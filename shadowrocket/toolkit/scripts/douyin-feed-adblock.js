/*
 * JAX Douyin Feed AdBlock v2
 * - No external requests.
 * - Only filters explicitly marked ad items in known Douyin feed arrays.
 * - Parse failure => original response.
 */

(() => {
  const original = $response && typeof $response.body === "string" ? $response.body : "";
  if (!original) return $done({});

  const FEED_KEYS = [
    "aweme_list",
    "awemeList",
    "item_list",
    "itemList",
    "feed_list",
    "feedList",
    "items",
    "data"
  ];

  const AWEME_KEYS = [
    "aweme_info",
    "awemeInfo",
    "aweme",
    "aweme_detail",
    "awemeDetail",
    "item"
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

  const isTrueFlag = (value) => value === true || value === 1 || value === "1";

  const isExplicitAd = (item) => {
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
      hasPayload(item.live_ad_creative_id) ||
      hasPayload(item.liveAdCreativeId) ||
      hasPayload(item.ad_aweme_source) ||
      hasPayload(item.adAwemeSource) ||
      hasPayload(item.raw_ad_data) ||
      hasPayload(item.rawAdData) ||
      hasPayload(item.ad_data) ||
      hasPayload(item.adData)
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

  const isExplicitAdEntry = (entry) => {
    if (!entry || typeof entry !== "object") return false;
    if (isExplicitAd(entry)) return true;

    return AWEME_KEYS.some((key) => isExplicitAd(entry[key]));
  };

  const filterFeedArrays = (container) => {
    if (!container || typeof container !== "object" || Array.isArray(container)) return 0;

    let removed = 0;
    FEED_KEYS.forEach((key) => {
      if (!Array.isArray(container[key])) return;

      const before = container[key].length;
      container[key] = container[key].filter((entry) => !isExplicitAdEntry(entry));
      removed += before - container[key].length;
    });

    return removed;
  };

  try {
    const obj = JSON.parse(original);
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return $done({});

    let removed = filterFeedArrays(obj);
    if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
      removed += filterFeedArrays(obj.data);
    }

    if (removed > 0) console.log(`JAX Douyin AdBlock: removed ${removed} ad item(s)`);
    return removed > 0 ? $done({ body: JSON.stringify(obj) }) : $done({});
  } catch (e) {
    console.log(`JAX Douyin AdBlock: pass through (${e})`);
    return $done({});
  }
})();
