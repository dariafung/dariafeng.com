/* ==========================================================
   攀岩地图的数据：每个去过的地方一条。
   去过的国家会根据钉子位置自动涂色，不用另外写。

   name:  地点名字（一种语言就行）
   type:  "outdoor"（户外岩场）或 "gym"（岩馆）
   home:  true = 常去的岩馆，显示 “Home gym”，不写日期
   lat / lng: 纬度 / 经度。在 Google 地图上右键点那个位置，第一行就是 “纬度, 经度”
   media: 照片 / 视频，可以放多个
     { type: "image", src: "assets/climbing/xxx.jpg", caption: "…" }
     { type: "video", src: "assets/climbing/xxx.mp4" }                ← 短视频，建议压缩到 20MB 以内
     { type: "embed", src: "https://www.youtube.com/embed/xxxx" }     ← 长视频放 YouTube / B 站，用嵌入链接

   例子（复制到下面的 CLIMBS 方括号里就会生效）：
   {
     name: "Fontainebleau",
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
  // ---- Madison 常去的岩馆 ----
  { name: "Bakke", type: "gym", home: true, lat: 43.0770, lng: -89.4200 },               // 1976 Observatory Dr
  { name: "Boulders Climbing Gym", type: "gym", home: true, lat: 43.0728, lng: -89.3863 }, // Downtown：129 S Carroll St

  // ---- 北京 ----（位置是大概的，确认分店后再改）
  { name: "Camp", type: "gym", date: "2026-07-19", lat: 39.9365, lng: 116.4540 },
  { name: "Bloc1", type: "gym", date: "2026-07-25", lat: 39.9150, lng: 116.4300 },
  { name: "岩时", type: "gym", date: "2026-08-08", lat: 39.8930, lng: 116.4760 },        // 大望路店：西大望路27号院

  // ---- 户外 ----
  { name: "Winona Ice Park", type: "outdoor", date: "2026-02-07", lat: 44.0343, lng: -91.6392 }, // Sugar Loaf, Winona MN
];
