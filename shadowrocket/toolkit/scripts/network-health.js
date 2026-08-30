// JAX Network Health
// Daily connectivity check for Shadowrocket.
// Normal: log only. Failure: send a notification.

(() => {
  const timeout = 6000;
  const results = [];
  let exitInfo = { ip: "unknown", loc: "unknown", colo: "unknown" };

  function statusCode(response) {
    if (!response) return 0;
    return Number(response.status || response.statusCode || 0);
  }

  function request(url, callback) {
    $httpClient.get({ url, timeout }, (error, response, data) => {
      callback(error, statusCode(response), data || "");
    });
  }

  function parseTrace(text) {
    const obj = {};
    text.split(/\r?\n/).forEach(line => {
      const pos = line.indexOf("=");
      if (pos > 0) obj[line.slice(0, pos)] = line.slice(pos + 1);
    });
    return obj;
  }

  function notifyFailure(failed) {
    const exit = `${exitInfo.loc} / ${exitInfo.colo}`;
    const body = [
      `出口: ${exit}`,
      `IP: ${exitInfo.ip}`,
      `异常: ${failed.join(", ")}`
    ].join("\n");

    try {
      $notification.post("⚠️ JAX 网络检测", "Shadowrocket 连通性异常", body);
    } catch (_) {}
  }

  const checks = [
    { name: "Google", url: "https://www.gstatic.com/generate_204" },
    { name: "GitHub", url: "https://github.com/" },
    { name: "YouTube", url: "https://www.youtube.com/generate_204" }
  ];

  function runCheck(index) {
    if (index >= checks.length) {
      const failed = results.filter(x => !x.ok).map(x => x.name);
      const summary = results.map(x => `${x.name}:${x.status || "ERR"}`).join(" | ");
      console.log(`[JAX Network Health] ${exitInfo.loc}/${exitInfo.colo} ${summary}`);

      if (failed.length > 0) notifyFailure(failed);
      return $done();
    }

    const item = checks[index];
    request(item.url, (error, status) => {
      const ok = !error && status >= 200 && status < 400;
      results.push({ name: item.name, ok, status });
      runCheck(index + 1);
    });
  }

  request("https://www.cloudflare.com/cdn-cgi/trace", (error, status, data) => {
    if (!error && status >= 200 && status < 400) {
      const trace = parseTrace(data);
      exitInfo = {
        ip: trace.ip || "unknown",
        loc: trace.loc || "unknown",
        colo: trace.colo || "unknown"
      };
    } else {
      results.push({ name: "Cloudflare Trace", ok: false, status });
    }
    runCheck(0);
  });
})();
