// The editor keeps one crop per panel and one in-memory library per session.
const byId = id => document.getElementById(id);
const cover = byId('cover');
const overlay = byId('selection');
const stage = byId('stage');
const status = byId('status');
const picker = byId('photo');
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const freshCrop = photo => ({ photo, zoom: 1, x: 0, y: 0 });
const state = {
  photos: [], panels: PANEL_NAMES.map(() => freshCrop(0)), active: 0,
  format: 'wide', grade: 'sunset', caption: '', eyebrow: '', edition: '', showSelection: false,
};
let photoRequest = 0;
let frame = 0;
let pointer = null;

function fitPreview() {
  const { width, height } = cover;
  const scale = Math.max(0, Math.min((stage.clientWidth - 32) / width, (stage.clientHeight - 32) / height));
  const mat = byId('mat');
  mat.style.width = `${width * scale}px`;
  mat.style.height = `${height * scale}px`;
}

function renderSelection() {
  const ctx = overlay.getContext('2d');
  ctx.clearRect(0,0,cover.width,cover.height);
  if (!state.showSelection) return;
  const points = panelPoints(state.format,cover.width,cover.height,state.active);
  panelPath(ctx,points);
  ctx.strokeStyle = '#fff0c7db';
  ctx.lineWidth = 5;
  ctx.setLineDash([10,8]);
  ctx.stroke();
}

function render() {
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  drawCover(cover,state);
  renderSelection();
}

function queueRender() {
  if (!frame) frame = requestAnimationFrame(render);
}

function setFormat(format) {
  state.format = format;
  const { width, height } = FORMATS[format];
  cover.width = overlay.width = width;
  cover.height = overlay.height = height;
  byId('dimensions').textContent = `${width} × ${height} PX`;
  document.querySelectorAll('[data-format]').forEach(button => button.setAttribute('aria-pressed',button.dataset.format === format));
  fitPreview();
  queueRender();
}

function setGrade(grade) {
  state.grade = grade;
  document.querySelectorAll('[data-grade]').forEach(button => button.setAttribute('aria-pressed',button.dataset.grade === grade));
  queueRender();
}

const panelButtons = PANEL_NAMES.map((name,index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'panel';
  button.setAttribute('aria-label',`${name} panel`);
  const thumb = document.createElement('canvas');
  thumb.width = 72;
  thumb.height = 52;
  thumb.setAttribute('aria-hidden','true');
  const label = document.createElement('span');
  label.textContent = name;
  button.append(thumb,label);
  button.addEventListener('click',() => selectPanel(index));
  byId('panels').append(button);
  return {button,thumb};
});

function drawThumbnails() {
  panelButtons.forEach(({thumb}, index) => {
    const ctx = thumb.getContext('2d');
    ctx.fillStyle = '#312239';
    ctx.fillRect(0,0,thumb.width,thumb.height);
    const image = state.photos[state.panels[index].photo]?.image;
    if (!image) return;
    const fit = photoFit(image,thumb,1);
    ctx.drawImage(image,-fit.dx,-fit.dy,fit.width,fit.height);
  });
}

function syncCrop() {
  const crop = state.panels[state.active];
  byId('source').value = String(crop.photo);
  byId('zoom').value = crop.zoom;
  byId('pan-x').value = crop.x;
  byId('pan-y').value = crop.y;
  byId('zoom-value').value = `${Math.round(crop.zoom * 100)}%`;
}

function selectPanel(index, show = true) {
  state.active = index;
  state.showSelection = show;
  byId('crop-title').textContent = `${PANEL_NAMES[index]} crop`;
  panelButtons.forEach(({button}, i) => button.setAttribute('aria-pressed',i === index));
  syncCrop();
  renderSelection();
}

function refreshLibrary() {
  byId('source').replaceChildren(...state.photos.map(({name}, index) => new Option(name,String(index))));
  syncCrop();
  drawThumbnails();
  queueRender();
}

async function loadImage(url) {
  const image = new Image();
  image.src = url;
  await image.decode();
  return image;
}

