/* ==========================================================
   Projects 页面的内容都在这里改。
   文字可以直接写一种语言（"Outside The Frame"），也可以写中英两份（{ en: "…", zh: "…" }）

   每个项目：title 标题，desc 一行小字，link 点击打开的网址（留空就不能点）
   ========================================================== */

window.PROJECTS = [
  {
    title: "Outside The Frame",
    desc: { en: "Toymaker sim · Micro Jam 067", zh: "玩具工匠模拟 · Micro Jam 067" },
    link: "https://blizzardfan.itch.io/outside-the-frame",
  },
];

/* ---------- 下面是渲染卡片的代码，一般不用改 ---------- */
(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pick = (o, l) => (o == null ? "" : typeof o === "string" ? o : o[l] || o.en || o.zh || "");
  const bi = (o) => {
    if (o == null || typeof o === "string") return esc(o);
    return `<span lang="en">${esc(pick(o, "en"))}</span><span lang="zh">${esc(pick(o, "zh"))}</span>`;
  };

  // 项目卡片：有 link 就是可点击的链接
  const projectCard = (p) => {
    const inner = `
      <span class="pc-title">${bi(p.title)}</span>
      <span class="pc-desc">${bi(p.desc)}</span>
      ${p.link ? '<span class="pc-arrow" aria-hidden="true">↗</span>' : ""}`;
    return p.link
      ? `<a class="project-card" href="${esc(p.link)}" target="_blank" rel="noopener">${inner}</a>`
      : `<div class="project-card is-disabled">${inner}</div>`;
  };

  document.getElementById("projectCards").innerHTML = (window.PROJECTS || []).map(projectCard).join("");
})();
