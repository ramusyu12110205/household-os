import { supabase } from './core/supabase.js';
import { state,setState } from './core/state.js';
import { loadHousehold } from './core/data.js';
import { $ } from './core/utils.js';
import { renderLogin } from './features/auth.js';
import { renderHome } from './features/home.js';
import { renderInput,bindInput } from './features/transactions/input.js';
import { renderHistory,bindHistory } from './features/transactions/history.js';
import { renderMonthly } from './features/budgets/monthly.js';
import { renderCards } from './features/credit/cards.js';
import { renderAssets } from './features/assets/assets.js';
import { renderSettings } from './features/settings/settings.js';
const pages={home:renderHome,input:renderInput,history:renderHistory,monthly:renderMonthly,cards:renderCards,assets:renderAssets,settings:renderSettings};
export async function refresh(page='home'){setState(await loadHousehold(state.user.id));render(page)}
export function render(page='home'){const fn=pages[page]||pages.home;$("app").innerHTML=fn(state);bind(page)}
function bind(page){document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>render(b.dataset.page));document.querySelector('[data-action="logout"]')?.addEventListener('click',()=>supabase.auth.signOut());if(page==='input')bindInput(state,()=>refresh('home'));if(page==='history')bindHistory(()=>refresh('history'));document.dispatchEvent(new CustomEvent('household:rendered',{detail:{page}}))}
async function boot(user){state.user=user;setState(await loadHousehold(user.id));render('home')}
supabase.auth.getSession().then(({data:{session}})=>session?boot(session.user):renderLogin());
supabase.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_IN'&&session)boot(session.user);if(event==='SIGNED_OUT')renderLogin()});
