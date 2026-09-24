/* ==========================================================
   Blog 文章都写在这里。
   每篇文章在它的每个 tag 旁边各有一个点；同一个 tag 的点互相连线。

   tags 可选：notes / scifi / tech（可以写多个）
   title / body 写 en 和 zh；只写一种语言也行，另一种会自动用它顶上
   body 里可以写 HTML：<p>段落</p> <h2>小标题</h2> <blockquote>引用</blockquote> <img src="...">

   例子（复制到下面的 POSTS 方括号里就会生效）：
   {
     slug: "my-first-post",              // 网址里用的名字，只用英文字母、数字、连字符
     date: "2026-10-01",
     tags: ["notes", "tech"],
     title: { en: "My first post", zh: "我的第一篇文章" },
     body:  { en: "<p>Hello.</p>",     zh: "<p>你好。</p>" },
   },
   ========================================================== */

window.POSTS = [
  {
    slug: "memo1",
    date: "2026-09-24",
    tags: ["notes"],
    title: { en: "memo1", zh: "memo1" },
    body: {
      en: "<p>Often, we hesitate between choices because we don't know ourselves well enough. Once we truly understand ourselves, we realize there is only one path left.</p>",
      zh: "<p>很多时候在不同选择中犹豫不决是因为不够了解自己，真正了解自己之后意识到其实只剩下一条路。</p>",
    },
  },
];
