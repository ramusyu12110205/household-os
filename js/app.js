import { supabase } from './core/supabase.js';
import { state,setState } from './core/state.js';
import { loadHousehold } from './core/data-fresh.js';
import { $ } from './core/utils.js';
import { renderLogin } from './features/auth.js';
import { renderHome } from './features/home.js?v=20260907b';
import { renderInput,bindInput } from './features/transactions/input.js?v=20260907f';
import { renderHistory,bindHistory } from './features/transactions/history.js?v=20260907b';
import { renderMonthly,bindMonthly } from './features/budgets/monthly.js';
import { renderCards } from './features/credit/cards.js';
import { renderAssets,bindAssets } from './features/assets/assets-v2.js?v=20260909';
import { renderSettings,bindSettings } from './features/settings/settings.js?v=20260909';
import { enhanceCategoryOrder } from './features/settings/category-order.js?v=20260908';
import { enhanceMasterOrder } from './features/settings/master-order.js?v=20260908';
import { enhanceSummaryPaymentLinks } from './features/settings/summary-payment-link.js?v=20260908';
import { enhanceContentSummaryLinks } from './features/settings/content-summary-link.js?v=20260909';
import { enhanceContentSummaryFilter } from './features/transactions/content-summary-filter.js?v=20260909';
const pages={home:renderHome,input:renderInput,history:renderHistory,monthly:renderMonthly,cards:renderCards,assets:renderAssets,settings:renderSettings};
function sortMasterState(s){['summaries','payments','cards','accounts','categories'].forEach(key=>{if(Array.isArray(s[key]))s[key].sort((a,b)=>Number(a.sort_order??999999)-Number(b.sort_order??999999)||String(a.name).localeCompare(String(b.name),'ja'));});return s;}
export async function refresh(page='home'){setState(sortMasterState(await loadHousehold(state.user.id)));window.__household_state=state;render(page)}
export function render(page='home'){window.__household_state=state;const fn=pages[page]||pages.home;$("app").innerHTML=fn(state);bind(page)}
function bindEnterToNextInput(){const root=document.getElementById('app');if(!root)return;root.addEventListener('keydown',e=>{if(e.key!=='Enter'||e.isComposing||!e.target.matches('input,select'))return;const target=e.target,fields=[...root.querySelectorAll('input,select')].filter(el=>!el.disabled&&el.type!=='hidden'&&el.offsetParent!==null),index=fields.indexOf(target);if(index<0)return;e.preventDefault();const next=fields[index+1];if(next){next.focus();if(next.tagName==='SELECT'&&typeof next.showPicker==='function'){try{next.showPicker()}catch(_){}}else if(next.tagName==='INPUT'&&next.type!=='date'&&next.select)next.select();return;}document.getElementById('tx-save')?.click();});}
function bind(page){document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>render(b.dataset.page));document.querySelector('[data-action="logout"]')?.addEventListener('click',()=>supabase.auth.signOut());if(page==='input'){bindInput(state,()=>render('input'));bindEnterToNextInput();enhanceContentSummaryFilter(state)}if(page==='history')bindHistory(render);if(page==='monthly')bindMonthly(state,refresh);if(page==='assets')bindAssets(state,refresh);if(page==='settings'){bindSettings(state,refresh);enhanceCategoryOrder(state,refresh);enhanceMasterOrder(state,refresh);enhanceSummaryPaymentLinks(state,refresh);enhanceContentSummaryLinks(state,refresh)}document.dispatchEvent(new CustomEvent('household:rendered',{detail:{page}}))}
async function boot(user){state.user=user;setState(sortMasterState(await loadHousehold(user.id)));window.__household_state=state;render('home')}
supabase.auth.getSession().then(({data:{session}})=>session?boot(session.user):renderLogin());
supabase.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_IN'&&session&&!state.user)boot(session.user);if(event==='SIGNED_OUT'){state.user=null;renderLogin()}});
