/**
 * JAX 51CG1 Web Cleaner
 *
 * Site-specific HTML response cleaner for 51cg1.com.
 * Privacy-first design:
 * - No fetch / $httpClient / $task.fetch.
 * - No persistent storage.
 * - No cookies, headers, account data, or browsing history are uploaded.
 * - Only rewrites the HTML response already intercepted locally by Shadowrocket.
 *
 * Strategy:
 * 1. Remove external iframe blocks.
 * 2. Remove image-banner links that point to external domains.
 * 3. Remove obvious ad/banner containers by conservative class/id tokens.
 * 4. Inject narrow CSS for leftover banner/ad placeholders and overlays.
 *
 * If the site's markup changes, unmatched content is left untouched.
 */

(function () {
  "use strict";

  function headerValue(headers, name) {
    if (!headers) return "";
    var target = String(name).toLowerCase();
    for (var k in headers) {
      if (Object.prototype.hasOwnProperty.call(headers, k) && String(k).toLowerCase() === target) {
        return String(headers[k] || "");
      }
    }
    return "";
  }

  function hostnameFromUrl(url) {
    var m = String(url || "").match(/^https?:\/\/([^\/:?#]+)/i);
    return m ? m[1].toLowerCase() : "";
  }

  function isAllowedHost(host) {
    if (!host) return true; // relative URL
    return (
      host === "51cg1.com" || host === "www.51cg1.com" ||
      host === "chigua.com" || host === "www.chigua.com" ||
      host === "cg51.com" || host === "www.cg51.com" ||
      /^51cg[a-z0-9-]*\.com$/i.test(host) ||
      /^cgwz\d*\.com$/i.test(host)
    );
  }

  function isExternalUrl(url) {
    if (!/^https?:\/\//i.test(String(url || ""))) return false;
    return !isAllowedHost(hostnameFromUrl(url));
  }

  function stripExternalImageAnchors(html) {
    var removed = 0;
    var out = html.replace(/<a\b([^>]*?)href=["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi, function (whole, before, href, after, inner) {
      if (/<img\b/i.test(inner) && isExternalUrl(href)) {
        removed++;
        return "";
      }
      return whole;
    });
    return { body: out, removed: removed };
  }

  function stripExternalIframes(html) {
    var removed = 0;
    var out = html.replace(/<iframe\b([^>]*?)src=["']([^"']+)["']([^>]*)>[\s\S]*?<\/iframe\s*>/gi, function (whole, before, src) {
      if (isExternalUrl(src)) {
        removed++;
        return "";
      }
      return whole;
    });
    return { body: out, removed: removed };
  }

  function stripObviousAdContainers(html) {
    var removed = 0;
    // Conservative token matching: ad, ads, advert, advertisement, ad-banner, banner-ad, popup-ad, sponsor.
    // Deliberately avoids broad substring selectors such as class*=ad, which would also match words like "header".
    var token = "(?:ad|ads|advert|advertisement|ad-banner|banner-ad|popup-ad|sponsor|sponsored)";
    var re = new RegExp(
      "<(div|section|aside)\\b(?=[^>]*(?:class|id)=[\\\"'][^\\\"']*(?:^|[\\s_-])" + token + "(?:$|[\\s_-])[^\\\"']*[\\\"'])[^>]*>[\\s\\S]*?<\\/\\1\\s*>",
      "gi"
    );
    var out = html.replace(re, function () {
      removed++;
      return "";
    });
    return { body: out, removed: removed };
  }

  function injectCss(html) {
    var css = "<style id=\"jax-51cg1-clean\">" +
      ".ad,.ads,.advert,.advertisement,.ad-banner,.banner-ad,.popup-ad,.sponsor,.sponsored{" +
      "display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important}" +
      "[id=\"ad\"],[id=\"ads\"],[id^=\"ad-\"],[id^=\"ads-\"],[class^=\"ad-\"],[class^=\"ads-\"]," +
      "[class~=\"ad\"],[class~=\"ads\"],[class~=\"advert\"],[class~=\"sponsor\"]{" +
      "display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important}" +
      "</style>";

    if (/<\/head\s*>/i.test(html)) {
      return html.replace(/<\/head\s*>/i, css + "</head>");
    }
    return css + html;
  }

  try {
    var body = $response && typeof $response.body === "string" ? $response.body : "";
    if (!body) return $done({});

    var contentType = headerValue($response.headers, "content-type");
    if (contentType && contentType.toLowerCase().indexOf("text/html") === -1) return $done({});
    if (!/<(?:!doctype|html|head|body)\b/i.test(body)) return $done({});

    var total = 0;
    var r1 = stripExternalIframes(body);
    body = r1.body;
    total += r1.removed;

    var r2 = stripExternalImageAnchors(body);
    body = r2.body;
    total += r2.removed;

    var r3 = stripObviousAdContainers(body);
    body = r3.body;
    total += r3.removed;

    body = injectCss(body);

    console.log("[JAX 51CG1 Cleaner] removed blocks: " + total);
    return $done({ body: body });
  } catch (e) {
    console.log("[JAX 51CG1 Cleaner] pass-through: " + String(e));
    return $done({});
  }
})();
