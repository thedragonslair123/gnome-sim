const garden = document.getElementById('garden');
const gnome = document.getElementById('gnome');
const oldWoman = document.getElementById('oldWoman');
const dialogue = document.getElementById('dialogue');

// restore saved state if any
function loadState(){
  try{ const raw = localStorage.getItem('gnomeState'); if(!raw) return null; return JSON.parse(raw); }catch(e){return null}
}
function saveState(s){ try{ localStorage.setItem('gnomeState', JSON.stringify(s)); }catch(e){} }

let saved = loadState();
let pos = saved && saved.pos ? saved.pos : {x: window.innerWidth*0.12, y: window.innerHeight*0.88};
let target = {...pos};
let speed = 280; // px per second

// curated flower presets (manual positions)
const curatedPresets = {
  meadow: [
    {l:8,b:12,s:28,a:'assets/flower1.svg'},
    {l:18,b:20,s:22,a:'assets/flower2.svg'},
    {l:30,b:8,s:34,a:'assets/flower3.svg'},
    {l:46,b:14,s:20,a:'assets/flower4.svg'},
    {l:62,b:22,s:26,a:'assets/flower5.svg'},
    {l:78,b:10,s:24,a:'assets/flower1.svg'}
  ],
  cottage: [
    {l:12,b:10,s:36,a:'assets/flower2.svg'},
    {l:22,b:14,s:30,a:'assets/flower4.svg'},
    {l:34,b:12,s:26,a:'assets/flower1.svg'},
    {l:46,b:8,s:28,a:'assets/flower5.svg'},
    {l:54,b:16,s:22,a:'assets/flower3.svg'}
  ],
  pond: [
    {l:44,b:24,s:34,a:'assets/flower4.svg'},
    {l:52,b:30,s:30,a:'assets/flower5.svg'},
    {l:60,b:22,s:26,a:'assets/flower1.svg'},
    {l:36,b:28,s:22,a:'assets/flower2.svg'}
  ]
};

function place(el, x, y){
  el.style.left = x + 'px';
  el.style.top = y + 'px';
}

function resizePositions(){
  // ensure elements stay on-screen after resize
  pos.x = parseFloat(pos.x);
}

place(gnome, pos.x, pos.y);
place(oldWoman, window.innerWidth*0.88, window.innerHeight*0.18);

// decorate with flowers (simple procedural art)
function makeFlowers(n=12,preset='meadow'){
  const assets = ['assets/flower1.svg','assets/flower2.svg','assets/flower3.svg','assets/flower4.svg','assets/flower5.svg'];
  // if a curated preset exists, use its manual placements
  if(curatedPresets[preset]){
    for(const item of curatedPresets[preset]){
      const f = document.createElement('div'); f.className = 'flower'; const size = item.s || 22; f.style.width = size+'px'; f.style.height = size+'px'; f.style.left = item.l + '%'; f.style.bottom = item.b + '%'; const img = document.createElement('img'); img.src = item.a || assets[Math.floor(Math.random()*assets.length)]; img.alt = 'flower'; f.appendChild(img); garden.appendChild(f);
    }
    return;
  }
  for(let i=0;i<n;i++){
    const f = document.createElement('div');
    f.className = 'flower';
    const size = 18 + Math.random()*28;
    f.style.width = size+'px'; f.style.height = size+'px';
    // position according to preset
    let leftPct = 6 + Math.random()*86;
    let bottomPct = 6 + Math.random()*66;
    if(preset === 'cottage'){
      leftPct = 8 + Math.random()*40; bottomPct = 6 + Math.random()*50;
    } else if(preset === 'pond'){
      leftPct = 40 + Math.random()*40; bottomPct = 20 + Math.random()*40;
    } else { // meadow
      leftPct = 6 + Math.random()*86; bottomPct = 6 + Math.random()*66;
    }
    f.style.left = leftPct + '%'; f.style.bottom = bottomPct + '%';
    const img = document.createElement('img');
    img.src = assets[Math.floor(Math.random()*assets.length)];
    img.alt = 'flower';
    f.appendChild(img);
    garden.appendChild(f);
  }
}
// load preset from saved state if present
const initialPreset = (saved && saved.layoutPreset) ? saved.layoutPreset : 'meadow';
makeFlowers(14, initialPreset);

