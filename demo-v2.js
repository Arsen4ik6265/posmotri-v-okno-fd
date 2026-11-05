/*
  «Посмотри в окно» — автономная демонстрационная версия.
  Исходная работа Яндекс Практикума: scripts/script.js.
  Иллюстративные видеофрагменты созданы для демонстрации UX; это не настоящая съёмка городов.
  Весь видеоряд помещён в один локальный MP4: 8 городов × 3 времени суток × 3 секунды.
  Кадры идут в порядке списка CITIES, внутри города: morning, afternoon, night.
*/
(() => {
  'use strict';

  const CITIES = [
    { id: 'moscow', name: 'Москва', country: 'Россия' },
    { id: 'spb', name: 'Санкт-Петербург', country: 'Россия' },
    { id: 'kazan', name: 'Казань', country: 'Россия' },
    { id: 'sochi', name: 'Сочи', country: 'Россия' },
    { id: 'tokyo', name: 'Токио', country: 'Япония' },
    { id: 'nyc', name: 'Нью-Йорк', country: 'США' },
    { id: 'london', name: 'Лондон', country: 'Великобритания' },
    { id: 'paris', name: 'Париж', country: 'Франция' }
  ];
  const TIMES = [
    { id: 'morning', name: 'Утро' },
    { id: 'afternoon', name: 'День' },
    { id: 'night', name: 'Ночь' }
  ];
  const CLIP_SECONDS = 3;
  const VIDEO_SRC = './city-scenes.mp4';
  const PREVIEW_SRC = './city-previews.jpg';

  const form = document.querySelector('.search-form');
  const cityInput = form?.querySelector('[name="city"]');
  const timeInputs = [...(form?.querySelectorAll('[name="time"]') || [])];
  const list = document.querySelector('.content__list');
  const cardsContainer = document.querySelector('.content__list-container');
  const videoContainer = document.querySelector('.result__video-container');
  const video = document.querySelector('.result__video');
  const cardTemplate = document.querySelector('.cards-list-item-template');
  const resultSection = document.querySelector('.result');
  if (!form || !cityInput || timeInputs.length !== 3 || !list || !videoContainer || !video || !cardTemplate || !resultSection) {
    console.error('Не найдены необходимые элементы исходной страницы');
    return;
  }

  const style = document.createElement('style');
  style.textContent = `
    .demo-notice {font: 14px/1.5 system-ui,sans-serif;color:#e8e5ee;background:#30313e;
      padding:12px 16px;border-left:4px solid #d9b583;margin:0 0 18px}
    .demo-current {font:600 16px/1.5 system-ui,sans-serif;color:#fff;margin:12px 0 5px}
    .demo-secondary {font:13px/1.45 system-ui,sans-serif;color:#c8c5c6;margin:0 0 16px}
    .demo-controls {display:flex;align-items:center;gap:13px;margin:8px 0 12px;flex-wrap:wrap}
    .demo-play {border:1px solid #fafafa;border-radius:8px;background:#fff;color:#1b1919;
      font:700 15px/1 system-ui,sans-serif;padding:13px 18px;cursor:pointer}
    .demo-progress {width:140px;height:5px;background:#67656b;border-radius:10px;overflow:hidden}
    .demo-progress-fill {width:0;height:100%;background:#eed3ab;transition:width .08s linear}
    .demo-tip {color:#d9d8dc;font:12px/1.4 system-ui,sans-serif}
    .demo-select {width:100%;max-width:285px;min-height:37px;padding:5px 28px 5px 8px;
      border:1px solid #eee;border-radius:4px;appearance:auto;color:#fff;background:#242229}
    .search-form__pseudo-checkbox,.search-form__pseudo-checkbox::after{border-radius:50%}
    .demo-thumb {display:block;width:194px;height:103px;flex:0 0 194px;
      background-image:url('${PREVIEW_SRC}');background-size:300% 800%;background-repeat:no-repeat}
    .demo-active {outline:2px solid #f3d5a8;outline-offset:2px;border-radius:3px}
    .demo-badge {display:block;margin-top:5px;font:12px/1.3 system-ui,sans-serif;color:#e9d0a8}
    .content__list {gap:16px}
    .result__video-container {background:#171a24;overflow:hidden}
    .result__video {background:#171a24;object-fit:contain}
    .content__video-card-description {line-height:1.3}
    @media (max-width:1199px) {
      html,body.page {width:100%;min-width:0;min-height:100%;height:auto;margin:0}
      body.page {display:block;padding:16px}
      .content {width:100%;max-width:830px;grid-template-columns:minmax(0,1fr);
        grid-template-areas:'result' 'details';gap:22px;place-items:stretch}
      .result,.result__video-container,.content__details {width:100%;min-width:0}
      .result__video-container {height:auto;aspect-ratio:16/9}
      .result__video {width:100%;height:100%}
      .content__details {overflow:hidden;gap:18px}
      .title {font-size:clamp(42px,11vw,75px)}
      .search-form {display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end}
      .search-form__fieldset {min-width:0}
      .search-form__checkbox-list {gap:12px;flex-wrap:wrap}
      .search-form__submit-button {width:100%;min-width:140px;max-width:280px}
      .content__list-container {height:auto;max-height:none;overflow:visible}
      .demo-thumb {width:116px;height:64px;flex-basis:116px}
      .content__video-card-title {font-size:clamp(18px,5vw,27px)}
      .content__video-card-description {font-size:13px}
    }
  `;
  document.head.append(style);

  const notice = document.createElement('p');
  notice.className = 'demo-notice';
  notice.textContent = 'Демо-версия без учебного API: 8 городов и по 3 анимированные видеосцены (утро, день, ночь). Это стилизованные иллюстрации, не реальная съёмка улиц.';
  resultSection.prepend(notice);

  // Заменяем ручной ввод города на список.
  const citySelect = document.createElement('select');
  citySelect.className = 'search-form__textfield demo-select';
  citySelect.name = 'city';
  citySelect.setAttribute('aria-label', 'Выберите город');
  const empty = new Option('Все города', '');
  citySelect.add(empty);
  CITIES.forEach(c => citySelect.add(new Option(`${c.name} — ${c.country}`, c.id)));
  cityInput.replaceWith(citySelect);

  // Время суток выбирается одно: утро ИЛИ день ИЛИ ночь.
  timeInputs.forEach(input => {
    input.type = 'radio';
    input.name = 'time';
    input.checked = input.value === 'afternoon';
  });

  // Собственный плеер: нативная шкала для одного общего MP4 показывала бы все 72 с.
  video.removeAttribute('controls');
  video.controls = false;
  video.autoplay = false;
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.preload = 'metadata';
  video.src = VIDEO_SRC;
  video.load();

  const title = document.createElement('p');
  title.className = 'demo-current';
  const sub = document.createElement('p');
  sub.className = 'demo-secondary';
  const controls = document.createElement('div');
  controls.className = 'demo-controls';
  const playButton = document.createElement('button');
  playButton.type = 'button';
  playButton.className = 'demo-play';
  playButton.textContent = '▶ Смотреть видео';
  const progress = document.createElement('div');
  progress.className = 'demo-progress';
  progress.setAttribute('aria-hidden', 'true');
  const progressFill = document.createElement('div');
  progressFill.className = 'demo-progress-fill';
  progress.append(progressFill);
  const tip = document.createElement('span');
  tip.className = 'demo-tip';
  tip.textContent = 'Фрагмент 3 сек. · Без звука';
  controls.append(playButton, progress, tip);
  videoContainer.after(title,sub,controls);

  let selectedCity = CITIES[0].id;
  let selectedTime = 'afternoon';
  let activeClipStart = 0;
  let pendingSeek = null;
  let fileLoaded = false;
  let hasError = false;

  function clipStart(cityId,timeId) {
    const ci=CITIES.findIndex(c=>c.id===cityId);
    const ti=TIMES.findIndex(t=>t.id===timeId);
    return ((ci*TIMES.length)+ti)*CLIP_SECONDS;
  }
  function clipPoster(cityId,timeId) {
    const ci=CITIES.findIndex(c=>c.id===cityId);
    const ti=TIMES.findIndex(t=>t.id===timeId);
    // CSS-спрайт позволяет показывать превью без 24 отдельных загрузок.
    return {x:ti*50,y:ci*100/(CITIES.length-1)};
  }
  function setThumb(el,cityId,timeId) {
    const bg=clipPoster(cityId,timeId);
    el.style.backgroundPosition=`${bg.x}% ${bg.y}%`;
  }
  function selectedTimeFromForm() {
    return form.querySelector('[name="time"]:checked')?.value || 'afternoon';
  }
  function uiForSelected() {
    const city=CITIES.find(c=>c.id===selectedCity);
    const time=TIMES.find(t=>t.id===selectedTime);
    title.textContent=`${city.name} · ${time.name}`;
    sub.textContent=`${city.country}. Демонстрационная анимация города в выбранное время суток.`;
    const preview=clipPoster(selectedCity,selectedTime);
    video.style.backgroundImage=`url('${PREVIEW_SRC}')`;
    video.style.backgroundSize='300% 800%';
    video.style.backgroundPosition=`${preview.x}% ${preview.y}%`;
    video.style.backgroundRepeat='no-repeat';
  }
  function seekClip(shouldPlay=false) {
    activeClipStart=clipStart(selectedCity,selectedTime);
    pendingSeek=activeClipStart+0.04;
    progressFill.style.width='0%';
    if (fileLoaded) {
      try {video.currentTime=pendingSeek;pendingSeek=null;} catch(e){console.warn('Не получилось перейти к видеосцене:',e);}
    }
    if (shouldPlay && !hasError) {
      const promise=video.play();
      if(promise?.catch)promise.catch(()=>{playButton.textContent='▶ Смотреть видео';});
    }
  }
  function selectClip(cityId,timeId,keepPlaying=false) {
    selectedCity=cityId;
    selectedTime=timeId;
    uiForSelected();
    seekClip(keepPlaying);
    renderList();
  }
  function renderList() {
    list.replaceChildren();
    cardsContainer.querySelector('.more-button')?.remove();
    const filtered=CITIES.filter(c=>!citySelect.value || c.id===citySelect.value);
    filtered.forEach(city=>{
      const node=cardTemplate.content.cloneNode(true);
      const link=node.querySelector('.content__card-link');
      const article=node.querySelector('.content__video-card');
      const titleNode=node.querySelector('.content__video-card-title');
      const descNode=node.querySelector('.content__video-card-description');
      const img=node.querySelector('.content__video-card-thumbnail');
      const thumb=document.createElement('span');
      thumb.className='demo-thumb';
      thumb.setAttribute('role','img');
      thumb.setAttribute('aria-label',`Превью: ${city.name}, ${TIMES.find(t=>t.id===selectedTime).name}`);
      setThumb(thumb,city.id,selectedTime);
      img.replaceWith(thumb);
      titleNode.textContent=city.name;
      descNode.textContent=city.country;
      const badge=document.createElement('small');
      badge.className='demo-badge';
      badge.textContent=TIMES.find(t=>t.id===selectedTime).name;
      descNode.after(badge);
      const isActive=selectedCity===city.id;
      link.classList.toggle('demo-active',isActive);
      link.classList.toggle('content__card-link_current',isActive);
      link.addEventListener('click',e=>{
        e.preventDefault();
        const keepPlaying=!video.paused;
        selectedCity=city.id;
        uiForSelected();
        seekClip(keepPlaying);
        renderList();
      });
      list.append(node);
    });
  }
  function applyFilters() {
    selectedTime=selectedTimeFromForm();
    if(citySelect.value)selectedCity=citySelect.value;
    const keepPlaying=!video.paused;
    uiForSelected();
    seekClip(keepPlaying);
    renderList();
  }
  form.addEventListener('submit', e=>{e.preventDefault();
  playButton.addEventListener('click',()=>{
    if(hasError){return;}
    if(!fileLoaded){tip.textContent='Загружается видеофайл…';return;}
    if(video.paused){
      if(video.currentTime<activeClipStart-0.05||video.currentTime>=activeClipStart+CLIP_SECONDS-0.1)seekClip(false);
      const promise=video.play();
      if(promise?.catch)promise.catch(()=>{tip.textContent='Не удалось начать воспроизведение';});
    } else video.pause();
  });
  video.addEventListener('loadedmetadata',()=>{
    fileLoaded=true;
    if(pendingSeek!=null){video.currentTime=pendingSeek;pendingSeek=null;}
    tip.textContent='Фрагмент 3 сек. · Без звука';
  });
  video.addEventListener('error',()=>{
    hasError=true;
    playButton.disabled=true;
    playButton.textContent='Не удалось загрузить видео';
    tip.textContent='Проверьте файл city-scenes.mp4 в корне репозитория';
  });
  video.addEventListener('play',()=>{playButton.textContent='Ⅱ Пауза';});
  video.addEventListener('pause',()=>{playButton.textContent='▶ Смотреть видео';});
  video.addEventListener('timeupdate',()=>{
    if(!fileLoaded)return;
    const elapsed=video.currentTime-activeClipStart;
    progressFill.style.width=`${Math.max(0,Math.min(100,(elapsed/CLIP_SECONDS)*100))}%`;
    if(elapsed>=CLIP_SECONDS-0.12){
      try {video.currentTime=activeClipStart+0.04;} catch(e) { video.pause(); }
    }
  });
  video.addEventListener('ended',()=>{
    video.currentTime=activeClipStart+0.04;
    video.pause();
  });

  uiForSelected();
  renderList();
  seekClip(false);
})();
