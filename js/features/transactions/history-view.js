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
  style.textContent='.history-view-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:12px 0;flex-wrap:wrap}.history-view-mode{display:flex;gap:6px}.history-view-mode .active{font-weight:700;outline:2px solid rgba(124,92,255,.35)}.history-month-control{display:flex;align-items:center;gap:8px}.history-month-control label{margin:0}.history-month-control select{min-width:140px}.history-date-heading{margin:16px 0 6px;padding:6px 10px;border-left:4px solid #6d5ce7;background:rgba(109,92,231,.08);border-radius:6px;font-weight:700}.history-date-heading:first-child{margin-top:0}.history-clinger{position:absolute;top:-19px;width:72px;height:58px;z-index:8;pointer-events:none;filter:drop-shadow(2px 3px 2px rgba(0,0,0,.16));animation:history-clinger-bob 1.8s ease-in-out infinite;transform-origin:50% 100%}.history-clinger svg{width:100%;height:100%;display:block}.history-clinger.left{left:10%}.history-clinger.center{left:50%;transform:translateX(-50%)}.history-clinger.right{right:8%}.history-clinger.flip{transform:scaleX(-1)}.history-clinger.center.flip{transform:translateX(-50%) scaleX(-1)}.history-clinger span{position:absolute;left:50%;top:48px;transform:translateX(-50%);font-size:10px;font-weight:800;white-space:nowrap;color:#172033;background:#fff;padding:2px 6px;border-radius:999px;box-shadow:0 2px 7px rgba(24,34,55,.12)}@keyframes history-clinger-bob{0%,100%{margin-top:0;rotate:-2deg}50%{margin-top:5px;rotate:2deg}}';
  document.head.appendChild(style);
  const monthControl=toolbar.querySelector('.history-month-control');
  const monthSelect=toolbar.querySelector('#history-month');
  const modeButtons=[...toolbar.querySelectorAll('[data-history-mode]')];

  function updateCount(count){if(originalCount)originalCount.textContent=`${count}件`}
  function characterSvg(type){
    if(type==='cat')return `<svg viewBox="0 0 100 70" aria-hidden="true"><path d="M18 62C19 43 28 21 50 21s31 22 32 41" fill="#d6b08c"/><path d="M27 27 23 7l16 13M73 27 77 7 61 20" fill="#d6b08c" stroke="#6b4a37" stroke-width="3" stroke-linejoin="round"/><circle cx="39" cy="36" r="4" fill="#172033"/><circle cx="61" cy="36" r="4" fill="#172033"/><path d="M47 45q3 3 6 0M50 45v5" fill="none" stroke="#6b4a37" stroke-width="2" stroke-linecap="round"/><path d="M31 45 14 42M31 50 13 51M69 45l17-3M69 50l18 1" stroke="#6b4a37" stroke-width="2" stroke-linecap="round"/></svg>`;
    if(type==='chick')return `<svg viewBox="0 0 100 70" aria-hidden="true"><path d="M19 62C18 42 27 19 50 19s32 23 31 43" fill="#f7d84a" stroke="#b98e1c" stroke-width="2"/><path d="M44 44h12l-6 8z" fill="#e78b2c"/><circle cx="39" cy="35" r="4" fill="#172033"/><circle cx="61" cy="35" r="4" fill="#172033"/><path d="M24 28Q16 18 23 12M76 28Q84 18 77 12" fill="none" stroke="#f7d84a" stroke-width="8" stroke-linecap="round"/></svg>`;
    return `<svg viewBox="0 0 100 70" aria-hidden="true"><path d="M18 63C18 39 29 18 52 18c22 0 31 23 30 45" fill="#7bc96f" stroke="#3f8f43" stroke-width="2"/><path d="M25 25 19 10l14 8M74 25l8-15-15 9" fill="#7bc96f" stroke="#3f8f43" stroke-width="2"/><circle cx="39" cy="35" r="4" fill="#172033"/><circle cx="61" cy="35" r="4" fill="#172033"/><path d="M45 46q5 4 10 0" fill="none" stroke="#3f5f35" stroke-width="2" stroke-linecap="round"/><circle cx="34" cy="44" r="3" fill="#ef9a9a"/><circle cx="66" cy="44" r="3" fill="#ef9a9a"/></svg>`;
  }
  function removeClinger(){list.querySelectorAll('.history-clinger').forEach(x=>x.remove())}
  function addClinger(visibleRecords){
    removeClinger();
    if(!visibleRecords.length)return;
    const target=visibleRecords[Math.floor(Math.random()*visibleRecords.length)]?.node;
    if(!target)return;
    target.style.position='relative';
    const clinger=document.createElement('div');
    const side=['left','center','right'][Math.floor(Math.random()*3)];
    const flip=Math.random()>0.5?' flip':'';
    const type=['cat','chick','dino'][Math.floor(Math.random()*3)];
    clinger.className=`history-clinger ${side}${flip}`;
    clinger.innerHTML=characterSvg(type)+`<span>なんかいる</span>`;
    target.appendChild(clinger);
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
  function setMode(mode){modeButtons.forEach(b=>b.classList.toggle('active',b.dataset.historyMode===mode));monthControl.hidden=mode!=='month';if(mode==='month')renderMonth();else renderOrder();}
  modeButtons.forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.historyMode)));
  monthSelect?.addEventListener('change',renderMonth);
}
