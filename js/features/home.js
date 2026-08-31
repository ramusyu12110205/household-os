import { layout } from '../components/layout.js';
import { currentMonth,toMonth,yen,esc } from '../core/utils.js';
import { isExpense,isIncome,isAssetMove,actualAmount } from '../core/transactionRules.js';
import { calculateBalances } from '../core/balance.js';

export function renderHome(s){
  const m=toMonth(s.settings?.target_year_month)||currentMonth();
  const rows=s.transactions.filter(t=>toMonth(t.transaction_date)===m);
  const income=rows.filter(t=>isIncome(t.process_type)).reduce((a,t)=>a+actualAmount(t.amount,t.points_used),0);
  const expense=rows.filter(t=>isExpense(t.process_type)).reduce((a,t)=>a+actualAmount(t.amount,t.points_used),0);
  const move=rows.filter(t=>isAssetMove(t.process_type)).reduce((a,t)=>a+actualAmount(t.amount,t.points_used),0);
  const b=calculateBalances(s);
  const assets=b.accounts.reduce((a,x)=>a+Number(x.balance||0),0);
  const debt=b.cards.reduce((a,x)=>a+Math.max(0,Number(x.balance||0)),0);
  const recent=[...rows].sort((a,b)=>String(b.transaction_date).localeCompare(String(a.transaction_date))||String(b.created_at||'').localeCompare(String(a.created_at||''))).slice(0,8);
  return layout('💰 家計簿OS','home',`
    <section class="card"><div class="between"><div><div class="muted small">対象年月</div><h2>${esc(m)}</h2></div><button class="primary" data-page="input">＋ 記録</button></div>
      <div class="stats"><div class="stat"><span class="stat-label">収入・借入</span><span class="stat-value">${yen(income)}</span></div><div class="stat"><span class="stat-label">実支出</span><span class="stat-value">${yen(expense)}</span></div><div class="stat"><span class="stat-label">資産移動・返済</span><span class="stat-value">${yen(move)}</span></div></div>
      <div class="stat" style="margin-top:10px"><span class="stat-label">家計収支（収入・借入−実支出）</span><span class="stat-value">${yen(income-expense)}</span></div>
      <div class="muted small" style="margin-top:8px">資産移動・返済は家計収支には含めません</div>
    </section>
    <section class="card"><div class="between"><h3>現在の資産・負債</h3><button class="light" data-page="assets">詳細</button></div>
      <div class="stats"><div class="stat"><span class="stat-label">資産</span><span class="stat-value">${yen(assets)}</span></div><div class="stat"><span class="stat-label">カード負債</span><span class="stat-value">${yen(debt)}</span></div><div class="stat"><span class="stat-label">純資産</span><span class="stat-value">${yen(assets-debt)}</span></div></div>
    </section>
    <section class="card"><h3>最近の記録</h3>${recent.map(t=>`<div class="list-item"><div class="between"><b>${esc(t.description)}</b><b>${yen(t.amount)}</b></div><div class="muted small">${esc(t.transaction_date)} ・ ${esc(t.category_name||'その他')} ・ ${esc(t.payment_method_name||'')}</div></div>`).join('')||'<p class="muted">まだ記録がありません。</p>'}</section>`)
}
