/* ==========================================================
   攀岩地图的数据：每个去过的地方一条。
   去过的国家会根据钉子位置自动涂色，不用另外写。

   type:  "outdoor"（户外岩场）或 "gym"（岩馆）
   lat / lng: 纬度 / 经度。在 Google 地图上右键点那个位置，第一行就是 “纬度, 经度”
   media: 照片 / 视频，可以放多个
     { type: "image", src: "assets/climbing/xxx.jpg", caption: "…" }
     { type: "video", src: "assets/climbing/xxx.mp4" }                ← 短视频，建议压缩到 20MB 以内
     { type: "embed", src: "https://www.youtube.com/embed/xxxx" }     ← 长视频放 YouTube / B 站，用嵌入链接

   例子（复制到下面的 CLIMBS 方括号里就会生效）：
   {
     name: { en: "Fontainebleau", zh: "枫丹白露" },
     type: "outdoor",
     lat: 48.404, lng: 2.699,
     date: "2026-05",
     note: { en: "Bouldering in the forest.", zh: "森林里的抱石。" },
     media: [
       { type: "image", src: "assets/climbing/font-1.jpg", caption: "Sunset at Bas Cuvier" },
     ],
   },
   ========================================================== */

window.CLIMBS = [
];
