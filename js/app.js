import { supabase } from './core/supabase.js';
import { state,setState } from './core/state.js';
import { loadHousehold } from './core/data-fresh.js';
import { $ } from './core/utils.js';
import { renderLogin } from './features/auth.js';
import { renderHome } from './features/home.js';
import { renderInput,bindInput } from './features/transactions/input.js';
import { renderHistory,bindHistory } from './features/transactions/history.js';
import { renderMonthly,bindMonthly } from './features/budgets/monthly.js';
import { renderCards } from './features/credit/cards.js';
import { renderAssets,bindAssets } from './features/assets/assets.js';
import { renderSettings,bindSettings } from './features/settings/settings.js';

const pages={home:renderHome,input:renderInput,history:renderHistory,monthly:renderMonthly,cards:renderCards,assets:renderAssets,settings:renderSettings};

export async function refresh(page='home'){
  setState(await loadHousehold(state.user.id));
  window.__household_state=state;
  render(page);
}

export function render(page='home'){
  window.__household_state=state;
  const fn=pages[page]||pages.home;
  $('app').innerHTML=fn(state);
  bind(page);
}

// 設定マスタの編集ボタンは、HTMLのonclick属性にデータ本体を埋め込まない。
// 既存HTMLに残っているonclick属性もここで無効化し、stateから対象レコードを直接渡す。
function bindSettingsEdits(){
  const collections={
    '摘要':{items:state.summaries,handler:'editHouseholdSummary'},
    '決済':{items:state.payments,handler:'editHouseholdPayment'},
    'カード':{items:state.cards,handler:'editHouseholdCard'},
    '口座':{items:state.accounts,handler:'editHouseholdAccount'},
    'カテゴリ':{items:state.categories,handler:'editHouseholdCategory'}
  };
  const indexes={};
  document.querySelectorAll('.list-item').forEach(item=>{
    const label=item.querySelector('b')?.textContent?.trim();
    const config=collections[label];
    if(!config)return;
    const button=Array.from(item.querySelectorAll('button')).find(b=>b.textContent.trim()==='編集');
    if(!button)return;
    const index=indexes[label]||0;
    indexes[label]=index+1;
    const record=config.items[index];
    if(!record)return;
    // 壊れた/旧式のinline onclickを確実に除去
    button.removeAttribute('onclick');
    button.type='button';
    button.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      const fn=window[config.handler];
      if(typeof fn==='function')fn(record);
    });
  });
}

function bind(page){
  document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>render(b.dataset.page));
  document.querySelector('[data-action="logout"]')?.addEventListener('click',()=>supabase.auth.signOut());
  if(page==='input')bindInput(state,()=>refresh('home'));
  if(page==='history')bindHistory(()=>refresh('history'));
  if(page==='monthly')bindMonthly(state,refresh);
  if(page==='assets')bindAssets(state,refresh);
  if(page==='settings'){
    bindSettings(state,refresh);
    bindSettingsEdits();
  }
  document.dispatchEvent(new CustomEvent('household:rendered',{detail:{page}}));
}

async function boot(user){
  state.user=user;
  setState(await loadHousehold(user.id));
  window.__household_state=state;
  render('home');
}

supabase.auth.getSession().then(({data:{session}})=>session?boot(session.user):renderLogin());
supabase.auth.onAuthStateChange((event,session)=>{
  if(event==='SIGNED_IN'&&session)boot(session.user);
  if(event==='SIGNED_OUT')renderLogin();
});
