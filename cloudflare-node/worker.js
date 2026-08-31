import { connect } from 'cloudflare:sockets';

const textDecoder = new TextDecoder();

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const wsPath = normalizePath(env.WS_PATH);

    if (request.method === 'GET' && url.pathname === '/health') {
      return healthCheck(env, wsPath);
    }

    const upgrade = request.headers.get('Upgrade');
    if (upgrade?.toLowerCase() !== 'websocket' || url.pathname !== wsPath) {
      return new Response('Not Found', {
        status: 404,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }

    const allowedUuid = uuidToBytes(env.UUID);
    if (!allowedUuid) {
      return new Response('Worker is not configured', { status: 500 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.binaryType = 'arraybuffer';
    server.accept({ allowHalfOpen: true });

    runVlessSession(server, request, allowedUuid).catch((error) => {
      console.log('session_error', error?.message || String(error));
      safeCloseWebSocket(server, 1011, 'Session error');
    });

    return new Response(null, { status: 101, webSocket: client });
  },
};

async function healthCheck(env, wsPath) {
  const uuidOk = !!uuidToBytes(env.UUID);
  const pathOk = typeof wsPath === 'string' && wsPath.startsWith('/');
  let tcpOk = false;
  let tcpError = null;

  try {
    const socket = connect({ hostname: 'www.google.com', port: 443 });
    await socket.opened;
    tcpOk = true;
    await socket.close();
  } catch (error) {
    tcpError = error?.message || String(error);
  }

  return Response.json({
    ok: uuidOk && pathOk && tcpOk,
    uuidConfigured: uuidOk,
    wsPathConfigured: pathOk,
    outboundTcpGoogle443: tcpOk,
    outboundTcpError: tcpError,
    version: 'jax-cf-node-v2',
  });
}

async function runVlessSession(ws, request, allowedUuid) {
  let remoteSocket = null;
  let remoteWriter = null;
  let mode = 'init';
  let dnsBuffer = new Uint8Array(0);
  let responseHeaderSent = false;
  let closed = false;
  let queue = Promise.resolve();

  const sendResponseHeader = (version) => {
    if (responseHeaderSent) return;
    responseHeaderSent = true;
    ws.send(new Uint8Array([version, 0]));
  };

  const cleanup = async () => {
    if (closed) return;
    closed = true;
    try {
      if (remoteWriter) remoteWriter.releaseLock();
    } catch {}
    try {
      if (remoteSocket) await remoteSocket.close();
    } catch {}
  };

  const processChunk = async (chunk) => {
    if (mode === 'tcp') {
      await remoteWriter.write(chunk);
      return;
    }

    if (mode === 'dns') {
      dnsBuffer = concatBytes(dnsBuffer, chunk);
      dnsBuffer = await processDnsFrames(dnsBuffer, ws);
      return;
    }

    const parsed = parseVlessRequest(chunk, allowedUuid);

    if (parsed.command === 1) {
      mode = 'tcp';
      remoteSocket = connect({
        hostname: parsed.address,
        port: parsed.port,
      });

      await remoteSocket.opened;
      remoteWriter = remoteSocket.writable.getWriter();
      sendResponseHeader(parsed.version);

      if (parsed.payload.byteLength > 0) {
        await remoteWriter.write(parsed.payload);
      }

      pipeRemoteToWebSocket(remoteSocket.readable, ws)
        .catch((error) => {
          console.log('upstream_read_error', error?.message || String(error));
          safeCloseWebSocket(ws, 1011, 'Upstream read error');
        });
      return;
    }

    if (parsed.command === 2 && parsed.port === 53) {
      mode = 'dns';
      sendResponseHeader(parsed.version);
      dnsBuffer = concatBytes(dnsBuffer, parsed.payload);
      dnsBuffer = await processDnsFrames(dnsBuffer, ws);
      return;
    }

    throw new Error('Unsupported VLESS command');
  };

  ws.addEventListener('message', (event) => {
    const frame = toUint8Array(event.data);
    if (!frame) {
      safeCloseWebSocket(ws, 1003, 'Binary frames only');
      return;
    }

    queue = queue
      .then(() => processChunk(frame))
      .catch((error) => {
        console.log('client_frame_error', error?.message || String(error));
        safeCloseWebSocket(ws, 1008, 'VLESS error');
      });
  });

  ws.addEventListener('close', () => {
    cleanup();
  });

  ws.addEventListener('error', () => {
    cleanup();
  });

  const earlyData = decodeEarlyData(request.headers.get('sec-websocket-protocol'));
  if (earlyData) {
    queue = queue
      .then(() => processChunk(earlyData))
      .catch((error) => {
        console.log('early_data_error', error?.message || String(error));
        safeCloseWebSocket(ws, 1008, 'VLESS early-data error');
      });
  }
}

async function processDnsFrames(buffer, ws) {
  let offset = 0;

  while (buffer.byteLength - offset >= 2) {
    const length = (buffer[offset] << 8) | buffer[offset + 1];
    if (buffer.byteLength - offset - 2 < length) break;

    const packet = buffer.slice(offset + 2, offset + 2 + length);
    const response = await fetch('https://1.1.1.1/dns-query', {
      method: 'POST',
      headers: {
        'content-type': 'application/dns-message',
        'accept': 'application/dns-message',
      },
      body: packet,
    });

    if (!response.ok) {
      throw new Error(`DoH failed: ${response.status}`);
    }

    const answer = new Uint8Array(await response.arrayBuffer());
    const framed = new Uint8Array(answer.byteLength + 2);
    framed[0] = (answer.byteLength >> 8) & 0xff;
    framed[1] = answer.byteLength & 0xff;
    framed.set(answer, 2);
    ws.send(framed);

    offset += 2 + length;
  }

  return buffer.slice(offset);
}

async function pipeRemoteToWebSocket(readable, ws) {
  const reader = readable.getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value?.byteLength) ws.send(value);
    }
    safeCloseWebSocket(ws, 1000, 'Upstream closed');
  } finally {
    try {
      reader.releaseLock();
    } catch {}
  }
}

