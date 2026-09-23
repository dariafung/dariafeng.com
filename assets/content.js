/* ==========================================================
   网站内容都在这里改 —— Edit your content here.
   每一项都有 en（英文）和 zh（中文）两个版本。
   ========================================================== */

/* ---------- 经历 Experience ---------- */
window.EXPERIENCE = [
  {
    when: "2025 — Now",
    role: { en: "Your current role", zh: "你现在的身份" },
    org:  { en: "Company / School", zh: "公司 / 学校" },
    desc: { en: "One or two lines about what you do here and what you're proud of.",
            zh: "一两句话，说说你在这里做什么、最骄傲的是什么。" },
  },
  {
    when: "2023 — 2025",
    role: { en: "Previous role", zh: "之前的身份" },
    org:  { en: "Somewhere interesting", zh: "某个有意思的地方" },
    desc: { en: "Placeholder — replace with a real highlight.",
            zh: "占位文字——换成一个真实的亮点。" },
  },
  {
    when: "2019 — 2023",
    role: { en: "Degree / Major", zh: "学位 / 专业" },
    org:  { en: "University", zh: "大学" },
    desc: { en: "What you studied, and what actually stuck.",
            zh: "你学了什么，以及真正记住的是什么。" },
  },
];

/* ---------- 文章 Journal ----------
   body 里可以写 HTML：<p>段落</p>、<h2>小标题</h2>、<img src="...">、<blockquote>引用</blockquote>
   slug 是文章网址的一部分，只用英文字母、数字和连字符。 */
window.POSTS = [
  {
    slug: "hello-world",
    date: "2026-09-23",
    tags: ["Life"],
    title: { en: "Hello, world", zh: "你好，世界" },
    body: {
      en: `<p>This is the very first post on this site. It exists so you can see how an article looks — replace it with something you actually want to say.</p>
           <blockquote>Start before you're ready.</blockquote>
           <p>Posts support paragraphs, subheadings, quotes and images.</p>`,
      zh: `<p>这是这个网站的第一篇文章。它的存在只是为了让你看看文章长什么样——把它换成你真正想说的话吧。</p>
           <blockquote>在准备好之前就开始。</blockquote>
           <p>文章支持段落、小标题、引用和图片。</p>`,
    },
  },
  {
    slug: "on-style",
    date: "2026-09-10",
    tags: ["Style"],
    title: { en: "On personal style", zh: "关于个人风格" },
    body: {
      en: `<p>Placeholder essay. Style is less about what you wear and more about what you notice.</p>`,
      zh: `<p>占位随笔。风格与其说是你穿什么，不如说是你注意到什么。</p>`,
    },
  },
  {
    slug: "city-notes",
    date: "2026-08-28",
    tags: ["Travel"],
    title: { en: "Notes from a city at night", zh: "夜晚城市笔记" },
    body: {
      en: `<p>Placeholder travel notes. Neon, rain, and a very good bowl of noodles.</p>`,
      zh: `<p>占位旅行笔记。霓虹、雨，还有一碗非常好吃的面。</p>`,
    },
  },
];

/* ---------- 影像 Gallery ----------
   src: 照片路径（放进 assets/img/ 文件夹），留空会显示占位色块
   shape: "tall" 竖图 / "wide" 横图 / "square" 方图 */
window.PHOTOS = [
  { src: "", shape: "tall",   caption: { en: "Tokyo, 2am",        zh: "东京，凌晨两点" } },
  { src: "", shape: "square", caption: { en: "Morning coffee",    zh: "早晨的咖啡" } },
  { src: "", shape: "wide",   caption: { en: "Coastline",         zh: "海岸线" } },
  { src: "", shape: "square", caption: { en: "Studio",            zh: "工作室" } },
  { src: "", shape: "tall",   caption: { en: "Street, film",      zh: "街头，胶片" } },
  { src: "", shape: "wide",   caption: { en: "Gallery opening",   zh: "展览开幕" } },
  { src: "", shape: "square", caption: { en: "Flowers",           zh: "花" } },
  { src: "", shape: "tall",   caption: { en: "Self portrait",     zh: "自拍" } },
];
