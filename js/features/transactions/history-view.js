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
  style.textContent='.history-view-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:12px 0;flex-wrap:wrap}.history-view-mode{display:flex;gap:6px}.history-view-mode .active{font-weight:700;outline:2px solid rgba(124,92,255,.35)}.history-month-control{display:flex;align-items:center;gap:8px}.history-month-control label{margin:0}.history-month-control select{min-width:140px}.history-date-heading{margin:16px 0 6px;padding:6px 10px;border-left:4px solid #6d5ce7;background:rgba(109,92,231,.08);border-radius:6px;font-weight:700}.history-date-heading:first-child{margin-top:0}.history-clinger{position:absolute!important;width:108px;height:auto;z-index:8;pointer-events:none;filter:drop-shadow(1px 2px 2px rgba(0,0,0,.14));animation:history-clinger-sway 2.8s ease-in-out infinite;transform-origin:50% 100%;will-change:transform}.history-clinger.hanabi{width:140px;height:128px;animation:none;transform-origin:50% 0;pointer-events:auto;cursor:pointer}.history-clinger.hanabi .hanabi-base{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;display:block}.history-clinger.hanabi .hanabi-fall{position:absolute;left:70px;top:74px;width:58px;height:auto;display:block;transform:translateY(0);will-change:transform,opacity}.history-clinger img{display:block;width:100%;height:auto}.history-clinger.flip{transform:scaleX(-1)}@keyframes history-clinger-sway{0%,100%{rotate:-1deg;translate:0 0}50%{rotate:1deg;translate:0 1px}}@keyframes history-hanabi-fall{from{transform:translateY(0);opacity:1}to{transform:translateY(var(--hanabi-drop,0px));opacity:0}}';
  document.head.appendChild(style);
  const monthControl=toolbar.querySelector('.history-month-control');
  const monthSelect=toolbar.querySelector('#history-month');
  const modeButtons=[...toolbar.querySelectorAll('[data-history-mode]')];
  const characterAssets={hanamaruHook:new URL('../../../assets/characters/Hanamaru_hook ver.PNG',import.meta.url).href,hanamaruHanabi:new URL('../../../assets/characters/Hanamaru_hanabi.PNG.PNG',import.meta.url).href};
  function updateCount(count){if(originalCount)originalCount.textContent=`${count}件`}
  function removeClinger(){list.querySelectorAll('.history-clinger').forEach(x=>{x._repositionCleanup?.();x.remove()})}
  function placeClinger(target,clinger,slotIndex){
    const card=target.getBoundingClientRect();
    const isHanabi=clinger.dataset.character==='hanabi';
    const w=clinger.getBoundingClientRect().width||(isHanabi?180:108);
    const maxX=Math.max(4,card.width-w-4);
    const candidates=[{x:4,flip:false},{x:maxX*.25,flip:false},{x:maxX*.5,flip:false},{x:maxX*.75,flip:true},{x:maxX,flip:true}];
    const chosen=candidates[Math.max(0,Math.min(slotIndex,candidates.length-1))];
    clinger.style.setProperty('left',`${chosen.x}px`,'important');
    clinger.style.setProperty('right','auto','important');
    clinger.style.setProperty('top',isHanabi?'-73px':'auto','important');
    clinger.style.setProperty('bottom',isHanabi?'auto':'calc(100% - 5px)','important');
    clinger.classList.toggle('flip',chosen.flip);
  }
  function addClinger(visibleRecords){
    removeClinger();
    if(!visibleRecords.length)return;
    const safeRecords=visibleRecords.filter(x=>!x.node.previousElementSibling?.classList.contains('history-date-heading'));
    const pool=safeRecords.length?safeRecords:visibleRecords;
    const target=pool[Math.floor(Math.random()*pool.length)]?.node;
    if(!target)return;
    const slotIndex=Math.floor(Math.random()*5);
    const isHanabi=Math.random()<0.5;
    target.style.setProperty('position','relative','important');
    target.style.setProperty('overflow','visible','important');
    const clinger=document.createElement('div');
    clinger.className='history-clinger';
    if(isHanabi)clinger.classList.add('hanabi');
    clinger.dataset.character=isHanabi?'hanabi':'hook';
    if(isHanabi){
      const base=document.createElement('img');
      const fall=document.createElement('img');
      base.className='hanabi-base';
      fall.className='hanabi-fall';
      base.src=characterAssets.hanamaruHanabi;
      fall.src=new URL('../../../assets/characters/hanamaru_fire_only_final.png',import.meta.url).href;
      base.alt='';
      fall.alt='';
      clinger.append(base,fall);
      target.appendChild(clinger);
      const place=()=>placeClinger(target,clinger,slotIndex);
      const startFall=()=>{
        const nextCard=[...list.children].slice([...list.children].indexOf(target)+1).find(x=>x.classList?.contains('list-item'));
        if(!nextCard){
          clinger.style.setProperty('--hanabi-drop','220px');
        }else{
          const targetRect=target.getBoundingClientRect();
          const nextRect=nextCard.getBoundingClientRect();
          const fireTop=74;
          const fireHeight=58*486/373;
          const drop=Math.max(40,nextRect.bottom-targetRect.top-fireTop-fireHeight);
          clinger.style.setProperty('--hanabi-drop',`${drop}px`);
        }
        requestAnimationFrame(()=>{
          fall.style.animation='history-hanabi-fall 1.05s linear forwards';
        });
      };
      let started=false;
      const activateHanabi=()=>{
        if(started||!clinger.isConnected)return;
        started=true;
        clinger.removeEventListener('click',activateHanabi);
        startFall();
      };
      clinger.addEventListener('click',e=>{
        e.preventDefault();
        e.stopPropagation();
        activateHanabi();
      });
      if(base.complete&&fall.complete){
        requestAnimationFrame(place);
      }else{
        let loaded=0;
        const ready=()=>{loaded++;if(loaded===2)requestAnimationFrame(place)};
        base.addEventListener('load',ready,{once:true});
        fall.addEventListener('load',ready,{once:true});
      }
      const reposition=()=>{if(clinger.isConnected)requestAnimationFrame(place)};
      window.addEventListener('resize',reposition,{passive:true});
      window.addEventListener('orientationchange',reposition,{passive:true});
      clinger._repositionCleanup=()=>{window.removeEventListener('resize',reposition);window.removeEventListener('orientationchange',reposition)};
      fall.addEventListener('animationend',()=>fall.remove(),{once:true});
    }else{
      const img=document.createElement('img');
      img.src=characterAssets.hanamaruHook;
      img.alt='';
      clinger.appendChild(img);
      target.appendChild(clinger);
      const place=()=>placeClinger(target,clinger,slotIndex);
      if(img.complete)requestAnimationFrame(place);else img.addEventListener('load',place,{once:true});
      const reposition=()=>{if(clinger.isConnected)requestAnimationFrame(place)};
      window.addEventListener('resize',reposition,{passive:true});
      window.addEventListener('orientationchange',reposition,{passive:true});
      clinger._repositionCleanup=()=>{window.removeEventListener('resize',reposition);window.removeEventListener('orientationchange',reposition)};
    }
  }
  function renderOrder(){list.replaceChildren();const sorted=[...records].sort((a,b)=>a.date.localeCompare(b.date)||a.index-b.index);sorted.forEach(x=>{x.node.hidden=false;list.appendChild(x.node)});updateCount(sorted.length);addClinger(sorted)}
  function renderMonth(){
    const month=monthSelect.value;const selected=records.filter(x=>x.date.startsWith(month));list.replaceChildren();const visible=[];const byDate=new Map();
    selected.forEach(x=>{x.node.hidden=false;if(!byDate.has(x.date))byDate.set(x.date,[]);byDate.get(x.date).push(x)});
    [...byDate.keys()].sort().forEach(date=>{const heading=document.createElement('div');heading.className='history-date-heading';const d=new Date(`${date}T00:00:00`);heading.textContent=`${d.getMonth()+1}月${d.getDate()}日`;list.appendChild(heading);byDate.get(date).sort((a,b)=>a.index-b.index).forEach(x=>{list.appendChild(x.node);visible.push(x)})});
    updateCount(selected.length);addClinger(visible);
  }
  function setMode(mode){modeButtons.forEach(b=>b.classList.toggle('active',b.dataset.historyMode===mode));monthControl.hidden=mode!=='month';if(mode==='month')renderMonth();else renderOrder()}
  modeButtons.forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.historyMode)));
  monthSelect?.addEventListener('change',renderMonth);
}