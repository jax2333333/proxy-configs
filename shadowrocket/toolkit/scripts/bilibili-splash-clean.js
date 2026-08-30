// JAX Bilibili Splash Cleaner
// Self-hosted, response-only, no fetch / no external network access.
// Clears Bilibili splash ad payloads while preserving a valid JSON shape.

const url = ($request && $request.url) || "";
const body = ($response && $response.body) || "";

try {
  const obj = JSON.parse(body);

  if (obj && obj.data && typeof obj.data === "object") {
    const data = obj.data;

    // Commercial splash preload list.
    if (/\/x\/v2\/splash\/list(?:[/?#]|$)/.test(url)) {
      data.max_time = 0;
      data.min_interval = 31536000;
      data.pull_interval = 31536000;
      data.keep_ids = [];
      data.list = [];
      if ("show" in data) data.show = [];
      if ("splash_request_id" in data) data.splash_request_id = "";
    }

    // Brand/default splash list. Keep the response valid but empty.
    if (/\/x\/v2\/splash\/brand\/list(?:[/?#]|$)/.test(url)) {
      data.pull_interval = 31536000;
      data.forcibly = false;
      data.list = [];
      data.show = [];
    }
  }

  $done({ body: JSON.stringify(obj) });
} catch (e) {
  // Parse failures are passed through unchanged for stability.
  $done({});
}
