/*
  «Посмотри в окно» — демонстрационная версия для портфолио.
  Исходный учебный код сохранён в scripts/script.js.
  Сначала используется API Практикума; при ошибке — открытые демо-ролики Wikimedia Commons.
*/
(() => {
  'use strict';

  const API = 'https://v-content.practicum-team.ru';
  const PAGE_SIZE = 5;

  // Городские видеоматериалы опубликованы на Wikimedia Commons с лицензиями CC.
  // Время суток — метки демонстрационного набора, а не данные учебного API.
  const demoVideos = [
    {
      id: 'demo-tokyo', city: 'Токио', time_of_day: 'afternoon',
      description: 'Перекрёсток Сибуя · демонстрационный ролик',
      videoUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/5/53/Shibuya_Crossing%2C_Tokyo%2C_Japan_%28video%29.webm/Shibuya_Crossing%2C_Tokyo%2C_Japan_%28video%29.webm.360p.vp9.webm',
      source: 'https://commons.wikimedia.org/wiki/File:Shibuya_Crossing,_Tokyo,_Japan_(video).webm',
      credit: 'Basile Morin · CC BY-SA 4.0'
    },
    {
      id: 'demo-newyork', city: 'Нью-Йорк', time_of_day: 'afternoon',
      description: 'Изменения городской территории · спутниковый таймлапс',
      videoUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/d/de/Google_Timelapse-_New_York%2C_New_York.webm/Google_Timelapse-_New_York%2C_New_York.webm.360p.vp9.webm',
      source: 'https://commons.wikimedia.org/wiki/File:Google_Timelapse-_New_York,_New_York.webm',
      credit: 'Google Earth · CC BY 3.0'
    },
    {
      id: 'demo-london', city: 'Лондон', time_of_day: 'night',
      description: 'Час Земли · городской видеоролик',
      videoUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/7/7c/Will_the_last_one_to_leave_the_City_of_London_please_switch_off_the_lights_2009.webm/Will_the_last_one_to_leave_the_City_of_London_please_switch_off_the_lights_2009.webm.360p.vp9.webm',
      source: 'https://commons.wikimedia.org/wiki/File:Will_the_last_one_to_leave_the_City_of_London_please_switch_off_the_lights_2009.webm',
      credit: 'Lars Plougmann · CC BY-SA 2.0'
    }
  ];

  const cardsList = document.querySelector('.content__list');
  const cardsContainer = document.querySelector('.content__list-container');
  const videoContainer = document.querySelector('.result__video-container');
  const player = document.querySelector('.result__video');
  const form = document.querySelector('.search-form');
  const cardTemplate = document.querySelector('.cards-list-item-template');
  const errorTemplate = document.querySelector('.error-template');
  if (!cardsList || !videoContainer || !player || !form || !cardTemplate) return;

  // Подстройка исходного десктопного макета под телефон.
  const mobileStyles = document.createElement('style');
  mobileStyles.textContent = `
    .portfolio-notice { font: 14px/1.45 system-ui,sans-serif; color:#ececec;
      background:#32303a; padding:12px 16px; border-left:3px solid #b6a3ef;
      margin:0 0 16px; max-width:1140px; }
    .portfolio-credit {margin:10px 0 0; font:12px/1.4 system-ui,sans-serif;color:#bdbdbd}
    .portfolio-credit a {color:#cec4ff}
    @media (max-width:1199px) {
      html,body.page {width:100%;min-width:0;min-height:100%;height:auto;margin:0}
      body.page {display:block;padding:16px}
      .content {width:100%;max-width:800px;grid-template-columns:minmax(0,1fr);
        grid-template-areas:'result' 'details';gap:25px;place-items:stretch}
      .result,.result__video-container,.content__details {width:100%;min-width:0}
      .result__video-container {height:auto;aspect-ratio:16/9}
      .content__details {overflow:hidden}
      .title {font-size:clamp(40px,10vw,70px)}
      .search-form {gap:14px;flex-wrap:wrap}
      .search-form__submit-button {min-width:130px}
      .content__list-container {height:auto;max-height:450px}
      .content__video-card-thumbnail {min-width:115px;width:115px;height:80px}
      .content__video-card-title {font-size:24px}
      .content__video-card-description {font-size:14px}
    }`;
  document.head.append(mobileStyles);
  player.setAttribute('playsinline', '');
  player.preload = 'metadata';

  const notice = document.createElement('div');
  notice.className = 'portfolio-notice';
  notice.setAttribute('role', 'status');
  document.querySelector('.result').prepend(notice);

  const credit = document.createElement('p');
  credit.className = 'portfolio-credit';
  videoContainer.after(credit);

  let mode = 'api';
  let currentItems = [];
  let page = 1;
  let pageCount = 1;
  let currentFilter = { city: '', time: [] };
  let requestId = 0;

  function normalizePath(path) {
    if (!path) return '';
    return /^https?:\/\//i.test(path) ? path : API + path;
  }
  function collectFilters() {
    return {
      city: form.querySelector('[name="city"]').value.trim().toLocaleLowerCase('ru'),
      time: [...form.querySelectorAll('[name="time"]:checked')].map(x => x.value)
    };
  }
  function matchingDemo(filters) {
    return demoVideos.filter(v =>
      v.city.toLocaleLowerCase('ru').includes(filters.city) &&
      (!filters.time.length || filters.time.includes(v.time_of_day))
    );
  }
  function makeUrl(filters, currentPage) {
    const u = new URL('/api/videos', API);
    u.searchParams.set('pagination[pageSize]', String(PAGE_SIZE));
    u.searchParams.set('pagination[page]', String(currentPage));
    if (filters.city) u.searchParams.set('filters[city][$containsi]', filters.city);
    filters.time.forEach(t => u.searchParams.append('filters[time_of_day][$eqi]', t));
    return u.toString();
  }
  async function loadApi(filters, currentPage) {
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 4500);
    try {
      const response = await fetch(makeUrl(filters, currentPage), { signal: abort.signal });
      if (!response.ok) throw new Error('API ' + response.status);
      const data = await response.json();
      if (!data || !Array.isArray(data.results)) throw new Error('Неизвестный формат API');
      return data;
    } finally {
      clearTimeout(timeout);
    }
  }
  function showNotice() {
    if (mode === 'demo') {
      notice.textContent = 'Демонстрационный режим: учебный API недоступен. Поиск и фильтры работают на небольшом наборе открытых роликов Wikimedia Commons; данные не принадлежат Яндекс Практикуму.';
    } else {
      notice.textContent = 'Видео загружаются из учебного API Яндекс Практикума.';
    }
  }
  function clearDisplay() {
    cardsList.replaceChildren();
    cardsContainer.querySelector('.more-button')?.remove();
    videoContainer.querySelector('.error')?.remove();
    videoContainer.querySelector('.preloader')?.remove();
    credit.replaceChildren();
    player.pause();
    player.removeAttribute('src');
    player.removeAttribute('poster');
    player.load();
  }
  function showError(message) {
    const el = errorTemplate?.content.firstElementChild?.cloneNode(true);
    if (el) {
      el.querySelector('.error__title').textContent = message;
      videoContainer.append(el);
    } else {
      credit.textContent = message;
    }
  }
  function posterFor(item) {
    if (item.thumbnail && item.thumbnail.url) return normalizePath(item.thumbnail.url);
    const city = item.city || 'Демо';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="230" viewBox="0 0 400 230"><rect width="400" height="230" fill="#2d3649"/><path d="M0 180h50V85h35v50h40V65h65v55h45V90h40v48h45V58h50v122h30v50H0Z" fill="#60708a"/><text x="200" y="215" font-family="Arial" font-size="24" fill="white" text-anchor="middle">${city}</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  function addCard(item) {
    const node = cardTemplate.content.cloneNode(true);
    const link = node.querySelector('.content__card-link');
    link.dataset.videoId = String(item.id);
    node.querySelector('.content__video-card-title').textContent = item.city;
    node.querySelector('.content__video-card-description').textContent = item.description || '';
    const img = node.querySelector('.content__video-card-thumbnail');
    img.src = posterFor(item);
    img.alt = 'Превью: ' + item.city;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      selectItem(item);
    });
    cardsList.append(node);
  }
  function setCredit(item) {
    credit.replaceChildren();
    if (item.source) {
      credit.append('Видео: ' + item.credit + ' · ');
      const link = document.createElement('a');
      link.href = item.source;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Автор и лицензия';
      credit.append(link);
    } else {
      credit.textContent = 'Видео из учебного API Яндекс Практикума.';
    }
  }
  function selectItem(item) {
    videoContainer.querySelector('.error')?.remove();
    const src = item.videoUrl || normalizePath(item.video?.url);
    player.pause();
    player.onerror = null;
    player.src = src;
    player.poster = posterFor(item);
    player.load();
    setCredit(item);
    cardsList.querySelectorAll('.content__card-link').forEach(el => {
      el.classList.toggle('content__card-link_current', el.dataset.videoId === String(item.id));
    });
    player.onerror = () => {
      credit.replaceChildren();
      credit.append('Не удалось загрузить видео с внешнего источника. ');
      if (item.source) {
        const link = document.createElement('a');
        link.href = item.source;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Открыть оригинал на Wikimedia Commons';
        credit.append(link);
      }
    };
  }
  function render(items) {
    currentItems = items;
    if (!items.length) {
      showError('По выбранным фильтрам видео не найдены');
      return;
    }
    items.forEach(addCard);
    selectItem(items[0]);
    cardsContainer.classList.add('custom-scrollbar');
  }
  function addMoreButton() {
    if (mode !== 'api' || page >= pageCount) return;
    const button = document.createElement('button');
    button.className = 'button more-button';
    button.textContent = 'Показать ещё';
    cardsContainer.append(button);
    button.addEventListener('click', async () => {
      button.disabled = true;
      button.textContent = 'Загрузка...';
      try {
        const data = await loadApi(currentFilter, page + 1);
        page += 1;
        pageCount = data.pagination?.pageCount || page;
        data.results.forEach(item => { currentItems.push(item); addCard(item); });
        button.remove();
        addMoreButton();
      } catch (e) {
        button.disabled = false;
        button.textContent = 'Повторить загрузку';
      }
    });
  }
  async function search() {
    const id = ++requestId;
    currentFilter = collectFilters();
    clearDisplay();
    notice.textContent = 'Загрузка видео...';
    if (mode === 'api') {
      try {
        const data = await loadApi(currentFilter, 1);
        if (id !== requestId) return;
        page = data.pagination?.page || 1;
        pageCount = data.pagination?.pageCount || 1;
        showNotice();
        render(data.results);
        addMoreButton();
        return;
      } catch (error) {
        if (id !== requestId) return;
        mode = 'demo';
        console.warn('Недоступен учебный API; включены демо-данные:', error);
      }
    }
    showNotice();
    render(matchingDemo(currentFilter));
  }
  form.addEventListener('submit', e => { e.preventDefault(); search(); });
  search();
})();
