// ==UserScript==
// @name                Universal Link Cleaner
// @name:zh-CN          通用链接净化器
// @name:zh-TW          通用連結淨化器
// @name:ja             ユニバーサルリンククリーナー
// @name:ko             유니버설 링크 클리너
// @name:es              Limpiador Universal de Enlaces
// @name:fr              Nettoyeur Universel de Liens
// @name:de              Universeller Link-Reiniger
// @name:ru              Универсальный очиститель ссылок
// @namespace           https://github.com/cruzclane/universal-link-cleaner
// @version             3.0.0
// @author              deepseek
// @description         Automatically remove tracking parameters from URLs across multiple websites for cleaner links and better privacy
// @description:zh-CN   自动清理各大网站链接中的追踪参数，保护隐私，让链接更干净
// @description:zh-TW   自動清理各大網站連結中的追蹤參數，保護隱私，讓連結更乾淨
// @description:ja      複数のWebサイトからトラッキングパラメータを自動削除し、プライバシーを保護、リンクをクリーンにします
// @description:ko      여러 웹사이트의 URL에서 추적 매개변수를 자동으로 제거하여 개인정보를 보호하고 링크를 깔끔하게 유지합니다
// @description:es      Elimina automáticamente los parámetros de seguimiento de las URL en múltiples sitios web para una mejor privacidad
// @description:fr      Supprime automatiquement les paramètres de suivi des URL sur plusieurs sites web pour une meilleure confidentialité
// @description:de      Entfernt automatisch Tracking-Parameter aus URLs auf mehreren Websites für mehr Privatsphäre
// @description:ru      Автоматически удаляет параметры отслеживания из URL на нескольких сайтах для лучшей конфиденциальности
// @homepage            https://github.com/cruzclane/universal-link-cleaner
// @homepageURL         https://github.com/cruzclane/universal-link-cleaner
// @supportURL          https://github.com/cruzclane/universal-link-cleaner/issues
// @license             MIT
// @icon                https://www.google.com/s2/favicons?domain=github.com
// @match               *://*/*
// @grant               none
// @run-at              document-start
// @compatible          chrome 80+
// @compatible          firefox 75+
// @compatible          edge 80+
// @compatible          safari 14+
// @downloadURL         https://update.greasyfork.org/scripts/universal-link-cleaner.user.js
// @updateURL           https://update.greasyfork.org/scripts/universal-link-cleaner.meta.js
// @note                如果发现新网站需要支持，请在GitHub提交Issue或PR
// @note:zh-CN          如果发现新网站需要支持，请在GitHub提交Issue或PR
// ==/UserScript==

