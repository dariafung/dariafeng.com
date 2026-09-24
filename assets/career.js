/* ==========================================================
   Career 页面的内容都在这里改。
   文字可以直接写一种语言（"UW–Madison"），也可以写中英两份（{ en: "…", zh: "…" }）

   education / internships：翻转卡片
     正面：title（学校 / 公司）、subtitle（学位 / 职位）、when（时间）
     背面：details（几条要点）
   projects：点击打开 link（留空就不能点）
   ========================================================== */

window.CAREER = {
  education: [
    { title: "…", subtitle: "…", when: "…", details: ["…"] },
  ],

  internships: [
    { title: "…", subtitle: "…", when: "…", details: ["…"] },
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

  // 翻转卡片：正面 + 背面，点击翻转
  const flipCard = (c) => `
    <button type="button" class="flip-card" aria-pressed="false">
      <span class="flip-inner">
        <span class="face front">
          <span class="fc-title">${bi(c.title)}</span>
          <span class="fc-sub">${bi(c.subtitle)}</span>
          <span class="fc-when">${bi(c.when)}</span>
          <span class="fc-hint" aria-hidden="true">↻</span>
        </span>
        <span class="face back">
          <span class="fc-title">${bi(c.title)}</span>
          <span class="fc-details">${(c.details || []).map((d) => `<span class="fc-li">${bi(d)}</span>`).join("")}</span>
          <span class="fc-hint" aria-hidden="true">↻</span>
        </span>
      </span>
    </button>`;

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

  document.getElementById("eduCards").innerHTML = (data.education || []).map(flipCard).join("");
  document.getElementById("internCards").innerHTML = (data.internships || []).map(flipCard).join("");
  document.getElementById("projectCards").innerHTML = (data.projects || []).map(projectCard).join("");

  document.querySelector('[data-tab="career"]').addEventListener("click", (e) => {
    const card = e.target.closest(".flip-card");
    if (!card) return;
    const flipped = card.classList.toggle("is-flipped");
    card.setAttribute("aria-pressed", String(flipped));
  });
})();
