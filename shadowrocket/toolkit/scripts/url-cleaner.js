// JAX URL Cleaner Safe
// Removes common tracking parameters from a limited set of MITM hosts.
// Privacy note: do not log the full URL.

(() => {
  try {
    const original = $request.url;
    const url = new URL(original);

    const trackingParams = new Set([
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "utm_id",
      "fbclid",
      "gclid",
      "dclid",
      "msclkid",
      "igshid",
      "mc_cid",
      "mc_eid",
      "si"
    ]);

    const removed = [];
    for (const key of Array.from(url.searchParams.keys())) {
      if (trackingParams.has(key.toLowerCase())) {
        url.searchParams.delete(key);
        removed.push(key);
      }
    }

    if (removed.length === 0) {
      return $done({});
    }

    console.log(`[JAX URL Cleaner] removed: ${removed.join(", ")}`);
    return $done({ url: url.toString() });
  } catch (error) {
    console.log(`[JAX URL Cleaner] error: ${String(error)}`);
    return $done({});
  }
})();
