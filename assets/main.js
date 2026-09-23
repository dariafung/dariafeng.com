(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // 渲染双语文本：两种语言都输出，由 CSS 按当前语言显示
  const bi = (o) => `<span lang="en">${esc(o.en)}</span><span lang="zh">${esc(o.zh)}</span>`;

  /* ---------- Language ---------- */
  let lang = store.get("lang") || ((navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en");
  function setLang(l) {
    lang = l;
    root.dataset.lang = l;
    root.lang = l === "zh" ? "zh-CN" : "en";
    store.set("lang", l);
    if (currentPost) renderPost(currentPost);
    fit();
  }
  $("#langToggle").addEventListener("click", () => setLang(lang === "en" ? "zh" : "en"));

  /* ---------- Content ---------- */
  const EXPERIENCE = window.EXPERIENCE || [];
  const POSTS = window.POSTS || [];
  const PHOTOS = window.PHOTOS || [];

  $("#timeline").innerHTML = EXPERIENCE.map((e) => `
    <li>
      <span class="t-when mono">${esc(e.when)}</span>
      <span class="t-role">${bi(e.role)}</span>
      <span class="t-org">${bi(e.org)}</span>
      <span class="t-desc">${bi(e.desc)}</span>
    </li>`).join("");

  $("#posts").innerHTML = POSTS.map((p) => `
    <li><a href="#journal/${esc(p.slug)}">
      <span class="p-date mono">${esc(p.date)}</span>
      <span class="p-title">${bi(p.title)}</span>
      <span class="p-tag mono">${(p.tags || []).map(esc).join(" · ")}</span>
    </a></li>`).join("");

  const media = (ph) => ph.src
    ? `<img src="${esc(ph.src)}" alt="${esc(ph.caption.en)}" loading="lazy">`
    : `<div class="ph"><span class="mono">IMG</span></div>`;

  $("#gallery").innerHTML = PHOTOS.map((ph, i) => `
    <button type="button" class="shot" data-shape="${esc(ph.shape || "square")}" data-i="${i}">
      ${media(ph)}
      <figcaption class="mono"><span>${bi(ph.caption)}</span><span>${String(i + 1).padStart(2, "0")}</span></figcaption>
    </button>`).join("");

  /* ---------- Journal article ---------- */
  let currentPost = null;
  function renderPost(p) {
    $("#postMeta").textContent = `${p.date} — ${(p.tags || []).join(" · ")}`;
    $("#postTitle").textContent = p.title[lang];
    $("#postBody").innerHTML = p.body[lang]; // 文章正文是你自己写的 HTML
    document.title = `${p.title[lang]} — Daria Feng`;
  }

  /* ---------- Router (#tab 或 #journal/slug) ---------- */
  const TABS = $$("[data-tab]").map((s) => s.dataset.tab);
  function route() {
    const [tab, slug] = location.hash.replace(/^#/, "").split("/");
    const active = TABS.includes(tab) ? tab : "index";

    $$("[data-tab]").forEach((s) => s.classList.toggle("is-active", s.dataset.tab === active));
    $$(".tabs [data-tab-link]").forEach((a) => a.classList.toggle("is-active", a.dataset.tabLink === active));

    const post = active === "journal" && slug ? POSTS.find((p) => p.slug === slug) : null;
    currentPost = post;
    $("#posts").hidden = !!post;
    $("#post").hidden = !post;
    if (post) renderPost(post);
    else document.title = "Daria Feng";
    fit();

    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);

  /* ---------- Lightbox ---------- */
  const lb = $("#lightbox");
  function openLb(i) {
    const ph = PHOTOS[i];
    $("#lbMedia").innerHTML = media(ph);
    $("#lbCap").innerHTML = `${String(i + 1).padStart(2, "0")} — ${bi(ph.caption)}`;
    lb.hidden = false;
    $("#lbClose").focus();
  }
  const closeLb = () => { lb.hidden = true; };
  $("#gallery").addEventListener("click", (e) => {
    const b = e.target.closest(".shot");
    if (b) openLb(+b.dataset.i);
  });
  $("#lbClose").addEventListener("click", closeLb);
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !lb.hidden) closeLb(); });

  /* ---------- Clock ---------- */
  const clock = $("#clock");
  const tick = () => { clock.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }); };
  tick(); setInterval(tick, 15000);
  $("#year").textContent = new Date().getFullYear();

  /* ---------- Cursor ---------- */
  const cur = $(".cursor");
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let x = 0, y = 0, cx = 0, cy = 0;
    addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; });
    (function loop() {
      cx += (x - cx) * 0.22; cy += (y - cy) * 0.22;
      cur.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener("mouseover", (e) => {
      cur.classList.toggle("is-big", !!e.target.closest("a, button"));
    });
  }

  /* ---------- Fit big headings to width ---------- */
  // 大标题按容器宽度自动缩放，max 为最大字号(px)
  function fit() {
    const textWidth = (node) => {
      const r = document.createRange();
      r.selectNodeContents(node);
      return r.getBoundingClientRect().width;
    };
    $$(".tab.is-active [data-fit]").forEach((el) => {
      const max = +el.dataset.fit;
      el.style.fontSize = max + "px";
      // .tab-head 里标题左边有 (02) 这样的编号，要让出它的宽度
      const label = el.parentElement.classList.contains("tab-head") ? el.previousElementSibling : null;
      const avail = el.parentElement.clientWidth - (label ? label.offsetWidth + 16 : 0);
      const lines = $$(".row", el);
      const w = Math.max(...(lines.length ? lines : [el]).map(textWidth));
      if (w > avail) el.style.fontSize = Math.floor(max * avail / w * 0.96) + "px";
    });
  }
  addEventListener("resize", fit);
  if (document.fonts) document.fonts.ready.then(fit);

  setLang(lang);
  route();
})();
