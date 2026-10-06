(() => {
  'use strict';
  const config = window.YMV_CONFIG;
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const header = $('#header');
  const menu = $('.menu-toggle');
  const navigation = $('#navigation');
  const closeMenu = () => {
    navigation.classList.remove('is-open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Открыть меню');
  };
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    navigation.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  });
  $$('.nav a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  document.addEventListener('click', event => { if (!header.contains(event.target)) closeMenu(); });
  window.matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);

  let scrollQueued = false;
  const updateScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 80);
    if (!reducedMotion.matches && window.innerWidth > 760 && window.scrollY < window.innerHeight) {
      $('.hero-picture img').style.transform = `translateY(${window.scrollY * .12}px) scale(1.015)`;
    }
    scrollQueued = false;
  };
  window.addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); }
  }, { passive: true });
  updateScroll();

  if ('IntersectionObserver' in window) {
    document.documentElement.classList.add('motion-ready');
    const reveals = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); reveals.unobserve(entry.target); }
    }), { threshold: .07 });
    $$('.reveal').forEach(element => reveals.observe(element));
    const sections = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) $$('.nav a').forEach(link => {
        const active = link.hash === `#${entry.target.id}`;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
      });
    }), { rootMargin: '-20% 0px -55% 0px' });
    ['services', 'works', 'about', 'contacts'].forEach(id => sections.observe(document.getElementById(id)));
  }

  $$('.directions a').forEach(link => link.addEventListener('click', () => {
    const detail = $(link.hash);
    if (detail) detail.open = true;
  }));
  $$('.service-list details').forEach(detail => detail.addEventListener('toggle', () => {
    if (detail.open) $$('.service-list details').forEach(other => { if (other !== detail) other.open = false; });
  }));

  // A native range input supports pointer, touch and keyboard without custom drag traps.
  const comparison = $('.comparison');
  $('.comparison-before img').src = config.comparison.before;
  $('.comparison-after').src = config.comparison.after;
  comparison.classList.toggle('demo-comparison', config.comparison.demo);
  $('#comparison-note').textContent = config.comparison.caption;
  const range = $('#comparison-range');
  const updateComparison = () => {
    comparison.style.setProperty('--position', `${range.value}%`);
    range.setAttribute('aria-valuetext', `${range.value}% до, ${100 - range.value}% после`);
  };
  range.addEventListener('input', updateComparison);
  updateComparison();

  let returnFocus = null;
  const openDialog = dialog => {
    closeMenu();
    returnFocus = document.activeElement;
    dialog.showModal();
    document.body.classList.add('modal-open');
  };
  $$('dialog').forEach(dialog => {
    $('[data-close]', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('modal-open');
      if (returnFocus instanceof HTMLElement) returnFocus.focus({ preventScroll: true });
    });
  });
  const booking = $('#booking-dialog');
  const form = $('#booking-form');
  $$('[data-book]').forEach(button => button.addEventListener('click', () => {
    $('#booking-form-view').hidden = false;
    $('#booking-result').hidden = true;
    if (button.dataset.service) form.elements.service.value = button.dataset.service;
    booking.setAttribute('aria-labelledby', 'booking-title');
    openDialog(booking);
  }));
  const phoneInput = form.elements.phone;
  const validatePhone = () => {
    const count = phoneInput.value.replace(/\D/g, '').length;
    const valid = count >= 10 && count <= 15 && /^[+\d()\s-]+$/.test(phoneInput.value);
    phoneInput.setCustomValidity(valid ? '' : 'Укажите номер, содержащий от 10 до 15 цифр.');
  };
  phoneInput.addEventListener('input', validatePhone);
  form.addEventListener('submit', event => {
    event.preventDefault();
    validatePhone();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const content = `Здравствуйте! Хочу записаться на осмотр в YMV Painting Lab.\n\nИмя: ${data.get('name').trim()}\nТелефон: ${data.get('phone').trim()}\nАвтомобиль: ${data.get('car').trim()}\nУслуга: ${data.get('service')}${data.get('comment').trim() ? `\nКомментарий: ${data.get('comment').trim()}` : ''}`;
    $('#request-text').value = content;
    $('#booking-form-view').hidden = true;
    $('#booking-result').hidden = false;
    $('#booking-result h2').id = 'result-title';
    booking.setAttribute('aria-labelledby', 'result-title');
    $('#copy-status').textContent = '';
    booking.scrollTop = 0;
    $('#copy-request').focus();
  });
  $('#edit-request').addEventListener('click', () => {
    $('#booking-form-view').hidden = false;
    $('#booking-result').hidden = true;
    booking.setAttribute('aria-labelledby', 'booking-title');
    form.elements.name.focus();
  });
  $('#copy-request').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('#request-text').value);
      $('#copy-status').textContent = 'Текст скопирован. Заявка ещё не отправлена.';
    } catch {
      $('#request-text').focus();
      $('#request-text').select();
      $('#copy-status').textContent = 'Текст выделен. Скопируйте его вручную.';
    }
  });
  $$('.work').forEach(button => button.addEventListener('click', () => {
    $('#lightbox-image').src = button.dataset.image;
    $('#lightbox-image').alt = $('img', button).alt;
    $('#lightbox-title').textContent = button.dataset.caption;
    openDialog($('#lightbox'));
  }));
  $('#demo-info').addEventListener('click', () => openDialog($('#info-dialog')));

  const safeUrl = value => {
    try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; } catch { return null; }
  };
  $('#business-location').textContent = `${config.city}, ${config.district}`;
  $('#business-address').textContent = config.address || 'Точный адрес уточняется';
  if (config.phone) {
    const link = $('#phone-link');
    link.textContent = config.phone;
    link.href = `tel:${config.phone.replace(/[^+\d]/g, '')}`;
    link.removeAttribute('aria-disabled');
    $('#phone-note').textContent = 'Позвоните, чтобы согласовать осмотр';
  }
  let contactCount = 0;
  $$('[data-contact]').forEach(link => {
    const url = safeUrl(config[link.dataset.contact]);
    if (!url) { link.title = 'Контакт пока не указан'; return; }
    contactCount++;
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.removeAttribute('aria-disabled');
    $('#result-contacts').append(link.cloneNode(true));
  });
  if (contactCount) $('#social-note').textContent = 'Выберите удобный способ связи';
  if (config.phone || contactCount) $('#booking-result .dialog-intro').textContent = 'Запись ещё не оформлена. Скопируйте текст и свяжитесь со студией, чтобы согласовать дату осмотра.';

  let mapLoaded = false;
  const coords = config.coordinates || config.cityCoordinates;
  const preciseLocation = !!config.address && Array.isArray(config.coordinates);
  const point = [coords[1], coords[0]];
  const locationNote = preciseLocation ? config.address : 'Условная точка в районе. Точный адрес студии уточняется.';
  $('#external-map').href = 'https://yandex.ru/maps/?' + new URLSearchParams({ ll: point.join(','), z: preciseLocation ? '16' : '13', pt: point.join(',') + ',pm2vvm' });
  $('#map-note').textContent = locationNote;
  async function loadMap() {
    if (mapLoaded) return;
    mapLoaded = true;
    $('#load-map').disabled = true;
    $('#load-map').textContent = 'Загрузка карты…';
    let map;
    try {
      // Load the local library only when the visitor reaches the contact section.
      if (!window.maplibregl) await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'assets/vendor/maplibre-gl.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.append(script);
      });
      const placeholder = $('.map-loading');
      placeholder.remove();
      map = new maplibregl.Map({
        container: 'map', style: 'assets/map-style.json', center: point,
        zoom: preciseLocation ? 15 : 12, minZoom: 3, maxZoom: 18,
        scrollZoom: false, dragRotate: false, pitchWithRotate: false,
        attributionControl: false,
        locale: {
          'NavigationControl.ZoomIn': 'Приблизить карту',
          'NavigationControl.ZoomOut': 'Отдалить карту',
          'AttributionControl.ToggleAttribution': 'Источники карты',
          'Map.Title': 'Карта Калининграда'
        }
      });
      map.touchZoomRotate.disableRotation();
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
      map.addControl(new maplibregl.AttributionControl({ compact: true }));
      const marker = document.createElement('button');
      marker.className = 'map-marker';
      marker.type = 'button';
      marker.setAttribute('aria-label', config.name + ' — ' + locationNote);
      const label = document.createElement('span');
      label.className = 'map-marker-label';
      label.textContent = 'YMV PAINTING LAB';
      const subtitle = document.createElement('small');
      subtitle.textContent = preciseLocation ? 'Кузовная студия' : 'Условная точка · адрес уточняется';
      label.append(subtitle);
      marker.append(label);
      const popup = new maplibregl.Popup({ offset: 20, closeButton: true }).setText(config.name + ' — ' + locationNote);
      new maplibregl.Marker({ element: marker }).setLngLat(point).setPopup(popup).addTo(map);
      const markError = () => { $('#map-note').textContent = 'Карта временно недоступна. Откройте её по ссылке справа. ' + locationNote; };
      map.on('error', markError);
      map.on('idle', () => { $('#map-note').textContent = locationNote; $('#map').dataset.loaded = 'true'; });
      if ('ResizeObserver' in window) new ResizeObserver(() => map.resize()).observe($('#map'));
    } catch {
      if (map) map.remove();
      const message = document.createElement('p');
      message.className = 'map-unavailable';
      message.textContent = 'Не удалось открыть карту. Воспользуйтесь ссылкой «Открыть карту» ниже.';
      $('#map').replaceChildren(message);
    }
  }
  $('#load-map').addEventListener('click', loadMap);
  if ('IntersectionObserver' in window) {
    const mapObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { loadMap(); mapObserver.disconnect(); }
    }, { rootMargin: '200px' });
    mapObserver.observe($('#map'));
  }
})();
