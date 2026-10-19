// Помощник «Хоши» — робот-шар HOSHIMOTO в углу сайта: подсказывает, куда нажать, и ведёт к нужному блоку.
// Рисунок — SVG прямо на странице (без 3D и библиотек): глаза с эмоциями, движения — CSS-анимации.

const BOT = 'https://t.me/Hoshimoto_VPN_bot?start=site';
const root = document.getElementById('hoshi');
// запуск — в конце файла: рисунок шара (ORB_SVG) объявлен ниже

function start() {
  const stage = root.querySelector('.hoshi-stage');
  const bubble = root.querySelector('.hoshi-bubble');
  const textEl = root.querySelector('.hoshi-text');
  const chipsEl = root.querySelector('.hoshi-chips');
  const hint = root.querySelector('.hoshi-hint');
  const qEl = root.querySelector('.hoshi-q');
  const askForm = root.querySelector('.hoshi-ask');
  const reduceUI = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let closing = 0;
  function minimize() {
    if (root.classList.contains('hoshi-min') || closing) return;
    if (reduceUI) return void root.classList.add('hoshi-min');
    root.classList.add('hoshi-closing');
    closing = setTimeout(() => {
      closing = 0;
      root.classList.remove('hoshi-closing');
      root.classList.add('hoshi-min');
    }, 250);
  }
  const HINTS = ['Нужна помощь?', 'Покажу, где что 🧭', '7 дней бесплатно 🎁'];
  let hintN = 0;
  const syncHint = () => {
    if (hint) hint.hidden = !root.classList.contains('hoshi-min') || root.hidden;
  };
  new MutationObserver(syncHint).observe(root, { attributes: true, attributeFilter: ['class', 'hidden'] });
  setInterval(() => {
    if (!hint || hint.hidden) return;
    hintN = (hintN + 1) % HINTS.length;
    hint.textContent = HINTS[hintN];
  }, 9000);
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
  let typing = 0, autoMin = 0, lastSay = 0;
  let thinking = 0;
  function say(text, chips = [], { emotion = 'happy', anim = 'Talk', stay = false, q = '', think = 0 } = {}) {
    clearTimeout(thinking);
    clearTimeout(closing);
    closing = 0;
    root.classList.remove('hoshi-closing');
    if (qEl) {
      qEl.hidden = !q;
      qEl.textContent = q;
    }
    root.classList.remove('hoshi-min');
    lastSay = performance.now();
    clearTimeout(autoMin);
    if (!stay) autoMin = setTimeout(minimize, 14000);
    bubble.hidden = false;
    clearInterval(typing);
    textEl.textContent = '';
    if (think && bot && !reduceUI) {
      // работает на ноутбуке: точки в окне, ноутбук перед шаром — потом ответ
      chipsEl.innerHTML = '';
      textEl.innerHTML = '<span class="hoshi-dots"><i></i><i></i><i></i></span><span class="hoshi-typing">Хоши печатает…</span>';
      bot.work(think);
      thinking = setTimeout(() => say(text, chips, { emotion, anim, stay, q }), think);
      return;
    }
    let i = 0;
    typing = setInterval(() => {
      textEl.textContent = text.slice(0, ++i);
      if (i >= text.length) {
        clearInterval(typing);
        if (bot && anim === 'Talk') bot.play('Idle');
      }
    }, 16);
    chipsEl.innerHTML = '';
    chips.forEach((c, n) => {
      const b = document.createElement(c.href ? 'a' : 'button');
      b.style.setProperty('--n', String(n));
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
    });
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
          { label: '⚡️ Happ или AmneziaVPN?', go: () => guide('#how', 'apps', 'AmneziaVPN — максимальная скорость и стабильность (протокол на базе WireGuard), от 290 ₽. Happ — все страны в одной подписке и 2 устройства, от 190 ₽. Попробовать можно оба.') },
          { label: '💳 Цены', go: () => guide('#pricing', 'price', 'Переключатель сверху: Happ или AmneziaVPN. Чем длиннее срок — тем дешевле месяц.') },
          { label: '🔎 Найти на сайте', go: () => search() },
        ];
  function menu(text = 'Чем помочь?', think = 0) {
    say(text, MENU(), { emotion: 'happy', anim: 'Talk', stay: true, think });
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
    minimize();
    if (bot) face.set('look', 1500);
  }
  // ---------- ответы на вопросы о сайте ----------
  // раздел страницы: здесь — прокрутить и показать, на другой странице — перейти
  const goTo = (sel, text) => () => (document.querySelector(sel) ? guide(sel, sel, text) : (location.href = 'index.html' + sel));
  const SUPPORT = { label: '✉️ Поддержка в Telegram', href: 'https://t.me/Hoshimoto_03' };
  const TRY = { label: '🎁 Попробовать 7 дней бесплатно', main: true, href: BOT, go: () => cheer() };
  const KB = [
    { k: ['цен', 'стои', 'тариф', 'скольк', 'руб', '₽', 'дорог', 'дешев', 'прайс', 'месяц', 'год'], emo: 'happy',
      a: 'Happ: 190 ₽ в месяц, 500 ₽ за 3 месяца, 1 990 ₽ за год — все страны, 2 устройства.\nAmneziaVPN: 290 ₽ в месяц (2 ключа — 390 ₽), 790 ₽ за 3 месяца, 2 990 ₽ за год.\nПервые 7 дней — бесплатно.',
      c: () => [TRY, { label: '💳 Открыть тарифы', go: goTo('#pricing', 'Переключатель сверху: Happ или AmneziaVPN.') }] },
    { k: ['бесплат', 'пробн', 'тест', 'попроб', 'триал', 'trial', '7 дн', 'халяв'], emo: 'love',
      a: '7 дней — бесплатно и без карты. Откройте нашего Telegram-бота, нажмите «Получить ключ» и выберите приложение — ключ придёт за минуту. Один пробный ключ на Telegram-аккаунт.',
      c: () => [TRY] },
    { k: ['happ', 'хапп', 'хап', 'amnezia', 'амнез', 'выбра', 'разниц', 'лучше', 'отлича', 'какой', 'что лучше'], emo: 'look',
      a: 'AmneziaVPN — для максимальной скорости и стабильности: протокол AmneziaWG построен на WireGuard — одном из самых быстрых VPN-протоколов. Низкий пинг, видео в 4K и игры без задержек, ключ на выбранный сервер.\nHapp — проще и дешевле: одна подписка на все страны (Финляндия, Нидерланды, США), 2 устройства, есть в App Store и Google Play.',
      c: () => [{ label: '⚡️ Сравнить на сайте', go: goTo('#how', 'Сравните два способа рядом.') }, TRY] },
    { k: ['быстре', 'самый быстр', 'стабильн', 'надежне', 'надёжне', 'пинг', 'задержк', 'лаг', 'для игр'], emo: 'happy',
      a: 'Самый быстрый и стабильный вариант у нас — AmneziaVPN: протокол AmneziaWG на базе WireGuard, одного из самых быстрых VPN-протоколов. Меньше накладных расходов, низкий пинг — подходит для игр, звонков и 4K.\nЕсли в вашей сети VPN режут — попробуйте Happ: он лучше маскируется под обычный трафик.',
      c: () => [TRY, { label: '💳 Тарифы AmneziaVPN', go: goTo('#pricing', 'Переключатель сверху — выберите AmneziaVPN.') }] },
    { k: ['iphone', 'айфон', 'ios', 'appstore', 'app store', 'эпстор', 'апстор', 'ipad', 'айпад', 'apple'], emo: 'look',
      a: 'На iPhone проще всего Happ — он есть в российском App Store. AmneziaVPN из российского App Store убрали: можно поставить Happ или сменить регион Apple ID — в инструкции всё по шагам.',
      c: () => [{ label: '📲 Скачать приложение', go: goTo('#download', 'Выберите iPhone — там кнопки Happ и AmneziaVPN.') }, { label: '📖 Нет в App Store', href: 'guide.html#appstore' }] },
    { k: ['андроид', 'android', 'самсунг', 'xiaomi', 'сяоми', 'google play', 'плей', 'apk'], emo: 'look',
      a: 'На Android: Happ — файлом APK или из Google Play, AmneziaVPN — наше приложение HOSHIMOTO VPN (файл APK) или AmneziaVPN из Google Play.',
      c: () => [{ label: '📲 Скачать для Android', go: goTo('#download', 'Выберите Android — там обе кнопки.') }] },
    { k: ['windows', 'винд', 'компьют', 'пк', 'ноутбук', 'ноут', 'mac', 'мак', 'macbook', 'макбук', 'linux'], emo: 'look',
      a: 'Для Windows есть наша программа HOSHIMOTO VPN и Happ. Для Mac — Happ из App Store (Mac на M1 и новее) или AmneziaVPN с официального сайта.',
      c: () => [{ label: '📲 Скачать для компьютера', go: goTo('#download', 'Выберите Windows или macOS.') }] },
    { k: ['телевиз', 'tv', 'тв', 'приставк', 'смарт'], emo: 'look',
      a: 'На Android TV — наше приложение HOSHIMOTO VPN или Happ (файлы APK). На Apple TV — Happ for TV из App Store.',
      c: () => [{ label: '📺 Скачать для ТВ', go: goTo('#download', 'Выберите Android TV.') }] },
    { k: ['подключ', 'настро', 'установ', 'начать', 'вставит', 'добавит', 'как пользо', 'инструкц', 'ключ'], emo: 'happy',
      a: 'Три шага:\n1. Откройте бота и нажмите «Получить ключ».\n2. Выберите Happ или AmneziaVPN.\n3. Happ: откройте ссылку из бота → «Добавить подписку». AmneziaVPN: «+» → вставить ключ.',
      c: () => [TRY, { label: '📖 Подробная инструкция', href: 'guide.html' }] },
    { k: ['не работ', 'не подключ', 'ошибк', 'не откры', 'медлен', 'тормоз', 'отвал', 'сломал', 'пропал', 'не грузит', 'не идет', 'не идёт'], emo: 'surprised',
      a: 'Попробуйте: 1) обновить приложение до последней версии; 2) в Happ — «Обновить подписку» и выбрать другую страну; 3) переключиться между Wi-Fi и мобильным интернетом. Не помогло — напишите в поддержку, разберёмся.',
      c: () => [SUPPORT, { label: '🛟 Что делать, если не подключается', href: 'guide.html#help' }] },
    { k: ['устройств', 'два телефон', '2 телефон', 'двух', 'нескольк', 'одновремен', 'семь', 'жена', 'муж', 'дет', 'второй', 'втором', 'планшет'], emo: 'happy',
      a: 'Happ: одна подписка — 2 устройства. AmneziaVPN: 1 ключ — 1 устройство; два ключа на месяц — 390 ₽ вместо 580 ₽, годовой тариф — сразу на 3 устройства.',
      c: () => [{ label: '💳 Тарифы', go: goTo('#pricing', 'Тарифы Happ и AmneziaVPN.') }] },
    { k: ['оплат', 'заплат', 'карт', 'перевод', 'продл', 'купит', 'покуп', 'сбп', 'реквизит'], emo: 'happy',
      a: 'Оплата — через менеджера: в боте нажмите «Купить» или «Продлить», выберите тариф — бот даст контакт, менеджер пришлёт реквизиты и сразу продлит ключ.',
      c: () => [{ label: '💳 Купить в боте', href: BOT, main: true, go: () => cheer() }, SUPPORT] },
    { k: ['сервер', 'стран', 'локац', 'финлянд', 'нидерланд', 'голланд', 'сша', 'америк', 'герман', 'европ'], emo: 'look',
      a: 'Happ — Финляндия, Нидерланды и США сразу в одной подписке. AmneziaVPN — Нидерланды или США на выбор. Скоро добавится Германия.',
      c: () => [{ label: '🌍 Серверы на сайте', go: goTo('#servers', 'Серверы и их нагрузка в реальном времени.') }] },
    { k: ['партн', 'зарабат', 'заработ', 'реферал', 'процент', 'пригла', 'друз'], emo: 'love',
      a: 'Советуйте VPN друзьям и получайте 20% с каждой их оплаты — пока они пользуются. Ссылку и кабинет даст бот: кнопка «💰 Зарабатывать с нами».',
      c: () => [{ label: '💰 Подробнее', go: goTo('#partners', 'Подвигайте ползунок — посчитайте доход.') }, { label: '🤝 Стать партнёром', href: 'https://t.me/Hoshimoto_VPN_bot?start=partner' }] },
    { k: ['номер', 'регистрац', 'почт', 'email', 'паспорт', 'личные данн'], emo: 'happy',
      a: 'Номер телефона, почта и регистрация не нужны — ключ выдаётся в Telegram одним нажатием.',
      c: () => [TRY] },
    { k: ['безопас', 'лог', 'приват', 'шифр', 'анонимн', 'следят', 'слежк', 'надежн', 'надёжн'], emo: 'happy',
      a: 'Мы не записываем, какие сайты вы открываете. Трафик шифруется от устройства до сервера, а протоколы VLESS Reality и AmneziaWG маскируют VPN под обычный трафик.',
      c: () => [{ label: '✨ Возможности', go: goTo('#features', 'Почему HOSHIMOTO.') }] },
    { k: ['блокир', 'белые списк', 'белый списк', 'россии', 'рф', 'обход', 'youtube', 'ютуб', 'инстаграм', 'instagram'], emo: 'happy',
      a: 'Да, работает в России: VPN маскируется под обычный трафик, поэтому его сложно заблокировать. YouTube, Instagram и другие сервисы открываются без ограничений.',
      c: () => [TRY] },
    { k: ['скорост', 'быстр', '4k', 'игр', 'пинг', 'трафик', 'лимит', 'безлимит'], emo: 'happy',
      a: 'Трафик без ограничений, скорость — для видео в 4K и игр. Серверы с запасом мощности, нагрузку видно на сайте в реальном времени.',
      c: () => [{ label: '🌍 Серверы', go: goTo('#servers', 'Нагрузка серверов в реальном времени.') }] },
    { k: ['поддерж', 'связат', 'менеджер', 'контакт', 'написат', 'вопрос', 'помощ', 'оператор'], emo: 'happy',
      a: 'Поддержка — в Telegram: ответим и поможем с подключением. Ещё можно написать прямо в бота: «🛟 Помощь».',
      c: () => [SUPPORT, { label: '🤖 Открыть бота', href: BOT }] },
    { k: ['что такое', 'hoshimoto', 'хошимото', 'кто вы', 'о вас', 'компан'], emo: 'happy',
      a: 'HOSHIMOTO VPN — быстрый VPN, который работает там, где другие блокируют. Два способа подключения: подписка Happ или ключ AmneziaVPN. Ключ выдаёт Telegram-бот за минуту.',
      c: () => [TRY, { label: '🗺 Экскурсия по сайту', go: () => tour(0) }] },
    { k: ['бот', 'телеграм', 'telegram', 'тг'], emo: 'happy',
      a: 'Наш бот — @Hoshimoto_VPN_bot: выдаёт ключи, напоминает о сроке, помогает с подключением и продлением.',
      c: () => [{ label: '🤖 Открыть бота', href: BOT, main: true, go: () => cheer() }] },
  ];
  const SMALL = [
    { k: ['спасиб', 'благодар', 'класс', 'круто', 'супер', 'отлично'], a: 'Пожалуйста! Рад помочь 😊', emo: 'love' },
    { k: ['привет', 'здравств', 'добрый', 'хай', 'hello', 'hi'], a: 'Привет! Спросите что угодно про VPN — цены, подключение, приложения.', emo: 'happy' },
    { k: ['как дела', 'ты кто', 'как тебя'], a: 'Я Хоши — помощник HOSHIMOTO VPN. Дела отлично: серверы летают 🚀', emo: 'happy' },
  ];
  const norm = (t) => ' ' + t.toLowerCase().replace(/ё/g, 'е').replace(/[^\p{L}\p{N}₽ ]+/gu, ' ').replace(/\s+/g, ' ') + ' ';
  function match(list, q) {
    let best = null, bestScore = 0;
    for (const item of list) {
      let score = 0;
      for (const k of item.k) {
        const key = k.replace(/ё/g, 'е');
        if (key.includes(' ') ? q.includes(key) : q.includes(' ' + key)) score += key.length > 4 ? 2 : 1;
      }
      if (score > bestScore) {
        best = item;
        bestScore = score;
      }
    }
    return best;
  }
  function answer(raw) {
    const text = raw.trim().slice(0, 200);
    if (!text) return;
    const q = norm(text);
    const hit = match(KB, q) || match(SMALL, q);
    if (hit) say(hit.a, [...(hit.c ? hit.c() : []), { label: '« Меню', go: () => menu() }], { emotion: hit.emo || 'happy', anim: 'Talk', stay: true, q: text, think: 1100 });
    else
      say('Пока не знаю ответа на это 🤔 Спросите по-другому — например, «сколько стоит» или «как подключить на iPhone». Или напишите в поддержку — там ответят.', [SUPPORT, { label: '❓ Частые вопросы', go: goTo('#faq', 'Ответы на частые вопросы.') }, { label: '« Меню', go: () => menu() }], { emotion: 'surprised', anim: 'Talk', stay: true, q: text, think: 1100 });
  }
  if (askForm)
    askForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = askForm.elements.namedItem('q');
      answer(input.value);
      input.value = '';
    });

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
    minimize();
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
  if (hint)
    hint.addEventListener('click', () => {
      saved.quiet = false;
      save();
      menu('Я тут! Чем помочь?', 800);
    });
  stage.addEventListener('click', () => {
    if (root.classList.contains('hoshi-min')) {
      saved.quiet = false;
      save();
      menu('Я тут! Чем помочь?', 800);
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

  // ---------- робот-шар ----------
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bot = makeOrb(stage, reduce);
  const face = bot.face;
  let ready = true;
  root.classList.add('hoshi-live');

  // смотрит на курсор: шар чуть наклоняется, глаза бегают
  addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    bot.look(
      Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth * 0.5))),
      Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (innerHeight * 0.5))),
    );
  });

  // ---------- в ожидании: играет, смеётся, засыпает ----------
  const GAMES = ['bounce', 'spin', 'giggle', 'love', 'peek', 'dance'];
  let lastGame = '', lastMove = performance.now(), sleeping = false, hoverBubble = false, tickled = 0;
  bubble.addEventListener('pointerenter', () => (hoverBubble = true));
  bubble.addEventListener('pointerleave', () => (hoverBubble = false));
  addEventListener('pointermove', () => {
    lastMove = performance.now();
    if (sleeping) {
      sleeping = false;
      bot.wake();
    }
  });
  addEventListener('scroll', () => (lastMove = performance.now()), { passive: true });
  // щекотка: навели на шар — хихикает
  stage.addEventListener('pointerenter', () => {
    if (performance.now() - tickled < 4000 || performance.now() - lastSay < 2500) return;
    tickled = performance.now();
    bot.fun('giggle');
  });
  const playLoop = () => {
    setTimeout(playLoop, 8000 + Math.random() * 5000);
    const now = performance.now();
    if (document.hidden || root.hidden || hoverBubble || now - lastSay < 7000 || bot.busy()) return;
    if (now - lastMove > 60000) {
      if (!sleeping) {
        sleeping = true;
        bot.sleep();
      }
      return;
    }
    let g = GAMES[Math.floor(Math.random() * GAMES.length)];
    if (g === lastGame) g = GAMES[(GAMES.indexOf(g) + 1) % GAMES.length];
    lastGame = g;
    bot.fun(g);
  };
  setTimeout(playLoop, 9000);

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
      autoMin = setTimeout(minimize, 8000);
    }
  }, 700);
}