async function loadLocal(file) {
  const url = URL.createObjectURL(file);
  try {
    return { image: await loadImage(url), name: file.name, demo: false };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function addFiles(files) {
  if (!files.length) return;
  const ticket = ++photoRequest;
  status.textContent = 'Opening photos…';
  const results = await Promise.allSettled(Array.from(files,loadLocal));
  if (ticket !== photoRequest) return;
  const good = results.filter(result => result.status === 'fulfilled').map(result => result.value);
  const failed = results.length - good.length;
  if (!good.length) {
    status.textContent = 'Couldn’t open these images. Try JPEG, PNG, or WebP.';
    return;
  }
  const firstUpload = !state.photos.some(photo => !photo.demo);
  if (firstUpload) state.photos = [];
  const start = state.photos.length;
  state.photos.push(...good);
  if (firstUpload || good.length > 1) {
    state.panels = PANEL_NAMES.map((_, index) => freshCrop(start + index % good.length));
  } else {
    state.panels[state.active] = freshCrop(start);
  }
  state.showSelection = false;
  refreshLibrary();
  status.textContent = `${good.length} ${good.length === 1 ? 'photo' : 'photos'} added${failed ? ` · ${failed} couldn’t open` : ''}.`;
}

async function loadDemo() {
  const ticket = ++photoRequest;
  status.textContent = 'Opening demo…';
  try {
    const [boulevard,pier] = await Promise.all([loadImage(DEMO_IMAGES.boulevard),loadImage(DEMO_IMAGES.pier)]);
    if (ticket !== photoRequest) return;
    state.photos = [
      {name:'Sunset roadster', image:drawRoadster(), demo:true},
      {name:'Boulevard', image:boulevard, demo:true},
      {name:'Ocean pier', image:pier, demo:true},
    ];
    state.panels = [0,1,2,2,1].map(freshCrop);
    state.panels[1].x = -.52;
    state.panels[4].x = .66;
    state.panels[3].x = -.58;
    selectPanel(0,false);
    refreshLibrary();
    status.textContent = 'Demo loaded. Add your photos to make it yours.';
  } catch {
    if (ticket === photoRequest) status.textContent = 'Couldn’t load the demo. Add a local photo to start.';
  }
}

function posterPosition(event) {
  const rect = cover.getBoundingClientRect();
  return { x:(event.clientX - rect.left) * cover.width / rect.width, y:(event.clientY - rect.top) * cover.height / rect.height };
}

cover.addEventListener('pointerdown',event => {
  if (event.button !== 0 || pointer) return;
  const {x,y} = posterPosition(event);
  const ctx = overlay.getContext('2d');
  const index = state.panels.findIndex((_,i) => {
    panelPath(ctx,panelPoints(state.format,cover.width,cover.height,i));
    return ctx.isPointInPath(x,y);
  });
  if (index < 0) return;
  selectPanel(index);
  const crop = state.panels[index];
  const image = state.photos[crop.photo]?.image;
  if (!image) return;
  const bounds = panelBounds(panelPoints(state.format,cover.width,cover.height,index));
  pointer = { id:event.pointerId, x, y, crop, initialX:crop.x, initialY:crop.y, fit:photoFit(image,bounds,crop.zoom) };
  cover.setPointerCapture(event.pointerId);
  cover.classList.add('dragging');
});
cover.addEventListener('pointermove',event => {
  if (pointer?.id !== event.pointerId) return;
  const {x,y} = posterPosition(event);
  const {crop,fit} = pointer;
  if (fit.dx > 1) crop.x = clamp(pointer.initialX + (x - pointer.x) / fit.dx,-1,1);
  if (fit.dy > 1) crop.y = clamp(pointer.initialY + (y - pointer.y) / fit.dy,-1,1);
  syncCrop();
  queueRender();
});
cover.addEventListener('lostpointercapture',() => {
  pointer = null;
  cover.classList.remove('dragging');
});

for (const [id,key] of [['zoom','zoom'],['pan-x','x'],['pan-y','y']]) {
  byId(id).addEventListener('input',event => {
    state.panels[state.active][key] = event.target.valueAsNumber;
    syncCrop();
    queueRender();
  });
}
byId('reset').addEventListener('click',() => {
  const crop = state.panels[state.active];
  state.panels[state.active] = freshCrop(crop.photo);
  syncCrop();
  queueRender();
});
byId('source').addEventListener('change',event => {
  state.panels[state.active] = freshCrop(Number(event.target.value));
  syncCrop();
  drawThumbnails();
  queueRender();
});
for (const id of ['caption','eyebrow','edition']) {
  state[id] = byId(id).value;
  byId(id).addEventListener('input',event => {
    state[id] = event.target.value;
    queueRender();
  });
}
for (const button of document.querySelectorAll('[data-format]')) button.addEventListener('click',() => setFormat(button.dataset.format));
for (const button of document.querySelectorAll('[data-grade]')) button.addEventListener('click',() => setGrade(button.dataset.grade));
byId('add').addEventListener('click',() => picker.click());
picker.addEventListener('change',() => {
  addFiles(Array.from(picker.files));
  picker.value = '';
});
byId('demo').addEventListener('click',loadDemo);

let dropDepth = 0;
window.addEventListener('dragenter',event => {
  if (!event.dataTransfer.types.includes('Files')) return;
  if (++dropDepth === 1) document.body.classList.add('is-dropping');
});
window.addEventListener('dragleave',() => {
  if (--dropDepth <= 0) {
    dropDepth = 0;
    document.body.classList.remove('is-dropping');
  }
});
window.addEventListener('dragover',event => {
  if (!event.dataTransfer.types.includes('Files')) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
});
window.addEventListener('drop',event => {
  if (!event.dataTransfer.files.length) return;
  event.preventDefault();
  dropDepth = 0;
  document.body.classList.remove('is-dropping');
  addFiles(Array.from(event.dataTransfer.files));
});

const exportButton = byId('export');
const letteringReady = Promise.all([document.fonts.load('100px Display'),document.fonts.load('16px Mono')]);
exportButton.addEventListener('click',async () => {
  exportButton.disabled = true;
  try {
    await letteringReady;
    render();
    const filename = `afterglow-${cover.width}x${cover.height}.png`;
    const blob = await new Promise(resolve => cover.toBlob(resolve,'image/png'));
    if (!blob) throw new Error('PNG encoding failed');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url),10000);
    status.textContent = `Exported ${filename}`;
  } catch {
    status.textContent = 'Couldn’t export this cover. Please try again.';
  } finally {
    exportButton.disabled = false;
  }
});
new ResizeObserver(fitPreview).observe(stage);
selectPanel(0,false);
setFormat('wide');
letteringReady.then(queueRender).catch(() => { status.textContent = 'Couldn’t load the local lettering.'; });
loadDemo();
