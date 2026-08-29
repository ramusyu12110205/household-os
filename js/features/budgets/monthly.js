import { layout } from '../../components/layout.js';
import { $,currentMonth,toMonth,yen,esc } from '../../core/utils.js';
import { isExpense,actualAmount } from '../../core/transactionRules.js';
import { supabase } from '../../core/supabase.js';

export function renderMonthly(s){
  const m=toMonth(s.settings?.target_year_month)||currentMonth();
  const rows=s.transactions.filter(t=>toMonth(t.transaction_date)===m);
  const expenses=rows.filter(t=>isExpense(t.process_type));
  const income=rows.filter(t=>['income','borrowing'].includes(t.process_type));
  const repay=rows.filter(t=>['repayment','card_payment'].includes(t.process_type));
  const transfers=rows.filter(t=>t.process_type==='transfer');
  const total=expenses.reduce((a,t)=>a+actualAmount(t.amount,t.points_used),0);
  const incomeTotal=income.reduce((a,t)=>a+actualAmount(t.amount,t.points_used),0);
  const repayTotal=repay.reduce((a,t)=>a+actualAmount(t.amount,t.points_used),0);
  const cats={};
  expenses.forEach(t=>cats[t.category_name||'その他']=(cats[t.category_name||'その他']||0)+actualAmount(t.amount,t.points_used));
  const budgets=s.budgets.filter(b=>toMonth(b.year_month)===m);
  const budgetTotal=budgets.reduce((a,b)=>a+Number(b.amount||0),0);
  return layout('💰 家計簿OS','monthly',`<section class="card"><div class="between"><div><div class="muted small">対象年月</div><h2>${esc(m)}</h2></div><input id="month-picker" type="month" value="${esc(m)}" style="width:150px"></div><div class="stats"><div class="stat"><span class="stat-label">収入</span><span class="stat-value">${yen(incomeTotal)}</span></div><div class="stat"><span class="stat-label">支出</span><span class="stat-value">${yen(total)}</span></div><div class="stat"><span class="stat-label">返済</span><span class="stat-value">${yen(repayTotal)}</span></div></div><div class="stat" style="margin-top:10px"><span class="stat-label">家計収支（収入−支出−返済）</span><span class="stat-value">${yen(incomeTotal-total-repayTotal)}</span></div><div class="muted small" style="margin-top:8px">振替 ${transfers.length}件・家計収支には含めません</div></section><section class="card"><h3>カテゴリ別支出</h3>${Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([n,v])=>{const b=budgets.find(x=>x.category_name===n),diff=b?Number(b.amount)-v:null;return `<div class="list-item"><div class="between"><b>${esc(n)}</b><b>${yen(v)}</b></div><div class="muted small">予算 ${b?yen(b.amount):'—'} ${diff!==null?'／ 残 '+yen(diff):''}</div></div>`}).join('')||'<p class="muted">支出なし</p>'}</section><section class="card"><h3>予算</h3><div class="between"><span>予算合計</span><b>${yen(budgetTotal)}</b></div><div class="between"><span>残額</span><b>${yen(budgetTotal-total)}</b></div></section>`);
}

export function bindMonthly(s,refresh){
  $('month-picker')?.addEventListener('change',async e=>{
    const month=e.target.value;
    if(!month)return;
    const {error}=await supabase.from('household_settings').upsert({user_id:s.user.id,target_year_month:month+'-01'},{onConflict:'user_id'});
    if(error){console.error('household settings month update failed',error);return alert(`対象年月の更新に失敗しました\n${error.message}`)}
    s.settings={...(s.settings||{}),target_year_month:month+'-01'};
    await refresh('monthly');
  });
}