function parseVlessRequest(buffer, allowedUuid) {
  let offset = 0;
  ensureLength(buffer, 24);

  const version = buffer[offset++];
  const uuid = buffer.slice(offset, offset + 16);
  offset += 16;

  if (!constantTimeEqual(uuid, allowedUuid)) {
    throw new Error('Invalid UUID');
  }

  const addonsLength = buffer[offset++];
  ensureLength(buffer, offset + addonsLength + 4);
  offset += addonsLength;

  const command = buffer[offset++];
  const port = (buffer[offset] << 8) | buffer[offset + 1];
  offset += 2;

  const addressType = buffer[offset++];
  let address;

  if (addressType === 1) {
    ensureLength(buffer, offset + 4);
    address = Array.from(buffer.slice(offset, offset + 4)).join('.');
    offset += 4;
  } else if (addressType === 2) {
    ensureLength(buffer, offset + 1);
    const domainLength = buffer[offset++];
    ensureLength(buffer, offset + domainLength);
    address = textDecoder.decode(buffer.slice(offset, offset + domainLength));
    offset += domainLength;
  } else if (addressType === 3) {
    ensureLength(buffer, offset + 16);
    const parts = [];
    for (let i = 0; i < 16; i += 2) {
      parts.push(((buffer[offset + i] << 8) | buffer[offset + i + 1]).toString(16));
    }
    address = parts.join(':');
    offset += 16;
  } else {
    throw new Error('Unsupported address type');
  }

  if (!address || port < 1 || port > 65535) {
    throw new Error('Invalid destination');
  }

  return {
    version,
    command,
    port,
    address,
    payload: buffer.slice(offset),
  };
}

function decodeEarlyData(value) {
  if (!value || value.includes(',')) return null;
  try {
    let base64 = value.replaceAll('-', '+').replaceAll('_', '/');
    while (base64.length % 4) base64 += '=';
    const binary = atob(base64);
    if (!binary.length) return null;
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

function toUint8Array(data) {
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  return null;
}

function concatBytes(a, b) {
  if (!a.byteLength) return b.slice();
  if (!b.byteLength) return a.slice();
  const out = new Uint8Array(a.byteLength + b.byteLength);
  out.set(a, 0);
  out.set(b, a.byteLength);
  return out;
}

function normalizePath(value) {
  const path = typeof value === 'string' && value.trim() ? value.trim() : '/jax-ws';
  return path.startsWith('/') ? path : `/${path}`;
}

function uuidToBytes(uuid) {
  if (typeof uuid !== 'string') return null;
  const hex = uuid.replaceAll('-', '').toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(hex)) return null;

  const out = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function constantTimeEqual(a, b) {
  if (a.byteLength !== b.byteLength) return false;
  let diff = 0;
  for (let i = 0; i < a.byteLength; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function ensureLength(buffer, needed) {
  if (buffer.byteLength < needed) throw new Error('Truncated request');
}

function safeCloseWebSocket(ws, code, reason) {
  try {
    ws.close(code, reason);
  } catch {}
}
