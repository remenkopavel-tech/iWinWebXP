// iWin Web XP - simple web emulator
(()=>{
  const i18n = {
    uk: {
      Start: 'Пуск', Files:'Файли', Notepad:'Блокнот', Paint:'Paint', Calculator:'Калькулятор', 'File Explorer':'Провідник',
      Save:'Зберегти', 'Close Start':'Закрити Пуск', 'Add Home':'Додати на головний екран'
    },
    ru: {
      Start: 'Пуск', Files:'Файлы', Notepad:'Блокнот', Paint:'Paint', Calculator:'Калькулятор', 'File Explorer':'Проводник',
      Save:'Сохранить', 'Close Start':'Закрыть Пуск', 'Add Home':'Добавить на главный экран'
    }
  };

  const defaultLang = (navigator.language||'uk').startsWith('ru') ? 'ru' : 'uk';
  let lang = localStorage.getItem('iwin-lang') || defaultLang;

  function t(k){ return (i18n[lang] && i18n[lang][k]) || k }
  function localizePage(){
    document.querySelectorAll('[data-i18n]').forEach(el=>{ const key=el.getAttribute('data-i18n'); el.innerText = t(key); })
  }
  localizePage();

  // Time
  const timeEl = document.getElementById('time');
  function tick(){ timeEl.innerText = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); }
  setInterval(tick,1000); tick();

  // Start menu toggle
  const startBtn = document.getElementById('startBtn');
  const startMenu = document.getElementById('startMenu');
  startBtn.addEventListener('click', ()=> startMenu.classList.toggle('hidden'));
  document.addEventListener('click', (e)=>{ if(!startMenu.contains(e.target) && !startBtn.contains(e.target)) startMenu.classList.add('hidden') });

  // Window manager
  const windowsRoot = document.getElementById('windows');
  const winTpl = document.getElementById('window-template');
  const taskItems = document.getElementById('task-items');
  let z = 10;
  function createWindow(title, contentEl){
    const node = winTpl.content.firstElementChild.cloneNode(true);
    node.querySelector('.title').innerText = title;
    const content = node.querySelector('.content');
    content.appendChild(contentEl);
    node.style.left = '60px'; node.style.top = '60px';
    node.style.zIndex = ++z;
    makeDraggable(node);
    attachControls(node);
    windowsRoot.appendChild(node);
    addTask(node,title);
    return node;
  }

  function addTask(winNode,title){
    const btn = document.createElement('button');
    btn.className = 'task-btn';
    btn.innerText = title;
    btn.addEventListener('click', ()=>{ winNode.style.display = winNode.style.display==='none'?'block':'block'; winNode.style.zIndex = ++z; });
    taskItems.appendChild(btn);
  }

  function attachControls(node){
    node.querySelector('.close').addEventListener('click', ()=>{ node.remove(); updateTasks(); });
    node.querySelector('.min').addEventListener('click', ()=>{ node.style.display='none'; });
    node.querySelector('.max').addEventListener('click', ()=>{ node.style.width = node.style.width ? '' : '100%'; node.style.height = node.style.height ? '' : '100%'; node.style.left = 0; node.style.top = 0; node.style.zIndex = ++z; });
    node.addEventListener('touchstart', ()=> node.style.zIndex = ++z);
  }

  function updateTasks(){ taskItems.innerHTML=''; document.querySelectorAll('.win').forEach(w=> addTask(w, w.querySelector('.title').innerText)); }

  function makeDraggable(el){
    const title = el.querySelector('.title').parentElement;
    let startX, startY, ox, oy, touching=false;
    title.addEventListener('touchstart', (e)=>{ touching=true; const t=e.touches[0]; startX=t.clientX; startY=t.clientY; ox=parseInt(el.style.left||0); oy=parseInt(el.style.top||0); });
    title.addEventListener('touchmove', (e)=>{ if(!touching) return; const t=e.touches[0]; el.style.left = (ox + (t.clientX-startX)) + 'px'; el.style.top = (oy + (t.clientY-startY)) + 'px'; });
    title.addEventListener('touchend', ()=>{ touching=false; });
    // desktop double tap to bring front
    el.addEventListener('dblclick', ()=> el.style.zIndex = ++z);
  }

  // Apps
  function createNotepad(initialTxt=''){
    const area = document.createElement('textarea');
    area.style.width='100%'; area.style.height='100%'; area.value = initialTxt;
    const saveBtn = document.createElement('button'); saveBtn.innerText = t('Save'); saveBtn.style.marginTop='6px';
    saveBtn.addEventListener('click', ()=>{
      const name = prompt('File name', 'note.txt') || 'note.txt';
      saveFile(name, area.value);
      alert('Saved');
    });
    const wrap = document.createElement('div');
    wrap.appendChild(area); wrap.appendChild(saveBtn);
    return wrap;
  }

  function createPaint(){
    const canvas = document.createElement('canvas');
    canvas.width = 800; canvas.height = 500;
    canvas.style.width='100%'; canvas.style.height='100%';
    const ctx = canvas.getContext('2d'); ctx.fillStyle='white'; ctx.fillRect(0,0,canvas.width,canvas.height);
    let drawing=false;
    let last={x:0,y:0};
    function pos(e){
      const r = canvas.getBoundingClientRect();
      const touch = e.touches ? e.touches[0] : e;
      return {x: (touch.clientX - r.left) * (canvas.width / r.width), y: (touch.clientY - r.top) * (canvas.height / r.height)};
    }
    canvas.addEventListener('touchstart',(e)=>{ drawing=true; last = pos(e); });
    canvas.addEventListener('touchmove',(e)=>{ if(!drawing) return; const p=pos(e); ctx.beginPath(); ctx.moveTo(last.x,last.y); ctx.lineTo(p.x,p.y); ctx.strokeStyle='black'; ctx.lineWidth=2; ctx.stroke(); last=p; e.preventDefault(); });
    canvas.addEventListener('touchend',()=>{ drawing=false; });
    const save = document.createElement('button'); save.innerText='Save PNG'; save.style.marginTop='6px';
    save.addEventListener('click', ()=>{
      const data = canvas.toDataURL('image/png');
      const name = prompt('Image name','drawing.png') || 'drawing.png';
      saveFile(name, data, true);
      alert('Saved');
    });
    const wrap = document.createElement('div');
    wrap.appendChild(canvas); wrap.appendChild(save);
    return wrap;
  }

  function createCalculator(){
    const wrap = document.createElement('div');
    const out = document.createElement('div'); out.style.fontSize='28px'; out.style.marginBottom='8px'; out.innerText='0';
    wrap.appendChild(out);
    const keys = ['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'];
    const grid = document.createElement('div'); grid.style.display='grid'; grid.style.gridTemplateColumns='repeat(4,1fr)'; grid.style.gap='6px';
    keys.forEach(k=>{ const b=document.createElement('button'); b.innerText=k; b.style.padding='10px'; b.addEventListener('click', ()=>{ if(k==='='){ try{ out.innerText = eval(out.innerText) }catch{out.innerText='Err'} } else { if(out.innerText==='0') out.innerText = k; else out.innerText += k } }); grid.appendChild(b); });
    wrap.appendChild(grid);
    return wrap;
  }

  // File storage using localStorage
  function saveFile(name, content, isBinary=false){
    const key = 'iwin:file:' + name;
    localStorage.setItem(key, content);
    let files = JSON.parse(localStorage.getItem('iwin:files')||'[]');
    if(!files.includes(name)) files.push(name);
    localStorage.setItem('iwin:files', JSON.stringify(files));
  }
  function listFiles(){ return JSON.parse(localStorage.getItem('iwin:files')||'[]'); }
  function loadFile(name){ return localStorage.getItem('iwin:file:' + name); }

  function createFileExplorer(){
    const wrap = document.createElement('div');
    const list = document.createElement('div');
    function refresh(){ list.innerHTML=''; listFiles().forEach(n=>{ const r = document.createElement('div'); r.innerText = n; r.style.padding='6px'; r.style.borderBottom='1px solid #eee'; r.addEventListener('click', ()=>{ const v = loadFile(n); if(v && v.startsWith('data:image')){ const img = new Image(); img.src = v; const win = createWindow(n, img); } else { const ta = document.createElement('textarea'); ta.style.width='100%'; ta.style.height='200px'; ta.value = v || ''; const win = createWindow(n, ta); } }); list.appendChild(r); }); }
    refresh();
    const clr = document.createElement('button'); clr.innerText='Clear all'; clr.addEventListener('click', ()=>{ if(confirm('Clear all saved files?')){ listFiles().forEach(n=> localStorage.removeItem('iwin:file:'+n)); localStorage.removeItem('iwin:files'); refresh(); } });
    wrap.appendChild(list); wrap.appendChild(clr);
    return wrap;
  }

  // Wiring icons and start menu
  document.querySelectorAll('.icon').forEach(ic=> ic.addEventListener('click', ()=>{
    const app = ic.dataset.app;
    openApp(app);
  }));
  document.querySelectorAll('.start-item[data-action=open]').forEach(b=> b.addEventListener('click', ()=> openApp(b.dataset.app)));

  function openApp(name){
    if(name==='notepad'){ createWindow('Блокнот', createNotepad()); }
    if(name==='paint'){ createWindow('Paint', createPaint()); }
    if(name==='calculator'){ createWindow('Калькулятор', createCalculator()); }
    if(name==='fileExplorer'){ createWindow('Провідник', createFileExplorer()); }
  }

  // Start menu add to home
  document.getElementById('addHome').addEventListener('click', ()=>{ alert('Для iPhone: у Safari натисни Поділитись → На головний екран'); });

  // Notifications for start items (open via Notification)
  document.addEventListener('DOMContentLoaded', ()=>{
    // open quick apps from notifications
    window.addEventListener('message', e=>{
      if(e.data && e.data.open) openApp(e.data.open);
    });
  });

  // Language switch via long-press start
  let startPressTimer;
  startBtn.addEventListener('touchstart', ()=>{ startPressTimer = setTimeout(()=>{ lang = (lang==='uk'?'ru':'uk'); localStorage.setItem('iwin-lang', lang); localizePage(); alert('Language: '+lang); }, 800); });
  startBtn.addEventListener('touchend', ()=>{ clearTimeout(startPressTimer); });

  // Expose createWindow to other functions
  window.createWindow = createWindow;

})();
