/* ==========================================================
   Projects 页面的内容都在这里改。
   文字可以直接写一种语言（"Outside The Frame"），也可以写中英两份（{ en: "…", zh: "…" }）

   按分类写：每个分类有 category（标题）和 items（项目列表）
   每个项目：title 标题，desc 一行小字，link 点击打开的网址（留空就不能点）
     cover:  封面图（可选），有封面就显示成大卡片
     tag:    封面下面的小标签（可选），比如 game jam 名字
     theme:  卡片配色（可选），对应 style.css 里的 .theme-xxx
   ========================================================== */

window.PROJECTS = [
  {
    category: { en: "Games", zh: "游戏" },
    items: [
      {
        title: "Outside The Frame",
        desc: { en: "You are a toymaker for Bureau of Toys No. 7.", zh: "你是第七玩具局的一名玩具工匠。" },
        tag: "Micro Jam 067",
        link: "https://blizzardfan.itch.io/outside-the-frame",
        cover: "https://img.itch.zone/aW1nLzMxMDY1MzkwLmdpZg==/original/r3Agtk.gif", // itch.io 页面的封面
        theme: "otf",
      },
    ],
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

  // 项目卡片：有 link 就是可点击的链接；有 cover 就是带封面的大卡片
  const projectCard = (p) => {
    const cls = ["project-card", p.cover && "has-cover", p.theme && `theme-${p.theme}`, !p.link && "is-disabled"].filter(Boolean).join(" ");
    const inner = p.cover
      ? `
      <span class="pc-cover"><img src="${esc(p.cover)}" alt="" loading="lazy"></span>
      <span class="pc-body">
        ${p.tag ? `<span class="pc-tag">${bi(p.tag)}</span>` : ""}
        <span class="pc-title">${bi(p.title)}</span>
        <span class="pc-desc">${bi(p.desc)}</span>
        ${p.link ? '<span class="pc-play"><span lang="en">Play</span><span lang="zh">去玩</span> ↗</span>' : ""}
      </span>`
      : `
      <span class="pc-title">${bi(p.title)}</span>
      <span class="pc-desc">${bi(p.desc)}</span>
      ${p.link ? '<span class="pc-arrow" aria-hidden="true">↗</span>' : ""}`;
    return p.link
      ? `<a class="${cls}" href="${esc(p.link)}" target="_blank" rel="noopener">${inner}</a>`
      : `<div class="${cls}">${inner}</div>`;
  };

  document.getElementById("projectGroups").innerHTML = (window.PROJECTS || []).map((g) => `
    <h2>${bi(g.category)}</h2>
    <div class="cards">${(g.items || []).map(projectCard).join("")}</div>`).join("");
})();
