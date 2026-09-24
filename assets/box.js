/* ==========================================================
   首页：悬浮在云天里的一块黑色实心正方体
   重量感来自运动：推得动但很慢、转起来停不下、最后“落”在一个面上
   ========================================================== */
import * as THREE from "three";

/* ---------- 可调参数 ---------- */
const SIZE = 1.0;         // 边长
const COLOR = "#030303";  // 方块颜色

const DRAG_GAIN = 0.006;  // 拖动 1px 对应的转速
const RESPONSE = 4.5;     // 越小越“重”：跟手越慢
const FRICTION = 0.45;    // 越小转得越久才停
const SPRING = 3.0;       // 落定到某个面时的回复力
const DAMPING = 2.1;      // 落定时的阻尼（越小回摆越明显）
const IDLE_TURN = 9000;   // 没人碰多久后自己缓缓翻一面（毫秒）

const canvas = document.getElementById("stage");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
} catch (e) {
  console.warn("WebGL unavailable", e);
}
if (renderer) init();

function init() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
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

        // 白天的蓝天：头顶是饱和的蓝，越往下越浅
        vec3 zenith  = vec3(0.13, 0.42, 0.82);
        vec3 horizon = vec3(0.62, 0.81, 0.96);
        vec3 sky = mix(horizon, zenith, smoothstep(0.0, 1.0, uv.y * 1.1 + 0.08 * uv.x));

        float c1 = fbm(p * 1.3 + vec2(t, t * 0.3));
        float c2 = fbm(p * 2.6 + vec2(t * 1.8, -t * 0.4) + c1);
        // 白云：中间亮白，边缘和底部带一点灰蓝的阴影
        float clouds = smoothstep(0.50, 0.82, c1 * 0.6 + c2 * 0.55);
        float wisps  = smoothstep(0.58, 0.95, c2) * 0.25;
        vec3 cloudCol = mix(vec3(0.78, 0.84, 0.92), vec3(1.0), smoothstep(0.35, 0.8, c2));
        sky = mix(sky, cloudCol, clouds * 0.92 + wisps);

        float vig = smoothstep(1.25, 0.35, length(uv - 0.5));
        sky *= mix(0.88, 1.0, vig);

        sky += (hash(gl_FragCoord.xy + uTime) - 0.5) * 0.015;
        gl_FragColor = vec4(sky, 1.0);
      }`,
    depthWrite: false,
    depthTest: false,
  });
  skyScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), skyMat));

  /* ---------- 主场景 ---------- */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);

  // 环境反射：上方是明亮的天空，下方是黑的 → 顶面接天光，底面沉在暗处，显得重
  const envScene = new THREE.Scene();
  const envGeo = new THREE.SphereGeometry(10, 64, 32);
  const envCols = [];
  const pos = envGeo.attributes.position;
  const top = new THREE.Color("#cfe2f7"), mid = new THREE.Color("#4f86c6"), bot = new THREE.Color("#000000");
  for (let i = 0; i < pos.count; i++) {
    const h = pos.getY(i) / 10; // -1 … 1
    const c = h > 0 ? mid.clone().lerp(top, Math.pow(h, 0.7)) : mid.clone().lerp(bot, Math.min(1, -h * 3));
    envCols.push(c.r, c.g, c.b);
  }
  envGeo.setAttribute("color", new THREE.Float32BufferAttribute(envCols, 3));
  envScene.add(new THREE.Mesh(envGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(envScene, 0.02).texture;

  const sun = new THREE.DirectionalLight(0xfff1e0, 2.6);
  sun.position.set(1.8, 2.4, 2.2);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x9fb8e0, 1.2); // 天空反光，勾出背光面的边
  rim.position.set(-3, 1.5, -2);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight(0x5d7598, 0x000000, 0.15));

  /* ---------- 方块 ---------- */
  // 很细的颗粒粗糙度，像磨砂石材 / 喷砂金属
  const grain = document.createElement("canvas");
  grain.width = grain.height = 512;
  const gctx = grain.getContext("2d");
  const img = gctx.createImageData(512, 512);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 150 + Math.random() * 60;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  gctx.putImageData(img, 0, 0);
  const grainTex = new THREE.CanvasTexture(grain);
  grainTex.wrapS = grainTex.wrapT = THREE.RepeatWrapping;

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(SIZE, SIZE, SIZE), // 直角直边
    new THREE.MeshPhysicalMaterial({
      color: COLOR,
      roughness: 0.7,
      roughnessMap: grainTex,
      metalness: 0,
      specularIntensity: 0.45,
      clearcoat: 0.2,
      clearcoatRoughness: 0.35,
      envMapIntensity: 0.4,
    })
  );
  const holder = new THREE.Group(); // 负责上下漂浮；cube 自己负责旋转
  holder.add(cube);
  scene.add(holder);

  /* ---------- 旋转物理 ---------- */
  // 默认视角：稍微仰视，能同时看到三个面
  const VIEW = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.32, 0.62, 0, "XYZ"));

  // 正方体的 24 种“摆正”姿态
  const UPRIGHT = [];
  {
    const seen = new Set();
    const r = [0, 1, 2, 3].map((k) => (k * Math.PI) / 2);
    for (const x of r) for (const y of r) for (const z of r) {
      const u = new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
      const key = new THREE.Matrix4().makeRotationFromQuaternion(u).elements.map(Math.round).join();
      if (!seen.has(key)) { seen.add(key); UPRIGHT.push(u); }
    }
  }
  const nearestRest = (q) => {
    let best = null, bestDot = -1;
    for (const u of UPRIGHT) {
      const c = VIEW.clone().multiply(u);
      const d = Math.abs(q.dot(c));
      if (d > bestDot) { bestDot = d; best = c; }
    }
    return best;
  };

  const q = VIEW.clone();                 // 当前姿态
  let target = VIEW.clone();              // 要落定的姿态
  const w = new THREE.Vector3();          // 角速度（世界坐标，弧度/秒）
  let dragging = false, accX = 0, accY = 0, lastX = 0, lastY = 0;
  let idleSince = performance.now();

  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add("dragging");
    lastX = e.clientX; lastY = e.clientY;
    accX = accY = 0;
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    accX += e.clientX - lastX;
    accY += e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
  });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    canvas.classList.remove("dragging");
    idleSince = performance.now();
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);

  const tmpQ = new THREE.Quaternion();
  const errQ = new THREE.Quaternion();
  const axis = new THREE.Vector3();
  const wTarget = new THREE.Vector3();
  const Y = new THREE.Vector3(0, 1, 0);

  function step(dt, now) {
    if (dragging) {
      // 手指想让它转多快 → 方块慢慢追上这个速度（质量大，追得慢）
      wTarget.set(accY, accX, 0).multiplyScalar(DRAG_GAIN / dt);
      accX = accY = 0;
      w.lerp(wTarget, 1 - Math.exp(-RESPONSE * dt));
      target = nearestRest(q);
    } else {
      // 摩擦
      w.multiplyScalar(Math.exp(-FRICTION * dt));
      // 转得快时，目标面跟着换；慢下来后锁定，弹簧把它拉过去
      if (w.length() > 0.7) target = nearestRest(q);

      errQ.copy(target).multiply(tmpQ.copy(q).invert());
      if (errQ.w < 0) { errQ.x *= -1; errQ.y *= -1; errQ.z *= -1; errQ.w *= -1; }
      const angle = 2 * Math.acos(Math.min(1, errQ.w));
      const s = Math.sqrt(1 - errQ.w * errQ.w);
      if (s > 1e-5) axis.set(errQ.x / s, errQ.y / s, errQ.z / s); else axis.set(0, 0, 0);

      // 角加速度 = 弹簧 − 阻尼
      w.addScaledVector(axis, SPRING * angle * dt);
      w.multiplyScalar(Math.exp(-DAMPING * dt));

      // 静止够久了，自己沉沉地翻一面
      if (!reduceMotion && now - idleSince > IDLE_TURN && w.length() < 0.02 && angle < 0.01) {
        target = new THREE.Quaternion().setFromAxisAngle(Y, -Math.PI / 2).multiply(target);
        idleSince = now;
      }
    }

    const speed = w.length();
    if (speed > 1e-6) {
      tmpQ.setFromAxisAngle(axis.copy(w).divideScalar(speed), speed * dt);
      q.premultiply(tmpQ).normalize();
    }
    cube.quaternion.copy(q);
  }

  /* ---------- 尺寸 ---------- */
  function resize() {
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    if (!cw || !ch) return;
    renderer.setSize(cw, ch, false);
    camera.aspect = cw / ch;
    const dist = camera.aspect < 0.8 ? 6.2 / Math.max(camera.aspect, 0.45) * 0.55 : 4.6;
    camera.position.set(0, -0.2, dist);
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

    step(Math.max(dt, 1e-3), now);
    // 很慢、很小的漂浮：重的东西不会晃得轻快
    holder.position.y = reduceMotion ? 0 : Math.sin(t * 0.9) * 0.018;

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

  const onHome = () => document.querySelector('[data-tab="home"]').classList.contains("is-active");
  addEventListener("tabchange", (e) => (e.detail === "home" && !document.hidden ? start() : stop()));
  document.addEventListener("visibilitychange", () => (!document.hidden && onHome() ? start() : stop()));

  resize();
  if (onHome()) requestAnimationFrame(frame); else running = false;
}
