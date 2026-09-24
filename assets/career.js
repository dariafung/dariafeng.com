/* ==========================================================
   Career 页面的内容都在这里改。
   文字可以直接写一种语言（"MLE Intern"），也可以写中英两份（{ en: "…", zh: "…" }）

   education / internships：
     logo:    大 logo。{ img: "图片路径" } 用原图；
              { icon: "图标名", color: "#色值" } 用 Simple Icons 的单色图标；
              { mask: "单色 SVG 路径", color: "#色值" } 把自己的单色 SVG 涂成指定颜色
     name:    logo 旁边的名字
     sub:     logo 下面的小 logo（可选），格式同上，加 label 写名字
     title:   卡片上的主要文字，比如学位 / 职位
     when:    时间（可选）
   projects：点击打开 link（留空就不能点）
   ========================================================== */

// Simple Icons：开源的品牌图标库，https://simpleicons.org
const SI = (name) => `https://cdn.jsdelivr.net/npm/simple-icons@13/icons/${name}.svg`;

window.CAREER = {
  education: [
    {
      // UW 官方单色 crest（brand.wisc.edu），涂成 UW 红
      logo: { mask: "assets/logos/uw-crest.svg", color: "#c5050c" },
      name: "University of Wisconsin–Madison",
      title: "B.S. in Computer Science",
    },
  ],

  internships: [
    {
      logo: { icon: "bytedance", color: "#3c8cff" },
      name: "ByteDance",
      sub: { icon: "tiktok", color: "#000000", label: "TikTok" },
      title: "MLE Intern",
    },
  ],

  projects: [
    { title: "…", desc: "…", link: "" },
    { title: "…", desc: "…", link: "" },
    { title: "…", desc: "…", link: "" },
  ],
};

/* ---------- 下面是渲染卡片的代码，一般不用改 ---------- */
(function () {
  const data = window.CAREER;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pick = (o, l) => (o == null ? "" : typeof o === "string" ? o : o[l] || o.en || o.zh || "");
  const bi = (o) => {
    if (o == null || typeof o === "string") return esc(o);
    return `<span lang="en">${esc(pick(o, "en"))}</span><span lang="zh">${esc(pick(o, "zh"))}</span>`;
  };

  // 单色图标用 CSS mask 上色；原图直接用 <img>
  const logoHTML = (l, cls) => {
    if (!l) return "";
    if (l.img) return `<img class="${cls}" src="${esc(l.img)}" alt="">`;
    // 转成完整地址：写在 CSS 变量里的相对路径会被当成相对样式表，找错地方
    const url = l.mask ? new URL(l.mask, document.baseURI).href : SI(l.icon);
    return `<span class="${cls} mask-icon" style="--icon: url('${esc(url)}'); --c: ${esc(l.color || "#111")}" aria-hidden="true"></span>`;
  };

  const orgCard = (c) => `
    <article class="org-card">
      <div class="oc-head">
        ${logoHTML(c.logo, "oc-logo")}
        <span class="oc-name">${bi(c.name)}</span>
      </div>
      ${c.sub ? `<div class="oc-sub">${logoHTML(c.sub, "oc-sublogo")}<span>${bi(c.sub.label)}</span></div>` : ""}
      <p class="oc-title">${bi(c.title)}</p>
      ${c.when ? `<p class="oc-when">${bi(c.when)}</p>` : ""}
    </article>`;

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

  document.getElementById("eduCards").innerHTML = (data.education || []).map(orgCard).join("");
  document.getElementById("internCards").innerHTML = (data.internships || []).map(orgCard).join("");
  document.getElementById("projectCards").innerHTML = (data.projects || []).map(projectCard).join("");
})();