// idle bob
gnome.classList.add('bob');

// movement loop
let last = performance.now();
function step(now){
  const dt = Math.min(0.05, (now-last)/1000);
  last = now;
  const dx = target.x - pos.x; const dy = target.y - pos.y;
  const dist = Math.hypot(dx,dy);
  if(dist>1){
    const move = Math.min(dist, speed*dt);
    pos.x += (dx/dist)*move;
    pos.y += (dy/dist)*move;
    place(gnome,pos.x,pos.y);
    // persist position frequently
    const cur = loadState() || {};
    cur.pos = pos; saveState(cur);
  }
  // detect proximity to old woman
  const owRect = oldWoman.getBoundingClientRect();
  const owCenter = {x: owRect.left+owRect.width/2, y: owRect.top+owRect.height/2};
  const gCenter = {x: pos.x, y: pos.y};
  const d = Math.hypot(owCenter.x-gCenter.x, owCenter.y-gCenter.y);
  if(d < 120){ showDialogue(randomLineNearOldWoman()); }
  requestAnimationFrame(step);
}
requestAnimationFrame(step);

// click to move
garden.addEventListener('click', (e)=>{
  // ignore clicks on old woman (they have their own handler)
  if(e.target === oldWoman) return;
  target.x = e.clientX;
  target.y = e.clientY;
  gnome.classList.remove('bob');
  setTimeout(()=>gnome.classList.add('bob'), 600);
  playMoveSound();
});

// keyboard movement
window.addEventListener('keydown', (e)=>{
  const stepSize = 30;
  if(e.key === 'ArrowUp') target.y -= stepSize;
  if(e.key === 'ArrowDown') target.y += stepSize;
  if(e.key === 'ArrowLeft') target.x -= stepSize;
  if(e.key === 'ArrowRight') target.x += stepSize;
  playMoveSound();
});

// clicking the old woman triggers conversation
oldWoman.addEventListener('click', ()=>{
  showDialogue(randomOldWomanLine());
  playTalkSound();
});

function showDialogue(text){
  dialogue.style.display = 'block';
  dialogue.textContent = text;
  clearTimeout(showDialogue._t);
  showDialogue._t = setTimeout(()=> dialogue.style.display = 'none', 4200);
  const cur = loadState() || {};
  cur.lastDialogue = text; cur.pos = pos; saveState(cur);
}

function random(a){return a[Math.floor(Math.random()*a.length)];}

function randomOldWomanLine(){
  const lines = [
    "Oh my, a little gnome! Mind the cabbages.",
    "You keep the garden cheerful, don't you?",
    "Do you like stories? I have many to tell.",
    "Pass me that watering can, would you?"
  ];
  return random(lines);
}

function randomLineNearOldWoman(){
  const lines = [
    "The old woman hums a tune.",
    "You rest on a nearby stone and listen.",
    "A warm breeze stirs the flowers.",
  ];
  return Math.random()<0.16 ? randomOldWomanLine() : random(lines);
}

// small responsive reposition on resize
window.addEventListener('resize', ()=>{
  place(oldWoman, window.innerWidth*0.88, window.innerHeight*0.18);
  // adjust saved position if needed
  const s = loadState();
  if(s && s.pos){ pos = s.pos; place(gnome,pos.x,pos.y); }
});

// --- simple WebAudio sounds ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let ac = null;
let masterGain = null;
function ensureAudio(){ if(!ac){ ac = new AudioCtx(); masterGain = ac.createGain(); masterGain.gain.value = (loadVolume()||0.8); masterGain.connect(ac.destination); } }
function playTone(freq, duration=0.08, type='sine', vol=0.12){
  try{
    ensureAudio();
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g); g.connect(masterGain);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    o.stop(ac.currentTime + duration + 0.02);
  }catch(e){}
}
function playMoveSound(){ playTone(880, 0.06, 'triangle', 0.05); }
function playTalkSound(){ playTone(540, 0.12, 'sine', 0.09); playTone(760,0.14,'sine',0.06); }

function saveVolume(v){ try{ localStorage.setItem('gnomeVolume', String(v)); }catch(e){} }
function loadVolume(){ try{ const v=localStorage.getItem('gnomeVolume'); return v===null?null:parseFloat(v); }catch(e){return null} }

