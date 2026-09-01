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
export async function refresh(page='home'){setState(await loadHousehold(state.user.id));window.__household_state=state;render(page)}
export function render(page='home'){window.__household_state=state;const fn=pages[page]||pages.home;$("app").innerHTML=fn(state);bind(page)}
function bindSettingsEdits(){
  document.querySelectorAll('button[onclick^="window.editHousehold"]').forEach(btn=>{
    const raw=btn.getAttribute('onclick')||'';
    const match=raw.match(/^window\.(editHousehold\w+)\((.*)\)$/s);
    if(!match)return;
    let record;
    try{record=JSON.parse(match[2]);}catch(e){return;}
    btn.removeAttribute('onclick');
    btn.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      const fn=window[match[1]];
      if(typeof fn==='function'){
        const oldScroll=window.scrollTo;
        window.scrollTo=()=>{};
        try{fn(record);}finally{window.scrollTo=oldScroll;}
      }
    });
  });
}
function bind(page){document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>render(b.dataset.page));document.querySelector('[data-action="logout"]')?.addEventListener('click',()=>supabase.auth.signOut());if(page==='input')bindInput(state,()=>refresh('home'));if(page==='history')bindHistory(()=>refresh('history'));if(page==='monthly')bindMonthly(state,refresh);if(page==='assets')bindAssets(state,refresh);if(page==='settings'){bindSettings(state,refresh);bindSettingsEdits();}document.dispatchEvent(new CustomEvent('household:rendered',{detail:{page}}))}
async function boot(user){state.user=user;setState(await loadHousehold(user.id));window.__household_state=state;render('home')}
supabase.auth.getSession().then(({data:{session}})=>session?boot(session.user):renderLogin());
supabase.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_IN'&&session)boot(session.user);if(event==='SIGNED_OUT')renderLogin()});
