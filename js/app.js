import { supabase } from './core/supabase.js';
import { state,setState } from './core/state.js';
import { loadHousehold } from './core/data.js';
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

let settingsEditCaptureBound=false;
function bindSettingsEditCapture(){
  if(settingsEditCaptureBound)return;
  settingsEditCaptureBound=true;
  document.addEventListener('click',(e)=>{
    if(!document.querySelector('[data-page="settings"]'))return;
    const btn=e.target.closest('.list-item button');
    if(!btn||btn.textContent.trim()!=='編集')return;
    const item=btn.closest('.list-item');
    const type=item?.querySelector('b')?.textContent?.trim();
    if(!item||!type)return;

    const source={
      '摘要':state.summaries,
      '決済':state.payments,
      'カード':state.cards,
      '口座':state.accounts,
      'カテゴリ':state.categories
    }[type]||[];
    const text=item.textContent||'';
    const found=[...source]
      .filter(x=>x?.name&&text.includes(String(x.name)))
      .sort((a,b)=>String(b.name).length-String(a.name).length)[0];
    const fn={
      '摘要':window.editHouseholdSummary,
      '決済':window.editHouseholdPayment,
      'カード':window.editHouseholdCard,
      '口座':window.editHouseholdAccount,
      'カテゴリ':window.editHouseholdCategory
    }[type];

    if(found&&typeof fn==='function'){
      e.preventDefault();
      e.stopPropagation();
      fn(found);
    }
  },true);
}

export async function refresh(page='home'){setState(await loadHousehold(state.user.id));window.__household_state=state;render(page)}
export function render(page='home'){
  window.__household_state=state;
  const fn=pages[page]||pages.home;
  $("app").innerHTML=fn(state);
  bind(page);
}
function bind(page){
  document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>render(b.dataset.page));
  document.querySelector('[data-action="logout"]')?.addEventListener('click',()=>supabase.auth.signOut());
  if(page==='input')bindInput(state,()=>refresh('home'));
  if(page==='history')bindHistory(()=>refresh('history'));
  if(page==='monthly')bindMonthly(state,refresh);
  if(page==='assets')bindAssets(state,refresh);
  if(page==='settings'){
    bindSettingsEditCapture();
    bindSettings(state,refresh);
  }
  document.dispatchEvent(new CustomEvent('household:rendered',{detail:{page}}));
}
async function boot(user){state.user=user;setState(await loadHousehold(user.id));window.__household_state=state;render('home')}
supabase.auth.getSession().then(({data:{session}})=>session?boot(session.user):renderLogin());
supabase.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_IN'&&session)boot(session.user);if(event==='SIGNED_OUT')renderLogin()});
