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

  /* ---------- Tab 切换（#home / #blog / #career / #climbing） ---------- */
  const tabs = [...document.querySelectorAll("[data-tab]")];
  const names = tabs.map((t) => t.dataset.tab);
  function route() {
    let [name] = location.hash.slice(1).split("/");
    if (name === "sports") name = "climbing"; // 旧网址兼容
    const active = names.includes(name) ? name : "home";
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.tab === active));
    document.querySelectorAll("[data-tab-link]").forEach((a) =>
      a.classList.toggle("is-active", a.dataset.tabLink === active));

    // 首页和 Blog 是深色背景，header 文字变白
    document.body.classList.toggle("on-dark", active === "home" || active === "blog");
    window.dispatchEvent(new CustomEvent("tabchange", { detail: active }));
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  route();
})();
