// Помощник «Хоши» — 3D-робот HOSHIMOTO в углу сайта: подсказывает, куда нажать, и ведёт к нужному блоку.
// Модель и анимации сделаны в Blender (hoshimoto-bot.glb), глаза рисуются вживую на «экране» лица — с эмоциями.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const BOT = 'https://t.me/Hoshimoto_VPN_bot?start=site';
const root = document.getElementById('hoshi');
if (root) start();

function start() {
  const stage = root.querySelector('.hoshi-stage');
  const bubble = root.querySelector('.hoshi-bubble');
  const textEl = root.querySelector('.hoshi-text');
  const chipsEl = root.querySelector('.hoshi-chips');
  const STORE = 'hoshi:v1';
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(STORE) || '{}');
  } catch {
    saved = {};
  }
  const save = () => {
    try {
      localStorage.setItem(STORE, JSON.stringify(saved));
    } catch {
      /* приватный режим — просто не запоминаем */
    }
  };

  // ---------- облачко с подсказками ----------
  let typing = 0, autoMin = 0;
  function say(text, chips = [], { emotion = 'happy', anim = 'Talk', stay = false } = {}) {
    root.classList.remove('hoshi-min');
    clearTimeout(autoMin);
    if (!stay) autoMin = setTimeout(() => root.classList.add('hoshi-min'), 14000);
    bubble.hidden = false;
    clearInterval(typing);
    textEl.textContent = '';
    let i = 0;
    typing = setInterval(() => {
      textEl.textContent = text.slice(0, ++i);
      if (i >= text.length) {
        clearInterval(typing);
        if (bot && anim === 'Talk') bot.play('Idle');
      }
    }, 16);
    chipsEl.innerHTML = '';
    for (const c of chips) {
      const b = document.createElement(c.href ? 'a' : 'button');
      b.className = 'hoshi-chip' + (c.main ? ' main' : '');
      b.textContent = c.label;
      if (c.href) {
        b.href = c.href;
        if (/^https?:/.test(c.href)) {
          b.target = '_blank';
          b.rel = 'noopener';
        }
      } else b.type = 'button';
      b.addEventListener('click', () => c.go && c.go());
      chipsEl.appendChild(b);
    }
    if (bot) {
      bot.play(anim);
      face.set(emotion);
    }
  }

  // ---------- карта сайта: разделы страницы ----------
  const onGuide = /guide\.html$/.test(location.pathname);
  const SECTIONS = onGuide
    ? [
        { sel: '#key', name: '🔑 Получить ключ', text: 'Здесь — как получить ключ или подписку в нашем Telegram-боте: одно нажатие, без номера телефона.' },
        { sel: '#happ', name: '⚡️ Подключение через Happ', text: 'Если выбрали Happ: установите приложение и добавьте подписку одной кнопкой. Все страны сразу.' },
        { sel: '#install', name: '📲 Установить AmneziaVPN', text: 'Вкладки по устройствам: iPhone, Android, Windows, Mac — что скачать и как установить.' },
        { sel: '#connect', name: '➕ Добавить ключ', text: 'Как вставить ключ в AmneziaVPN и подключиться — по шагам.' },
        { sel: '#appstore', name: '🍏 Нет в App Store', text: 'Если AmneziaVPN нет в App Store вашей страны — как сменить регион Apple ID. Или просто выберите Happ: он есть в российском App Store.' },
        { sel: '#help', name: '🛟 Не подключается', text: 'Частые проблемы и что делать: неверный ключ, сайты не открываются, перестало работать.' },
        { href: 'index.html', name: '🏠 На главную', text: '' },
      ]
    : [
        { sel: '#features', name: '✨ Возможности', text: 'Почему HOSHIMOTO: обходит блокировки, не ведёт логов, работает на всех устройствах.' },
        { sel: '#how', name: '🚀 Как начать', text: 'Три шага до VPN и сравнение двух способов: Happ и AmneziaVPN.' },
        { sel: '#download', name: '📲 Скачать приложение', text: 'Кнопки для Windows, Mac, iPhone, Android и TV — выберите своё устройство.' },
        { sel: '#servers', name: '🌍 Серверы', text: 'Наши страны и нагрузка серверов в реальном времени.' },
        { sel: '#pricing', name: '💳 Тарифы', text: 'Переключатель сверху: Happ или AmneziaVPN. Чем длиннее срок — тем дешевле месяц.' },
        { sel: '#partners', name: '💰 Партнёрам', text: 'Советуйте VPN друзьям и получайте 20% с каждой их оплаты. Подвигайте ползунок — посчитайте доход.' },
        { sel: '#faq', name: '❓ Вопросы', text: 'Ответы на частые вопросы: что выбрать, сколько устройств, что делать, если не подключается.' },
        { href: 'guide.html', name: '📖 Инструкция', text: '' },
      ];
  const here = SECTIONS.filter((x) => x.sel && document.querySelector(x.sel));

  const MENU = () =>
    onGuide
      ? [
          { label: '🧭 Где что на этой странице', go: () => navMenu() },
          { label: '⚡️ Как подключить Happ', go: () => guide('#happ', 'happ', SECTIONS[1].text) },
          { label: '🛟 Не подключается', go: () => guide('#help', 'help', SECTIONS[5].text) },
          { label: '🔎 Найти на сайте', go: () => search() },
          { label: '🏠 На главную', href: 'index.html' },
        ]
      : [
          { label: '🎁 Попробовать 7 дней бесплатно', main: true, href: BOT, go: () => cheer() },
          { label: '🗺 Экскурсия по сайту — 30 секунд', go: () => tour(0) },
          { label: '🧭 Где что на сайте', go: () => navMenu() },
          { label: '⚡️ Happ или AmneziaVPN?', go: () => guide('#how', 'apps', 'Сравните два способа: Happ — все страны в одной подписке и 2 устройства, от 190 ₽. AmneziaVPN — ключ на выбранный сервер, от 290 ₽. Попробовать можно оба.') },
          { label: '💳 Цены', go: () => guide('#pricing', 'price', 'Переключатель сверху: Happ или AmneziaVPN. Чем длиннее срок — тем дешевле месяц.') },
          { label: '🔎 Найти на сайте', go: () => search() },
        ];
  function menu(text = 'Чем помочь?') {
    say(text, MENU(), { emotion: 'happy', anim: 'Talk', stay: true });
  }
  /** Все разделы страницы — кнопками: нажали — Хоши ведёт туда и показывает. */
  function navMenu() {
    say(
      onGuide ? 'Разделы инструкции — куда перейти?' : 'Вот что есть на сайте. Куда перейти?',
      [
        ...SECTIONS.map((x) => (x.href ? { label: x.name, href: x.href } : { label: x.name, go: () => guide(x.sel, x.sel, x.text, [{ label: '🧭 Другие разделы', go: () => navMenu() }]) })),
        { label: '« Меню', go: () => menu() },
      ],
      { emotion: 'look', anim: 'Talk', stay: true },
    );
  }
  /** Экскурсия: по разделам по очереди, с подсветкой. */
  function tour(n) {
    if (n >= here.length) {
      say('Вот и весь сайт! Попробуете бесплатно? Ключ придёт в Telegram за минуту.', [
        { label: '🎁 Попробовать 7 дней бесплатно', main: true, href: BOT, go: () => cheer() },
        { label: '« Меню', go: () => menu() },
      ], { emotion: 'happy', anim: 'Wave', stay: true });
      return;
    }
    const x = here[n];
    guide(x.sel, x.sel, `${n + 1} из ${here.length} · ${x.name.replace(/^\S+\s/, '')}. ${x.text}`, [
      { label: n + 1 < here.length ? 'Дальше →' : 'Готово →', main: true, go: () => tour(n + 1) },
      ...(n > 0 ? [{ label: '← Назад', go: () => tour(n - 1) }] : []),
      { label: 'Закончить', go: () => menu() },
    ]);
  }
  /** Поиск по сайту — то же окно, что по кнопке-лупе в шапке. */
  function search() {
    const b = document.querySelector('.search-btn');
    if (b) b.click();
    root.classList.add('hoshi-min');
    if (bot) face.set('look', 1500);
  }
  function cheer() {
    if (!bot) return;
    bot.play('Happy');
    face.set('love', 2600);
    saved.cta = true;
    save();
  }
  // пока Хоши сам прокручивает страницу, подсказки по пути не показываем — до конца прокрутки
  let scrolling = false, scrollTimer = 0, spotTimer = 0;
  const scrollDone = () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => (scrolling = false), 400);
  };
  /** Прокрутить к разделу, подсветить его и показать рукой. */
  function guide(sel, key, text, chips = [{ label: '« Ещё вопросы', go: () => menu() }]) {
    const el = document.querySelector(sel);
    scrolling = true;
    addEventListener('scrollend', scrollDone, { once: true });
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => (scrolling = false), 6000);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.querySelectorAll('.hoshi-spot').forEach((x) => x.classList.remove('hoshi-spot'));
      el.classList.add('hoshi-spot');
      clearTimeout(spotTimer);
      spotTimer = setTimeout(() => el.classList.remove('hoshi-spot'), 2600);
    }
    seen.add(key);
    say(text, chips, { emotion: 'look', anim: 'Point', stay: true });
  }

  // подсказки по месту на странице — каждая один раз, только если облачко не свёрнуто вручную
  const seen = new Set();
  const TIPS = onGuide
    ? [['#appstore', 'appstore', 'Нет AmneziaVPN в App Store? Можно сменить регион — или просто взять Happ: он есть в российском App Store.', [{ label: '⚡️ Про Happ', go: () => guide('#happ', 'happ', SECTIONS[1].text) }]]]
    : [
        ['#pricing', 'price', 'Happ сейчас выгоднее всего: от 190 ₽ в месяц, все страны сразу. А первые 7 дней — бесплатно.', [{ label: '🎁 Получить бесплатно', main: true, href: BOT, go: () => cheer() }]],
        ['#download', 'dl', 'Выберите своё устройство — для Happ и AmneziaVPN есть свои кнопки. На iPhone Happ есть в российском App Store.', []],
        ['#partners', 'earn', 'Хотите зарабатывать на VPN? Подвигайте ползунок — увидите, сколько можно получать в месяц.', []],
        ['#faq', 'faq', 'Не нашли ответ? Напишите в поддержку — ответим в Telegram.', [{ label: '✉️ Поддержка', href: 'https://t.me/Hoshimoto_03' }]],
      ];
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting || !ready || root.classList.contains('hoshi-min') || saved.quiet || scrolling) continue;
        const tip = TIPS.find((t) => document.querySelector(t[0]) === e.target);
        if (!tip || seen.has(tip[1])) continue;
        seen.add(tip[1]);
        say(tip[2], [...tip[3], { label: '« Меню', go: () => menu() }], { emotion: tip[1] === 'price' ? 'surprised' : 'look', anim: 'Point' });
      }
    },
    { threshold: 0.35 },
  );
  TIPS.forEach((t) => {
    const el = document.querySelector(t[0]);
    if (el) io.observe(el);
  });

  bubble.addEventListener('pointerenter', () => clearTimeout(autoMin));
  root.querySelector('.hoshi-close').addEventListener('click', () => {
    root.classList.add('hoshi-min');
    saved.quiet = true;
    save();
    if (bot) face.set('sleepy', 1800);
  });
  root.querySelector('.hoshi-hide').addEventListener('click', () => {
    root.hidden = true;
    saved.hidden = true;
    save();
    showReturn();
  });
  stage.addEventListener('click', () => {
    if (root.classList.contains('hoshi-min')) {
      saved.quiet = false;
      save();
      menu('Я тут! Чем помочь?');
    } else {
      if (bot) {
        bot.play('Wave');
        face.set('wink', 1200);
      }
    }
  });
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href*="Hoshimoto_VPN_bot"]');
    if (a && !root.contains(a)) cheer();
  });

  function showReturn() {
    const b = document.createElement('button');
    b.className = 'hoshi-return';
    b.type = 'button';
    b.title = 'Вернуть помощника';
    b.setAttribute('aria-label', 'Вернуть помощника');
    b.innerHTML = '<i></i><i></i>';
    b.addEventListener('click', () => {
      saved.hidden = false;
      saved.quiet = false;
      save();
      b.remove();
      root.hidden = false;
      menu('С возвращением! Чем помочь?');
    });
    document.body.appendChild(b);
  }

  if (saved.hidden) {
    root.hidden = true;
    showReturn();
  }

  // ---------- 3D ----------
  let bot = null;
  let ready = false;
  const face = makeFace();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl = (() => {
    try {
      const c = document.createElement('canvas');
      return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      return false;
    }
  })();
  // «уменьшить движение» в системе не отключает 3D: робот двигается спокойно, без прыжков
  if (!gl) {
    ready = true;
    root.classList.add('hoshi-static');
    if (!saved.hidden) setTimeout(() => (saved.quiet ? root.classList.add('hoshi-min') : menu('Привет! Я Хоши, помощник HOSHIMOTO VPN. Чем помочь?')), 1200);
    return;
  }

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  stage.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 20);
  camera.position.set(0, 0.05, 4.6);
  camera.lookAt(0, -0.02, 0);
  scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x1a1016, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(-1.5, 2, 3);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xff2e4d, 2.2);
  rim.position.set(2, 1, -2);
  scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0x22d3ee, 1.2);
  rim2.position.set(-2.2, 0.5, -1.5);
  scene.add(rim2);

  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(stage);
  resize();

  const draco = new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/draco/gltf/');
  const loader = new GLTFLoader().setDRACOLoader(draco);
  const url = new URL('hoshimoto-bot.glb', import.meta.url).href;
  loader.load(
    url,
    (gltf) => {
      const model = gltf.scene;
      scene.add(model);
      const mixer = new THREE.AnimationMixer(model);
      const clips = Object.fromEntries(gltf.animations.map((c) => [c.name, c]));
      let current = null;
      const ONCE = new Set(['Wave', 'Point', 'Happy']);
      if (reduce) delete clips.Happy;
      bot = {
        play(name) {
          const clip = clips[name];
          if (!clip) return;
          const next = mixer.clipAction(clip);
          if (current === next && !ONCE.has(name)) return;
          next.reset();
          next.setLoop(ONCE.has(name) ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
          next.clampWhenFinished = true;
          next.play();
          if (current && current !== next) current.crossFadeTo(next, 0.35, false);
          else next.fadeIn(0.25);
          current = next;
        },
      };
      mixer.addEventListener('finished', () => bot.play('Idle'));
      bot.play('Idle');

      // экран лица: свои текстуры, глаза рисуются каждый кадр
      const screen = model.getObjectByName('FaceScreen');
      if (screen && screen.isMesh) {
        screen.material = new THREE.MeshStandardMaterial({
          map: face.base,
          emissiveMap: face.glow,
          emissive: 0xffffff,
          emissiveIntensity: 1.8,
          roughness: 0.28,
          metalness: 0.1,
          transparent: true,
        });
        screen.renderOrder = 2;
      }
      const head = model.getObjectByName('head');

      // смотрит на курсор: голова чуть поворачивается, глаза бегают
      const pointer = { x: 0, y: 0 };
      addEventListener('pointermove', (e) => {
        const r = stage.getBoundingClientRect();
        pointer.x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth * 0.5)));
        pointer.y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * 0.3)) / (innerHeight * 0.5)));
      });
      const look = new THREE.Quaternion();
      const euler = new THREE.Euler();
      const clock = new THREE.Clock();
      let visible = true;
      document.addEventListener('visibilitychange', () => (visible = document.visibilityState === 'visible'));
      renderer.setAnimationLoop(() => {
        if (!visible || root.hidden) return;
        const dt = Math.min(0.05, clock.getDelta());
        mixer.update(dt);
        if (head) {
          euler.set(pointer.y * 0.22, pointer.x * 0.45, 0, 'YXZ');
          look.setFromEuler(euler);
          head.quaternion.multiply(look);
        }
        face.look(pointer.x, pointer.y);
        face.draw(dt);
        renderer.render(scene, camera);
      });

      root.classList.add('hoshi-live');
      ready = true;
      if (saved.hidden) return;
      setTimeout(() => {
        if (saved.quiet) {
          root.classList.add('hoshi-min');
          bot.play('Wave');
          return;
        }
        const phone = innerWidth < 560;
        const hello = onGuide
          ? 'Это инструкция. Подскажу, где нужный шаг — или что делать, если не подключается.'
          : saved.cta
            ? 'С возвращением! Подсказать что-нибудь?'
            : phone
              ? 'Привет! Я Хоши — помогу подключить VPN за минуту.'
              : 'Привет! Я Хоши, помощник HOSHIMOTO VPN. Помогу выбрать, подключить и покажу, где что на сайте.';
        // на телефоне — коротко, чтобы не закрывать страницу
        say(hello, phone ? [MENU()[0], { label: '🧭 Где что на сайте', go: () => navMenu() }, { label: '💬 Ещё подсказки', go: () => menu() }] : MENU(), { emotion: 'happy', anim: 'Wave' });
        if (phone) {
          clearTimeout(autoMin);
          autoMin = setTimeout(() => root.classList.add('hoshi-min'), 8000);
        }
      }, 600);
    },
    undefined,
    () => {
      // модель не загрузилась — остаёмся с картинкой
      root.classList.add('hoshi-static');
      ready = true;
      if (!saved.hidden && !saved.quiet) menu('Привет! Я Хоши, помощник HOSHIMOTO VPN. Чем помочь?');
    },
  );
}

