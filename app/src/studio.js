const canvas = document.querySelector('#coverCanvas');
const ctx = canvas.getContext('2d');
const photoInput = document.querySelector('#photoInput');
const photoShelf = document.querySelector('#photoShelf');
const panelList = document.querySelector('#panelList');
const captionInput = document.querySelector('#captionInput');
const captionCount = document.querySelector('#captionCount');
const formatSelect = document.querySelector('#formatSelect');
const sizeLabel = document.querySelector('#sizeLabel');
const previewSize = document.querySelector('#previewSize');
const toast = document.querySelector('#toast');
const emptyState = document.querySelector('#emptyState');

const formats = { portrait: [1080, 1350, 'Portrait'], square: [1080, 1080, 'Square'], landscape: [1920, 1080, 'Landscape'] };
const palette = {
  sunset: { wash: 'rgba(246,129,91,.24)', accent: '#f2bd54', ink: '#fff4dc', dark: '#222a29', blush: '#db684f' },
  neon: { wash: 'rgba(65,181,168,.18)', accent: '#b7f09b', ink: '#efffe7', dark: '#172c32', blush: '#ed687c' },
  mono: { wash: 'rgba(220,220,211,.10)', accent: '#eee9d8', ink: '#f7f3e8', dark: '#202524', blush: '#a7aaa2' }
};
const state = { photos: [], panels: [0, 1, 0], selectedPanel: 0, title: 'VICE AFTER DARK', grade: 'sunset', font: 'display', format: 'portrait', offsets: [{x:0,y:0},{x:0,y:0},{x:0,y:0}] };

function notify(message) { toast.textContent = message; toast.classList.add('show'); window.clearTimeout(notify.timer); notify.timer = window.setTimeout(() => toast.classList.remove('show'), 2200); }
function makePhoto(src, name) { const image = new Image(); image.src = src; image.onload = () => draw(); return { image, name }; }
function fallbackPhotos() { return ['samples/boulevard.jpg', 'samples/pier.jpg'].map((src, i) => makePhoto(src, i === 0 ? 'Boulevard' : 'Pier')); }
state.photos = fallbackPhotos();

