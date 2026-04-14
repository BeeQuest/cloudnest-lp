/* =========================================================
   CloudNest LP - script.js
   ========================================================= */
(() => {
  "use strict";

  /* ---------- Utilities ---------- */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // rAF-throttled event binder
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        fn(...args);
        ticking = false;
      });
    };
  };

  // Focusable elements inside a container (for focus trap)
  const FOCUSABLE_SEL = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  const getFocusable = (container) =>
    $$(FOCUSABLE_SEL, container).filter(el => el.offsetParent !== null || el === document.activeElement);

  /* ---------- Boot ---------- */
  const init = () => {
    initHeaderScroll();
    initHamburger();
    initPricingTabs();
    initPagetop();
    initFadeUp();
    initSmoothAnchors();
  };

  /* ---------- Header scroll state ---------- */
  const initHeaderScroll = () => {
    const header = $(".header");
    if (!header) return;
    const SCROLLED_THRESHOLD = 20;
    const onScroll = () => {
      const scrolled = window.scrollY > SCROLLED_THRESHOLD;
      header.classList.toggle("scrolled", scrolled);
    };
    window.addEventListener("scroll", rafThrottle(onScroll), { passive: true });
    onScroll();
  };

  /* ---------- Hamburger menu (a11y + focus trap + scroll lock) ---------- */
  const initHamburger = () => {
    const hamburger = $(".hamburger");
    const gnav = $(".gnav");
    if (!hamburger || !gnav) return;

    // Ensure ids/aria linkage
    if (!gnav.id) gnav.id = "gnav";
    hamburger.setAttribute("aria-controls", gnav.id);
    hamburger.setAttribute("aria-expanded", "false");
    if (!hamburger.hasAttribute("type")) hamburger.setAttribute("type", "button");

    let lastFocused = null;

    const isOpen = () => gnav.classList.contains("open");

    const openMenu = () => {
      if (isOpen()) return;
      lastFocused = document.activeElement;
      hamburger.classList.add("open");
      gnav.classList.add("open");
      hamburger.setAttribute("aria-expanded", "true");
      document.body.classList.add("no-scroll");
      // Move focus to first focusable inside menu
      const focusables = getFocusable(gnav);
      if (focusables.length) focusables[0].focus();
      document.addEventListener("keydown", onKeydown);
    };

    const closeMenu = ({ restoreFocus = true } = {}) => {
      if (!isOpen()) return;
      hamburger.classList.remove("open");
      gnav.classList.remove("open");
      hamburger.setAttribute("aria-expanded", "false");
      document.body.classList.remove("no-scroll");
      document.removeEventListener("keydown", onKeydown);
      if (restoreFocus && lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      }
    };

    const onKeydown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
        return;
      }
      if (e.key === "Tab") {
        const focusables = getFocusable(gnav).concat(hamburger);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    hamburger.addEventListener("click", () => {
      isOpen() ? closeMenu() : openMenu();
    });

    // Close on in-menu link click
    $$("a", gnav).forEach(a => {
      a.addEventListener("click", () => closeMenu({ restoreFocus: false }));
    });

    // Close if viewport upsizes out of mobile
    const mq = window.matchMedia("(min-width: 769px)");
    const mqHandler = (e) => { if (e.matches) closeMenu({ restoreFocus: false }); };
    mq.addEventListener ? mq.addEventListener("change", mqHandler) : mq.addListener(mqHandler);
  };

  /* ---------- Pricing tabs (ARIA tab pattern) ---------- */
  const pricingData = {
    shared: [
      { name: "Starter",    desc: "個人サイト・ブログ向け",          price: "440",    features: ["ディスク 100GB SSD", "転送量 無制限", "マルチドメイン 10個", "無料SSL", "自動バックアップ"], recommended: false },
      { name: "Business",   desc: "中小企業のコーポレートサイトに",   price: "1,320",  features: ["ディスク 300GB SSD", "転送量 無制限", "マルチドメイン 無制限", "無料SSL + WAF", "優先サポート", "WordPress簡単インストール"], recommended: true },
      { name: "Enterprise", desc: "大規模ECサイト・メディア向け",     price: "3,960",  features: ["ディスク 1TB SSD", "転送量 無制限", "マルチドメイン 無制限", "高度WAF + DDoS対策", "専任カスタマーサクセス", "SLA 99.99% 保証"], recommended: false }
    ],
    vps: [
      { name: "VPS 1GB",  desc: "個人の開発用途に",      price: "880",    features: ["メモリ 1GB", "SSD 50GB", "CPU 2コア", "root権限", "テンプレート10種"], recommended: false },
      { name: "VPS 4GB",  desc: "小規模サービスに最適",   price: "3,520",  features: ["メモリ 4GB", "SSD 200GB", "CPU 4コア", "root権限", "自動バックアップ", "スナップショット"], recommended: true },
      { name: "VPS 16GB", desc: "本格運用の基盤に",      price: "14,300", features: ["メモリ 16GB", "SSD 800GB", "CPU 8コア", "root権限", "自動バックアップ", "プライベートNW"], recommended: false }
    ],
    dedicated: [
      { name: "Standard", desc: "中規模サイトに",            price: "15,800", features: ["Xeon E-2336", "メモリ 32GB", "SSD 1TB", "帯域 100Mbps", "RAID1構成"], recommended: false },
      { name: "Advance",  desc: "高負荷サイトに",            price: "29,800", features: ["Xeon Silver 4310", "メモリ 64GB", "SSD 2TB x2", "帯域 1Gbps", "RAID1 + 遠隔バックアップ"], recommended: true },
      { name: "Premium",  desc: "基幹業務・大規模運用に",    price: "58,000", features: ["Xeon Gold 6330", "メモリ 128GB", "NVMe 4TB x2", "帯域 1Gbps 専有", "24時間保守"], recommended: false }
    ]
  };

  const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  const initPricingTabs = () => {
    const tablist = $(".pricing-tabs");
    const panel = $(".pricing-grid");
    if (!tablist || !panel) return;
    const tabs = $$(".tab", tablist);
    if (!tabs.length) return;

    // ARIA scaffolding
    tablist.setAttribute("role", "tablist");
    tablist.setAttribute("aria-label", "料金プラン種別");
    if (!panel.id) panel.id = "pricing-panel";
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("tabindex", "0");

    tabs.forEach((tab, i) => {
      tab.setAttribute("role", "tab");
      tab.setAttribute("type", "button");
      const key = tab.dataset.tab || `tab-${i}`;
      if (!tab.id) tab.id = `pricing-tab-${key}`;
      tab.setAttribute("aria-controls", panel.id);
      const active = tab.classList.contains("active");
      tab.setAttribute("aria-selected", active ? "true" : "false");
      tab.setAttribute("tabindex", active ? "0" : "-1");
    });

    const render = (key) => {
      const data = pricingData[key];
      if (!data) return;
      panel.innerHTML = data.map(p => {
        const recClass = p.recommended ? " recommended" : "";
        const btnClass = p.recommended ? "btn-primary" : "btn-outline";
        return `
          <div class="price-card${recClass}">
            ${p.recommended ? '<span class="ribbon">おすすめ</span>' : ""}
            <h3>${escapeHTML(p.name)}</h3>
            <p class="price-desc">${escapeHTML(p.desc)}</p>
            <div class="price"><span>月額</span><strong>${escapeHTML(p.price)}</strong><span>円</span></div>
            <ul class="price-features">
              ${p.features.map(f => `<li><i class="fa-solid fa-check" aria-hidden="true"></i> ${escapeHTML(f)}</li>`).join("")}
            </ul>
            <a href="#" class="btn ${btnClass} btn-block">このプランで申し込む</a>
          </div>
        `;
      }).join("");
      // Re-attach fade-up to freshly rendered cards
      observeFadeUp($$(".price-card", panel));
    };

    const activate = (tab, { focus = true } = {}) => {
      if (!tab) return;
      tabs.forEach(t => {
        const selected = t === tab;
        t.classList.toggle("active", selected);
        t.setAttribute("aria-selected", selected ? "true" : "false");
        t.setAttribute("tabindex", selected ? "0" : "-1");
      });
      panel.setAttribute("aria-labelledby", tab.id);
      render(tab.dataset.tab);
      if (focus) tab.focus();
    };

    tabs.forEach((tab, idx) => {
      tab.addEventListener("click", () => activate(tab, { focus: false }));
      tab.addEventListener("keydown", (e) => {
        let next = null;
        switch (e.key) {
          case "ArrowRight": next = tabs[(idx + 1) % tabs.length]; break;
          case "ArrowLeft":  next = tabs[(idx - 1 + tabs.length) % tabs.length]; break;
          case "Home":       next = tabs[0]; break;
          case "End":        next = tabs[tabs.length - 1]; break;
          default: return;
        }
        e.preventDefault();
        activate(next);
      });
    });

    // If initial active tab exists, ensure panel matches
    const initial = tabs.find(t => t.classList.contains("active")) || tabs[0];
    panel.setAttribute("aria-labelledby", initial.id);
    // Only re-render if initial key differs from static markup (shared is already in DOM)
    if (initial.dataset.tab && initial.dataset.tab !== "shared") {
      render(initial.dataset.tab);
    }
  };

  /* ---------- Pagetop ---------- */
  const initPagetop = () => {
    const pagetop = $(".pagetop");
    if (!pagetop) return;
    if (!pagetop.hasAttribute("type")) pagetop.setAttribute("type", "button");
    const onScroll = () => {
      pagetop.classList.toggle("show", window.scrollY > 400);
    };
    window.addEventListener("scroll", rafThrottle(onScroll), { passive: true });
    onScroll();
    pagetop.addEventListener("click", () => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
    });
  };

  /* ---------- Fade-up with IntersectionObserver ---------- */
  let fadeObserver = null;

  const ensureFadeObserver = () => {
    if (fadeObserver) return fadeObserver;
    if (!("IntersectionObserver" in window)) {
      // Fallback: reveal immediately
      fadeObserver = {
        observe: (el) => el.classList.add("visible"),
        unobserve: () => {}
      };
      return fadeObserver;
    }
    fadeObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    return fadeObserver;
  };

  const observeFadeUp = (elements) => {
    const obs = ensureFadeObserver();
    elements.forEach(el => {
      if (!el || el.classList.contains("fade-up")) return;
      el.classList.add("fade-up");
      obs.observe(el);
    });
  };

  const initFadeUp = () => {
    const targets = $$(".service-card, .feature-item, .price-card, .case-card, .section-head");
    observeFadeUp(targets);
  };

  /* ---------- Smooth anchors with header offset ---------- */
  const initSmoothAnchors = () => {
    const header = $(".header");
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    $$('a[href^="#"]').forEach(a => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href");
        if (!href || href.length <= 1 || href === "#") return;
        let target;
        try {
          target = document.querySelector(href);
        } catch {
          return; // invalid selector (e.g. "#!/foo")
        }
        if (!target) return;
        e.preventDefault();
        const headerH = header ? header.getBoundingClientRect().height : 0;
        const y = target.getBoundingClientRect().top + window.scrollY - headerH - 10;
        window.scrollTo({ top: y, behavior: prefersReduced.matches ? "auto" : "smooth" });
        // Move focus for a11y
        if (target.hasAttribute("tabindex") === false) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      });
    });
  };

  /* ---------- Kickoff ---------- */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