// sprite image toggle + runtime sprite-sheet -> canvas animation
const origGnomeHTML = gnome.innerHTML;
const origOldHTML = oldWoman.innerHTML;
const gnomeFrames = ['assets/gnome_frame1.svg','assets/gnome_frame2.svg'];
const oldWomanFrames = ['assets/oldwoman_frame1.svg','assets/oldwoman_frame2.svg'];

async function buildSpriteSheet(frameUrls){
  const imgs = await Promise.all(frameUrls.map(u=>new Promise(res=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=()=>res(i); i.src=u;})));
  const frameW = Math.max(...imgs.map(i=>i.width));
  const frameH = Math.max(...imgs.map(i=>i.height));
  const count = imgs.length;
  const canvas = document.createElement('canvas'); canvas.width = frameW * count; canvas.height = frameH;
  const ctx = canvas.getContext('2d');
  imgs.forEach((img,i)=>{ ctx.drawImage(img, i*frameW, 0, frameW, frameH); });
  return {sheetDataUrl: canvas.toDataURL('image/png'), frameW, frameH, count};
}

function createSpriteCanvas(parentEl, width, height){
  const cv = document.createElement('canvas'); cv.className = 'sprite-canvas';
  cv.width = width; cv.height = height; cv.style.width = parentEl.clientWidth + 'px'; cv.style.height = parentEl.clientHeight + 'px';
  parentEl.innerHTML = ''; parentEl.appendChild(cv); return cv;
}

function easeInOutCubic(t){ return t<0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }

function startCanvasSpriteAnimation(canvasEl, sheetUrlOrImg, frameW_or_frames, frameH_or_rate, frameRateArg){
  const ctx = canvasEl.getContext('2d');
  const sheetImg = new Image();
  let isFramesArray = Array.isArray(frameW_or_frames);
  let frames = [];
  let frameRate = frameRateArg || 6;
  if(isFramesArray){
    // args: (canvas, sheetUrl, framesArray, frameRate)
    frames = frameW_or_frames; frameRate = frameH_or_rate || frameRate;
    sheetImg.src = sheetUrlOrImg;
  } else {
    // args: (canvas, sheetUrl, frameW, frameH, frameRate)
    const frameW = frameW_or_frames; const frameH = frameH_or_rate;
    sheetImg.src = sheetUrlOrImg;
    // generate frames array covering horizontal strip
    frames = [];
    // will populate frames after sheet loads
    sheetImg.onload = ()=>{
      const count = Math.max(1, Math.floor(sheetImg.width / frameW));
      for(let i=0;i<count;i++) frames.push({x:i*frameW, y:0, w:frameW, h:frameH});
    };
  }
  let rafId = null;
  let startTime = null;
  function loop(now){
    if(startTime===null) startTime = now;
    const elapsed = now - startTime; const frameDuration = 1000/frameRate;
    if(frames.length===0){ rafId = requestAnimationFrame(loop); return; }
    const absoluteFrame = Math.floor(elapsed / frameDuration);
    const idx = absoluteFrame % frames.length;
    const nextIdx = (idx + 1) % frames.length;
    const rawProgress = ((elapsed % frameDuration) / frameDuration);
    const progress = easeInOutCubic(rawProgress);
    ctx.clearRect(0,0,canvasEl.width,canvasEl.height);
    if(sheetImg.complete){
      const f = frames[idx]; const nf = frames[nextIdx];
      ctx.globalAlpha = 1.0;
      ctx.drawImage(sheetImg, f.x, f.y, f.w, f.h, 0, 0, canvasEl.width, canvasEl.height);
      ctx.globalAlpha = progress;
      ctx.drawImage(sheetImg, nf.x, nf.y, nf.w, nf.h, 0, 0, canvasEl.width, canvasEl.height);
      ctx.globalAlpha = 1.0;
    }
    rafId = requestAnimationFrame(loop);
  }
  rafId = requestAnimationFrame(loop);
  return ()=>{ if(rafId) cancelAnimationFrame(rafId); };
}

let gnomeCanvasStop = null, oldWomanCanvasStop = null;