// ---------- робот-шар: рисунок, глаза, движения ----------
const ORB_SVG = `<svg viewBox="0 0 600 660" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="hs-shell" cx="0.36" cy="0.3" r="0.82">
      <stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#eef1f6"/><stop offset="0.82" stop-color="#cfd5df"/><stop offset="1" stop-color="#a9b1c0"/>
    </radialGradient>
    <radialGradient id="hs-rimlight" cx="0.5" cy="0.95" r="0.6">
      <stop offset="0" stop-color="#ff2e4d" stop-opacity="0.28"/><stop offset="1" stop-color="#ff2e4d" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="hs-glass" x1="0.2" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="#232a3a"/><stop offset="0.55" stop-color="#0b0e16"/><stop offset="1" stop-color="#05060a"/>
    </linearGradient>
    <linearGradient id="hs-rim" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#22d3ee"/><stop offset="0.35" stop-color="#ff3d81"/><stop offset="0.7" stop-color="#ff2e4d"/><stop offset="1" stop-color="#22d3ee"/>
      <animateTransform attributeName="gradientTransform" type="rotate" values="0 0.5 0.5;360 0.5 0.5" dur="6s" repeatCount="indefinite"/>
    </linearGradient>
    <linearGradient id="hs-lid" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="#4a5060"/><stop offset="0.5" stop-color="#2a2e38"/><stop offset="1" stop-color="#15171d"/>
    </linearGradient>
    <linearGradient id="hs-deck" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e7eaf0"/><stop offset="1" stop-color="#9aa1ae"/>
    </linearGradient>
    <radialGradient id="hs-screenlight" cx="0.5" cy="1" r="0.8">
      <stop offset="0" stop-color="#5ee7f7" stop-opacity="0.55"/><stop offset="1" stop-color="#5ee7f7" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="hs-shadow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <filter id="hs-glow" x="-30%" y="-40%" width="160%" height="180%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="hs-eyeglow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <ellipse class="orb-shadow" cx="300" cy="618" rx="120" ry="18" fill="url(#hs-shadow)"/>
  <g class="orb-float"><g class="orb-body"><g class="orb-tilt">
    <circle cx="300" cy="300" r="190" fill="url(#hs-shell)"/>
    <circle cx="300" cy="300" r="190" fill="url(#hs-rimlight)"/>
    <circle cx="300" cy="300" r="189" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="2"/>
    <ellipse cx="226" cy="168" rx="70" ry="34" fill="#fff" opacity="0.8" transform="rotate(-28 226 168)"/>
    <g class="orb-visor">
      <rect x="142" y="196" width="316" height="208" rx="100" fill="url(#hs-rim)" filter="url(#hs-glow)"/>
      <rect x="156" y="210" width="288" height="180" rx="88" fill="url(#hs-glass)"/>
      <rect class="orb-screenlight" x="156" y="250" width="288" height="140" rx="70" fill="url(#hs-screenlight)"/>
      <path d="M184 238q60-22 132-14" fill="none" stroke="#fff" stroke-opacity="0.16" stroke-width="10" stroke-linecap="round"/>
      <g filter="url(#hs-eyeglow)">
        <path class="orb-eye-fill" fill="#fff"/><path class="orb-eye-fill" fill="#fff"/>
        <path class="orb-eye-line" fill="none" stroke="#fff" stroke-width="13" stroke-linecap="round"/><path class="orb-eye-line" fill="none" stroke="#fff" stroke-width="13" stroke-linecap="round"/>
      </g>
    </g>
  </g>
    <g class="orb-laptop">
      <g class="orb-lid">
        <rect x="196" y="386" width="208" height="122" rx="14" fill="url(#hs-lid)" stroke="#596072" stroke-width="2"/>
        <path d="M214 396h172" stroke="#fff" stroke-opacity="0.18" stroke-width="4" stroke-linecap="round"/>
        <circle class="orb-logo" cx="300" cy="447" r="15" fill="none" stroke="url(#hs-rim)" stroke-width="5" filter="url(#hs-eyeglow)"/>
      </g>
      <path d="M172 506h256l-16 20H188z" fill="url(#hs-deck)"/>
      <path d="M188 526h224" stroke="#6b7280" stroke-width="3" stroke-linecap="round"/>
    </g>
  </g></g>
</svg>`;

