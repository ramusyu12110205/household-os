export function enhanceHistoryView(s){
  const section=document.querySelector('#app section.card');
  const list=section?.querySelector('.list');
  if(!section||!list)return;
  if(section.dataset.historyViewBound==='1')return;
  section.dataset.historyViewBound='1';

  const items=[...list.querySelectorAll('.list-item')];
  if(!items.length)return;

  const records=items.map((node,index)=>({
    node,
    index,
    date:node.querySelector('.muted.small')?.textContent.match(/\d{4}-\d{2}-\d{2}/)?.[0]||''
  }));
  const months=[...new Set(records.map(x=>x.date.slice(0,7)).filter(Boolean))].sort().reverse();

  const titleBlock=section.querySelector('.between');
  if(!titleBlock)return;
  const originalCount=titleBlock.querySelector('.muted.small');
  const toolbar=document.createElement('div');
  toolbar.className='history-view-toolbar';
  toolbar.innerHTML=`<div class="history-view-mode" role="tablist" aria-label="履歴表示"><button type="button" class="secondary history-mode active" data-history-mode="order">入力順</button><button type="button" class="secondary history-mode" data-history-mode="month">月別</button></div><div class="history-month-control" hidden><label for="history-month">対象月</label><select id="history-month">${months.map(m=>`<option value="${m}">${m.replace('-','年')}月</option>`).join('')}</select></div>`;
  titleBlock.insertAdjacentElement('afterend',toolbar);

  const style=document.createElement('style');
  style.textContent='.history-view-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:12px 0;flex-wrap:wrap}.history-view-mode{display:flex;gap:6px}.history-view-mode .active{font-weight:700;outline:2px solid rgba(124,92,255,.35)}.history-month-control{display:flex;align-items:center;gap:8px}.history-month-control label{margin:0}.history-month-control select{min-width:140px}.history-date-heading{margin:16px 0 6px;padding:6px 10px;border-left:4px solid #6d5ce7;background:rgba(109,92,231,.08);border-radius:6px;font-weight:700}.history-date-heading:first-child{margin-top:0}';
  document.head.appendChild(style);

  const monthControl=toolbar.querySelector('.history-month-control');
  const monthSelect=toolbar.querySelector('#history-month');
  const modeButtons=[...toolbar.querySelectorAll('[data-history-mode]')];

  function updateCount(count){if(originalCount)originalCount.textContent=`${count}件`}
  function renderOrder(){
    list.replaceChildren();
    records.sort((a,b)=>String(b.date).localeCompare(String(a.date))||b.index-a.index);
    records.forEach(x=>{x.node.hidden=false;list.appendChild(x.node)});
    updateCount(records.length);
  }
  function renderMonth(){
    const month=monthSelect.value;
    const selected=records.filter(x=>x.date.startsWith(month));
    list.replaceChildren();
    const byDate=new Map();
    selected.forEach(x=>{x.node.hidden=false;if(!byDate.has(x.date))byDate.set(x.date,[]);byDate.get(x.date).push(x)});
    [...byDate.keys()].sort().reverse().forEach(date=>{
      const heading=document.createElement('div');
      heading.className='history-date-heading';
      const d=new Date(`${date}T00:00:00`);
      heading.textContent=`${d.getMonth()+1}月${d.getDate()}日`;
      list.appendChild(heading);
      byDate.get(date).sort((a,b)=>b.index-a.index).forEach(x=>list.appendChild(x.node));
    });
    updateCount(selected.length);
  }
  function setMode(mode){
    modeButtons.forEach(b=>b.classList.toggle('active',b.dataset.historyMode===mode));
    monthControl.hidden=mode!=='month';
    if(mode==='month')renderMonth();else renderOrder();
  }

  modeButtons.forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.historyMode)));
  monthSelect?.addEventListener('change',renderMonth);
}
