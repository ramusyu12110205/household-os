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
  style.textContent='.history-view-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:12px 0;flex-wrap:wrap}.history-view-mode{display:flex;gap:6px}.history-view-mode .active{font-weight:700;outline:2px solid rgba(124,92,255,.35)}.history-month-control{display:flex;align-items:center;gap:8px}.history-month-control label{margin:0}.history-month-control select{min-width:140px}.history-date-heading{margin:16px 0 6px;padding:6px 10px;border-left:4px solid #6d5ce7;background:rgba(109,92,231,.08);border-radius:6px;font-weight:700}.history-date-heading:first-child{margin-top:0}.history-clinger{position:absolute;top:-28px;width:58px;height:54px;z-index:8;pointer-events:none;filter:drop-shadow(1px 2px 2px rgba(0,0,0,.16));animation:history-clinger-sway 2.2s ease-in-out infinite;transform-origin:50% 100%}.history-clinger svg{width:100%;height:100%;display:block;overflow:visible}.history-clinger.left{left:9%}.history-clinger.center{left:50%;transform:translateX(-50%)}.history-clinger.right{right:9%}.history-clinger.flip{transform:scaleX(-1)}.history-clinger.center.flip{transform:translateX(-50%) scaleX(-1)}@keyframes history-clinger-sway{0%,100%{rotate:-2deg;translate:0 0}50%{rotate:2deg;translate:0 2px}}';
  document.head.appendChild(style);
  const monthControl=toolbar.querySelector('.history-month-control');
  const monthSelect=toolbar.querySelector('#history-month');
  const modeButtons=[...toolbar.querySelectorAll('[data-history-mode]')];

  function updateCount(count){if(originalCount)originalCount.textContent=`${count}件`}
  function characterSvg(type){
    if(type==='cat')return `<svg viewBox="0 0 100 80" aria-hidden="true"><path d="M22 76C21 53 29 27 50 27s29 26 28 49" fill="#d6b08c" stroke="#6b4a37" stroke-width="3"/><path d="M29 31 23 9l17 15M71 31 77 9 60 24" fill="#d6b08c" stroke="#6b4a37" stroke-width="3" stroke-linejoin="round"/><circle cx="39" cy="43" r="4" fill="#172033"/><circle cx="61" cy="43" r="4" fill="#172033"/><path d="M47 53q3 3 6 0M50 53v5" fill="none" stroke="#6b4a37" stroke-width="2" stroke-linecap="round"/><path d="M29 55 11 50M29 60 10 60M71 55l18-5M71 60l19 0" stroke="#6b4a37" stroke-width="2" stroke-linecap="round"/><path d="M19 74q-8 5-12-2M81 74q8 5 12-2" fill="none" stroke="#d6b08c" stroke-width="7" stroke-linecap="round"/></svg>`;
    if(type==='chick')return `<svg viewBox="0 0 100 80" aria-hidden="true"><path d="M21 76C20 52 28 25 50 25s30 27 29 51" fill="#f7d84a" stroke="#b98e1c" stroke-width="3"/><path d="M44 50h12l-6 8z" fill="#e78b2c"/><circle cx="39" cy="41" r="4" fill="#172033"/><circle cx="61" cy="41" r="4" fill="#172033"/><path d="M25 32Q15 20 23 12M75 32Q85 20 77 12" fill="none" stroke="#f7d84a" stroke-width="8" stroke-linecap="round"/><path d="M18 73q-7 5-10-2M82 73q7 5 10-2" fill="none" stroke="#f7d84a" stroke-width="7" stroke-linecap="round"/></svg>`;
    return `<svg viewBox="0 0 100 80" aria-hidden="true"><path d="M20 76C19 50 28 25 51 25c22 0 30 26 29 51" fill="#7bc96f" stroke="#3f8f43" stroke-width="3"/><path d="M27 32 20 12l15 10M73 32l9-20-16 11" fill="#7bc96f" stroke="#3f8f43" stroke-width="3"/><circle cx="39" cy="41" r="4" fill="#172033"/><circle cx="61" cy="41" r="4" fill="#172033"/><path d="M45 53q5 4 10 0" fill="none" stroke="#3f5f35" stroke-width="2" stroke-linecap="round"/><circle cx="34" cy="51" r="3" fill="#ef9a9a"/><circle cx="66" cy="51" r="3" fill="#ef9a9a"/><path d="M18 73q-7 5-10-2M82 73q7 5 10-2" fill="none" stroke="#7bc96f" stroke-width="7" stroke-linecap="round"/></svg>`;
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
    clinger.innerHTML=characterSvg(type);
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
