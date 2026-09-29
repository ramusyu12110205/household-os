export function enhanceHistoryView(s){
  const section=document.querySelector('#app section.card');
  const list=section?.querySelector('.list');
  if(!section||!list)return;
  if(section.dataset.historyViewBound==='1')return;
  section.dataset.historyViewBound='1';

  const items=[...list.querySelectorAll('.list-item')];
  if(!items.length)return;
  const records=items.map((node,index)=>({node,index,date:node.querySelector('.muted.small')?.textContent.match(/\d{4}-\d{2}-\d{2}/)?.[0]||''}));
  const months=[...new Set(records.map(x=>x.date.slice(0,7)).filter(Boolean))].sort();
  const today=new Date();
  const currentMonth=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;
  const defaultMonth=months.includes(currentMonth)?currentMonth:(months[months.length-1]||'');
  const titleBlock=section.querySelector('.between');
  if(!titleBlock)return;
  const originalCount=titleBlock.querySelector('.muted.small');
  const toolbar=document.createElement('div');
  toolbar.className='history-view-toolbar';
  toolbar.innerHTML=`<div class="history-view-mode" role="tablist" aria-label="履歴表示"><button type="button" class="secondary history-mode active" data-history-mode="order">入力順</button><button type="button" class="secondary history-mode" data-history-mode="month">月別</button></div><div class="history-month-control" hidden><label for="history-month">対象月</label><select id="history-month">${months.map(m=>`<option value="${m}"${m===defaultMonth?' selected':''}>${m.replace('-','年')}月</option>`).join('')}</select></div>`;
  titleBlock.insertAdjacentElement('afterend',toolbar);
  const style=document.createElement('style');
  style.textContent='.history-view-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:12px 0;flex-wrap:wrap}.history-view-mode{display:flex;gap:6px}.history-view-mode .active{font-weight:700;outline:2px solid rgba(124,92,255,.35)}.history-month-control{display:flex;align-items:center;gap:8px}.history-month-control label{margin:0}.history-month-control select{min-width:140px}.history-date-heading{margin:16px 0 6px;padding:6px 10px;border-left:4px solid #6d5ce7;background:rgba(109,92,231,.08);border-radius:6px;font-weight:700}.history-date-heading:first-child{margin-top:0}.history-clinger{position:absolute;width:58px;height:auto;z-index:8;pointer-events:none;filter:drop-shadow(1px 2px 2px rgba(0,0,0,.14));animation:history-clinger-sway 2.4s ease-in-out infinite;transform-origin:50% 100%;will-change:transform}.history-clinger img{display:block;width:100%;height:auto}.history-clinger.flip{transform:scaleX(-1)}@keyframes history-clinger-sway{0%,100%{rotate:-1.5deg;translate:0 0}50%{rotate:1.5deg;translate:0 1px}}';
  document.head.appendChild(style);
  const monthControl=toolbar.querySelector('.history-month-control');
  const monthSelect=toolbar.querySelector('#history-month');
  const modeButtons=[...toolbar.querySelectorAll('[data-history-mode]')];
  const characterAssets={hanamaru:new URL('../../../assets/characters/hanamaru_transparent.png',import.meta.url).href};

  function updateCount(count){if(originalCount)originalCount.textContent=`${count}件`}
  function removeClinger(){list.querySelectorAll('.history-clinger').forEach(x=>x.remove())}

  function rectOverlapArea(a,b){
    const w=Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left));
    const h=Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
    return w*h;
  }

  function getBlockedRects(target){
    const rects=[];
    [...target.querySelectorAll('*')].forEach(el=>{
      if(el.closest('.history-clinger'))return;
      const text=(el.textContent||'').trim();
      const tag=el.tagName;
      if(!text&&tag!=='BUTTON')return;
      const r=el.getBoundingClientRect();
      if(r.width>0&&r.height>0)rects.push(r);
    });
    [...list.querySelectorAll('.list-item,.history-date-heading')].forEach(el=>{
      if(el===target||el.closest('.history-clinger'))return;
      const r=el.getBoundingClientRect();
      if(r.width>0&&r.height>0)rects.push(r);
    });
    return rects;
  }

  function placeClinger(target,clinger){
    const card=target.getBoundingClientRect();
    const w=58;
    const h=58;
    const candidates=[
      {x:10,y:-14},
      {x:(card.width-w)/2,y:-18},
      {x:card.width-w-10,y:-14},
      {x:10,y:10},
      {x:card.width-w-10,y:10},
      {x:10,y:card.height-h-10},
      {x:(card.width-w)/2,y:card.height-h-10},
      {x:card.width-w-10,y:card.height-h-10},
      {x:-12,y:(card.height-h)/2},
      {x:card.width-w+12,y:(card.height-h)/2}
    ];
    const blocked=getBlockedRects(target);
    const safe=[];
    for(const c of candidates){
      const r={left:card.left+c.x,top:card.top+c.y,right:card.left+c.x+w,bottom:card.top+c.y+h};
      const overlapsBlocked=blocked.some(b=>rectOverlapArea(r,b)>2);
      if(!overlapsBlocked)safe.push(c);
    }
    if(!safe.length){
      clinger.remove();
      return;
    }
    const chosen=safe[Math.floor(Math.random()*safe.length)];
    clinger.style.left=`${chosen.x}px`;
    clinger.style.top=`${chosen.y}px`;
    if(Math.random()>0.5)clinger.classList.add('flip');
  }

  function addClinger(visibleRecords){
    removeClinger();
    if(!visibleRecords.length)return;
    const target=visibleRecords[Math.floor(Math.random()*visibleRecords.length)]?.node;
    if(!target)return;
    target.style.position='relative';
    const clinger=document.createElement('div');
    clinger.className='history-clinger';
    const img=document.createElement('img');
    img.src=characterAssets.hanamaru;
    img.alt='';
    clinger.appendChild(img);
    target.appendChild(clinger);
    const place=()=>placeClinger(target,clinger);
    if(img.complete)requestAnimationFrame(place);else img.addEventListener('load',place,{once:true});
  }
  function renderOrder(){
    list.replaceChildren();
    const sorted=[...records].sort((a,b)=>a.date.localeCompare(b.date)||a.index-b.index);
    sorted.forEach(x=>{x.node.hidden=false;list.appendChild(x.node)});
    updateCount(sorted.length);
    addClinger(sorted);
  }
  function renderMonth(){
    const month=monthSelect.value;
    const selected=records.filter(x=>x.date.startsWith(month));
    list.replaceChildren();
    const visible=[];
    const byDate=new Map();
    selected.forEach(x=>{x.node.hidden=false;if(!byDate.has(x.date))byDate.set(x.date,[]);byDate.get(x.date).push(x)});
    [...byDate.keys()].sort().forEach(date=>{const heading=document.createElement('div');heading.className='history-date-heading';const d=new Date(`${date}T00:00:00`);heading.textContent=`${d.getMonth()+1}月${d.getDate()}日`;list.appendChild(heading);byDate.get(date).sort((a,b)=>a.index-b.index).forEach(x=>{list.appendChild(x.node);visible.push(x)});});
    updateCount(selected.length);
    addClinger(visible);
  }
  function setMode(mode){modeButtons.forEach(b=>b.classList.toggle('active',b.dataset.historyMode===mode));monthControl.hidden=mode!=='month';if(mode==='month')renderMonth();else renderOrder()}
  modeButtons.forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.historyMode)));
  monthSelect?.addEventListener('change',renderMonth);
}
