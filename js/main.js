/* ==========================================================================
   YMV Painting Lab — скрипты сайта
   ========================================================================== */
(function () {
  'use strict';

  /* ========================================================================
     НАСТРОЙКИ КОМПАНИИ — все контакты и точка на карте меняются здесь
     ======================================================================== */
  var CONFIG = {
    phone: '+7 (900) 000-00-00',          // номер, как он показывается на сайте
    phoneTel: '+79000000000',             // тот же номер для ссылки «позвонить»
    address: 'Калининград, Центральный район',
    addressNote: 'Въезд и парковка у мастерской',
    coords: [54.7246, 20.4826],           // [широта, долгота] мастерской
    zoom: 16,
    // ID организации в Яндекс Картах: из ссылки вида yandex.ru/maps/org/ymv/1234567890/
    // Если указать — метка и кнопка будут открывать карточку организации.
    yandexOrgId: '',
    // Ключ «JavaScript API и HTTP Геокодер» (бесплатно: developer.tech.yandex.ru)
    yandexApiKey: '',
    telegram: 'https://t.me/YMVpainting',
    instagram: 'https://www.instagram.com/ymv_39/',
    hours: [
      { days: [1, 2, 3, 4, 5], label: 'Пн – Пт', time: '10:00 – 20:00' },
      { days: [6], label: 'Суббота', time: '10:00 – 18:00' },
      { days: [0], label: 'Воскресенье', time: 'по записи' }
    ],
    hoursShort: 'Пн–Пт 10–20, Сб 10–18<br>Вс — по записи',
    hoursFooter: 'Пн–Пт 10:00–20:00, Сб 10:00–18:00'
  };

  /* Снимок карты для резервного режима (если Яндекс Карты не загрузились).
     Используется только пока координаты совпадают со снимком. */
  var MAP_SNAPSHOT = {
    src: 'img/map-fallback.webp', w: 800, h: 640,
    lat: 54.7246, lon: 20.4826, x: 439, y: 321,
    attribution: '© OpenStreetMap'
  };

  /* Тексты для окна «Подробнее» в услугах */
  var SERVICES = {
    full: {
      title: 'Полная покраска кузова',
      text: 'Перекрашиваем автомобиль целиком — в заводской цвет или в новый. Работаем в окрасочной камере, поэтому на лаке нет пыли и сорности.',
      steps: ['Осмотр, замер толщины ЛКП, смета', 'Разборка навесных элементов и мойка', 'Рихтовка, шпаклёвка, грунт и матирование', 'Покраска: база и лак, сушка в камере', 'Сборка, полировка и выдача автомобиля'],
      price: ['Пример: Mercedes W203', '80 000 ₽']
    },
    parts: {
      title: 'Покраска отдельных элементов',
      text: 'Красим один или несколько элементов так, чтобы они не отличались от остального кузова: подбираем оттенок по коду и делаем тест-напыл.',
      steps: ['Подбор цвета по коду краски и тест-напыл', 'Подготовка элемента: шлифовка и грунт', 'Покраска с переходом на соседние детали', 'Полировка зоны перехода'],
      price: ['Стоимость', 'после осмотра']
    },
    body: {
      title: 'Кузовной ремонт и вмятины',
      text: 'Убираем вмятины и последствия ДТП: вытягиваем и рихтуем металл, восстанавливаем геометрию, меняем детали, которые не подлежат ремонту.',
      steps: ['Диагностика повреждений и смета', 'Вытяжка и рихтовка металла', 'Замена или ремонт повреждённых деталей', 'Подготовка, покраска и полировка'],
      price: ['Вмятина + покраска + полировка', '15 000 ₽']
    },
    bumper: {
      title: 'Бамперы',
      text: 'Ремонтируем пластик: паяем трещины и сломанные крепления. Если бампер не восстановить — меняем на новый и красим в цвет кузова.',
      steps: ['Оценка: ремонт или замена', 'Пайка трещин и креплений', 'Подготовка пластика и грунт', 'Покраска и установка на автомобиль'],
      price: ['Замена переднего бампера', '17 000 ₽']
    },
    polish: {
      title: 'Полировка кузова',
      text: 'Возвращаем лаку глубину и блеск. Перед работой замеряем толщину покрытия, чтобы снять ровно столько, сколько нужно.',
      steps: ['Мойка и очистка кузова', 'Замер толщины ЛКП', 'Абразивная полировка: риски и голограммы', 'Финишный этап и защитный состав'],
      price: ['Стоимость', 'после осмотра']
    },
    tint: {
      title: 'Тонировка',
      text: 'Тонируем стёкла плёнкой. Для передних боковых стёкол соблюдаем допустимую светопропускаемость, чтобы не было вопросов на дороге.',
      steps: ['Подбор плёнки и степени затемнения', 'Подготовка и очистка стёкол', 'Нанесение и формовка плёнки', 'Контроль и выдача'],
      price: ['Стоимость', 'по запросу']
    }
  };

  /* ======================================================================== */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ua = navigator.userAgent || '';
  var isAndroid = /Android/i.test(ua);
  var isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isMobile = isAndroid || isIOS;
  var isFramed = (function () { try { return window.self !== window.top; } catch (e) { return true; } })();
  root.classList.add('js');

  /* ---------- Подстановка данных из CONFIG ---------- */
  function bindData() {
    var map = { phone: CONFIG.phone, address: CONFIG.address, addressNote: CONFIG.addressNote };
    $$('[data-bind]').forEach(function (el) {
      var key = el.getAttribute('data-bind');
      if (key === 'hoursShort') { el.innerHTML = CONFIG.hoursShort; return; }
      if (key === 'hoursFooter') { el.textContent = CONFIG.hoursFooter; return; }
      if (map[key] != null) el.textContent = map[key];
    });
    $$('[data-bind-href]').forEach(function (el) {
      var key = el.getAttribute('data-bind-href');
      if (key === 'tel') el.setAttribute('href', 'tel:' + CONFIG.phoneTel);
      else if (CONFIG[key]) el.setAttribute('href', CONFIG[key]);
    });
    var hours = $('#hours');
    if (hours) {
      var today = new Date().getDay();
      hours.innerHTML = CONFIG.hours.map(function (h) {
        var isToday = h.days.indexOf(today) !== -1;
        return '<div class="kv__row' + (isToday ? ' is-today' : '') + '"><dt>' + h.label + '</dt><dd>' + h.time + '</dd></div>';
      }).join('');
    }
    var y = $('#year'); if (y) y.textContent = String(new Date().getFullYear());
  }

  /* ---------- Яндекс Карты: ссылки и открытие приложения ---------- */
  var lat = CONFIG.coords[0], lon = CONFIG.coords[1];
  var ll = lon + ',' + lat;
  var YA = {
    routeWeb: 'https://yandex.ru/maps/?rtext=~' + lat + ',' + lon + '&rtt=auto',
    routeApp: 'yandexmaps://maps.yandex.ru/?rtext=~' + lat + ',' + lon + '&rtt=auto',
    orgWeb: CONFIG.yandexOrgId
      ? 'https://yandex.ru/maps/org/' + CONFIG.yandexOrgId + '/'
      : 'https://yandex.ru/maps/?ll=' + ll + '&z=17&whatshere%5Bpoint%5D=' + ll + '&whatshere%5Bzoom%5D=17',
    orgApp: CONFIG.yandexOrgId
      ? 'yandexmaps://maps.yandex.ru/?ol=biz&oid=' + CONFIG.yandexOrgId
      : 'yandexmaps://maps.yandex.ru/?pt=' + ll + '&z=17&l=map'
  };

  function openLink(url) {
    var a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* На телефоне сначала пробуем приложение Яндекс Карт, иначе — браузерная версия.
     На компьютере — новая вкладка с Яндекс Картами. */
  function openYandex(kind, ev) {
    var web = YA[kind + 'Web'], app = YA[kind + 'App'];
    var isAnchor = ev && ev.currentTarget && ev.currentTarget.tagName === 'A';
    if (isMobile && !isFramed) {
      if (ev && ev.preventDefault) ev.preventDefault();
      if (isAndroid) {
        var q = app.replace('yandexmaps://', '');
        window.location.href = 'intent://' + q + '#Intent;scheme=yandexmaps;package=ru.yandex.yandexmaps;S.browser_fallback_url=' + encodeURIComponent(web) + ';end';
        return;
      }
      var left = false;
      var onHide = function () { if (document.hidden) left = true; };
      document.addEventListener('visibilitychange', onHide);
      window.location.href = app;
      setTimeout(function () {
        document.removeEventListener('visibilitychange', onHide);
        if (!left && !document.hidden) window.location.href = web;
      }, 1500);
      return;
    }
    if (isAnchor) return; // обычная ссылка с target="_blank"
    if (ev && ev.preventDefault) ev.preventDefault();
    openLink(web);
  }

  function initYandexLinks() {
    $$('[data-yandex]').forEach(function (a) {
      var kind = a.getAttribute('data-yandex');
      a.setAttribute('href', YA[kind + 'Web']);
      a.addEventListener('click', function (e) { openYandex(kind, e); });
    });
  }

  /* ---------- Метка YMV ---------- */
  function pinHTML(tag) {
    var t = tag || 'div';
    return '<' + t + ' class="ymv-pin is-pulse"' + (t === 'a' ? ' href="' + YA.orgWeb + '" target="_blank" rel="noopener"' : ' role="link" tabindex="0"') +
      ' aria-label="YMV Painting Lab — открыть в Яндекс Картах" title="Открыть в Яндекс Картах">' +
      '<span class="ymv-pin__body"><span class="ymv-pin__logo">YMV</span><span class="ymv-pin__sep"></span>' +
      '<span class="ymv-pin__cta">Painting Lab<svg viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span></span>' +
      '<span class="ymv-pin__tail"></span><span class="ymv-pin__dot"></span></' + t + '>';
  }

  /* ---------- Карта ---------- */
  function initMap() {
    var box = $('#mapCanvas');
    if (!box) return;
    renderFallback(box); // сразу показываем карту-заглушку, затем пробуем Яндекс

    var started = false;
    var start = function () {
      if (started) return; started = true;
      loadYandex().then(function (ymaps) { renderYandex(ymaps, box); }).catch(function () { /* остаётся резервная карта */ });
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); start(); }
      }, { rootMargin: '600px 0px' });
      io.observe(box);
    } else start();
  }

  function loadYandex() {
    return new Promise(function (resolve, reject) {
      if (window.ymaps && window.ymaps.ready) { window.ymaps.ready(function () { resolve(window.ymaps); }); return; }
      var s = document.createElement('script');
      s.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU' + (CONFIG.yandexApiKey ? '&apikey=' + encodeURIComponent(CONFIG.yandexApiKey) : '');
      s.async = true;
      var timer = setTimeout(reject, 9000);
      s.onload = function () {
        if (!window.ymaps) { clearTimeout(timer); reject(); return; }
        window.ymaps.ready(function () { clearTimeout(timer); resolve(window.ymaps); }, function () { clearTimeout(timer); reject(); });
      };
      s.onerror = function () { clearTimeout(timer); reject(); };
      document.head.appendChild(s);
    });
  }

  function renderYandex(ymaps, box) {
    try {
      var host = document.createElement('div');
      host.style.cssText = 'position:absolute;inset:0;opacity:0;transition:opacity .6s';
      box.appendChild(host);
      var map = new ymaps.Map(host, { center: CONFIG.coords, zoom: CONFIG.zoom, controls: ['zoomControl'] },
        { suppressMapOpenBlock: true, yandexMapDisablePoiInteractivity: true });
      map.behaviors.disable('scrollZoom');
      if (isMobile) map.behaviors.disable('drag');
      var Layout = ymaps.templateLayoutFactory.createClass(pinHTML('div'));
      var pm = new ymaps.Placemark(CONFIG.coords, { hintContent: 'YMV Painting Lab — открыть в Яндекс Картах' }, {
        iconLayout: Layout,
        iconShape: { type: 'Rectangle', coordinates: [[-80, -64], [80, 0]] }
      });
      pm.events.add('click', function () { openYandex('org', null); });
      map.geoObjects.add(pm);
      requestAnimationFrame(function () {
        host.style.opacity = '1';
        var fb = box.querySelector('.mapfb'); if (fb) setTimeout(function () { fb.remove(); }, 650);
        var open = box.parentNode.querySelector('.map__open'); if (open) open.remove();
      });
    } catch (e) { /* остаётся резервная карта */ }
  }

  /* Резервная карта: снимок + метка, перетаскивание мышью и кнопки масштаба */
  function renderFallback(box) {
    var snapOk = Math.abs(MAP_SNAPSHOT.lat - lat) < 1e-4 && Math.abs(MAP_SNAPSHOT.lon - lon) < 1e-4;
    var W = snapOk ? MAP_SNAPSHOT.w : 1600, H = snapOk ? MAP_SNAPSHOT.h : 1200;
    var px = snapOk ? MAP_SNAPSHOT.x : W / 2, py = snapOk ? MAP_SNAPSHOT.y : H / 2;

    var wrap = document.createElement('div'); wrap.className = 'mapfb';
    var layer = document.createElement('div'); layer.className = 'mapfb__layer' + (snapOk ? '' : ' is-blank');
    layer.style.width = W + 'px'; layer.style.height = H + 'px';
    if (snapOk) layer.innerHTML = '<img src="' + MAP_SNAPSHOT.src + '" alt="" draggable="false" width="' + W + '" height="' + H + '">';
    wrap.appendChild(layer);

    var pinWrap = document.createElement('div');
    pinWrap.innerHTML = pinHTML('a');
    var pin = pinWrap.firstChild;
    pin.addEventListener('click', function (e) { openYandex('org', e); });
    pin.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    wrap.appendChild(pin);

    var zoom = document.createElement('div'); zoom.className = 'mapfb__zoom';
    zoom.innerHTML = '<button type="button" aria-label="Приблизить">+</button><button type="button" aria-label="Отдалить">−</button>';
    wrap.appendChild(zoom);
    if (snapOk) {
      var attr = document.createElement('span'); attr.className = 'mapfb__attr'; attr.textContent = MAP_SNAPSHOT.attribution;
      wrap.appendChild(attr);
    }
    box.appendChild(wrap);

    var open = document.createElement('a');
    open.className = 'map__open'; open.href = YA.orgWeb; open.target = '_blank'; open.rel = 'noopener';
    open.innerHTML = '<svg viewBox="0 0 24 24"><use href="#i-pin"/></svg>Открыть в Яндекс Картах';
    open.addEventListener('click', function (e) { openYandex('org', e); });
    box.parentNode.appendChild(open);

    var s = 1, tx = 0, ty = 0;
    function minScale() { return Math.max(box.clientWidth / W, box.clientHeight / H, 0.6); }
    function clamp() {
      var bw = box.clientWidth, bh = box.clientHeight;
      tx = Math.min(0, Math.max(bw - W * s, tx));
      ty = Math.min(0, Math.max(bh - H * s, ty));
    }
    function apply() {
      clamp();
      layer.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + s + ')';
      pin.style.left = (tx + px * s) + 'px';
      pin.style.top = (ty + py * s) + 'px';
    }
    function center() {
      s = Math.max(1, minScale());
      tx = box.clientWidth / 2 - px * s;
      ty = box.clientHeight * 0.56 - py * s;
      apply();
    }
    function zoomBy(f) {
      var cx = box.clientWidth / 2, cy = box.clientHeight / 2;
      var ns = Math.min(2.4, Math.max(minScale(), s * f));
      tx = cx - (cx - tx) * (ns / s); ty = cy - (cy - ty) * (ns / s); s = ns;
      layer.style.transition = 'transform .35s cubic-bezier(.2,.7,.2,1)';
      apply();
      setTimeout(function () { layer.style.transition = ''; }, 360);
    }
    zoom.children[0].addEventListener('click', function () { zoomBy(1.35); });
    zoom.children[1].addEventListener('click', function () { zoomBy(1 / 1.35); });

    var drag = null;
    wrap.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch' || e.target.closest('.mapfb__zoom')) return;
      drag = { x: e.clientX, y: e.clientY, tx: tx, ty: ty };
      wrap.classList.add('is-dragging');
      wrap.setPointerCapture && wrap.setPointerCapture(e.pointerId);
    });
    wrap.addEventListener('pointermove', function (e) {
      if (!drag) return;
      tx = drag.tx + (e.clientX - drag.x); ty = drag.ty + (e.clientY - drag.y); apply();
    });
    var end = function () { drag = null; wrap.classList.remove('is-dragging'); };
    wrap.addEventListener('pointerup', end); wrap.addEventListener('pointercancel', end);
    wrap.addEventListener('dblclick', function (e) { if (!e.target.closest('.ymv-pin, .mapfb__zoom')) zoomBy(1.35); });

    if ('ResizeObserver' in window) new ResizeObserver(center).observe(box);
    else window.addEventListener('resize', center);
    center();
  }

  /* ---------- Шапка: фон при прокрутке, активный пункт меню ---------- */
  function initHeader() {
    var header = $('#header');
    var mbar = $('#mbar');
    var hero = $('#home');
    var onScroll = function () {
      var y = window.scrollY || window.pageYOffset;
      header.classList.toggle('is-solid', y > 24);
      if (mbar && hero) mbar.classList.toggle('is-visible', y > hero.offsetHeight * 0.55 && !document.body.classList.contains('is-locked'));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var nav = $('#nav');
    var indicator = $('.nav__indicator', nav);
    var moveIndicator = function (link) {
      if (!indicator || !link || !nav.offsetParent) return;
      indicator.style.width = link.offsetWidth + 'px';
      indicator.style.transform = 'translateX(' + link.offsetLeft + 'px)';
      indicator.style.opacity = '1';
    };
    var current = 'home';
    var setActive = function (id) {
      current = id;
      $$('[data-nav]').forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('data-nav') === id); });
      moveIndicator($('[data-nav="' + id + '"]', nav));
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) setActive(e.target.getAttribute('data-section')); });
      }, { rootMargin: '-45% 0px -50% 0px' });
      $$('[data-section]').forEach(function (s) { io.observe(s); });
    }
    window.addEventListener('resize', function () { moveIndicator($('[data-nav="' + current + '"]', nav)); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setActive(current); });
    setActive('home');
  }

  /* ---------- Мобильное меню ---------- */
  function initMenu() {
    var burger = $('#burger'), menu = $('#mmenu'), header = $('#header');
    var open = function (state) {
      burger.setAttribute('aria-expanded', String(state));
      burger.setAttribute('aria-label', state ? 'Закрыть меню' : 'Открыть меню');
      menu.classList.toggle('is-open', state);
      menu.setAttribute('aria-hidden', String(!state));
      header.classList.toggle('is-menu', state);
      document.body.classList.toggle('is-locked', state);
    };
    burger.addEventListener('click', function () { open(burger.getAttribute('aria-expanded') !== 'true'); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { open(false); }); });
    $$('[data-open]', menu).forEach(function (b) { b.addEventListener('click', function () { open(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('is-open')) open(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 1024 && menu.classList.contains('is-open')) open(false); });
  }

  /* ---------- Появление при прокрутке + счётчики ---------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (reduceMotion || !target || target < 2) { el.textContent = String(target); return; }
    var t0 = null, dur = 1400;
    var step = function (t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * e));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function initReveal() {
    var els = $$('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        $$('[data-count]', e.target).forEach(countUp);
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Параллакс ---------- */
  function initParallax() {
    if (reduceMotion) return;
    var items = $$('[data-parallax]').map(function (img) {
      return { img: img, box: img.parentElement, speed: parseFloat(img.getAttribute('data-parallax')) || 0.08 };
    });
    if (!items.length) return;
    var ticking = false;
    var update = function () {
      ticking = false;
      var vh = window.innerHeight;
      items.forEach(function (it) {
        var r = it.box.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var extra = Math.max(0, (it.img.offsetHeight - it.box.offsetHeight) / 2);
        var shift = (r.top + r.height / 2 - vh / 2) * -it.speed;
        shift = Math.max(-extra, Math.min(extra, shift));
        it.img.style.transform = 'translate3d(0,' + shift.toFixed(1) + 'px,0)';
      });
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ---------- Преимущества: движение фиолетового акцента ---------- */
  function initAdvantages() {
    var adv = $('#adv'); if (!adv) return;
    $$('.adv__item', adv).forEach(function (item) {
      item.addEventListener('mouseenter', function () { adv.style.setProperty('--ai', item.getAttribute('data-ai')); });
    });
    adv.addEventListener('mouseleave', function () { adv.style.setProperty('--ai', '0'); });
  }

  /* ---------- Модальные окна ---------- */
  var lastFocus = null;
  function trapFocus(container, e) {
    var f = $$('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])', container).filter(function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function openModal(m) {
    $$('.modal.is-open').forEach(function (o) { if (o !== m) closeModal(o, true); });
    lastFocus = lastFocus || document.activeElement;
    m.classList.add('is-open'); m.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    var mbar = $('#mbar'); if (mbar) mbar.classList.remove('is-visible');
    setTimeout(function () { var c = $('[data-close]', m); if (c) c.focus(); }, 60);
  }
  function closeModal(m, keepLock) {
    m.classList.remove('is-open'); m.setAttribute('aria-hidden', 'true');
    if (!keepLock && !$('.modal.is-open, .lightbox.is-open, .mmenu.is-open')) document.body.classList.remove('is-locked');
    if (!keepLock && lastFocus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} lastFocus = null; }
  }
  function initModals() {
    var contact = $('#contactModal'), service = $('#serviceModal');
    $$('[data-open="contact"]').forEach(function (b) {
      b.addEventListener('click', function () { openModal(contact); });
    });
    $$('[data-service]').forEach(function (b) {
      b.addEventListener('click', function () {
        var d = SERVICES[b.getAttribute('data-service')]; if (!d) return;
        $('#smTitle').textContent = d.title;
        $('#smText').textContent = d.text;
        $('#smList').innerHTML = d.steps.map(function (s) { return '<li><span>' + s + '</span></li>'; }).join('');
        $('#smPrice').innerHTML = '<span>' + d.price[0] + '</span><b>' + d.price[1] + '</b>';
        lastFocus = b;
        openModal(service);
      });
    });
    $$('.modal').forEach(function (m) {
      m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('[data-close]')) closeModal(m); });
    });
    document.addEventListener('keydown', function (e) {
      var m = $('.modal.is-open'); if (!m) return;
      if (e.key === 'Escape') closeModal(m);
      else if (e.key === 'Tab') trapFocus(m, e);
    });
  }

  /* ---------- Копирование телефона ---------- */
  function initCopy() {
    $$('[data-copy]').forEach(function (b) {
      var label = b.textContent, iconOnly = b.hasAttribute('data-icon');
      b.addEventListener('click', function () {
        var text = CONFIG.phone;
        var done = function () {
          if (!iconOnly) b.textContent = 'Скопировано';
          b.classList.add('is-done');
          setTimeout(function () { if (!iconOnly) b.textContent = label; b.classList.remove('is-done'); }, 1600);
        };
        var legacy = function () {
          var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', '');
          ta.style.cssText = 'position:fixed;opacity:0;left:-9999px'; document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); done(); } catch (e) {} ta.remove();
        };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, legacy);
        else legacy();
      });
    });
  }

  /* ---------- Галерея и полноэкранный просмотр ---------- */
  function initGallery() {
    var items = $$('#gallery .work');
    var lb = $('#lightbox'); if (!items.length || !lb) return;
    var img = $('#lbImg'), idx = 0;
    var data = items.map(function (it) {
      var im = $('img', it);
      return { src: im.getAttribute('src'), alt: im.getAttribute('alt'), tag: $('.work__cap span', it).textContent, cap: $('.work__cap strong', it).textContent };
    });
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    $('#lbTotal').textContent = pad(data.length);
    var show = function (i, animate) {
      idx = (i + data.length) % data.length;
      var d = data[idx];
      var set = function () {
        img.src = d.src; img.alt = d.alt;
        $('#lbTag').textContent = d.tag; $('#lbCap').textContent = d.cap;
        $('#lbIndex').textContent = pad(idx + 1);
        img.classList.remove('is-swapping');
      };
      if (animate && !reduceMotion) { img.classList.add('is-swapping'); setTimeout(set, 180); } else set();
      [idx + 1, idx - 1].forEach(function (n) { var p = new Image(); p.src = data[(n + data.length) % data.length].src; });
    };
    var open = function (i) {
      lastFocus = items[i];
      show(i, false);
      lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
      setTimeout(function () { $('[data-close]', lb).focus(); }, 60);
    };
    var close = function () {
      lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true');
      if (!$('.modal.is-open, .mmenu.is-open')) document.body.classList.remove('is-locked');
      if (lastFocus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} lastFocus = null; }
    };
    items.forEach(function (it, i) { it.addEventListener('click', function () { open(i); }); });
    $('#lbPrev').addEventListener('click', function () { show(idx - 1, true); });
    $('#lbNext').addEventListener('click', function () { show(idx + 1, true); });
    lb.addEventListener('click', function (e) { if (e.target.closest('[data-close]') || e.target === $('#lbStage')) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(idx - 1, true);
      else if (e.key === 'ArrowRight') show(idx + 1, true);
      else if (e.key === 'Tab') trapFocus(lb, e);
    });
    var sx = null, sy = null;
    var stage = $('#lbStage');
    stage.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(idx + (dx < 0 ? 1 : -1), true);
      sx = sy = null;
    });
  }

  /* ---------- Тема: светлая / тёмная ---------- */
  function initTheme() {
    var btn = $('#themeToggle'); if (!btn) return;
    var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    var current = function () { return root.getAttribute('data-theme') || (mq && mq.matches ? 'dark' : 'light'); };
    var meta = $('meta[name="theme-color"]');
    var sync = function () {
      var t = current();
      btn.setAttribute('aria-label', t === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему');
      if (meta) meta.setAttribute('content', t === 'dark' ? '#121016' : '#ffffff');
    };
    btn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('ymv-theme', next); } catch (e) {}
      sync();
    });
    if (mq && mq.addEventListener) mq.addEventListener('change', sync);
    sync();
  }

  /* ---------- Подбор цвета на главном экране ---------- */
  function initPaint() {
    var hero = $('#home'), sw = $$('.swatch');
    if (!hero || !sw.length) return;
    sw.forEach(function (b) {
      b.addEventListener('click', function () {
        sw.forEach(function (o) { o.classList.toggle('is-active', o === b); o.setAttribute('aria-checked', String(o === b)); });
        $('#paintCode').textContent = b.getAttribute('data-code');
        $('#paintName').textContent = b.getAttribute('data-name');
        hero.style.setProperty('--paint', getComputedStyle(b).getPropertyValue('--sw').trim());
      });
    });
  }

  /* ---------- Запуск ---------- */
  function boot() {
    bindData();
    initTheme();
    initPaint();
    initYandexLinks();
    initHeader();
    initMenu();
    initReveal();
    initParallax();
    initAdvantages();
    initModals();
    initCopy();
    initGallery();
    initMap();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
