/* ==========================================================
   首页：悬浮在云天里、可 360° 拖动旋转的纸盒
   盒子各个面上印的字在 FACES 里改
   ========================================================== */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const FACES = {
  lidFront:    [{ text: "Daria Feng", at: "bottom-left", size: 0.055, weight: 600 }],
  lidRight:    [{ text: "Latest interest", at: "bottom-left", size: 0.04, weight: 600 },
                { text: "…", at: "bottom-left", size: 0.04, line: 1 }],
  lidBack:     [{ text: "Blog · Career · Sports", at: "bottom-left", size: 0.045, weight: 500 }],
  lidLeft:     [{ text: "dariafeng.com", at: "bottom-left", size: 0.04, weight: 500 }],
  lidTop:      [{ text: "DF", at: "center", size: 0.09, weight: 600 }],
  bottomFront: [{ text: "Student", at: "top-left", size: 0.042 },
                { text: "Barre, Swimming & Bouldering", at: "top-left", size: 0.042, line: 1 }],
  bottomRight: [{ text: "Est. 2026", at: "top-left", size: 0.04 }],
};

const PAPER = "#474f4c";   // 盒子纸张颜色（灰绿）
const INNER = "#c4bfb2";   // 中间露出的内盒颜色
const GOLD  = "#e6c98a";   // 烫金字颜色
const FONT  = '"Inter", "Helvetica Neue", Arial, sans-serif';

// 盒子尺寸（单位随意，保持比例即可）
const W = 1.0, D = 0.86;
const LID_H = 0.68, BAND_H = 0.05, BOTTOM_H = 0.56;

const canvas = document.getElementById("stage");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
} catch (e) {
  console.warn("WebGL unavailable", e);
}

if (renderer) {
  await document.fonts.load(`600 40px Inter`).catch(() => {});
  await document.fonts.load(`500 40px Inter`).catch(() => {});
  init();
}

