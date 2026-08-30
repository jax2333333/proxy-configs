// JAX App Adblock Template
// This file is intentionally generic and is NOT active by default.
// Copy it to a dedicated app script only after the target API is confirmed.

(() => {
  try {
    if (!$response || !$response.body) return $done({});

    const data = JSON.parse($response.body);
    let changed = false;

    // Example only. Replace these fields after inspecting the real API schema.
    if (Array.isArray(data.ads)) {
      data.ads = [];
      changed = true;
    }

    if (Object.prototype.hasOwnProperty.call(data, "splash_ad")) {
      data.splash_ad = null;
      changed = true;
    }

    if (Object.prototype.hasOwnProperty.call(data, "advertisement")) {
      data.advertisement = null;
      changed = true;
    }

    if (!changed) return $done({});
    return $done({ body: JSON.stringify(data) });
  } catch (error) {
    console.log(`[JAX App Adblock Template] error: ${String(error)}`);
    return $done({});
  }
})();
