/*
 * JAX Douyin Feed AdBlock v5
 * - No external requests.
 * - Recursively filters only content candidates with strong ad markers.
 * - ad_info/adInfo alone is NOT treated as an ad marker.
 * - Parse, size, depth, or traversal-limit failure => original response.
 */

(() => {
  const original = $response && typeof $response.body === "string" ? $response.body : "";
  if (!original) return $done({});

  const MAX_BODY_BYTES = 2 * 1024 * 1024;
  const MAX_DEPTH = 12;
  const MAX_NODES = 20000;

  if (original.length > MAX_BODY_BYTES) return $done({});

  const firstNonSpace = original.match(/\S/);
  if (!firstNonSpace || (firstNonSpace[0] !== "{" && firstNonSpace[0] !== "[")) {
    return $done({});
  }

  const CONTENT_KEYS = [
    "aweme_id",
    "awemeId",
    "item_id",
    "itemId",
    "video",
    "author",
    "desc",
    "aweme_info",
    "awemeInfo"
  ];

  const AD_OBJECT_KEYS = [
    "aweme_info",
    "awemeInfo",
    "aweme",
    "aweme_detail",
    "awemeDetail",
    "item",
    "data",
    "series"
  ];

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

  const isTrueFlag = (value) => {
    if (value === true || value === 1) return true;
    if (typeof value !== "string") return false;
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true";
  };

  const isContentCandidate = (item) =>
    !!item &&
    typeof item === "object" &&
    CONTENT_KEYS.some((key) => hasPayload(item[key]));

  const hasNonCreativeAdMarker = (item) => {
    if (!item || typeof item !== "object") return false;

    if (
      isTrueFlag(item.is_ads) ||
      isTrueFlag(item.isAds) ||
      isTrueFlag(item.is_ad) ||
      isTrueFlag(item.isAd) ||
      hasPayload(item.ad_id) ||
      hasPayload(item.adId) ||
      hasPayload(item.live_ad_id) ||
      hasPayload(item.liveAdId) ||
      hasPayload(item.aweme_raw_ad) ||
      hasPayload(item.awemeRawAd) ||
      hasPayload(item.raw_ad_data) ||
      hasPayload(item.rawAdData) ||
      hasPayload(item.ad_data) ||
      hasPayload(item.adData) ||
      hasPayload(item.ad_order_id) ||
      hasPayload(item.adOrderId)
    ) {
      return true;
    }

    const webRawData = item.web_raw_data || item.webRawData;
    if (
      webRawData &&
      typeof webRawData === "object" &&
      (isTrueFlag(webRawData.brand_ad && webRawData.brand_ad.is_ad) ||
        isTrueFlag(webRawData.brandAd && webRawData.brandAd.isAd) ||
        isTrueFlag(webRawData.insert_info && webRawData.insert_info.is_ad) ||
        isTrueFlag(webRawData.insertInfo && webRawData.insertInfo.isAd))
    ) {
      return true;
    }

    return (
      isTrueFlag(item.video && item.video.meta && item.video.meta.isad) ||
      isTrueFlag(item.video_meta && item.video_meta.is_ad)
    );
  };

  const isExplicitAd = (item) => {
    if (!isContentCandidate(item)) return false;

    // creative_id / creativeId and ad_info / adInfo are intentionally NOT
    // standalone deletion markers. Some ordinary items may carry generic
    // ad capability/config fields without being actual ads.
    return hasNonCreativeAdMarker(item);
  };

  const getSafeRequestTarget = () => {
    const url = $request && typeof $request.url === "string" ? $request.url : "";
    const match = url.match(/^https?:\/\/([^/?#]+)(\/[^?#]*)?/i);
    if (!match) return "unknown";
    return `${match[1]}${match[2] || "/"}`;
  };

  let visitedNodes = 0;

  const enforceTraversalLimit = (depth) => {
    visitedNodes += 1;
    if (depth > MAX_DEPTH || visitedNodes > MAX_NODES) {
      throw new Error("response traversal limit reached");
    }
  };

  const isExplicitAdEntry = (entry, depth) => {
    if (!entry || typeof entry !== "object") return false;
    enforceTraversalLimit(depth);
    if (isExplicitAd(entry)) return true;

    return AD_OBJECT_KEYS.some((key) => isExplicitAdEntry(entry[key], depth + 1));
  };

  const filterArraysDeep = (value, depth) => {
    if (!value || typeof value !== "object") return 0;
    enforceTraversalLimit(depth);

    let removed = 0;
    if (Array.isArray(value)) {
      for (let index = value.length - 1; index >= 0; index -= 1) {
        if (isExplicitAdEntry(value[index], depth + 1)) {
          value.splice(index, 1);
          removed += 1;
        } else {
          removed += filterArraysDeep(value[index], depth + 1);
        }
      }
      return removed;
    }

    Object.keys(value).forEach((key) => {
      removed += filterArraysDeep(value[key], depth + 1);
    });

    return removed;
  };

  try {
    const obj = JSON.parse(original);
    if (!obj || typeof obj !== "object") return $done({});

    const removed = filterArraysDeep(obj, 0);

    if (removed > 0) {
      console.log(`JAX Douyin AdBlock v5: removed ${removed} ad item(s) @ ${getSafeRequestTarget()}`);
    }
    return removed > 0 ? $done({ body: JSON.stringify(obj) }) : $done({});
  } catch (e) {
    console.log(`JAX Douyin AdBlock v5: pass through (${e})`);
    return $done({});
  }
})();
