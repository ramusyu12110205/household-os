import { layout } from '../../components/layout.js';
import { $,currentMonth,toMonth,yen,esc } from '../../core/utils.js';
import { isExpense,isIncome,isAssetMove,actualAmount } from '../../core/transactionRules.js';
import { supabase } from '../../core/supabase.js';

export function renderMonthly(s){
  const m=toMonth(s.settings?.target_year_month)||currentMonth();
  const rows=s.transactions.filter(t=>toMonth(t.transaction_date)===m);
  const expenses=rows.filter(t=>isExpense(t.process_type));
  const income=rows.filter(t=>isIncome(t.process_type));
  const assetMoves=rows.filter(t=>isAssetMove(t.process_type));
  const transfers=rows.filter(t=>t.process_type==='transfer');
  const total=expenses.reduce((a,t)=>a+actualAmount(t.amount,t.points_used),0);
  const incomeTotal=income.reduce((a,t)=>a+actualAmount(t.amount,t.points_used),0);
  const moveTotal=assetMoves.reduce((a,t)=>a+actualAmount(t.amount,t.points_used),0);
  const cats={};
  expenses.forEach(t=>cats[t.category_name||'その他']=(cats[t.category_name||'その他']||0)+actualAmount(t.amount,t.points_used));
  const budgets=s.budgets.filter(b=>toMonth(b.year_month)===m);
  const budgetMap=new Map(budgets.map(b=>[b.category_name,Number(b.amount||0)]));
  const visibleCategories=[...new Set([...Object.keys(cats),...budgets.map(b=>b.category_name)])].sort((a,b)=>(cats[b]||0)-(cats[a]||0));
  const budgetTotal=budgets.reduce((a,b)=>a+Number(b.amount||0),0);
  const rowsHtml=visibleCategories.map(n=>{
    const actual=cats[n]||0, budget=budgetMap.has(n)?budgetMap.get(n):null, diff=budget===null?null:budget-actual;
    const pct=budget&&budget>0?Math.min(100,Math.round(actual/budget*100)):0;
    return `<div class="list-item"><div class="between"><b>${esc(n)}</b><span>${yen(actual)}${budget!==null?` / ${yen(budget)}`:''}</span></div><div class="muted small" style="margin-top:4px">${budget===null?'予算未設定':`予算 ${yen(budget)} ／ ${diff>=0?'残り':'超過'} ${yen(Math.abs(diff))}`}</div>${budget!==null&&budget>0?`<div style="height:7px;background:var(--border,#e5e7eb);border-radius:99px;overflow:hidden;margin-top:7px"><div style="width:${pct}%;height:100%;background:${diff<0?'#ef4444':'#2563eb'}"></div></div>`:''}<div class="row" style="margin-top:7px"><input type="number" min="0" step="1000" value="${budget===null?'':budget}" placeholder="予算額" data-budget-input="${esc(n)}" style="max-width:150px"><button class="secondary" data-budget-save="${esc(n)}">${budget===null?'予算を設定':'予算を更新'}</button></div></div>`;
  }).join('');
  return layout('💰 家計簿OS','monthly',`<section class="card"><div class="between"><div><div class="muted small">対象年月</div><h2>${esc(m)}</h2></div><input id="month-picker" type="month" value="${esc(m)}" style="width:150px"></div><div class="stats"><div class="stat"><span class="stat-label">収入・借入</span><span class="stat-value">${yen(incomeTotal)}</span></div><div class="stat"><span class="stat-label">実支出</span><span class="stat-value">${yen(total)}</span></div><div class="stat"><span class="stat-label">資産移動・返済</span><span class="stat-value">${yen(moveTotal)}</span></div></div><div class="stat" style="margin-top:10px"><span class="stat-label">家計収支（収入・借入−実支出）</span><span class="stat-value">${yen(incomeTotal-total)}</span></div><div class="muted small" style="margin-top:8px">振替 ${transfers.length}件・家計収支には含めません</div></section><section class="card"><div class="between"><h3>予算 vs 実績</h3><span class="muted small">この月だけを管理</span></div>${rowsHtml||'<p class="muted">支出または予算がありません。</p>'}</section><section class="card"><h3>今月の予算</h3><div class="between"><span>予算合計</span><b>${yen(budgetTotal)}</b></div><div class="between"><span>実績</span><b>${yen(total)}</b></div><div class="between"><span>残額</span><b>${yen(budgetTotal-total)}</b></div><div class="muted small" style="margin-top:8px">カード引落・チャージ・振替などの資産移動は実績に含めません。</div></section>`);
}

export function bindMonthly(state,refresh){
  document.querySelector('#month-picker')?.addEventListener('change',async e=>{
    const month=e.target.value;if(!month)return;
    if(!state?.user?.id)return alert('ログイン情報を確認してください。');
    const {error}=await supabase.from('household_settings').upsert({user_id:state.user.id,target_year_month:month+'-01'},{onConflict:'user_id'});
    if(error){console.error('household settings month update failed',error);return alert(`対象年月の更新に失敗しました\n${error.message}`)}
    await refresh('monthly');
  });
  document.querySelectorAll('[data-budget-save]').forEach(btn=>btn.addEventListener('click',async()=>{
    const category=btn.dataset.budgetSave;
    const input=document.querySelector(`[data-budget-input="${CSS.escape(category)}"]`);
    const amount=Number(input?.value||0);
    const m=toMonth(state.settings?.target_year_month)||currentMonth();
    if(!category||!Number.isFinite(amount)||amount<0)return alert('カテゴリと予算額を確認してください。');
    const {error}=await supabase.from('household_budgets').upsert({user_id:state.user.id,year_month:m+'-01',category_name:category,amount},{onConflict:'user_id,year_month,category_name'});
    if(error){console.error('budget save failed',error);return alert(`予算の保存に失敗しました\n${error.message}`)}
    await refresh('monthly');
  }));
}