// ---------- глаза на экране: эмоции ----------
function makeFace() {
  const W = 512, H = 388;
  const mk = () => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    return c;
  };
  const cb = mk(), cg = mk();
  const xb = cb.getContext('2d'), xg = cg.getContext('2d');
  const base = new THREE.CanvasTexture(cb);
  const glow = new THREE.CanvasTexture(cg);
  for (const t of [base, glow]) {
    t.flipY = false; // UV из glTF: верх картинки — верх экрана
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
  }
  // эмоции: размеры глаз (доли), скругление, форма, наклон, сдвиг
  const E = {
    neutral: { w: 0.12, h: 0.38, r: 0.5, shape: 'rect', tilt: 0, dy: 0 },
    happy: { w: 0.15, h: 0.2, r: 0.5, shape: 'arc', tilt: 0, dy: -0.02 },
    surprised: { w: 0.17, h: 0.44, r: 1, shape: 'rect', tilt: 0, dy: -0.02 },
    look: { w: 0.12, h: 0.32, r: 0.5, shape: 'rect', tilt: 0, dy: -0.02 },
    love: { w: 0.19, h: 0.3, r: 0.5, shape: 'heart', tilt: 0, dy: 0 },
    wink: { w: 0.14, h: 0.2, r: 0.5, shape: 'wink', tilt: 0, dy: 0 },
    sleepy: { w: 0.15, h: 0.05, r: 1, shape: 'rect', tilt: 0, dy: 0.06 },
  };
  const cur = { ...E.neutral };
  let target = 'neutral', fallback = 'neutral', until = 0;
  let blink = 0, nextBlink = 2.5, lookX = 0, lookY = 0, t = 0;
  const CX = [0.198, 0.809], CY = 0.59;
  function eyePath(ctx, shape, x, y, w, h, r, side) {
    ctx.beginPath();
    if (shape === 'arc' || (shape === 'wink' && side === 1)) {
      // «^» — улыбающиеся глаза
      ctx.lineWidth = Math.max(10, w * 0.32);
      ctx.lineCap = 'round';
      ctx.moveTo(x - w / 2, y + h * 0.35);
      ctx.quadraticCurveTo(x, y - h * 0.75, x + w / 2, y + h * 0.35);
      return 'stroke';
    }
    if (shape === 'heart') {
      const s = w * 0.55;
      ctx.moveTo(x, y + s * 0.95);
      ctx.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.7, y - s * 1.35, x, y - s * 0.45);
      ctx.bezierCurveTo(x + s * 0.7, y - s * 1.35, x + s * 1.6, y - s * 0.2, x, y + s * 0.95);
      return 'fill';
    }
    const rr = Math.min(w, h) * 0.5 * r;
    ctx.roundRect(x - w / 2, y - h / 2, w, h, rr);
    return 'fill';
  }
  function paint(ctx, glowPass) {
    ctx.clearRect(0, 0, W, H);
    if (!glowPass) {
      const g = ctx.createLinearGradient(0, 0, W * 0.6, H);
      g.addColorStop(0, '#26262c');
      g.addColorStop(0.55, '#141418');
      g.addColorStop(1, '#0d0d10');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(3, 3, W - 6, H - 6, 56);
      ctx.fill();
      // лёгкие строки экрана
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = '#ffffff';
      for (let y = (t * 18) % 6; y < H; y += 6) ctx.fillRect(0, y, W, 1);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
    }
    const open = 1 - blink;
    for (let side = 0; side < 2; side++) {
      const shape = cur.shape === 'wink' && side === 0 ? 'rect' : cur.shape;
      const w = cur.w * W, h = Math.max(6, cur.h * H * (shape === 'rect' ? open : 1));
      const x = CX[side] * W + lookX * W * 0.045, y = (CY + cur.dy) * H + lookY * H * 0.05;
      ctx.save();
      ctx.shadowColor = 'rgba(255, 70, 110, 0.95)';
      ctx.shadowBlur = glowPass ? 38 : 22;
      ctx.fillStyle = ctx.strokeStyle = glowPass ? '#ffd9e3' : '#fff4f7';
      const how = eyePath(ctx, shape, x, y, w, h, cur.r, side);
      how === 'stroke' ? ctx.stroke() : ctx.fill();
      if (glowPass) {
        // второй проход — мягкий ореол
        ctx.shadowBlur = 70;
        ctx.globalAlpha = 0.6;
        how === 'stroke' ? ctx.stroke() : ctx.fill();
      }
      ctx.restore();
    }
  }
  return {
    base,
    glow,
    set(name, ms = 0) {
      if (!E[name]) return;
      if (ms) {
        fallback = target === name ? fallback : target;
        until = performance.now() + ms;
      }
      target = name;
    },
    look(x, y) {
      lookX += (x - lookX) * 0.08;
      lookY += (y - lookY) * 0.08;
    },
    draw(dt) {
      t += dt;
      if (until && performance.now() > until) {
        target = fallback === target ? 'neutral' : fallback;
        until = 0;
      }
      const goal = E[target];
      for (const k of ['w', 'h', 'r', 'dy']) cur[k] += (goal[k] - cur[k]) * Math.min(1, dt * 10);
      cur.shape = goal.shape;
      // моргание раз в 2–5 секунд
      nextBlink -= dt;
      if (nextBlink < 0) {
        blink = Math.min(1, blink + dt * 14);
        if (blink >= 1) nextBlink = 2 + Math.random() * 3;
      } else blink = Math.max(0, blink - dt * 10);
      paint(xb, false);
      paint(xg, true);
      base.needsUpdate = true;
      glow.needsUpdate = true;
    },
  };
}
