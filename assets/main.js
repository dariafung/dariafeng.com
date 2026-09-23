(function () {
  const root = document.documentElement;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };

  /* ---------- 中英切换 ---------- */
  let lang = store.get("lang") || ((navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en");
  function setLang(l) {
    lang = l;
    root.dataset.lang = l;
    root.lang = l === "zh" ? "zh-CN" : "en";
    store.set("lang", l);
  }
  document.getElementById("langToggle").addEventListener("click", () => setLang(lang === "en" ? "zh" : "en"));
  setLang(lang);

  /* ---------- Tab 切换（#home / #blog / #career / #sports/climbing） ---------- */
  const tabs = [...document.querySelectorAll("[data-tab]")];
  const names = tabs.map((t) => t.dataset.tab);
  function route() {
    const [name, sub] = location.hash.slice(1).split("/");
    const active = names.includes(name) ? name : "home";
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.tab === active));
    document.querySelectorAll("[data-tab-link]").forEach((a) =>
      a.classList.toggle("is-active", a.dataset.tabLink === active));

    // 子 tab：没指定或不存在时，默认第一个（Sports 里就是 Climbing）
    const page = tabs.find((t) => t.dataset.tab === active);
    const panels = [...page.querySelectorAll("[data-sub]")];
    if (panels.length) {
      const current = panels.some((p) => p.dataset.sub === sub) ? sub : panels[0].dataset.sub;
      panels.forEach((p) => p.classList.toggle("is-active", p.dataset.sub === current));
      page.querySelectorAll("[data-sub-link]").forEach((a) =>
        a.classList.toggle("is-active", a.dataset.subLink === current));
    }
    document.body.classList.toggle("on-home", active === "home");
    window.dispatchEvent(new CustomEvent("tabchange", { detail: active }));
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  route();
})();