async function useImageSprites(on){
  if(on){
    const forceSheet = (document.getElementById('forceSheet') && document.getElementById('forceSheet').checked) || false;
    // choose gnome source
    if((window.gnomeSheet && !forceSheet) || (window.gnomeSheet && forceSheet) || (!window.gnomeFrames && !window.gnomeSheet)){
      // prefer sheet if available
      if(window.gnomeSheet){
        const gcv = createSpriteCanvas(gnome, window.gnomeSheet.frames[0].w, window.gnomeSheet.frames[0].h);
        gcv.style.width = gnome.clientWidth + 'px'; gcv.style.height = gnome.clientHeight + 'px';
        gnomeCanvasStop = startCanvasSpriteAnimation(gcv, window.gnomeSheet.sheet, window.gnomeSheet.frames, window.gnomeSheet.frameRate);
      } else {
        const gFrames = window.gnomeFrames || gnomeFrames;
        const gSpec = await buildSpriteSheet(gFrames);
        const gcv = createSpriteCanvas(gnome, gSpec.frameW, gSpec.frameH);
        gcv.style.width = gnome.clientWidth + 'px'; gcv.style.height = gnome.clientHeight + 'px';
        gnomeCanvasStop = startCanvasSpriteAnimation(gcv, gSpec.sheetDataUrl, gSpec.frameW, gSpec.frameH, gSpec.frameRate||6);
      }
    }
    // choose old woman source
    if((window.oldWomanSheet && !forceSheet) || (window.oldWomanSheet && forceSheet) || (!window.oldWomanFrames && !window.oldWomanSheet)){
      if(window.oldWomanSheet){
        const ocv = createSpriteCanvas(oldWoman, window.oldWomanSheet.frames[0].w, window.oldWomanSheet.frames[0].h);
        ocv.style.width = oldWoman.clientWidth + 'px'; ocv.style.height = oldWoman.clientHeight + 'px';
        oldWomanCanvasStop = startCanvasSpriteAnimation(ocv, window.oldWomanSheet.sheet, window.oldWomanSheet.frames, window.oldWomanSheet.frameRate);
      } else {
        const oFrames = window.oldWomanFrames || oldWomanFrames;
        const oSpec = await buildSpriteSheet(oFrames);
        const ocv = createSpriteCanvas(oldWoman, oSpec.frameW, oSpec.frameH);
        ocv.style.width = oldWoman.clientWidth + 'px'; ocv.style.height = oldWoman.clientHeight + 'px';
        oldWomanCanvasStop = startCanvasSpriteAnimation(ocv, oSpec.sheetDataUrl, oSpec.frameW, oSpec.frameH, oSpec.frameRate||3);
      }
    }
  } else {
    if(gnomeCanvasStop){ gnomeCanvasStop(); gnomeCanvasStop = null; }
    if(oldWomanCanvasStop){ oldWomanCanvasStop(); oldWomanCanvasStop = null; }
    gnome.innerHTML = origGnomeHTML; oldWoman.innerHTML = origOldHTML;
  }
}

