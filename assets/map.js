/* ==========================================================
   Sports → Climbing：世界地图 + 钉子
   - 去过的国家自动涂色（根据钉子落在哪个国家）
   - 点钉子弹出照片 / 视频
   数据在 assets/climbing.js；网址加 ?demo 可以看示例地点
   地图库（d3、世界地图数据）只在第一次打开 Climbing 时才加载
   ========================================================== */
(function () {
  const LIBS = [
    "https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js",
    "https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js",
  ];
  const ATLAS = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json";

  const panel = document.querySelector('[data-sub="climbing"]');
  const box = document.getElementById("climbMap");
  const statsEl = document.getElementById("climbStats");
  const listEl = document.getElementById("climbList");
  const dialog = document.getElementById("spotDialog");

  let SPOTS = window.CLIMBS || [];
  if (new URLSearchParams(location.search).has("demo")) SPOTS = demoSpots();

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pick = (o, l) => (o == null ? "" : typeof o === "string" ? o : o[l] || o.en || o.zh || "");
  const bi = (o) => `<span lang="en">${esc(pick(o, "en"))}</span><span lang="zh">${esc(pick(o, "zh"))}</span>`;
  const TYPE = {
    outdoor: { en: "Outdoor", zh: "户外" },
    gym: { en: "Gym", zh: "岩馆" },
  };

  /* ---------- 只在 Climbing 可见时加载 ---------- */
  let started = false;
  const visible = () => panel.classList.contains("is-active") && panel.closest(".tab").classList.contains("is-active");
  function check() {
    if (!started && visible()) { started = true; load(); }
  }
  addEventListener("hashchange", check);
  check();

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = () => rej(new Error("Failed to load " + src));
      document.head.appendChild(s);
    });
  }

  async function load() {
    try {
      for (const src of LIBS) await loadScript(src);
      const world = await fetch(ATLAS).then((r) => r.json());
      init(world);
    } catch (e) {
      console.error(e);
      box.innerHTML = `<p class="map-msg"><span lang="en">The map couldn't load. Try refreshing.</span><span lang="zh">地图加载失败，刷新试试。</span></p>`;
    }
  }

  /* ---------- 地图 ---------- */
  function init(world) {
    const d3 = window.d3;
    const W = 960, H = 480;

    // 去掉南极洲，地图更紧凑
    const countries = topojson.feature(world, world.objects.countries).features.filter((c) => c.id !== "010");
    const land = { type: "FeatureCollection", features: countries };

    const projection = d3.geoEqualEarth().fitExtent([[6, 6], [W - 6, H - 6]], land);
    const path = d3.geoPath(projection);

    // 每个钉子落在哪个国家。海边的岩场可能因为地图海岸线比较粗而落在“海里”，
    // 这时在周围一圈圈往外找最近的国家（最远约 2°，大概 200 公里）
    const countryAt = (lng, lat) => countries.find((c) => d3.geoContains(c, [lng, lat]));
    function findCountry(s) {
      const hit = countryAt(s.lng, s.lat);
      if (hit) return hit;
      for (const r of [0.25, 0.5, 1, 1.5, 2]) {
        for (let a = 0; a < 360; a += 30) {
          const c = countryAt(s.lng + r * Math.cos((a * Math.PI) / 180), s.lat + r * Math.sin((a * Math.PI) / 180));
          if (c) return c;
        }
      }
      return null;
    }
    SPOTS.forEach((s) => {
      s.country = findCountry(s);
      [s.x, s.y] = projection([s.lng, s.lat]);
    });
    const visited = new Set(SPOTS.map((s) => s.country).filter(Boolean));

    box.innerHTML = "";
    const svg = d3.select(box).append("svg")
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("role", "img")
      .attr("aria-label", "World map of places I've climbed");
    const g = svg.append("g");

    g.append("g").attr("class", "countries")
      .selectAll("path").data(countries).join("path")
      .attr("d", path)
      .attr("class", (c) => (visited.has(c) ? "country is-visited" : "country"))
      .append("title").text((c) => c.properties.name);

    // 钉子：尖端正好落在坐标上
    const PIN = "M0,0 C-2.4,-4.2 -6,-7.4 -6,-11.5 A6,6 0 1 1 6,-11.5 C6,-7.4 2.4,-4.2 0,0 Z";
    const pins = g.append("g").attr("class", "pins")
      .selectAll("g").data([...SPOTS].sort((a, b) => a.y - b.y)).join("g")
      .attr("class", (s) => `pin pin-${s.type === "gym" ? "gym" : "outdoor"}`)
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", (s) => pick(s.name, "en"))
      .attr("transform", (s) => `translate(${s.x},${s.y})`)
      .on("click", (e, s) => openSpot(s))
      .on("keydown", (e, s) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openSpot(s); } });
    pins.append("path").attr("d", PIN);
    pins.append("circle").attr("cy", -11.5).attr("r", 2.3);
    pins.append("title").text((s) => pick(s.name, document.documentElement.dataset.lang));

    // 缩放 / 拖动：滚轮需要按住 Ctrl（或 ⌘），免得滚页面时误缩放
    const zoom = d3.zoom()
      .scaleExtent([1, 20])
      .translateExtent([[0, 0], [W, H]])
      .filter((e) => (e.type === "wheel" ? e.ctrlKey || e.metaKey : !e.button))
      .on("zoom", (e) => {
        g.attr("transform", e.transform);
        pins.attr("transform", (s) => `translate(${s.x},${s.y}) scale(${1 / Math.sqrt(e.transform.k)})`);
      });
    svg.call(zoom).on("dblclick.zoom", null);

    box.insertAdjacentHTML("beforeend", `
      <div class="map-ctrl">
        <button type="button" data-z="in" aria-label="Zoom in">+</button>
        <button type="button" data-z="out" aria-label="Zoom out">−</button>
        <button type="button" data-z="reset" aria-label="Reset">⟲</button>
      </div>`);
    box.querySelector(".map-ctrl").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      const t = svg.transition().duration(500);
      if (b.dataset.z === "in") zoom.scaleBy(t, 1.8);
      else if (b.dataset.z === "out") zoom.scaleBy(t, 1 / 1.8);
      else zoom.transform(t, d3.zoomIdentity);
    });

    function focusSpot(s) {
      const k = 6;
      svg.transition().duration(900)
        .call(zoom.transform, d3.zoomIdentity.translate(W / 2 - s.x * k, H / 2 - s.y * k).scale(k));
    }

    /* ---------- 统计 + 列表 ---------- */
    const n = (t) => SPOTS.filter((s) => (t === "gym" ? s.type === "gym" : s.type !== "gym")).length;
    statsEl.innerHTML = SPOTS.length
      ? `<span lang="en">${visited.size} ${visited.size === 1 ? "country" : "countries"} · ${n("outdoor")} outdoor · ${n("gym")} ${n("gym") === 1 ? "gym" : "gyms"}</span>
         <span lang="zh">${visited.size} 个国家 · ${n("outdoor")} 个户外岩场 · ${n("gym")} 个岩馆</span>`
      : `<span lang="en">No pins yet.</span><span lang="zh">还没有钉子。</span>`;

    const byDate = [...SPOTS].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    listEl.innerHTML = byDate.map((s, i) => `
      <li><button type="button" data-i="${SPOTS.indexOf(s)}">
        <span class="cl-dot cl-${s.type === "gym" ? "gym" : "outdoor"}" aria-hidden="true"></span>
        <span class="cl-name">${bi(s.name)}</span>
        <span class="cl-meta">${bi(TYPE[s.type] || TYPE.outdoor)}${s.country ? " · " + esc(s.country.properties.name) : ""}${s.date ? " · " + esc(s.date) : ""}</span>
      </button></li>`).join("");
    listEl.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-i]");
      if (!b) return;
      const s = SPOTS[+b.dataset.i];
      box.scrollIntoView({ behavior: "smooth", block: "center" });
      focusSpot(s);
      setTimeout(() => openSpot(s), 950);
    });
  }

  /* ---------- 弹窗：照片 / 视频 ---------- */
  function mediaHTML(m) {
    const cap = m.caption ? `<figcaption>${bi(m.caption)}</figcaption>` : "";
    if (m.type === "video") return `<figure><video src="${esc(m.src)}" controls preload="metadata" playsinline></video>${cap}</figure>`;
    if (m.type === "embed") return `<figure class="embed"><iframe src="${esc(m.src)}" allowfullscreen loading="lazy" title="Video"></iframe>${cap}</figure>`;
    return `<figure><img src="${esc(m.src)}" alt="${esc(pick(m.caption, "en"))}" loading="lazy">${cap}</figure>`;
  }

  function openSpot(s) {
    const media = s.media || [];
    dialog.innerHTML = `
      <button type="button" class="spot-close" aria-label="Close">✕</button>
      <p class="spot-meta">${bi(TYPE[s.type] || TYPE.outdoor)}${s.country ? " · " + esc(s.country.properties.name) : ""}${s.date ? " · " + esc(s.date) : ""}</p>
      <h3>${bi(s.name)}</h3>
      ${s.note ? `<p class="spot-note">${bi(s.note)}</p>` : ""}
      ${media.length
        ? `<div class="spot-media">${media.map(mediaHTML).join("")}</div>`
        : `<p class="spot-empty"><span lang="en">No photos yet.</span><span lang="zh">还没有照片。</span></p>`}`;
    dialog.querySelector(".spot-close").addEventListener("click", () => dialog.close());
    dialog.showModal();
  }
  // 点弹窗外面关闭；关闭时停掉视频
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => { dialog.innerHTML = ""; });

  /* ---------- 示例地点（网址加 ?demo 才会出现） ---------- */
  function demoSpots() {
    const ph = (label, bg) => ({
      type: "image",
      src: "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><rect width="800" height="500" fill="${bg}"/><text x="400" y="260" font-family="sans-serif" font-size="28" fill="#fff" text-anchor="middle">${label}</text></svg>`),
      caption: { en: `Demo photo — ${label}`, zh: `示例照片 — ${label}` },
    });
    return [
      { name: { en: "Fontainebleau", zh: "枫丹白露" }, type: "outdoor", lat: 48.404, lng: 2.699, date: "2026-05",
        note: { en: "Demo note: a line or two about the trip.", zh: "示例：一两句关于这次攀岩的话。" },
        media: [ph("Photo 1", "#8a9a7b"), ph("Photo 2", "#b08968")] },
      { name: { en: "Yosemite", zh: "优胜美地" }, type: "outdoor", lat: 37.73, lng: -119.6, date: "2025-09" },
      { name: { en: "Yangshuo", zh: "阳朔" }, type: "outdoor", lat: 24.78, lng: 110.49, date: "2025-12" },
      { name: { en: "Railay", zh: "莱利海滩" }, type: "outdoor", lat: 8.01, lng: 98.84, date: "2026-02" },
      { name: { en: "A gym in Shanghai", zh: "上海某岩馆" }, type: "gym", lat: 31.23, lng: 121.47, date: "2026-08" },
      { name: { en: "A gym in New York", zh: "纽约某岩馆" }, type: "gym", lat: 40.71, lng: -74.0, date: "2026-07" },
    ];
  }
})();
