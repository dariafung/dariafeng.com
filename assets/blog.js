/* ==========================================================
   Blog：星空里的标签节点 + 文章小点
   - 每个 tag 是一个带名字的节点
   - 每篇文章在它的每个 tag 旁边各有一个无字小点
   - 同一个 tag 的文章点互相连线，也连到 tag 节点
   网址：#blog  /  #blog/tag/tech  /  #blog/post/<slug>
   在网址后加 ?demo 可以用假文章预览效果
   ========================================================== */
(function () {
  const TAGS = [
    { id: "notes", label: "NOTES",  x: 0.24, y: 0.34, mx: 0.22, my: 0.26 },
    { id: "scifi", label: "SCI-FI", x: 0.70, y: 0.26, mx: 0.60, my: 0.46 },
    { id: "tech",  label: "TECH",   x: 0.52, y: 0.74, mx: 0.30, my: 0.70 },
  ];

  const section = document.querySelector('[data-tab="blog"]');
  const canvas = document.getElementById("constellation");
  const ctx = canvas.getContext("2d");
  const labelsEl = document.getElementById("blogLabels");
  const tip = document.getElementById("blogTip");
  const panel = document.getElementById("blogPanel");
  const postEl = document.getElementById("blogPost");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let POSTS = window.POSTS || [];
  if (new URLSearchParams(location.search).has("demo")) POSTS = demoPosts();

  /* ---------- 小工具 ---------- */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pick = (o, l) => (o ? o[l] || o.en || o.zh || "" : "");
  const bi = (o) => `<span lang="en">${esc(pick(o, "en"))}</span><span lang="zh">${esc(pick(o, "zh"))}</span>`;
  const biHTML = (o) => `<div lang="en">${pick(o, "en")}</div><div lang="zh">${pick(o, "zh")}</div>`;
  const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const rng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const tagById = (id) => TAGS.find((t) => t.id === id);

  /* ---------- 标签的 HTML 按钮（文字用 HTML，清晰、可点击、读屏可读） ---------- */
  TAGS.forEach((t) => {
    const a = document.createElement("a");
    a.className = "tag-label";
    a.href = `#blog/tag/${t.id}`;
    a.textContent = t.label;
    labelsEl.appendChild(a);
    t.el = a;
  });

  /* ---------- 布局 ---------- */
  let W = 0, H = 0, dpr = 1;
  let stars = [], deco = [], decoLinks = [], dots = [], tagLinks = [];

  function layout() {
    W = section.clientWidth; H = section.clientHeight;
    if (!W || !H) return;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const narrow = W < 720;
    const unit = Math.min(W, H) / 800;
    TAGS.forEach((t) => { t.px = (narrow ? t.mx : t.x) * W; t.py = (narrow ? t.my : t.y) * H; t.ph = hash(t.id) % 628 / 100; });

    const R = rng(7);
    // 背景星星
    stars = Array.from({ length: Math.round((W * H) / 4500) }, () => ({
      x: R() * W, y: R() * H, r: R() < 0.07 ? 1.3 : 0.6 + R() * 0.3, a: 0.2 + R() * 0.6, tw: R() * 6.28,
    }));
    // 装饰用的星座点（无意义，只为了那张“网”的感觉）
    deco = Array.from({ length: Math.round(18 + (W * H) / 60000) }, () => ({ x: R() * W, y: R() * H, ph: R() * 6.28 }));
    TAGS.forEach((t) => {
      for (let i = 0; i < 4; i++) {
        const ang = R() * 6.28, rad = (170 + R() * 160) * unit;
        deco.push({ x: t.px + Math.cos(ang) * rad, y: t.py + Math.sin(ang) * rad, ph: R() * 6.28 });
      }
    });
    const nodes = [...deco, ...TAGS.map((t) => ({ x: t.px, y: t.py, tag: t }))];
    const seen = new Set();
    decoLinks = [];
    nodes.forEach((n, i) => {
      nodes
        .map((m, j) => ({ j, d: (m.x - n.x) ** 2 + (m.y - n.y) ** 2 }))
        .filter((o) => o.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 2 + (i % 2))
        .forEach(({ j }) => {
          const k = i < j ? `${i}-${j}` : `${j}-${i}`;
          if (!seen.has(k)) { seen.add(k); decoLinks.push([nodes[i], nodes[j]]); }
        });
    });

    // 文章点：每篇文章的每个 tag 一个点，位置由 slug+tag 决定，刷新也不会变
    dots = [];
    POSTS.forEach((p) => (p.tags || []).forEach((id) => {
      const t = tagById(id);
      if (!t) return;
      const r = rng(hash(p.slug + "@" + id));
      const ang = r() * 6.28, rad = (55 + r() * 115) * unit;
      dots.push({ x: t.px + Math.cos(ang) * rad, y: t.py + Math.sin(ang) * rad, post: p, tag: t, ph: r() * 6.28 });
    }));
    // 同一个 tag 的点互相连（点多时只连最近的 3 个，免得糊成一团）
    tagLinks = [];
    TAGS.forEach((t) => {
      const mine = dots.filter((d) => d.tag === t);
      const tNode = { x: t.px, y: t.py, ph: t.ph };
      mine.forEach((d) => tagLinks.push([tNode, d, t]));
      const s = new Set();
      mine.forEach((d, i) => {
        const others = mine.map((m, j) => ({ j, dist: (m.x - d.x) ** 2 + (m.y - d.y) ** 2 })).filter((o) => o.j !== i).sort((a, b) => a.dist - b.dist);
        (mine.length <= 6 ? others : others.slice(0, 3)).forEach(({ j }) => {
          const k = i < j ? `${i}-${j}` : `${j}-${i}`;
          if (!s.has(k)) { s.add(k); tagLinks.push([d, mine[j], t]); }
        });
      });
    });
  }

  /* ---------- 镜头 ---------- */
  const cam = { fx: 0, fy: 0, s: 1, ax: 0, ay: 0 };
  const goal = { ...cam };
  let focus = null; // 当前聚焦的 tag
  function setGoal() {
    if (focus) {
      const wide = W >= 720;
      Object.assign(goal, { fx: focus.px, fy: focus.py, s: 1.7, ax: wide ? W * 0.34 : W / 2, ay: wide ? H / 2 : H * 0.3 });
    } else {
      Object.assign(goal, { fx: W / 2, fy: H / 2, s: 1, ax: W / 2, ay: H / 2 });
    }
  }

  const mouse = { x: 0, y: 0, sx: 0, sy: 0, over: false };
  let t0 = 0;
  // 世界坐标 → 屏幕坐标（带轻微漂浮和鼠标视差）
  function project(p, depth = 1) {
    const tt = reduceMotion ? 0 : t0;
    const ph = p.ph || 0;
    const dx = Math.sin(tt * 0.25 + ph) * 3, dy = Math.cos(tt * 0.21 + ph * 1.3) * 3;
    const px = (mouse.sx - W / 2) * 0.015 * depth, py = (mouse.sy - H / 2) * 0.015 * depth;
    return [(p.x + dx - cam.fx) * cam.s + cam.ax - px, (p.y + dy - cam.fy) * cam.s + cam.ay - py];
  }

  /* ---------- 绘制 ---------- */
  let hovered = null;
  function draw(now) {
    t0 = now / 1000;
    const k = 1 - Math.pow(0.02, Math.min(0.05, dtSec));
    for (const key in cam) cam[key] += (goal[key] - cam[key]) * k;
    mouse.sx += (mouse.x - mouse.sx) * 0.06;
    mouse.sy += (mouse.y - mouse.sy) * 0.06;

    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);

    // 星星：只有视差，不跟镜头缩放 → 有远近感
    for (const s of stars) {
      const x = s.x - (mouse.sx - W / 2) * 0.006, y = s.y - (mouse.sy - H / 2) * 0.006;
      ctx.globalAlpha = s.a * (reduceMotion ? 1 : 0.7 + 0.3 * Math.sin(t0 * 1.3 + s.tw));
      ctx.fillStyle = "#fff";
      ctx.fillRect(x, y, s.r * 1.4, s.r * 1.4);
    }

    // 装饰网
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = "#fff";
    ctx.globalAlpha = focus ? 0.05 : 0.1;
    ctx.beginPath();
    for (const [a, b] of decoLinks) {
      const [ax, ay] = project(a), [bx, by] = project(b);
      ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
    }
    ctx.stroke();
    ctx.globalAlpha = focus ? 0.25 : 0.5;
    for (const d of deco) { const [x, y] = project(d); ctx.fillRect(x - 0.8, y - 0.8, 1.6, 1.6); }

    // 同一 tag 的文章连线
    for (const [a, b, t] of tagLinks) {
      const on = !focus || focus === t;
      ctx.globalAlpha = on ? (focus ? 0.45 : 0.3) : 0.06;
      ctx.lineWidth = on && focus ? 0.9 : 0.7;
      const [ax, ay] = project(a), [bx, by] = project(b);
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    }

    // 文章点
    for (const d of dots) {
      const on = !focus || focus === d.tag;
      const [x, y] = project(d);
      d.sx = x; d.sy = y;
      const isHover = hovered && hovered.post === d.post;
      ctx.globalAlpha = on ? 0.95 : 0.2;
      ctx.beginPath(); ctx.arc(x, y, isHover ? 4.5 : 2.6, 0, 6.283); ctx.fill();
      if (isHover) {
        ctx.globalAlpha = 0.35; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(x, y, 10, 0, 6.283); ctx.stroke();
      }
    }

    // tag 节点 + 文字位置
    for (const t of TAGS) {
      const [x, y] = project({ x: t.px, y: t.py, ph: t.ph });
      const on = !focus || focus === t;
      ctx.globalAlpha = on ? 1 : 0.3;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, 6.283); ctx.fill();
      t.el.style.transform = `translate(${x + 12}px, ${y}px) translateY(-50%)`;
      t.el.classList.toggle("is-dim", !on);
      t.el.classList.toggle("is-active", focus === t);
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- 鼠标 ---------- */
  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    hovered = null;
    let best = 14 * 14;
    for (const d of dots) {
      const dd = (d.sx - mouse.x) ** 2 + (d.sy - mouse.y) ** 2;
      if (dd < best && (!focus || focus === d.tag)) { best = dd; hovered = d; }
    }
    canvas.style.cursor = hovered ? "pointer" : focus ? "zoom-out" : "default";
    if (hovered) {
      tip.innerHTML = bi(hovered.post.title);
      tip.style.transform = `translate(${mouse.x + 14}px, ${mouse.y + 14}px)`;
      tip.hidden = false;
    } else tip.hidden = true;
  });
  canvas.addEventListener("pointerleave", () => { hovered = null; tip.hidden = true; });
  canvas.addEventListener("click", () => {
    if (hovered) location.hash = `#blog/post/${hovered.post.slug}`;
    else if (focus) location.hash = "#blog";
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !running) return;
    if (!postEl.hidden) location.hash = focus ? `#blog/tag/${focus.id}` : "#blog";
    else if (focus) location.hash = "#blog";
  });

  /* ---------- 面板 / 文章 ---------- */
  const byDate = (a, b) => String(b.date).localeCompare(String(a.date));

  function renderPanel(t) {
    const list = POSTS.filter((p) => (p.tags || []).includes(t.id)).sort(byDate);
    panel.innerHTML = `
      <a class="panel-back" href="#blog">← <span lang="en">All tags</span><span lang="zh">全部标签</span></a>
      <h2>${esc(t.label)}</h2>
      <p class="panel-count">${list.length} <span lang="en">${list.length === 1 ? "post" : "posts"}</span><span lang="zh">篇文章</span></p>
      ${list.length ? `<ol class="panel-list">${list.map((p) => `
        <li><a href="#blog/post/${esc(p.slug)}">
          <span class="pl-date">${esc(p.date)}</span>
          <span class="pl-title">${bi(p.title)}</span>
        </a></li>`).join("")}</ol>`
      : `<p class="panel-empty"><span lang="en">No posts yet.</span><span lang="zh">还没有文章。</span></p>`}`;
  }

  function renderPost(p, fromTag) {
    const back = fromTag ? `#blog/tag/${fromTag.id}` : "#blog";
    postEl.innerHTML = `
      <div class="post-inner">
        <a class="panel-back" href="${back}">← ${fromTag ? esc(fromTag.label) : '<span lang="en">All tags</span><span lang="zh">全部标签</span>'}</a>
        <p class="post-meta">${esc(p.date)} · ${(p.tags || []).map((id) => `<a href="#blog/tag/${esc(id)}">${esc(tagById(id)?.label || id)}</a>`).join(" · ")}</p>
        <h1>${bi(p.title)}</h1>
        <div class="post-body">${biHTML(p.body)}</div>
      </div>`;
    postEl.scrollTop = 0;
  }

  /* ---------- 路由 ---------- */
  function route() {
    const [tab, kind, id] = location.hash.slice(1).split("/");
    if (tab !== "blog") { stop(); return; }
    start();
    if (kind === "post") {
      const p = POSTS.find((x) => x.slug === id);
      if (p) {
        if (!focus || !(p.tags || []).includes(focus.id)) focus = tagById((p.tags || [])[0]) || null;
        renderPost(p, focus);
        postEl.hidden = false;
        panel.classList.toggle("is-open", !!focus);
        if (focus) renderPanel(focus);
      } else { location.hash = "#blog"; return; }
    } else {
      postEl.hidden = true;
      focus = kind === "tag" ? tagById(id) || null : null;
      if (focus) renderPanel(focus);
      panel.classList.toggle("is-open", !!focus);
    }
    setGoal();
  }

  /* ---------- 循环 ---------- */
  let running = false, raf = 0, last = 0, dtSec = 0.016;
  function loop(now) {
    dtSec = (now - last) / 1000 || 0.016;
    last = now;
    draw(now);
    raf = requestAnimationFrame(loop);
  }
  function start() {
    if (running) return;
    running = true;
    layout();
    setGoal();
    Object.assign(cam, goal);
    mouse.x = mouse.sx = W / 2; mouse.y = mouse.sy = H / 2;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  addEventListener("resize", () => { if (running) { layout(); setGoal(); } });
  addEventListener("hashchange", route);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop(); else route();
  });
  route();

  /* ---------- 演示用的假文章（网址加 ?demo 才会出现） ---------- */
  function demoPosts() {
    const combos = [["notes"], ["scifi"], ["tech"], ["notes", "tech"], ["scifi", "tech"], ["notes"], ["tech"], ["scifi"], ["notes", "scifi", "tech"], ["notes"], ["tech"]];
    return combos.map((tags, i) => ({
      slug: `demo-${i + 1}`,
      date: `2026-09-${String(20 - i).padStart(2, "0")}`,
      tags,
      title: { en: `Demo post ${i + 1}`, zh: `示例文章 ${i + 1}` },
      body: { en: "<p>…</p>", zh: "<p>……</p>" },
    }));
  }
})();
