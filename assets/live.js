// Актуальные условия из панели: пробный срок, цены тарифов, процент партнёра.
// В страницу вписаны текущие значения — если панель не ответила, сайт показывает их, ничего не ломается.
// Разметка: <span data-live="trial">7 дней</span>, data-live="p:happ:30" (цена), "pm:happ:90" (≈ в месяц),
// "old:happ:90" (без скидки, зачёркнутая), "save:awg:30:k2" (выгода второго ключа), "pct", "minpay";
// data-live-plan="awg:30:k2" — блок прячется, если такого тарифа в панели больше нет.
(function () {
  var API = 'https://vpn.hoshimoto.online/api/site';
  var CACHE = 'hs-live';
  var DEF = {
    trialDays: 7,
    happ: [{ price: 190, days: 30, keys: 1 }, { price: 500, days: 90, keys: 1 }, { price: 1990, days: 365, keys: 1 }],
    awg: [{ price: 290, days: 30, keys: 1 }, { price: 390, days: 30, keys: 2 }, { price: 790, days: 90, keys: 1 }, { price: 2990, days: 365, keys: 1 }],
    partner: { percent: 30, minPayout: 1500 },
  };
  var data = DEF;

  var rub = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽'; };
  var plural = function (n, one, few, many) {
    var a = n % 10, b = n % 100;
    return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many;
  };
  var months = function (days) { return days % 365 === 0 ? (days / 365) * 12 : days / 30; };
  var plan = function (app, days, keys) {
    var list = data[app] || [];
    for (var i = 0; i < list.length; i++) if (list[i].days === days && (list[i].keys || 1) === keys) return list[i];
    return null;
  };

  /** Значение по ключу разметки; null — нечего подставить (оставить как есть). */
  function get(key) {
    var k = key.split(':');
    if (k[0] === 'trial') return data.trialDays + ' ' + plural(data.trialDays, 'день', 'дня', 'дней');
    if (k[0] === 'trialn') return String(data.trialDays);
    if (k[0] === 'pct') return data.partner.percent + '%';
    if (k[0] === 'minpay') return rub(data.partner.minPayout);
    var p = plan(k[1], Number(k[2]), k[3] ? Number(k[3].slice(1)) : 1);
    var base = plan(k[1], 30, 1);
    if (!p) return null;
    if (k[0] === 'p') return rub(p.price);
    if (k[0] === 'pm') return rub(p.price / months(p.days));
    if (k[0] === 'old') return base ? rub(base.price * months(p.days) * (p.keys || 1)) : null;
    if (k[0] === 'save') return base ? '−' + rub(base.price * months(p.days) * (p.keys || 1) - p.price) : null;
    if (k[0] === 'saven') return base ? rub(base.price * months(p.days) * (p.keys || 1) - p.price) : null;
    return null;
  }

  /** Подстановки в тексте скриптов (помощник, поиск): «{trial}», «{p:happ:30}». */
  function fill(text) {
    return String(text).replace(/\{([a-z]+(?::[a-z0-9]+)*)\}/g, function (m, key) {
      var v = get(key);
      if (v !== null) return v;
      var saved = data;
      data = DEF;
      v = get(key);
      data = saved;
      return v !== null ? v : m;
    });
  }

  function apply() {
    var els = document.querySelectorAll('[data-live]');
    for (var i = 0; i < els.length; i++) {
      var v = get(els[i].getAttribute('data-live'));
      if (v !== null && els[i].textContent !== v) els[i].textContent = v;
    }
    var blocks = document.querySelectorAll('[data-live-plan]');
    for (var j = 0; j < blocks.length; j++) {
      var k = blocks[j].getAttribute('data-live-plan').split(':');
      blocks[j].hidden = !plan(k[0], Number(k[1]), k[2] ? Number(k[2].slice(1)) : 1);
    }
    document.dispatchEvent(new CustomEvent('hs-live', { detail: data }));
  }

  function valid(d) {
    return d && typeof d.trialDays === 'number' && Array.isArray(d.happ) && Array.isArray(d.awg) && d.partner && typeof d.partner.percent === 'number';
  }
  function use(d) {
    if (!valid(d)) return;
    data = d;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
    else apply();
  }

  window.hsLive = { get: get, fill: fill, data: function () { return data; } };

  // с прошлой страницы этого сайта — сразу, без мелькания старых цифр
  try { use(JSON.parse(sessionStorage.getItem(CACHE) || 'null')); } catch (e) { /* нет хранилища */ }

  var ctl = typeof AbortController === 'function' ? new AbortController() : null;
  var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 3000);
  fetch(API, { signal: ctl ? ctl.signal : undefined, credentials: 'omit' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      clearTimeout(timer);
      if (!valid(d)) return;
      try { sessionStorage.setItem(CACHE, JSON.stringify(d)); } catch (e) { /* нет хранилища */ }
      use(d);
    })
    .catch(function () { /* панель недоступна — остаются вписанные значения */ });
})();
