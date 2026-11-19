// Offline canvas renderer shared by the preview and the PNG export.
const FORMATS = {
  wide: { width: 1920, height: 1080 },
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
};
const PANEL_NAMES = ['Hero', 'Upper left', 'Upper right', 'Lower left', 'Lower right'];
const PANELS = {
  wide: [
    [[.294,0],[.748,0],[.681,1],[.215,1]],
    [[0,0],[.294,0],[.249,.572],[0,.437]],
    [[.748,0],[1,0],[1,.59],[.711,.452]],
    [[0,.437],[.249,.572],[.215,1],[0,1]],
    [[.711,.452],[1,.59],[1,1],[.681,1]],
  ],
  square: [
    [[0,.26],[1,.152],[1,.66],[0,.768]],
    [[0,0],[.512,0],[.425,.214],[0,.26]],
    [[.512,0],[1,0],[1,.152],[.425,.214]],
    [[0,.768],[.582,.705],[.489,1],[0,1]],
    [[.582,.705],[1,.66],[1,1],[.489,1]],
  ],
  portrait: [
    [[0,.262],[1,.15],[1,.662],[0,.782]],
    [[0,0],[.58,0],[.49,.207],[0,.262]],
    [[.58,0],[1,0],[1,.15],[.49,.207]],
    [[0,.782],[.562,.715],[.443,1],[0,1]],
    [[.562,.715],[1,.662],[1,1],[.443,1]],
  ],
};
const GRADES = {
  sunset: { ink: '#231026', light: '#fff7d9', low: '#ff946c', edge: '#ffbb8d', dark: '#a3375a', mid: '#ef699a', high: '#ffd19d' },
  neon: { ink: '#160e30', light: '#dfffee', low: '#7af7e6', edge: '#bdaaff', dark: '#6533c0', mid: '#df64c1', high: '#aef7df' },
  gold: { ink: '#241516', light: '#ffffe4', low: '#ffc067', edge: '#ffdd9b', dark: '#a4503e', mid: '#fba57a', high: '#ffe49a' },
};

