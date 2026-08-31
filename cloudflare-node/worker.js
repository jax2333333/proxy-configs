import { connect } from 'cloudflare:sockets';

const textDecoder = new TextDecoder();

export default {
  async fetch(request, env) {
    const upgrade = request.headers.get('Upgrade');
    const url = new URL(request.url);
    const wsPath = normalizePath(env.WS_PATH);

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

    // Since Workers compatibility dates >= 2026-03-17 deliver binary
    // WebSocket frames as Blob by default, force ArrayBuffer delivery so
    // VLESS frames can be parsed synchronously and consistently.
    server.binaryType = 'arraybuffer';
    server.accept({ allowHalfOpen: true });

    handleVlessSession(server, allowedUuid).catch(() => {
      safeCloseWebSocket(server, 1011, 'Upstream error');
    });

    return new Response(null, { status: 101, webSocket: client });
  },
};

async function handleVlessSession(ws, allowedUuid) {
  let initPromise = null;
  let upstreamWriter = null;
  let closed = false;

  const closeUpstream = async () => {
    if (closed) return;
    closed = true;
    if (upstreamWriter) {
      try {
        await upstreamWriter.close();
      } catch {}
      try {
        upstreamWriter.releaseLock();
      } catch {}
    }
  };

  ws.addEventListener('message', (event) => {
    const frame = toUint8Array(event.data);
    if (!frame) {
      safeCloseWebSocket(ws, 1003, 'Binary frames only');
      return;
    }

    if (!initPromise) {
      initPromise = openUpstream(frame, allowedUuid, ws).then(({ writer }) => {
        upstreamWriter = writer;
        return writer;
      });
      initPromise.catch(() => safeCloseWebSocket(ws, 1008, 'Invalid VLESS request'));
      return;
    }

    initPromise
      .then((writer) => writer.write(frame))
      .catch(() => safeCloseWebSocket(ws, 1011, 'Upstream write failed'));
  });

  ws.addEventListener('close', () => {
    closeUpstream();
  });

  ws.addEventListener('error', () => {
    closeUpstream();
  });
}

async function openUpstream(firstFrame, allowedUuid, ws) {
  const request = parseVlessRequest(firstFrame, allowedUuid);

  // This minimal Worker intentionally supports TCP only.
  if (request.command !== 1) {
    throw new Error('Only VLESS TCP is supported');
  }

  const socket = connect({
    hostname: request.address,
    port: request.port,
  });

  const writer = socket.writable.getWriter();
  if (request.payload.byteLength > 0) {
    await writer.write(request.payload);
  }

  // VLESS response: request version + zero-length addons.
  ws.send(new Uint8Array([request.version, 0]));

  pipeRemoteToWebSocket(socket.readable, ws).catch(() => {
    safeCloseWebSocket(ws, 1011, 'Upstream read failed');
  });

  return { writer };
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

function toUint8Array(data) {
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  return null;
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
