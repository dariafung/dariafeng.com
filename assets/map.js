/* ==========================================================
   Climbing：世界地图 + 钉子
   - 去过的地方自动涂色：有州/省数据的国家（美、中、加、澳、巴西、印度、印尼、俄、南非）按州/省涂，其他按国家涂
   - 点钉子弹出照片 / 视频
   数据在 assets/climbing.js
   地图库（d3、世界地图数据）只在第一次打开 Climbing 时才加载
   ========================================================== */
(function () {
  const LIBS = [
    "https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js",
    "https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js",
  ];
  const ATLAS = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json";
  const ADMIN1 = "assets/geo/admin1.json?v=1"; // 州 / 省边界（Natural Earth 1:50m，已精简）

  const panel = document.querySelector('[data-tab="climbing"]');
  const box = document.getElementById("climbMap");
  const statsEl = document.getElementById("climbStats");
  const listEl = document.getElementById("climbList");
  const dialog = document.getElementById("spotDialog");

  const SPOTS = window.CLIMBS || [];

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pick = (o, l) => (o == null ? "" : typeof o === "string" ? o : o[l] || o.en || o.zh || "");
  const bi = (o) => `<span lang="en">${esc(pick(o, "en"))}</span><span lang="zh">${esc(pick(o, "zh"))}</span>`;
  const TYPE = {
    outdoor: { en: "Outdoor", zh: "户外" },
    gym: { en: "Gym", zh: "岩馆" },
  };
  // “Wisconsin, United States of America”；州/省名有中文时中文模式显示中文
  const where = (s) => {
    const c = s.country ? esc(s.country.properties.name) : "";
    if (!s.region) return c ? " · " + c : "";
    const r = s.region.properties;
    return ` · <span lang="en">${esc(r.name)}</span><span lang="zh">${esc(r.name_zh || r.name)}</span>${c ? ", " + c : ""}`;
  };
  // 常去的岩馆显示 “Home gym”，其他显示日期
  const when = (s) => (s.home ? " · Home gym" : s.date ? " · " + esc(s.date) : "");

  /* ---------- 只在 Climbing 可见时加载 ---------- */
  let started = false;
  const visible = () => panel.classList.contains("is-active");
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
      const [world, admin1] = await Promise.all([ATLAS, ADMIN1].map((u) => fetch(u).then((r) => r.json())));
      init(world, admin1);
    } catch (e) {
      console.error(e);
      box.innerHTML = `<p class="map-msg"><span lang="en">The map couldn't load. Try refreshing.</span><span lang="zh">地图加载失败，刷新试试。</span></p>`;
    }
  }

  /* ---------- 地图 ---------- */
  function init(world, admin1) {
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
    // 州 / 省：d3 要求多边形顺时针，数据是逆时针，先翻过来
    admin1.features.forEach((f) => {
      f.geometry.coordinates = f.geometry.coordinates.map((poly) =>
        d3.geoArea({ type: "Polygon", coordinates: poly }) > 2 * Math.PI ? poly.map((r) => r.slice().reverse()) : poly);
    });
    const regionsOf = d3.group(admin1.features, (f) => f.properties.admin);
    function findRegion(s, country) {
      const list = country && regionsOf.get(country.properties.name);
      if (!list) return null;
      return list.find((f) => d3.geoContains(f, [s.lng, s.lat]))
        || list.map((f) => ({ f, d: d3.geoDistance([s.lng, s.lat], d3.geoCentroid(f)) })).sort((a, b) => a.d - b.d)[0].f;
    }

    SPOTS.forEach((s) => {
      s.country = findCountry(s);
      s.region = findRegion(s, s.country);
      [s.x, s.y] = projection([s.lng, s.lat]);
    });
    const visitedCountries = new Set(SPOTS.map((s) => s.country).filter(Boolean));
    const visitedRegions = new Set(SPOTS.map((s) => s.region).filter(Boolean));
    // 没有州/省数据的国家，整个国家涂色
    const filledCountries = new Set(SPOTS.filter((s) => s.country && !s.region).map((s) => s.country));
    // 有涂色州/省的国家，顺便画出它所有州/省的细边界
    const detailCountries = new Set([...visitedRegions].map((f) => f.properties.admin));

    box.innerHTML = "";
    const svg = d3.select(box).append("svg")
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("role", "img")
      .attr("aria-label", "World map of places I've climbed");
    const g = svg.append("g");

    g.append("g").attr("class", "countries")
      .selectAll("path").data(countries).join("path")
      .attr("d", path)
      .attr("class", (c) => (filledCountries.has(c) ? "country is-visited" : "country"))
      .append("title").text((c) => c.properties.name);

    g.append("g").attr("class", "regions")
      .selectAll("path").data(admin1.features.filter((f) => detailCountries.has(f.properties.admin))).join("path")
      .attr("d", path)
      .attr("class", (f) => (visitedRegions.has(f) ? "region is-visited" : "region"))
      .append("title").text((f) => f.properties.name);

    // 钉子：尖端正好落在坐标上。离得太近（在当前缩放下重叠）的钉子合成一个带数字的圆点
    const PIN = "M0,0 C-2.4,-4.2 -6,-7.4 -6,-11.5 A6,6 0 1 1 6,-11.5 C6,-7.4 2.4,-4.2 0,0 Z";
    const MERGE_PX = 16;
    const markers = g.append("g").attr("class", "pins");
    const kindOf = (list) => (list.every((s) => s.type === "gym") ? "gym" : list.every((s) => s.type !== "gym") ? "outdoor" : "mixed");
    const activate = (e, m) => (m.spots.length > 1 ? openCluster(m.spots) : openSpot(m.spots[0]));

    function drawMarkers(k) {
      const groups = [];
      for (const s of SPOTS) {
        const near = groups.find((c) => Math.hypot((c.x - s.x) * k, (c.y - s.y) * k) < MERGE_PX);
        if (near) {
          near.spots.push(s);
          near.x = d3.mean(near.spots, (p) => p.x);
          near.y = d3.mean(near.spots, (p) => p.y);
        } else groups.push({ x: s.x, y: s.y, spots: [s] });
      }
      groups.forEach((m) => { m.key = m.spots.map((s) => SPOTS.indexOf(s)).join("-"); });
      groups.sort((a, b) => a.y - b.y);

      markers.selectAll("g.marker").data(groups, (m) => m.key).join(
        (enter) => {
          const el = enter.append("g")
            .attr("tabindex", 0)
            .attr("role", "button")
            .on("click", activate)
            .on("keydown", (e, m) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(e, m); } });
          el.each(function (m) {
            const node = d3.select(this);
            if (m.spots.length === 1) {
              const s = m.spots[0];
              node.attr("class", `marker pin pin-${s.type === "gym" ? "gym" : "outdoor"}`).attr("aria-label", pick(s.name, "en"));
              node.append("path").attr("d", PIN);
              node.append("circle").attr("cy", -11.5).attr("r", 2.3);
              node.append("title").text(pick(s.name, "en"));
            } else {
              node.attr("class", `marker cluster cluster-${kindOf(m.spots)}`)
                .attr("aria-label", m.spots.map((s) => pick(s.name, "en")).join(", "));
              node.append("circle").attr("r", 9.5);
              node.append("text").attr("dy", "0.35em").text(m.spots.length);
              node.append("title").text(m.spots.map((s) => pick(s.name, "en")).join("\n"));
            }
          });
          return el;
        }
      ).attr("transform", (m) => `translate(${m.x},${m.y}) scale(${1 / k})`);
    }

    // 缩放 / 拖动：滚轮需要按住 Ctrl（或 ⌘），免得滚页面时误缩放
    const zoom = d3.zoom()
      .scaleExtent([1, 60])
      .translateExtent([[0, 0], [W, H]])
      .filter((e) => (e.type === "wheel" ? e.ctrlKey || e.metaKey : !e.button))
      .on("zoom", (e) => {
        g.attr("transform", e.transform);
        drawMarkers(e.transform.k);
      });
    svg.call(zoom).on("dblclick.zoom", null);
    drawMarkers(1);

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
    const nc = visitedCountries.size, nr = visitedRegions.size;
    statsEl.innerHTML = SPOTS.length
      ? `<span lang="en">${nc} ${nc === 1 ? "country" : "countries"}${nr ? ` · ${nr} ${nr === 1 ? "state / province" : "states / provinces"}` : ""} · ${n("outdoor")} outdoor · ${n("gym")} ${n("gym") === 1 ? "gym" : "gyms"}</span>
         <span lang="zh">${nc} 个国家${nr ? ` · ${nr} 个州 / 省` : ""} · ${n("outdoor")} 个户外岩场 · ${n("gym")} 个岩馆</span>`
      : `<span lang="en">No pins yet.</span><span lang="zh">还没有钉子。</span>`;
    document.getElementById("climbCount").textContent = SPOTS.length;

    // Home gym 排最前，其余按日期从新到旧
    const byDate = [...SPOTS].sort((a, b) => (b.home ? 1 : 0) - (a.home ? 1 : 0) || String(b.date || "").localeCompare(String(a.date || "")));
    listEl.innerHTML = byDate.map((s, i) => `
      <li><button type="button" data-i="${SPOTS.indexOf(s)}">
        <span class="cl-dot cl-${s.type === "gym" ? "gym" : "outdoor"}" aria-hidden="true"></span>
        <span class="cl-name">${bi(s.name)}</span>
        <span class="cl-meta">${bi(TYPE[s.type] || TYPE.outdoor)}${where(s)}${when(s)}</span>
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
      <p class="spot-meta">${bi(TYPE[s.type] || TYPE.outdoor)}${where(s)}${when(s)}</p>
      <h3>${bi(s.name)}</h3>
      ${s.note ? `<p class="spot-note">${bi(s.note)}</p>` : ""}
      ${media.length
        ? `<div class="spot-media">${media.map(mediaHTML).join("")}</div>`
        : `<p class="spot-empty"><span lang="en">No photos yet.</span><span lang="zh">还没有照片。</span></p>`}`;
    dialog.querySelector(".spot-close").addEventListener("click", () => dialog.close());
    if (!dialog.open) dialog.showModal();
  }

  // 几个钉子叠在一起时：先列出这几个地方，再选一个打开
  function openCluster(list) {
    dialog.innerHTML = `
      <button type="button" class="spot-close" aria-label="Close">✕</button>
      <p class="spot-meta">${list.length} <span lang="en">places here</span><span lang="zh">个地方</span></p>
      <ul class="cluster-list">${list.map((s, i) => `
        <li><button type="button" data-i="${i}">
          <span class="cl-dot cl-${s.type === "gym" ? "gym" : "outdoor"}" aria-hidden="true"></span>
          <span class="cl-name">${bi(s.name)}</span>
          <span class="cl-meta">${bi(TYPE[s.type] || TYPE.outdoor)}${when(s)}</span>
        </button></li>`).join("")}</ul>`;
    dialog.querySelector(".spot-close").addEventListener("click", () => dialog.close());
    dialog.querySelector(".cluster-list").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-i]");
      if (b) openSpot(list[+b.dataset.i]);
    });
    if (!dialog.open) dialog.showModal();
  }
  // 点弹窗外面关闭；关闭时停掉视频
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => { dialog.innerHTML = ""; });

})();