function panelPath(ctx, points) {
  ctx.beginPath();
  for (const [index, [x,y]] of points.entries()) {
    if (index === 0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  }
  ctx.closePath();
}

function panelPoints(format, width, height, index) {
  return PANELS[format][index].map(([x,y]) => [x * width, y * height]);
}

function panelBounds(points) {
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  const left = Math.min(...xs), top = Math.min(...ys);
  return { left, top, width: Math.max(...xs) - left, height: Math.max(...ys) - top };
}

function photoFit(image, bounds, zoom) {
  const iw = image.naturalWidth || image.width;
  const ih = image.naturalHeight || image.height;
  const scale = Math.max(bounds.width / iw, bounds.height / ih) * zoom;
  const width = iw * scale, height = ih * scale;
  return { width, height, dx: Math.max(0, (width - bounds.width) / 2), dy: Math.max(0, (height - bounds.height) / 2) };
}

function addWash(ctx, bounds, color, index, hasPhoto) {
  const {left, top, width, height} = bounds;
  ctx.save();
  if (hasPhoto) {
    const tint = ctx.createLinearGradient(left, top, left + width * .58, top + height);
    tint.addColorStop(0, index === 2 || index === 3 ? color.mid : color.high);
    tint.addColorStop(.47, color.mid);
    tint.addColorStop(1, color.dark);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = .69;
    ctx.fillStyle = tint;
    ctx.fillRect(left, top, width, height);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = .34;
    const shade = ctx.createLinearGradient(left, top, left, top + height);
    shade.addColorStop(0, color.ink + '22');
    shade.addColorStop(.45, color.ink + '00');
    shade.addColorStop(1, color.ink + 'ee');
    ctx.fillStyle = shade;
  } else {
    const fill = ctx.createLinearGradient(left, top, left + width, top + height);
    fill.addColorStop(0, color.dark);
    fill.addColorStop(1, color.ink);
    ctx.fillStyle = fill;
  }
  ctx.fillRect(left, top, width, height);
  ctx.restore();
}

function paintPanel(ctx, points, panel, image, color, index) {
  const bounds = panelBounds(points);
  ctx.save();
  panelPath(ctx, points);
  ctx.clip();
  if (image) {
    const fit = photoFit(image, bounds, panel.zoom);
    ctx.save();
    ctx.filter = 'contrast(1.13) saturate(1.16)';
    ctx.drawImage(image, bounds.left - fit.dx + panel.x * fit.dx, bounds.top - fit.dy + panel.y * fit.dy, fit.width, fit.height);
    ctx.restore();
  }
  addWash(ctx, bounds, color, index, Boolean(image));
  ctx.restore();
}

let grainPattern;
function printGrain(ctx, width, height) {
  if (!grainPattern) {
    const tile = document.createElement('canvas');
    tile.width = tile.height = 180;
    const texture = tile.getContext('2d');
    let seed = 218533;
    for (let i = 0; i < 5700; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      texture.fillStyle = i % 3 === 0 ? '#ffecc5' : '#290f29';
      texture.fillRect(seed % 180, (seed >>> 10) % 180, i % 7 === 0 ? 2 : 1, 1);
    }
    grainPattern = ctx.createPattern(tile, 'repeat');
  }
  ctx.save();
  ctx.globalAlpha = .19;
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = grainPattern;
  ctx.fillRect(0,0,width,height);
  ctx.restore();
}

function textLines(text) {
  const explicit = text.trim().toUpperCase().split(/\n+/).map(line => line.trim()).filter(Boolean);
  if (explicit.length > 1) return explicit.length <= 3 ? explicit : [...explicit.slice(0,2), explicit.slice(2).join(' ')];
  const words = (explicit[0] || '').split(/\s+/);
  if (words.length < 2 || explicit[0].length < 15) return explicit;
  let split = 1;
  while (split < words.length - 1 && words.slice(0,split).join(' ').length < explicit[0].length * .45) split++;
  return [words.slice(0,split).join(' '), words.slice(split).join(' ')];
}

function headline(ctx, text, center, top, maxWidth, maxHeight, color) {
  const lines = textLines(text);
  if (!lines.length) return { top, bottom: top };
  const size = maxHeight / (1 + (lines.length - 1) * .69);
  ctx.save();
  ctx.font = `${size}px Display`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  for (const [index, line] of lines.entries()) {
    const measured = ctx.measureText(line).width;
    const rowWidth = maxWidth * (index === 0 ? 1 : .91);
    const scaleX = Math.min(rowWidth / measured, lines.length > 1 ? 1.3 : 1.12);
    const y = top + size * (.72 + index * .68);
    ctx.save();
    ctx.translate(center, y);
    ctx.scale(scaleX, 1);
    ctx.strokeStyle = color.ink;
    ctx.lineWidth = size * .122;
    ctx.strokeText(line, size * .04, size * .057);
    ctx.strokeStyle = color.dark;
    ctx.lineWidth = size * .065;
    ctx.strokeText(line, size * .02, size * .037);
    ctx.strokeStyle = color.ink;
    ctx.lineWidth = size * .048;
    ctx.strokeText(line, 0, 0);
    const fill = ctx.createLinearGradient(0,-size*.68,0,size*.025);
    fill.addColorStop(0,color.light);
    fill.addColorStop(.5,color.light);
    fill.addColorStop(1,color.low);
    ctx.fillStyle = fill;
    ctx.fillText(line,0,0);
    ctx.restore();
  }
  ctx.restore();
  return { top, bottom: top + size * (.76 + (lines.length - 1) * .68) };
}

function lozenge(ctx, text, x, y, limit, unit, color, light) {
  if (!text.trim()) return;
  ctx.save();
  ctx.font = `${unit * .022}px Mono`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.letterSpacing = `${unit * .004}px`;
  const str = text.trim().toUpperCase();
  const width = Math.min(ctx.measureText(str).width, limit) + unit * .044;
  const h = unit * .039, skew = h * .27;
  const l = x - width/2, r = x + width/2;
  panelPath(ctx, [[l+skew,y-h/2],[r+skew,y-h/2],[r-skew,y+h/2],[l-skew,y+h/2]]);
  ctx.fillStyle = light ? color.light : color.ink;
  ctx.fill();
  ctx.strokeStyle = color.edge;
  ctx.lineWidth = unit * .0015;
  ctx.stroke();
  ctx.fillStyle = light ? color.ink : color.light;
  ctx.fillText(str,x,y+unit*.001,limit);
  ctx.restore();
}

function printFrame(ctx, width, height, unit, color) {
  const m = unit * .025;
  const mark = unit * .022;
  ctx.save();
  ctx.strokeStyle = color.ink;
  ctx.lineWidth = unit * .025;
  ctx.strokeRect(0,0,width,height);
  ctx.lineWidth = unit * .002;
  ctx.strokeStyle = color.edge + 'b8';
  ctx.strokeRect(m,m,width-m*2,height-m*2);
  ctx.strokeStyle = color.light;
  ctx.lineWidth = unit * .0045;
  for (const [x,y,sx,sy] of [[m,m,1,1],[width-m,m,-1,1],[m,height-m,1,-1],[width-m,height-m,-1,-1]]) {
    ctx.beginPath();
    ctx.moveTo(x,y+sy*mark);
    ctx.lineTo(x,y);
    ctx.lineTo(x+sx*mark,y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const {width, height} = canvas;
  const unit = Math.min(width,height);
  const color = GRADES[state.grade];
  const wide = state.format === 'wide';
  const center = width * (wide ? .483 : .495);
  const top = height * (wide ? .238 : .305);
  const shapes = state.panels.map((_, index) => panelPoints(state.format,width,height,index));
  ctx.fillStyle = color.ink;
  ctx.fillRect(0,0,width,height);
  for (const [index, points] of shapes.entries()) {
    const panel = state.panels[index];
    paintPanel(ctx, points, panel, state.photos[panel.photo]?.image, color, index);
  }
  ctx.lineJoin = 'round';
  for (const points of shapes) {
    panelPath(ctx, points);
    ctx.strokeStyle = color.ink;
    ctx.lineWidth = unit * .014;
    ctx.stroke();
    ctx.strokeStyle = color.edge + 'b5';
    ctx.lineWidth = unit * .0017;
    ctx.stroke();
  }
  // A local shadow lifts the headline without darkening the whole photo deck.
  ctx.save();
  ctx.translate(center,top+height*.13);
  ctx.scale(width * (wide ? .33 : .60),height*.27);
  const shadow = ctx.createRadialGradient(0,0,.08,0,0,1);
  shadow.addColorStop(0,color.ink+'c4');
  shadow.addColorStop(.60,color.ink+'5b');
  shadow.addColorStop(1,color.ink+'00');
  ctx.fillStyle = shadow;
  if (state.caption.trim()) ctx.fillRect(-1,-1,2,2);
  ctx.restore();
  printGrain(ctx,width,height);
  const title = headline(ctx,state.caption,center,top,width*(wide ? .52 : .83),height*(wide ? .31 : .285),color);
  lozenge(ctx,state.eyebrow,center,title.top-unit*.022,width*.53,unit,color,true);
  lozenge(ctx,state.edition,center,height-unit*.066,width*.63,unit,color,false);
  printFrame(ctx,width,height,unit,color);
}
