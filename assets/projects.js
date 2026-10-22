/* ==========================================================
   Career 页面的内容都在这里改。
   文字可以直接写一种语言（"MLE Intern"），也可以写中英两份（{ en: "…", zh: "…" }）

   education / internships：
     logo:   完整 logo 图片 { img: "路径", h: 高度(px) }
     sub:    logo 下面的小 logo（可选），格式同上
     title:  一行小字，比如学位 / 职位
     when:   时间（可选）
   projects：点击打开 link（留空就不能点）

   logo 来源：UW 官方横版 W Crest（brand.wisc.edu）；ByteDance、TikTok（Wikimedia）
   ========================================================== */

window.CAREER = {
  education: [
    {
      logo: { img: "assets/logos/uw-horizontal.svg", h: 40, alt: "University of Wisconsin–Madison" },
      title: "B.S. in Computer Science",
    },
  ],

  internships: [
    {
      logo: { img: "assets/logos/bytedance.svg", h: 22, alt: "ByteDance" },
      sub: { img: "assets/logos/tiktok.svg", h: 13, alt: "TikTok" },
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

  const logoHTML = (l, cls) =>
    l ? `<img class="${cls}" src="${esc(l.img)}" alt="${esc(l.alt)}" style="height: ${+l.h || 28}px">` : "";

  const orgCard = (c) => `
    <article class="org-card">
      ${logoHTML(c.logo, "oc-logo")}
      ${c.sub ? logoHTML(c.sub, "oc-sublogo") : ""}
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