function makeOrb(stage, reduce) {
  stage.innerHTML = ORB_SVG;
  const svg = stage.querySelector('svg');
  const body = svg.querySelector('.orb-body');
  const tilt = svg.querySelector('.orb-tilt');
  const visor = svg.querySelector('.orb-visor');
  const fills = svg.querySelectorAll('.orb-eye-fill');
  const lines = svg.querySelectorAll('.orb-eye-line');
  // эмоции: полуширина и полувысота глаза, форма
  const E = {
    neutral: { w: 26, h: 34, shape: 'oval' },
    happy: { w: 30, h: 22, shape: 'arc' },
    surprised: { w: 33, h: 41, shape: 'oval' },
    look: { w: 24, h: 31, shape: 'oval' },
    love: { w: 32, h: 32, shape: 'heart' },
    wink: { w: 30, h: 22, shape: 'wink' },
    sleepy: { w: 30, h: 5, shape: 'oval' },
  };
  const cur = { w: 26, h: 34 };
  let target = 'neutral', fallback = 'neutral', until = 0;
  let blink = 0, nextBlink = 2.5, lx = 0, ly = 0, tx = 0, ty = 0, force = null, forceUntil = 0;
  const oval = (x, y, w, h) => `M${x - w} ${y}a${w} ${h} 0 1 0 ${2 * w} 0a${w} ${h} 0 1 0 ${-2 * w} 0z`;
  const arc = (x, y, w, h) => `M${x - w} ${y + h * 0.45}Q${x} ${y - h * 1.5} ${x + w} ${y + h * 0.45}`;
  const heart = (x, y, s) =>
    `M${x} ${y + s * 0.95}C${x - s * 1.6} ${y - s * 0.15} ${x - s * 0.75} ${y - s * 1.3} ${x} ${y - s * 0.45}C${x + s * 0.75} ${y - s * 1.3} ${x + s * 1.6} ${y - s * 0.15} ${x} ${y + s * 0.95}z`;

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (until && now > until) {
      target = fallback === target ? 'neutral' : fallback;
      until = 0;
    }
    const goal = E[target];
    cur.w += (goal.w - cur.w) * Math.min(1, dt * 12);
    cur.h += (goal.h - cur.h) * Math.min(1, dt * 12);
    // моргание раз в 2–5 секунд
    nextBlink -= dt;
    if (nextBlink < 0) {
      blink = Math.min(1, blink + dt * 14);
      if (blink >= 1) nextBlink = 2 + Math.random() * 3;
    } else blink = Math.max(0, blink - dt * 10);
    // взгляд: за курсором или туда, куда показывает
    const want = force && now < forceUntil ? force : { x: tx, y: ty };
    lx += (want.x - lx) * Math.min(1, dt * 6);
    ly += (want.y - ly) * Math.min(1, dt * 6);
    visor.setAttribute('transform', `translate(${(lx * 10).toFixed(2)} ${(ly * 6).toFixed(2)})`);
    tilt.setAttribute('transform', `rotate(${(lx * 7).toFixed(2)} 300 300)`);
    const ex = lx * 16, ey = ly * 10;
    for (let i = 0; i < 2; i++) {
      const x = (i ? 348 : 252) + ex, y = 302 + ey;
      const shape = goal.shape === 'wink' ? (i ? 'arc' : 'oval') : goal.shape;
      const fillOn = shape === 'oval' || shape === 'heart';
      fills[i].setAttribute('d', shape === 'heart' ? heart(x, y + 4, cur.w * 0.85) : fillOn ? oval(x, y, cur.w, Math.max(3, cur.h * (1 - blink * 0.92))) : '');
      fills[i].setAttribute('fill', shape === 'heart' ? '#ff4d7d' : '#ffffff');
      lines[i].setAttribute('d', shape === 'arc' ? arc(x, y, cur.w, cur.h) : '');
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // движения: классы с CSS-анимациями (стили — в index.html, блок «помощник Хоши»)
  const ONCE = { Wave: 1600, Point: 2000, Happy: 1300 };
  let timer = 0, busyUntil = 0, zTimer = 0;
  const ACTS = ['orb-a-wave', 'orb-a-point', 'orb-a-happy', 'orb-a-talk', 'orb-a-bounce', 'orb-a-spin', 'orb-a-giggle', 'orb-a-dance'];
  const layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  svg.appendChild(layer);
  // частицы: искорки, сердечки, ноты, «ха», «z» — вылетают над шаром и тают
  function particle(ch, color, delay = 0, dx = 0, y = 120) {
    setTimeout(() => {
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.textContent = ch;
      t.setAttribute('x', String(300 + dx + (Math.random() * 60 - 30)));
      t.setAttribute('y', String(y));
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('fill', color);
      t.setAttribute('class', 'orb-pt');
      t.style.setProperty('--dx', `${Math.random() * 120 - 60}px`);
      layer.appendChild(t);
      setTimeout(() => t.remove(), 1800);
    }, delay);
  }
  const GAMES = {
    bounce: { cls: 'orb-a-bounce', ms: 1700, emo: 'happy', pts: [['✦', '#9feeff'], ['✦', '#ffffff'], ['✦', '#ff8aa0']] },
    spin: { cls: 'orb-a-spin', ms: 1300, emo: 'happy', pts: [['✦', '#ffffff'], ['✦', '#22d3ee']] },
    giggle: { cls: 'orb-a-giggle', ms: 1500, emo: 'happy', pts: [['ха', '#ffffff'], ['ха', '#ffd1db'], ['хи', '#ffffff']] },
    love: { cls: 'orb-a-bounce', ms: 1700, emo: 'love', pts: [['❤', '#ff4d7d'], ['❤', '#ff2e4d'], ['❤', '#ff8aa0']] },
    peek: { cls: '', ms: 2400, emo: 'look', pts: [] },
    dance: { cls: 'orb-a-dance', ms: 2200, emo: 'happy', pts: [['♪', '#ff8aa0'], ['♫', '#9feeff'], ['♪', '#ffffff']] },
  };
  function clearActs() {
    body.classList.remove(...ACTS);
  }
  return {
    busy: () => performance.now() < busyUntil,
    work(ms) {
      clearTimeout(timer);
      clearActs();
      busyUntil = performance.now() + ms + 400;
      svg.classList.add('orb-working');
      this.face.set('look', ms);
      force = { x: 0, y: 1 };
      forceUntil = performance.now() + ms;
      const CODE = [['</>', '#9feeff'], ['{ }', '#ffffff'], ['01', '#5ee7f7'], ['✓', '#ff8aa0']];
      let n = 0;
      const iv = setInterval(() => {
        const [ch, color] = CODE[n++ % CODE.length];
        particle(ch, color, 0, n % 2 ? 175 : -175, 440);
      }, 300);
      setTimeout(() => {
        clearInterval(iv);
        svg.classList.remove('orb-working');
      }, ms);
    },
    fun(kind) {
      const g = GAMES[kind];
      if (!g) return;
      clearTimeout(timer);
      clearActs();
      busyUntil = performance.now() + g.ms;
      if (g.emo !== 'look') this.face.set(g.emo, g.ms);
      if (kind === 'peek') {
        // оглядывается и удивляется
        this.face.set('look', 1600);
        force = { x: -1, y: -0.2 };
        forceUntil = performance.now() + 2200;
        setTimeout(() => (force = { x: 1, y: -0.2 }), 750);
        setTimeout(() => {
          force = { x: 0, y: 0.1 };
          this.face.set('surprised', 900);
        }, 1500);
      }
      if (reduce) return;
      if (g.cls) {
        void body.getBoundingClientRect();
        body.classList.add(g.cls);
        timer = setTimeout(() => body.classList.remove(g.cls), g.ms);
      }
      g.pts.forEach(([ch, color], i) => particle(ch, color, i * 260, i % 2 ? 40 : -40));
    },
    sleep() {
      clearActs();
      this.face.set('sleepy');
      clearInterval(zTimer);
      if (!reduce) zTimer = setInterval(() => particle('z', '#9feeff', 0, 50), 1300);
    },
    wake() {
      clearInterval(zTimer);
      this.face.set('surprised', 900);
      setTimeout(() => this.face.set('neutral'), 950);
    },
    play(name) {
      if (reduce && (name === 'Happy' || name === 'Wave')) name = 'Idle';
      clearTimeout(timer);
      clearActs();
      busyUntil = performance.now() + (ONCE[name] || 0);
      if (name === 'Idle') return;
      void body.getBoundingClientRect();
      body.classList.add(`orb-a-${name.toLowerCase()}`);
      if (name === 'Point') {
        force = { x: -1, y: -0.35 };
        forceUntil = performance.now() + 1900;
      }
      if (ONCE[name]) timer = setTimeout(() => body.classList.remove(`orb-a-${name.toLowerCase()}`), ONCE[name]);
    },
    look(x, y) {
      tx = x;
      ty = y;
    },
    face: {
      set(name, ms = 0) {
        if (!E[name]) return;
        if (ms) {
          fallback = target === name ? fallback : target;
          until = performance.now() + ms;
        }
        target = name;
      },
    },
  };
}

// запуск — после всех объявлений
if (root) start();