function init() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  renderer.autoClear = false;

  /* ---------- 天空（全屏 shader：深蓝底 + 缓慢飘动的云） ---------- */
  const skyScene = new THREE.Scene();
  const skyCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const skyMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) } },
    vertexShader: `void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform vec2 uRes;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1,0)), u.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
      }
      float fbm(vec2 p){
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 6; i++){ v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
        return v;
      }
      void main(){
        vec2 uv = gl_FragCoord.xy / uRes;
        vec2 p = uv * vec2(uRes.x / uRes.y, 1.0);
        float t = uTime * 0.012;

        vec3 deep = vec3(0.035, 0.09, 0.19);
        vec3 high = vec3(0.10, 0.20, 0.36);
        vec3 sky = mix(deep, high, smoothstep(0.0, 1.0, uv.y + 0.15 * uv.x));

        // 两层云，远处的淡、近处的亮
        float c1 = fbm(p * 1.3 + vec2(t, t * 0.3));
        float c2 = fbm(p * 2.6 + vec2(t * 1.8, -t * 0.4) + c1);
        float clouds = smoothstep(0.48, 0.85, c1 * 0.6 + c2 * 0.55);
        float wisps  = smoothstep(0.55, 0.95, c2) * 0.35;
        vec3 cloudCol = mix(vec3(0.42, 0.50, 0.62), vec3(0.78, 0.82, 0.88), c2);
        sky = mix(sky, cloudCol, clouds * 0.75 + wisps);

        // 暗角
        float vig = smoothstep(1.25, 0.35, length(uv - 0.5));
        sky *= mix(0.72, 1.0, vig);

        // 轻微颗粒，像照片
        sky += (hash(gl_FragCoord.xy + uTime) - 0.5) * 0.025;
        gl_FragColor = vec4(sky, 1.0);
      }`,
    depthWrite: false,
    depthTest: false,
  });
  skyScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), skyMat));

  /* ---------- 主场景 ---------- */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // 主光从左前上方打来：正面亮、侧面暗、底面几乎全黑，像参考图
  const sun = new THREE.DirectionalLight(0xfff1e0, 2.6);
  sun.position.set(1.8, 2.4, 2.2);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x9fb8e0, 0.6); // 天空反光
  rim.position.set(3, 1, -2);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight(0x5d7598, 0x020305, 0.25));

  /* ---------- 纸张纹理 ---------- */
  // 每个面画一张 canvas：纸色 + 细纤维噪点 + 烫金字
  const PX = 1024; // 每单位长度多少像素
  const aniso = renderer.capabilities.getMaxAnisotropy();

  function paperNoise(ctx, w, h, base, amount) {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * amount;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
    // 纤维
    ctx.globalAlpha = 0.05;
    for (let i = 0; i < (w * h) / 900; i++) {
      ctx.strokeStyle = Math.random() > 0.5 ? "#fff" : "#000";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      const x = Math.random() * w, y = Math.random() * h, a = Math.random() * Math.PI;
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * 8, y + Math.sin(a) * 8);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawText(ctx, w, h, items, color) {
    const pad = 0.07 * PX;
    ctx.fillStyle = color;
    items.forEach((it) => {
      const size = it.size * PX;
      ctx.font = `${it.weight || 500} ${size}px ${FONT}`;
      const lh = size * 1.3;
      const line = it.line || 0;
      if (it.at === "center") {
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(it.text, w / 2, h / 2 + line * lh);
      } else if (it.at === "top-left") {
        ctx.textAlign = "left"; ctx.textBaseline = "top";
        ctx.fillText(it.text, pad, pad * 0.9 + line * lh);
      } else { // bottom-left：多行时 line 越大越靠下
        const count = items.filter((x) => x.at === "bottom-left").length;
        ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
        ctx.fillText(it.text, pad, h - pad - (count - 1 - line) * lh);
      }
    });
  }

  function faceMaterial(w, h, items = [], base = PAPER) {
    const cw = Math.round(w * PX), ch = Math.round(h * PX);
    const mk = () => { const c = document.createElement("canvas"); c.width = cw; c.height = ch; return c; };

    const color = mk(), cctx = color.getContext("2d", { willReadFrequently: true });
    paperNoise(cctx, cw, ch, base, 14);
    drawText(cctx, cw, ch, items, GOLD);

    // 金属度：字是金属，纸不是
    const metal = mk(), mctx = metal.getContext("2d");
    mctx.fillStyle = "#000"; mctx.fillRect(0, 0, cw, ch);
    drawText(mctx, cw, ch, items, "#fff");

    // 粗糙度：纸很粗糙，金字比较亮
    const rough = mk(), rctx = rough.getContext("2d", { willReadFrequently: true });
    paperNoise(rctx, cw, ch, "#e0e0e0", 40);
    drawText(rctx, cw, ch, items, "#383838");

    const tex = (c, srgb) => {
      const t = new THREE.CanvasTexture(c);
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = aniso;
      return t;
    };
    return new THREE.MeshStandardMaterial({
      map: tex(color, true),
      metalnessMap: tex(metal), metalness: 1,
      roughnessMap: tex(rough), roughness: 1,
      bumpMap: tex(rough), bumpScale: 0.6,
      envMapIntensity: 0.35,
    });
  }

  // BoxGeometry 的面顺序：右 左 上 下 前 后
  const plain = (w, h) => faceMaterial(w, h);
  const lidMats = [
    faceMaterial(D, LID_H, FACES.lidRight),
    faceMaterial(D, LID_H, FACES.lidLeft),
    faceMaterial(W, D, FACES.lidTop),
    plain(W, D),
    faceMaterial(W, LID_H, FACES.lidFront),
    faceMaterial(W, LID_H, FACES.lidBack),
  ];
  const bottomMats = [
    faceMaterial(D, BOTTOM_H, FACES.bottomRight),
    plain(D, BOTTOM_H),
    plain(W, D),
    plain(W, D),
    faceMaterial(W, BOTTOM_H, FACES.bottomFront),
    plain(W, BOTTOM_H),
  ];
  const innerMat = faceMaterial(W, BAND_H + 0.1, [], INNER);

  const box = new THREE.Group();
  const H = LID_H + BAND_H + BOTTOM_H;

  const bottom = new THREE.Mesh(new THREE.BoxGeometry(W, BOTTOM_H, D), bottomMats);
  bottom.position.y = -H / 2 + BOTTOM_H / 2;

  const inner = new THREE.Mesh(new THREE.BoxGeometry(W - 0.02, BAND_H + 0.1, D - 0.02), innerMat);
  inner.position.y = -H / 2 + BOTTOM_H + BAND_H / 2;

  const lid = new THREE.Mesh(new THREE.BoxGeometry(W, LID_H, D), lidMats);
  const lidRestY = H / 2 - LID_H / 2;
  lid.position.y = lidRestY;

  box.add(bottom, inner, lid);
  scene.add(box);

  /* ---------- 拖动旋转 + 惯性 ---------- */
  const BASE_TILT = -0.22; // 负数 = 从下往上仰视，能看到盒底
  const AUTO_SPEED = reduceMotion ? 0 : 0.18; // 没人碰时的自转速度（弧度/秒）
  let rotY = -0.5, rotX = BASE_TILT;
  let vY = 0, vX = 0;
  let dragging = false, lastX = 0, lastY = 0, lastT = 0, idleSince = 0;

  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add("dragging");
    lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
    vY = vX = 0;
  });
  canvas.addEventListener("pointermove", (e) => {
    updateHover(e);
    if (!dragging) return;
    const now = performance.now();
    const dt = Math.max(1, now - lastT) / 1000;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    const k = 0.009;
    rotY += dx * k;
    rotX = THREE.MathUtils.clamp(rotX + dy * k, -1.1, 1.1);
    vY = (dx * k) / dt;
    vX = (dy * k) / dt;
    lastX = e.clientX; lastY = e.clientY; lastT = now;
  });
  const release = (e) => {
    if (!dragging) return;
    dragging = false;
    canvas.classList.remove("dragging");
    if (performance.now() - lastT > 80) vY = vX = 0; // 停顿后才松手 → 不甩出去
    idleSince = performance.now();
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);

  /* ---------- 鼠标悬停时盖子微微抬起 ---------- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hovering = false;
  function updateHover(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    hovering = ray.intersectObject(box, true).length > 0;
  }
  canvas.addEventListener("pointerleave", () => { hovering = false; });

  /* ---------- 尺寸 ---------- */
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // 竖屏手机上把相机拉远一点，让盒子完整显示
    const dist = camera.aspect < 0.8 ? 6.2 / Math.max(camera.aspect, 0.45) * 0.55 : 4.3;
    camera.position.set(0, -0.25, dist);
    camera.lookAt(0, 0.05, 0);
    camera.updateProjectionMatrix();
    skyMat.uniforms.uRes.value.set(renderer.domElement.width, renderer.domElement.height);
  }
  addEventListener("resize", resize);

  /* ---------- 动画循环 ---------- */
  let running = true, prev = performance.now();
  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    const t = now / 1000;

    if (!dragging) {
      // 惯性衰减
      const decay = Math.pow(0.04, dt);
      vY *= decay; vX *= decay;
      rotY += vY * dt;
      rotX += vX * dt;
      // 慢慢回到默认倾斜角
      rotX += (BASE_TILT - rotX) * (1 - Math.pow(0.2, dt));
      // 停下来一会儿后恢复自转
      if (Math.abs(vY) < AUTO_SPEED && now - idleSince > 1200) {
        vY += (AUTO_SPEED - vY) * (1 - Math.pow(0.5, dt));
      }
    }

    // XYZ：先绕竖轴转，再朝镜头俯仰，俯仰轴始终是水平的
    box.rotation.set(rotX, rotY, reduceMotion ? 0 : Math.sin(t * 0.5) * 0.025, "XYZ");
    box.position.y = reduceMotion ? 0 : Math.sin(t * 0.8) * 0.035;

    const lidTarget = lidRestY + (hovering && !dragging ? 0.06 : 0);
    lid.position.y += (lidTarget - lid.position.y) * (1 - Math.pow(0.001, dt));
    inner.scale.y = 1 + (lid.position.y - lidRestY) / (BAND_H + 0.1) * 1.2;
    inner.position.y = -H / 2 + BOTTOM_H + (BAND_H + 0.1) * inner.scale.y / 2 - 0.05;

    skyMat.uniforms.uTime.value = t;

    renderer.clear();
    renderer.render(skyScene, skyCam);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    prev = performance.now();
    resize();
    requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  // 只有在首页、且页面可见时才渲染，省电
  const onHome = () => document.querySelector('[data-tab="home"]').classList.contains("is-active");
  addEventListener("tabchange", (e) => (e.detail === "home" && !document.hidden ? start() : stop()));
  document.addEventListener("visibilitychange", () => (!document.hidden && onHome() ? start() : stop()));

  resize();
  if (onHome()) requestAnimationFrame(frame); else running = false;
}
