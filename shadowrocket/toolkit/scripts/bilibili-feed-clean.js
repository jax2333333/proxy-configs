// JAX Bilibili Feed Cleaner
// Self-hosted, response-only, no fetch / no external network access.
// Conservative policy: remove only explicit ad objects from Bilibili feed responses.
// Parse failures or unknown response shapes are passed through unchanged.

const url = ($request && $request.url) || "";
const body = ($response && $response.body) || "";

if (!body) {
  $done({});
} else {
  try {
    const obj = JSON.parse(body);
    let changed = false;

    if (/\/x\/v2\/feed\/index(?:\/story)?(?:[/?#]|$)/.test(url)) {
      const items = obj && obj.data && Array.isArray(obj.data.items) ? obj.data.items : null;

      if (items) {
        const filtered = items.filter((item) => !isExplicitAd(item));
        if (filtered.length !== items.length) {
          obj.data.items = filtered;
          changed = true;
        }
      }
    }

    if (changed) {
      $done({ body: JSON.stringify(obj) });
    } else {
      $done({});
    }
  } catch (e) {
    // Fail open: keep the original response untouched on parse/runtime errors.
    $done({});
  }
}

function isExplicitAd(item) {
  if (!item || typeof item !== "object") return false;

  if (Object.prototype.hasOwnProperty.call(item, "ad_info")) return true;
  if (Object.prototype.hasOwnProperty.call(item, "ad_info_v2")) return true;

  const cardGoto = String(item.card_goto || "").toLowerCase();
  return cardGoto === "ad_av" || cardGoto === "vertical_ad_av";
}