// load persisted volume and sprite preference
document.addEventListener('DOMContentLoaded', ()=>{
  const volEl = document.getElementById('volume');
  const useImgs = document.getElementById('useImages');
  const resetBtn = document.getElementById('resetState');
  const exportBtn = document.getElementById('exportPNG');
  const controlPanel = document.getElementById('controlPanel');
  const layoutSelect = document.getElementById('layoutPreset');
  const savedVol = loadVolume(); if(savedVol!==null){ volEl.value = Math.round(savedVol*100); }
  volEl.addEventListener('input', ()=>{ const v = volEl.value/100; ensureAudio(); masterGain.gain.value = v; saveVolume(v); });
  // initialize audio gain
  ensureAudio();
  // sprite toggle
  const spritePref = localStorage.getItem('useImageSprites') === '1';
  useImgs.checked = spritePref;
  // attempt to load sprite JSON files to support sprite-sheets
  (async function loadSpriteJSONs(){
      // try generated sprite JSONs by DPR preference: auto -> use navigator.devicePixelRatio
      const deviceDPR = Math.max(1, Math.round(window.devicePixelRatio || 1));
      const tryOrder = (dpr)=>{
        const candidates = [];
        if(dpr>=4) candidates.push('@4x');
        if(dpr>=3) candidates.push('@3x');
        if(dpr>=2) candidates.push('@2x');
        candidates.push('');
        // always include other scales as fallback
        if(!candidates.includes('@2x')) candidates.push('@2x');
        if(!candidates.includes('@3x')) candidates.push('@3x');
        if(!candidates.includes('@4x')) candidates.push('@4x');
        return candidates;
      };
      const gBase = 'assets/gnome_sprites.json';
      const oBase = 'assets/oldwoman_sprites.json';
      const gCandidates = tryOrder(deviceDPR);
      const oCandidates = tryOrder(deviceDPR);
      // helper to attempt fetch variants
      async function loadVariants(name, basePath, candidates){
        // check canonical source first
        try{
          const resp = await fetch(basePath);
          if(resp.ok){ const data = await resp.json(); if(data.sheet && data.frames && data.frames.length){ return {sheet: data.sheet, frames: data.frames, frameRate: data.frameRate||6, dpr: data.dpr||1}; } else if(data.frames && data.frames.length){ window[name+'Frames'] = data.frames; }
          }
        }catch(e){}
        // try generated files with suffix preference
        for(const s of candidates){
          const path = basePath.replace('.json', s ? ('_generated'+s+'.json') : '_generated.json');
          try{ const r = await fetch(path); if(r.ok){ const jd = await r.json(); if(jd.sheet && jd.frames && jd.frames.length) return {sheet: jd.sheet, frames: jd.frames, frameRate: jd.frameRate||6, dpr: jd.dpr||1}; } }catch(e){}
        }
        return null;
      }

      const gLoaded = await loadVariants('gnome', gBase, gCandidates);
      if(gLoaded) window.gnomeSheet = gLoaded; else { /* fallback frames previously loaded */ }
      const oLoaded = await loadVariants('oldWoman', oBase, oCandidates);
      if(oLoaded) window.oldWomanSheet = oLoaded; else { }
      useImageSprites(useImgs.checked);
  })();
  useImgs.addEventListener('change', ()=>{ localStorage.setItem('useImageSprites', useImgs.checked ? '1':'0'); useImageSprites(useImgs.checked); });
  const forceSheetEl = document.getElementById('forceSheet');
  const dprOverrideEl = document.getElementById('dprOverride');
  const easingEl = document.getElementById('easing');
  // set initial easing mix
  window.spriteEasingMix = parseFloat(easingEl.value) || 0.66;
  easingEl.addEventListener('input', ()=>{ window.spriteEasingMix = parseFloat(easingEl.value||0.66); });
  // reload preferred sheet when DPR override changes
  async function reloadPreferredSheets(){
    const override = dprOverrideEl.value === 'auto' ? Math.max(1, Math.round(window.devicePixelRatio||1)) : parseInt(dprOverrideEl.value,10) || 1;
    // re-run the loader logic tailored to override
    const tryOrder = (dpr)=>{
      const candidates = [];
      if(dpr>=4) candidates.push('@4x');
      if(dpr>=3) candidates.push('@3x');
      if(dpr>=2) candidates.push('@2x');
      candidates.push('');
      if(!candidates.includes('@2x')) candidates.push('@2x');
      if(!candidates.includes('@3x')) candidates.push('@3x');
      if(!candidates.includes('@4x')) candidates.push('@4x');
      return candidates;
    };
    const gCandidates = tryOrder(override);
    const oCandidates = tryOrder(override);
    async function loadGen(base){
      for(const s of (base=== 'gnome' ? gCandidates: oCandidates)){
        const path = `assets/${base}_sprites_generated${s ? s : ''}.json`;
        try{ const r = await fetch(path); if(r.ok){ const jd = await r.json(); if(jd.sheet && jd.frames) return {sheet: jd.sheet, frames: jd.frames, frameRate: jd.frameRate||6, dpr: jd.dpr||1}; } }catch(e){}
      }
      return null;
    }
    const g = await loadGen('gnome'); if(g) window.gnomeSheet = g;
    const o = await loadGen('oldwoman'); if(o) window.oldWomanSheet = o;
    // if sprites are currently enabled, reinitialize them
    if(useImgs.checked) useImageSprites(true);
  }
  dprOverrideEl.addEventListener('change', ()=>{ localStorage.setItem('dprOverride', dprOverrideEl.value); reloadPreferredSheets(); });
  // load saved dprOverride and forceSheet
  const savedDpr = localStorage.getItem('dprOverride') || 'auto'; dprOverrideEl.value = savedDpr;
  const savedForce = localStorage.getItem('forceSheet') === '1'; forceSheetEl.checked = savedForce;
  forceSheetEl.addEventListener('change', ()=>{ localStorage.setItem('forceSheet', forceSheetEl.checked ? '1':'0'); useImageSprites(useImgs.checked); });
  // layout select
  layoutSelect.value = initialPreset || 'meadow';
  layoutSelect.addEventListener('change', ()=>{
    const p = layoutSelect.value; localStorage.setItem('layoutPreset', p);
    // rebuild flowers
    document.querySelectorAll('.flower').forEach(n=>n.remove()); makeFlowers(18,p);
  });
  // reset saved state
  resetBtn.addEventListener('click', ()=>{
    localStorage.removeItem('gnomeState'); localStorage.removeItem('gnomeVolume'); localStorage.removeItem('useImageSprites'); localStorage.removeItem('layoutPreset'); location.reload();
  });
  // export
  exportBtn.addEventListener('click', ()=>{ exportGardenPNG(); });
  // keyboard shortcuts
  document.addEventListener('keydown', (ev)=>{
    if(ev.key === 'v'){ controlPanel.classList.toggle('hidden'); }
    if(ev.key === 'r'){ resetBtn.click(); }
    if(ev.key === 'i'){ useImgs.checked = !useImgs.checked; useImgs.dispatchEvent(new Event('change')); }
    if(ev.key === 'e'){ exportBtn.click(); }
  });
});

  function showExportToast(text="Saved PNG"){
    let t = document.getElementById('exportToast');
    if(!t){ t = document.createElement('div'); t.id = 'exportToast'; document.body.appendChild(t); }
    t.textContent = text; t.style.display = 'block'; clearTimeout(showExportToast._t); showExportToast._t = setTimeout(()=> t.style.display = 'none',2200);
  }

  async function exportGardenPNG(){
    const gardenRect = garden.getBoundingClientRect();
    const DPR = window.devicePixelRatio || 1;
    const W = Math.round(gardenRect.width); const H = Math.round(gardenRect.height);
    const canvas = document.createElement('canvas'); canvas.width = Math.round(W*DPR); canvas.height = Math.round(H*DPR);
    const ctx = canvas.getContext('2d'); ctx.scale(DPR,DPR);
    // draw background gradient similar to CSS
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#cfeef8'); g.addColorStop(0.4,'#b5e0c7'); g.addColorStop(0.6,'#7fc97f');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    // draw flower images (use drawElement below)
    const flowerEls = Array.from(document.querySelectorAll('.flower'));
    // helper to draw element (svg or img)
    async function drawElement(el){
      const r = el.getBoundingClientRect();
      const w = r.width, h = r.height;
      let imgSrc = null;
      const imgEl = el.querySelector('img');
      const svgEl = el.querySelector('svg');
      if(imgEl && imgEl.src){ imgSrc = imgEl.src; }
      else if(svgEl){ const svgText = new XMLSerializer().serializeToString(svgEl); imgSrc = 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svgText); }
      if(!imgSrc) return;
      await new Promise((res,rej)=>{
        const im = new Image();
        im.onload = ()=>{ const dx = r.left - gardenRect.left; const dy = r.top - gardenRect.top; ctx.drawImage(im, dx, dy, w, h); res(); };
        im.onerror = ()=>res();
        im.src = imgSrc;
      });
    }
    // draw flowers first so they appear beneath characters
    for(const f of flowerEls){ await drawElement(f); }
    // draw old woman and gnome
    await drawElement(oldWoman);
    await drawElement(gnome);
    // done, create download
    const data = canvas.toDataURL('image/png');
    const a = document.createElement('a'); a.href = data; a.download = 'gnome-garden.png'; document.body.appendChild(a); a.click(); a.remove();
    showExportToast('Saved PNG');
  }
// if we restored last dialogue, show it briefly
if(saved && saved.lastDialogue){ showDialogue(saved.lastDialogue); }