function renderShelf() {
  photoShelf.innerHTML = '';
  state.photos.forEach((photo, i) => { const img = document.createElement('img'); img.className = `photo-chip ${state.panels[state.selectedPanel] === i ? 'selected' : ''}`; img.src = photo.image.src; img.alt = photo.name; img.title = `Use ${photo.name}`; img.onclick = () => { state.panels[state.selectedPanel] = i; renderPanels(); renderShelf(); draw(); }; photoShelf.append(img); });
}
function renderPanels() {
  panelList.replaceChildren();
  state.panels.forEach((photoIndex, index) => {
    const row = document.createElement('div');
    row.className = `panel-row ${state.selectedPanel === index ? 'selected' : ''}`;
    const thumb = document.createElement('img');
    thumb.className = 'panel-thumb'; thumb.alt = ''; thumb.src = state.photos[photoIndex].image.src;
    const copy = document.createElement('div'); copy.className = 'panel-copy';
    const name = document.createElement('b'); name.textContent = `FRAME ${String(index+1).padStart(2,'0')}`;
    const subtitle = document.createElement('small'); subtitle.textContent = index===0 ? 'The opening' : 'After hours';
    copy.append(name,subtitle);
    const select = document.createElement('select'); select.setAttribute('aria-label',`Photo for frame ${index+1}`);
    state.photos.forEach((photo,value) => select.add(new Option(photo.name,String(value),false,value===photoIndex)));
    select.onclick = event => event.stopPropagation();
    select.onchange = () => {state.panels[index]=Number(select.value);state.selectedPanel=index;renderPanels();renderShelf();syncFraming();draw();};
    const remove = document.createElement('button'); remove.textContent = '−';
    remove.setAttribute('aria-label',`Remove frame ${index+1}`); remove.disabled = state.panels.length===1;
    remove.onclick = event => {event.stopPropagation();state.panels.splice(index,1);state.offsets.splice(index,1);state.selectedPanel=Math.min(state.selectedPanel,state.panels.length-1);renderPanels();renderShelf();syncFraming();draw();};
    row.onclick = () => {state.selectedPanel=index;renderPanels();renderShelf();syncFraming();draw();};
    row.append(thumb,copy,select,remove); panelList.append(row);
  });
  document.querySelector('#panelCount').textContent = `${state.panels.length} frames`;
  document.querySelectorAll('#addPanel,#quickAdd').forEach(button => button.disabled=state.panels.length>=5);
}
function imageCover(image, box, offset) {
  const { x, y, w, h } = box;
  if (!image?.complete || !image.naturalWidth) {
    ctx.fillStyle = '#343b38'; ctx.fillRect(x, y, w, h); return;
  }
  const coverScale = Math.max(w / image.naturalWidth, h / image.naturalHeight) * (offset.zoom || 1);
  const iw = image.naturalWidth * coverScale, ih = image.naturalHeight * coverScale;
  const px = Math.max(x + w - iw, Math.min(x, x + (w - iw) / 2 + offset.x * w));
  const py = Math.max(y + h - ih, Math.min(y, y + (h - ih) / 2 + offset.y * h));
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.drawImage(image, px, py, iw, ih); ctx.restore();
}
function fitCanvas() {
  const [w, h] = formats[state.format];
  const ratio = state.exporting ? 1 : Math.min(1, 900 / w, 900 / h);
  canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio);
}
function panelLayout(w, h, gap, count) {
  const top = Math.max(h * .055, w * .048), bottom = h * .715, height = bottom - top;
  const wide = w - gap * 2, half = (wide - gap) / 2;
  const cell = (x, y, cw, ch) => ({ x, y, w: cw, h: ch });
  const full = cell(gap, top, wide, height);
  if (count === 1) return [full];
  if (count === 2) return [cell(gap, top, half, height), cell(gap * 2 + half, top, half, height)];
  if (count === 3) {
    const heroWidth = (wide - gap) * .58;
    const detailX = gap * 2 + heroWidth;
    const detailWidth = wide - heroWidth - gap;
    return [cell(gap, top, heroWidth, height), cell(detailX, top, detailWidth, (height-gap)/2), cell(detailX, top+(height+gap)/2, detailWidth, (height-gap)/2)];
  }
  const rows = count === 4 ? 2 : 3;
  const rowHeight = (height - gap * (rows-1)) / rows;
  return Array.from({length:count}, (_, index) => {
    const lastWide = count === 5 && index === 4;
    return cell(index % 2 ? gap*2+half : gap, top+Math.floor(index/2)*(rowHeight+gap), lastWide ? wide : half, rowHeight);
  });
}
function draw() {
  fitCanvas();
  const w = canvas.width, h = canvas.height, p = palette[state.grade], scale = w / 1080;
  ctx.clearRect(0, 0, w, h); ctx.fillStyle = p.dark; ctx.fillRect(0, 0, w, h);
  const gap = Math.max(8, Math.round(13 * scale));
  const boxes = panelLayout(w, h, gap, state.panels.length);
  boxes.forEach((box, index) => {
    imageCover(state.photos[state.panels[index]]?.image, box, state.offsets[index] || { x: 0, y: 0 });
    const tint = ctx.createLinearGradient(box.x, box.y, box.x + box.w * .65, box.y + box.h);
    tint.addColorStop(0, p.wash); tint.addColorStop(1, 'rgba(22,25,28,.28)');
    ctx.fillStyle = tint; ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.strokeStyle = 'rgba(255,245,220,.30)'; ctx.lineWidth = Math.max(1, scale * 1.2);
    ctx.strokeRect(box.x + scale, box.y + scale, box.w - scale * 2, box.h - scale * 2);
    ctx.fillStyle = p.accent; ctx.font = `700 ${Math.round(10 * scale)}px Arial`;
    ctx.fillText(`0${index + 1}  /  ${index === 0 ? 'THE OPENING' : index === boxes.length - 1 ? 'LAST LIGHT' : 'AFTER HOURS'}`, box.x + 13 * scale, box.y + box.h - 15 * scale);
  });
  ctx.fillStyle = p.accent; ctx.fillRect(0, 0, w, Math.max(5, Math.round(9 * scale)));
  ctx.fillStyle = p.ink; ctx.font = `700 ${Math.round(12 * scale)}px Arial`;
  ctx.letterSpacing = `${2 * scale}px`;
  ctx.fillText('AFTERGLOW  /  ORIGINAL COVER SERIES', 30 * scale, 34 * scale);
  ctx.fillStyle = p.accent; ctx.textAlign = 'right'; ctx.fillText('VOL. 01', w - 30 * scale, 34 * scale); ctx.textAlign = 'left';
  const title = state.title.trim().toUpperCase() || 'YOUR TITLE';
  const words = title.split(/\s+/);
  const split = Math.ceil(words.length/2);
  const lines = state.format !== 'landscape' && words.length>1 ? [words.slice(0,split).join(' '),words.slice(split).join(' ')] : [title];
  ctx.save();
  ctx.translate(w*.035,h*.735);
  ctx.rotate(-.025);
  ctx.letterSpacing = `${-1.2*scale}px`;
  const lineHeight = h * (lines.length===2 ? .096 : .15);
  ctx.font = `900 ${Math.round(lineHeight*(state.font==='condensed'?1.15:1))}px Afterglow`;
  ctx.textBaseline = 'top'; ctx.lineJoin='round';
  lines.forEach((line,index) => {
    const maxWidth = w*.92;
    ctx.lineWidth = 6*scale; ctx.strokeStyle='#101d23';
    ctx.strokeText(line,3*scale,index*lineHeight+4*scale,maxWidth);
    ctx.fillStyle = index===lines.length-1 ? p.accent : p.ink;
    ctx.fillText(line,0,index*lineHeight,maxWidth);
  });
  ctx.restore();
  ctx.fillStyle = p.blush; ctx.fillRect(30 * scale, h - 53 * scale, 114 * scale, 23 * scale);
  ctx.letterSpacing = '0px';
  ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(9 * scale)}px Arial`;
  ctx.fillText('NO FILTER / NO RULES', 38 * scale, h - 37 * scale);
  ctx.fillStyle = p.ink; ctx.textAlign = 'right'; ctx.fillText('MIAMI  ·  FL', w - 30 * scale, h - 37 * scale); ctx.textAlign = 'left';
}
function addPanels() {
  if (state.panels.length>=5) return;
  state.panels.push(state.panels[state.selectedPanel]);
  state.offsets.push({x:0,y:0,zoom:1});
  state.selectedPanel=state.panels.length-1;
  renderPanels(); renderShelf(); syncFraming(); draw(); notify('New story frame added');
}
photoInput.onchange = async event => {
  const files = [...event.target.files].slice(0,5);
  let loaded = 0;
  for (const file of files) {
    const localUrl = URL.createObjectURL(file);
    const image = new Image(); image.src = localUrl;
    try {
      await image.decode();
      state.photos.push({image,name:file.name.replace(/\.[^.]+$/,'').slice(0,24)});
      state.panels[(state.selectedPanel+loaded)%state.panels.length] = state.photos.length-1;
      loaded++;
    } catch { URL.revokeObjectURL(localUrl); }
  }
  event.target.value = '';
  renderShelf(); renderPanels(); draw();
  notify(loaded ? `${loaded} local photo${loaded>1?'s':''} added to the cover` : 'Choose a readable image such as JPG, PNG or WebP');
};
captionInput.oninput = e => { state.title = e.target.value || 'YOUR TITLE'; captionCount.textContent = `${e.target.value.length} / 24`; draw(); };
formatSelect.onchange = e => { state.format = e.target.value; const [w,h,label] = formats[state.format]; sizeLabel.textContent = `${w} × ${h} · ${label}`; previewSize.textContent = `${w} × ${h}`; draw(); };
document.querySelectorAll('[data-grade]').forEach(button => button.onclick = () => { state.grade = button.dataset.grade; document.querySelectorAll('[data-grade]').forEach(b => b.classList.toggle('selected', b === button)); draw(); });
document.querySelectorAll('[data-font]').forEach(button => button.onclick = () => { state.font = button.dataset.font; document.querySelectorAll('[data-font]').forEach(b => b.classList.toggle('selected', b === button)); draw(); });
document.querySelectorAll('#addPanel,#quickAdd').forEach(button => button.onclick=addPanels);
document.querySelector('#resetButton').onclick = () => {state.offsets=state.panels.map(()=>({x:0,y:0,zoom:1}));syncFraming();draw();notify('All photo crops reset');};
document.querySelector('#fitButton').onclick = () => canvas.scrollIntoView({behavior:'smooth',block:'center'});
async function exportCover() {
  if (state.exporting) return;
  await document.fonts.ready;
  const format = state.format, [width,height] = formats[format];
  const buttons = [document.querySelector('#exportButton'), document.querySelector('#exportTop')];
  buttons.forEach(button => button.disabled = true);
  try {
    state.exporting = true;
    draw();
    const png = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!png) throw new Error('PNG encoding failed');
    const downloadUrl = URL.createObjectURL(png);
    const anchor = document.createElement('a');
    anchor.download = `afterglow-${format}.png`;
    anchor.href = downloadUrl;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 10000);
    notify(`Exported ${width} × ${height} PNG`);
  } catch {
    notify('Export could not finish. Please try again.');
  } finally {
    state.exporting = false;
    buttons.forEach(button => button.disabled = false);
    draw();
  }
}
document.querySelector('#exportButton').onclick = exportCover; document.querySelector('#exportTop').onclick = exportCover;
let drag = null;
canvas.style.touchAction = 'none';
canvas.addEventListener('pointerdown', event => {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX-rect.left) * canvas.width / rect.width;
  const y = (event.clientY-rect.top) * canvas.height / rect.height;
  const boxes = panelLayout(canvas.width, canvas.height, Math.max(8,Math.round(13*canvas.width/1080)), state.panels.length);
  const index = boxes.findIndex(box => x>=box.x && x<=box.x+box.w && y>=box.y && y<=box.y+box.h);
  if (index < 0) return;
  state.selectedPanel = index;
  drag = {x:event.clientX,y:event.clientY,index,box:boxes[index]};
  canvas.setPointerCapture(event.pointerId);
  renderPanels(); renderShelf(); syncFraming();
});
canvas.addEventListener('pointermove', event => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const offset = state.offsets[drag.index] ||= {x:0,y:0,zoom:1};
  offset.x = Math.max(-2,Math.min(2,offset.x+(event.clientX-drag.x)*canvas.width/rect.width/drag.box.w));
  offset.y = Math.max(-2,Math.min(2,offset.y+(event.clientY-drag.y)*canvas.height/rect.height/drag.box.h));
  drag.x=event.clientX; drag.y=event.clientY;
  draw();
});
['pointerup','pointercancel','lostpointercapture'].forEach(type => canvas.addEventListener(type, () => {drag=null;}));
function syncFraming() {
  document.querySelector('#zoomInput').value = state.offsets[state.selectedPanel]?.zoom || 1;
  document.querySelector('#framingLabel').textContent = `Frame ${state.selectedPanel+1} crop`;
}
document.querySelector('#zoomInput').oninput = event => {
  const offset = state.offsets[state.selectedPanel] ||= {x:0,y:0};
  offset.zoom = Number(event.target.value); draw();
};
document.querySelector('#centerPanel').onclick = () => {
  state.offsets[state.selectedPanel] = {x:0,y:0,zoom:1}; syncFraming(); draw();
};
panelList.addEventListener('click', syncFraming);
document.fonts.ready.then(draw);
renderShelf(); renderPanels(); captionCount.textContent = `${state.title.length} / 24`; draw();
