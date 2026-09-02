/*
 * JAX Douyin Feed AdBlock
 * - No external requests.
 * - Only filters high-confidence ad items in Douyin feed-like JSON responses.
 * - Parse failure => original response.
 */

(() => {
  const original = $response && typeof $response.body === "string" ? $response.body : "";
  if (!original) return $done({});

  const hasPayload = (value) => {
    if (value == null || value === false || value === 0 || value === "") return false;
    if (typeof value === "string") {
      const s = value.trim();
      return s !== "" && s !== "{}" && s !== "[]" && s !== "null";
    }
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return Boolean(value);
  };

  const isAdAweme = (item) => {
    if (!item || typeof item !== "object") return false;
    const adFlag = item.is_ads === true || item.is_ads === 1 || item.is_ads === "1";
    const rawAd = hasPayload(item.raw_ad_data);
    const adData = hasPayload(item.ad_data) || hasPayload(item.ad_info);
    return adFlag || rawAd || adData;
  };

  const filterAwemeArray = (arr) => {
    if (!Array.isArray(arr)) return arr;
    return arr.filter((entry) => {
      if (isAdAweme(entry)) return false;
      if (entry && typeof entry === "object" && isAdAweme(entry.aweme)) return false;
      return true;
    });
  };

  try {
    const obj = JSON.parse(original);
    let removed = 0;

    if (Array.isArray(obj.aweme_list)) {
      const before = obj.aweme_list.length;
      obj.aweme_list = filterAwemeArray(obj.aweme_list);
      removed += before - obj.aweme_list.length;
    }

    if (Array.isArray(obj.data)) {
      const before = obj.data.length;
      obj.data = filterAwemeArray(obj.data);
      removed += before - obj.data.length;
    }

    if (obj.data && typeof obj.data === "object" && Array.isArray(obj.data.aweme_list)) {
      const before = obj.data.aweme_list.length;
      obj.data.aweme_list = filterAwemeArray(obj.data.aweme_list);
      removed += before - obj.data.aweme_list.length;
    }

    if (removed > 0) console.log(`JAX Douyin AdBlock: removed ${removed} ad item(s)`);
    return $done({ body: JSON.stringify(obj) });
  } catch (e) {
    console.log(`JAX Douyin AdBlock: pass through (${e})`);
    return $done({ body: original });
  }
})();
