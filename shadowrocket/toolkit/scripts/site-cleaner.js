/**
 * JAX Site Cleaner
 * Unified privacy-first website cleaner for Shadowrocket.
 *
 * Current sites:
 * - 51cg1.com
 * - wnacg.com
 * - missav.ws
 *
 * Privacy:
 * - No fetch / $httpClient / $task.fetch
 * - No persistent storage
 * - Does not upload cookies, headers, account data or browsing history
 * - Only modifies HTML already intercepted locally by Shadowrocket
 */

(function () {
  "use strict";

  function headerValue(headers, name) {
    if (!headers) return "";
    var target = String(name).toLowerCase();
    for (var key in headers) {
      if (
        Object.prototype.hasOwnProperty.call(headers, key) &&
        String(key).toLowerCase() === target
      ) {
        return String(headers[key] || "");
      }
    }
    return "";
  }

  function hostnameFromUrl(url) {
    var match = String(url || "").match(/^https?:\/\/([^\/:?#]+)/i);
    return match ? match[1].toLowerCase() : "";
  }

  function isHtmlResponse() {
    var body = $response && typeof $response.body === "string" ? $response.body : "";
    if (!body) return false;

    var contentType = headerValue($response.headers, "content-type");
    if (
      contentType &&
      contentType.toLowerCase().indexOf("text/html") === -1
    ) {
      return false;
    }

    return /<(?:!doctype|html|head|body)\b/i.test(body);
  }

  function injectCss(html, id, css) {
    if (!css) return html;
    var style = '<style id="' + id + '">' + css + "</style>";
    if (/<\/head\s*>/i.test(html)) {
      return html.replace(/<\/head\s*>/i, style + "</head>");
    }
    return style + html;
  }

  function injectHeadSnippet(html, snippet) {
    if (!snippet) return html;
    if (/<\/head\s*>/i.test(html)) {
      return html.replace(/<\/head\s*>/i, snippet + "</head>");
    }
    return snippet + html;
  }

  function injectHeadStart(html, snippet) {
    if (!snippet) return html;
    if (/<head\b[^>]*>/i.test(html)) {
      return html.replace(/<head\b[^>]*>/i, function (headTag) {
        return headTag + snippet;
      });
    }
    return snippet + html;
  }

  function clean51cg1(html) {
    var removed = 0;

    function isAllowedHost(host) {
      if (!host) return true;
      return (
        host === "51cg1.com" ||
        host === "www.51cg1.com" ||
        host === "chigua.com" ||
        host === "www.chigua.com" ||
        host === "cg51.com" ||
        host === "www.cg51.com" ||
        /^51cg[a-z0-9-]*\.com$/i.test(host) ||
        /^cgwz\d*\.com$/i.test(host)
      );
    }

    function isExternalUrl(url) {
      var value = String(url || "");
      if (!/^https?:\/\//i.test(value)) return false;
      return !isAllowedHost(hostnameFromUrl(value));
    }

    // 外部 iframe
    html = html.replace(
      /<iframe\b([^>]*?)src=["']([^"']+)["']([^>]*)>[\s\S]*?<\/iframe\s*>/gi,
      function (whole, before, src) {
        if (isExternalUrl(src)) {
          removed++;
          return "";
        }
        return whole;
      }
    );

    // 外链图片横幅
    html = html.replace(
      /<a\b([^>]*?)href=["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi,
      function (whole, before, href, after, inner) {
        if (/<img\b/i.test(inner) && isExternalUrl(href)) {
          removed++;
          return "";
        }
        return whole;
      }
    );

    // 明显广告容器
    var token = "(?:ad|ads|advert|advertisement|ad-banner|banner-ad|popup-ad|sponsor|sponsored)";
    var adContainerRegex = new RegExp(
      "<(div|section|aside)\\b" +
      "(?=[^>]*(?:class|id)=[\\\"'][^\\\"']*(?:^|[\\s_-])" +
      token +
      "(?:$|[\\s_-])[^\\\"']*[\\\"'])" +
      "[^>]*>[\\s\\S]*?<\\/\\1\\s*>",
      "gi"
    );

    html = html.replace(adContainerRegex, function () {
      removed++;
      return "";
    });

    // 残留占位隐藏
    var css =
      ".ad,.ads,.advert,.advertisement,.ad-banner,.banner-ad,.popup-ad,.sponsor,.sponsored{" +
      "display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;max-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important}" +
      '[id="ad"],[id="ads"],[id^="ad-"],[id^="ads-"],[class^="ad-"],[class^="ads-"],[class~="ad"],[class~="ads"],[class~="advert"],[class~="sponsor"]{' +
      "display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;max-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important}";

    html = injectCss(html, "jax-site-cleaner-51cg1", css);

    return {
      body: html,
      removed: removed
    };
  }

  function cleanWnacg(html) {
    var removed = 0;

    // 已确认的第三方广告脚本：在 HTML 执行前直接移除，避免生成 iframe / 弹层。
    html = html.replace(
      /<script\b(?=[^>]*\bsrc=["'][^"']*(?:juicyads\.com|jads\.co|erodatalabs\.com)[^"']*["'])[^>]*>[\s\S]*?<\/script\s*>/gi,
      function () {
        removed++;
        return "";
      }
    );

    // JuicyAds / jads iframe。
    html = html.replace(
      /<iframe\b(?=[^>]*\bsrc=["'][^"']*(?:juicyads\.com|jads\.co)[^"']*["'])[^>]*>[\s\S]*?<\/iframe\s*>/gi,
      function () {
        removed++;
        return "";
      }
    );
    html = html.replace(
      /<iframe\b(?=[^>]*\bsrc=["'][^"']*(?:juicyads\.com|jads\.co)[^"']*["'])[^>]*\/?>/gi,
      function () {
        removed++;
        return "";
      }
    );

    // EroDataLabs 广告/跳转链接。
    html = html.replace(
      /<a\b(?=[^>]*\bhref=["'][^"']*erodatalabs\.com[^"']*["'])[^>]*>[\s\S]*?<\/a\s*>/gi,
      function () {
        removed++;
        return "";
      }
    );

    // 页面已知广告容器和导航推广项。CSS 同时覆盖后续动态插入的广告节点。
    var css =
      "#ad-footer,.dlh," +
      'iframe[src*="juicyads.com"],iframe[src*="jads.co"],a[href*="erodatalabs.com"],' +
      '#album_tabs li:has(a[href*="shenshiai.net"]),#album_tabs li:has(a[href*="missai.space"]){' +
      "display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;max-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important}";

    html = injectCss(html, "jax-site-cleaner-wnacg", css);

    return {
      body: html,
      removed: removed
    };
  }

  function cleanMissav(html) {
    var removed = 0;
    var adHosts =
      "(?:go\\.mayzaent\\.com|creative\\.live\\.missav\\.com|(?:cdn\\.)?tsyndicate\\.com|cm\\.pxltag\\.com|go\\.rmishe\\.com|stripchat\\.dk|(?:[^\\/]+\\.)?ladyoffices\\.com)";

    // 已确认的广告脚本，避免页面加载后创建广告 iframe / 弹层。
    var adScriptRegex = new RegExp(
      "<script\\b(?=[^>]*\\bsrc=[\\\"'][^\\\"']*" +
        adHosts +
        "[^\\\"']*[\\\"'])[^>]*>[\\s\\S]*?<\\/script\\s*>",
      "gi"
    );
    html = html.replace(adScriptRegex, function () {
      removed++;
      return "";
    });

    // MissAV 当前播放器使用原生页面播放器；第三方 iframe 均按广告容器处理。
    html = html.replace(
      /<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>/gi,
      function () {
        removed++;
        return "";
      }
    );
    html = html.replace(/<iframe\b[^>]*\/?>/gi, function () {
      removed++;
      return "";
    });

    // 已确认的推广/跳转入口。
    html = html.replace(
      /<a\b(?=[^>]*\bhref=["'][^"']*(?:bit\.ly|myavlive\.com|ladyoffices\.com)[^"']*["'])[^>]*>[\s\S]*?<\/a\s*>/gi,
      function () {
        removed++;
        return "";
      }
    );

    // CSS 兜底：处理动态插入前短暂出现的广告层。
    var css =
      "iframe," +
      'a[href*="bit.ly"],a[href*="myavlive.com"],a[href*="ladyoffices.com"],' +
      'li:has(>a[href*="bit.ly"]),li:has(>a[href*="myavlive.com"]),' +
      ".under_player,.ts-outstream-video," +
      'div[class^="root"],div[class*="fixed"][class*="right-"][class*="bottom-"],' +
      'div[style*="z-index: 1001"],div[style*="width: 300px"][style*="height: 250px"]{' +
      "display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;max-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important;pointer-events:none!important}" +
      "body{overflow-x:hidden!important}";

    html = injectCss(html, "jax-site-cleaner-missav", css);

    // 运行时防护必须尽量早执行：动态删除广告节点，并阻断首次点击劫持。
    var runtimeGuard =
      '<script id="jax-site-cleaner-missav-runtime">(function(){' +
      '"use strict";' +
      'var bad=/(?:^|\\.)(?:ladyoffices\\.com|mayzaent\\.com|tsyndicate\\.com|pxltag\\.com|rmishe\\.com|stripchat\\.dk|myavlive\\.com)$/i;' +
      'function badUrl(u){try{var x=new URL(String(u||""),location.href);return x.hostname==="bit.ly"||bad.test(x.hostname);}catch(e){return false;}}' +
      'try{window.open=function(){return null;};}catch(e){}' +
      'try{var ac=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(badUrl(this.href))return;return ac.apply(this,arguments);};}catch(e){}' +
      'try{var la=Location.prototype.assign,lr=Location.prototype.replace;Location.prototype.assign=function(u){if(badUrl(u))return;return la.call(this,u);};Location.prototype.replace=function(u){if(badUrl(u))return;return lr.call(this,u);};}catch(e){}' +
      'function clean(){try{' +
      'document.querySelectorAll("iframe,div[class^=\\"root\\"],div[class*=\\"fixed\\"][class*=\\"right-\\"][class*=\\"bottom-\\"],.ts-outstream-video,.under_player").forEach(function(el){el.remove();});' +
      'document.querySelectorAll("a[href]").forEach(function(a){if(badUrl(a.href))a.remove();});' +
      '}catch(e){}}' +
      'function shield(e){try{var t=e.target;var a=t&&t.closest?t.closest("a[href]"):null;if(a&&badUrl(a.href)){e.preventDefault();e.stopImmediatePropagation();return false;}var p=t&&t.closest?t.closest("video,.plyr,#player,.video-player,[class*=\\"player\\"]"):null;if(p){e.stopImmediatePropagation();}}catch(x){}}' +
      'try{document.addEventListener("click",shield,false);document.addEventListener("touchend",shield,false);}catch(e){}' +
      'try{new MutationObserver(function(){clean();}).observe(document.documentElement,{childList:true,subtree:true});}catch(e){}' +
      'if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",clean,{once:true});}else{clean();}' +
      '})();</script>';

    html = injectHeadStart(html, runtimeGuard);

    return {
      body: html,
      removed: removed
    };
  }

  var SITE_RULES = [
    {
      name: "51CG1",
      hosts: ["51cg1.com", "www.51cg1.com"],
      cleaner: clean51cg1
    },
    {
      name: "WNACG",
      hosts: ["wnacg.com", "www.wnacg.com"],
      cleaner: cleanWnacg
    },
    {
      name: "MissAV",
      hosts: ["missav.ws"],
      cleaner: cleanMissav
    }
  ];

  function findSiteRule(host) {
    for (var i = 0; i < SITE_RULES.length; i++) {
      var rule = SITE_RULES[i];
      if (rule.hosts.indexOf(host) !== -1) return rule;
    }
    return null;
  }

  try {
    var url = $request && $request.url ? $request.url : "";
    var host = hostnameFromUrl(url);
    var siteRule = findSiteRule(host);

    if (!siteRule) return $done({});
    if (!isHtmlResponse()) return $done({});

    var result = siteRule.cleaner($response.body);
    if (!result || typeof result.body !== "string") return $done({});

    console.log(
      "[JAX Site Cleaner] " +
      siteRule.name +
      " removed blocks: " +
      String(result.removed || 0)
    );

    return $done({ body: result.body });
  } catch (error) {
    console.log("[JAX Site Cleaner] pass-through: " + String(error));
    return $done({});
  }
})();