(function () {
    'use strict';

    /**
     * 站点配置
     * 可以添加更多网站的规则
     */
    const SITE_CONFIGS = [
        {
            // Bilibili 规则
            domains: ['bilibili.com', 'bilibili.tv'],
            excludeDomains: ['passport.bilibili.com'], // 排除的域名
            params: new Set([
                'spm_id_from', 'from_source', 'msource', 'bsource', 'seid',
                'source', 'session_id', 'visit_id', 'sourceFrom', 'from_spmid',
                'share_source', 'share_medium', 'share_plat', 'share_session_id',
                'share_tag', 'unique_k', 'csource', 'vd_source', 'tab',
                'is_story_h5', 'share_from', 'plat_id', '-Arouter', 'spmid',
                'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'trackid'
            ]),
            cleanUrl: (url, urlObj) => {
                // 特定站点的额外处理
                if (urlObj.hostname.includes('bilibili.tv')) {
                    urlObj.hostname = urlObj.hostname.replace('bilibili.tv', 'bilibili.com');
                }
                return urlObj;
            }
        },
        {
            // 淘宝/天猫规则
            domains: ['taobao.com', 'tmall.com'],
            excludeDomains: ['login.taobao.com', 'passport.tmall.com'],
            params: new Set([
                'spm', 'spm', 'scm', 'skuId', 'trackInfo',
                'ut_sk', 'sourceType', 'suid', 'shareUid',
                'un', 'share_crt', 'utm', 'abbucket'
            ])
        },
        {
            // 京东规则
            domains: ['jd.com', 'jd.hk'],
            excludeDomains: ['passport.jd.com'],
            params: new Set([
                'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
                'jd_pop', 'abt', 'cu', 'scm', 'spread', 'resourceType',
                'resourceValue', 'keyword', 'referring'
            ])
        },
        {
            // 知乎规则
            domains: ['zhihu.com'],
            params: new Set([
                'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
                'spm', 'source', 'share', 'campaign', 'wechatShare'
            ])
        },
        {
            // 豆瓣规则（保留原有支持）
            domains: ['douban.com'],
            params: new Set([
                'utm_source', 'utm_medium', 'utm_campaign',
                'from', 'spm', 'track','_spm_id'
            ])
        },
        {
            // YouTube规则
            domains: ['youtube.com', 'youtu.be'],
            params: new Set([
                'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
                'si', 'feature', 'list', 'index', 'pp', 'source'
            ])
        },
        {
            // Twitter/X规则
            domains: ['twitter.com', 'x.com'],
            params: new Set([
                'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
                's', 't', 'i', 'ref_src', 'ref_url'
            ])
        }
    ];

    /** 全局默认过滤参数（适用于所有网站） */
    const DEFAULT_PARAMS = new Set([
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'utm_id', 'utm_source_platform', 'utm_creative_format', 'utm_marketing_tactic',
        'fbclid', 'gclid', 'msclkid', 'twclid', 'li_fat_id', 'mc_cid', 'mc_eid',
        '_ga', '_gl', 'utm_debug', 'utm_pubreferrer', 'utm_reader', 'utm_referrer',
        'utm_user', 'utm_viz_id', 'wt_mc', 'yclid', 'igshid', 'ref', 'source',
        'via', 'action', 'user', 'userId', 'shareId'
    ]);

    /**
     * 判断URL是否属于某个站点规则
     * @param {URL} urlObj URL对象
     * @returns {Object|null} 匹配的站点规则，没有则返回null
     */
    function getMatchingConfig(urlObj) {
        const hostname = urlObj.hostname;

        for (const config of SITE_CONFIGS) {
            // 检查域名匹配
            const domainMatch = config.domains.some(domain => hostname.includes(domain));
            if (!domainMatch) continue;

            // 检查排除域名
            if (config.excludeDomains) {
                const excludeMatch = config.excludeDomains.some(domain => hostname.includes(domain));
                if (excludeMatch) continue;
            }

            return config;
        }
        return null;
    }

    /**
     * 合并参数集合
     * @param {Set} defaultSet 默认参数集合
     * @param {Set} customSet 自定义参数集合
     * @returns {Set} 合并后的参数集合
     */
    function mergeParams(defaultSet, customSet) {
        return new Set([...defaultSet, ...(customSet || [])]);
    }

    /**
     * 判断字符串是否为有效URL
     * @param {string} url 要判断的字符串
     * @param {string} base 基础URL
     * @returns {URL|false} URL对象或false
     */
    function isValidURL(url, base) {
        try {
            if (typeof url === "string" && /^[\W\w]+\.[\W\w]+/.test(url) && !/^[a-z]+:/.test(url)) {
                // 处理省略协议头的情况
                const str = url.startsWith("//") ? "" : "//";
                url = location.protocol + str + url;
            }
            return new URL(url, base);
        } catch (e) {
            return false;
        }
    }

    /**
     * 清理URL参数
     * @param {string} str 原URL
     * @returns {string} 清理后的URL
     */
    function clean(str) {
        const urlObj = isValidURL(str);
        if (!urlObj) return str;

        // 获取匹配的站点配置
        const config = getMatchingConfig(urlObj);

        // 如果没有匹配的配置，只清理默认参数
        if (!config) {
            let changed = false;
            DEFAULT_PARAMS.forEach(param => {
                if (urlObj.searchParams.has(param)) {
                    urlObj.searchParams.delete(param);
                    changed = true;
                }
            });
            return changed ? urlObj.toString() : str;
        }

        // 有匹配配置，合并默认参数和自定义参数
        const allParams = mergeParams(DEFAULT_PARAMS, config.params);

        // 清理参数
        let changed = false;
        allParams.forEach(param => {
            if (urlObj.searchParams.has(param)) {
                urlObj.searchParams.delete(param);
                changed = true;
            }
        });

        // 执行特定站点的额外清理
        if (config.cleanUrl) {
            const processedObj = config.cleanUrl(str, urlObj);
            if (processedObj instanceof URL) {
                return processedObj.toString();
            }
        }

        return changed ? urlObj.toString() : str;
    }

    /** 地址备份 */
    let locationBackup;

    /** 处理地址栏 */
    function cleanLocation() {
        const { href } = location;
        if (href === locationBackup) return;
        const cleanedHref = clean(href);
        if (cleanedHref !== href) {
            replaceUrl(locationBackup = cleanedHref);
        }
    }

    /** 处理a标签的href属性 */
    function processAnchors(anchors) {
        anchors.forEach(anchor => {
            if (!anchor.href) return;
            const cleanedHref = clean(anchor.href);
            if (cleanedHref !== anchor.href) {
                anchor.href = cleanedHref;
            }
        });
    }

    /** 点击事件处理 */
    function handleClick(e) {
        let target = e.target;
        for (; target && target.tagName !== "A";) {
            target = target.parentNode;
        }
        if (target && target.tagName === "A") {
            processAnchors([target]);
        }
    }

    /**
     * 修改当前URL而不触发重定向
     * @param {string} url 新URL
     */
    function replaceUrl(url) {
        if (url !== window.location.href) {
            window.history.replaceState(window.history.state, "", url);
        }
    }

    // 初始化处理
    cleanLocation();

    // 处理动态添加的节点
    let debounceTimer;
    const observer = new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            cleanLocation();
            processAnchors(document.querySelectorAll("a"));
        }, 100);
    });

    observer.observe(document, {
        childList: true,
        subtree: true
    });

    // 事件监听
    window.addEventListener("click", handleClick, false);
    window.addEventListener("contextmenu", handleClick, false);
    document.addEventListener("DOMContentLoaded", () => {
        processAnchors(document.querySelectorAll("a"));
    });

    // 拦截 window.open
    window.open = ((originalOpen) => {
        return function(url, name, params) {
            const cleanedUrl = clean(url);
            return originalOpen.call(this, cleanedUrl, name, params);
        };
    })(window.open);

    // 处理导航事件（如果支持）
    if (window.navigation) {
        window.navigation.addEventListener('navigate', (e) => {
            const newURL = clean(e.destination.url);
            if (e.destination.url !== newURL) {
                e.preventDefault();
                if (newURL !== window.location.href) {
                    window.history.replaceState(window.history.state, "", newURL);
                }
            }
        });
    }

    console.log('通用链接净化器已加载，当前站点配置数:', SITE_CONFIGS.length);
})();
