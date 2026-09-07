import { layout } from '../components/layout.js';
import { currentMonth,toMonth,yen,esc,today } from '../core/utils.js';
import { isExpense,isIncome,isAssetMove,actualAmount } from '../core/transactionRules.js';
import { calculateBalances } from '../core/balance.js';

function pad(n){return String(n).padStart(2,'0')}
function dateText(d){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
function isBankHoliday(d){
  const y=d.getFullYear(),m=d.getMonth()+1,day=d.getDate();
  if((m===1&&day<=3)||(m===12&&day>=31))return true;
  const fixed=[`1-1`,`2-11`,`2-23`,`4-29`,`5-3`,`5-4`,`5-5`,`11-3`,`11-23`];
  if(fixed.includes(`${m}-${day}`))return true;
  const nth=(month,weekday,n)=>{if(m!==month)return false;const first=new Date(y,month-1,1).getDay();return day===1+((weekday-first+7)%7)+7*(n-1)};
  if(nth(1,1,2)||nth(7,1,3)||nth(9,1,3)||nth(10,1,2))return true;
  const vernal=Math.floor(20.8431+0.242194*(y-1980)-Math.floor((y-1980)/4));
  const autumnal=Math.floor(23.2488+0.242194*(y-1980)-Math.floor((y-1980)/4));
  if((m===3&&day===vernal)||(m===9&&day===autumnal))return true;
  return d.getDay()===0;
}
function nextBusinessDay(date){const d=new Date(date);while(d.getDay()===0||d.getDay()===6||isBankHoliday(d))d.setDate(d.getDate()+1);return d}
function nextDateOnOrAfter(day,from){const d=new Date(from);d.setHours(0,0,0,0);d.setDate(day);if(d<from){d.setMonth(d.getMonth()+1);d.setDate(day)}return d}
function nextSalaryDate(from){const d=new Date(from);d.setHours(0,0,0,0);if(d.getDate()>10){d.setMonth(d.getMonth()+1);d.setDate(10)}else d.setDate(10);return d}

export function renderHome(s){
  const m=toMonth(s.settings?.target_year_month)||currentMonth();
  const rows=s.transactions.filter(t=>toMonth(t.transaction_date)===m);
  const income=rows.filter(t=>isIncome(t.process_type)).reduce((a,t)=>a+actualAmount(t.amount,t.points_used),0);
  const expense=rows.filter(t=>isExpense(t.process_type)).reduce((a,t)=>a+actualAmount(t.amount,t.points_used),0);
  const move=rows.filter(t=>isAssetMove(t.process_type)).reduce((a,t)=>a+actualAmount(t.amount,t.points_used),0);
  const b=calculateBalances(s);
  const assets=b.accounts.reduce((a,x)=>a+Number(x.balance||0),0);
  const debt=b.cards.reduce((a,x)=>a+Math.max(0,Number(x.balance||0)),0);
  const now=new Date(today()+'T00:00:00');
  const salary=nextSalaryDate(now);
  const windowEnd=new Date(salary);windowEnd.setHours(23,59,59,999);
  const payments=[];
  b.cards.forEach(card=>{
    const balance=Math.max(0,Number(card.balance||0));if(!balance)return;
    const scheduled=nextBusinessDay(nextDateOnOrAfter(Number(card.withdrawal_day||26),now));
    if(scheduled>=now&&scheduled<=windowEnd)payments.push({date:scheduled,name:card.name,amount:balance,type:'カード引落'});
  });
  s.transactions.filter(t=>t.process_type==='repayment').forEach(t=>{
    const d=new Date(`${t.transaction_date}T00:00:00`),amount=actualAmount(t.amount,t.points_used);
    if(d>=now&&d<=windowEnd&&amount>0)payments.push({date:d,name:t.description,amount,type:'借入返済'});
  });
  payments.sort((a,b)=>a.date-b.date||b.amount-a.amount);
  const plannedTotal=payments.reduce((a,x)=>a+x.amount,0);
  const recent=[...rows].sort((a,b)=>String(b.transaction_date).localeCompare(String(a.transaction_date))||String(b.created_at||'').localeCompare(String(a.created_at||''))).slice(0,8);
  return layout('💰 家計簿OS','home',`
    <section class="card"><div class="between"><div><div class="muted small">対象年月</div><h2>${esc(m)}</h2></div><button class="primary" data-page="input">＋ 記録</button></div>
      <div class="stats"><div class="stat"><span class="stat-label">収入・借入</span><span class="stat-value">${yen(income)}</span></div><div class="stat"><span class="stat-label">実支出</span><span class="stat-value">${yen(expense)}</span></div><div class="stat"><span class="stat-label">資産移動・返済</span><span class="stat-value">${yen(move)}</span></div></div>
      <div class="stat" style="margin-top:10px"><span class="stat-label">家計収支（収入・借入−実支出）</span><span class="stat-value">${yen(income-expense)}</span></div>
      <div class="muted small" style="margin-top:8px">資産移動・返済は家計収支には含めません</div>
    </section>
    <section class="card"><h3>📅 次回支払い予定</h3><p class="muted small">次の給料日（10日）までに出ていく予定額です。土日祝に当たる引落しは翌営業日に繰り越します。</p>${payments.map(x=>`<div class="list-item"><div class="between"><div><b>${esc(x.name)}</b><div class="muted small">${dateText(x.date)} ・ ${esc(x.type)}</div></div><b>${yen(x.amount)}</b></div></div>`).join('')||'<p class="muted">次の10日までの支払い予定はありません。</p>'}<div class="stat" style="margin-top:10px"><span class="stat-label">予定支出合計</span><span class="stat-value">${yen(plannedTotal)}</span></div></section>
    <section class="card"><div class="between"><h3>現在の資産・負債</h3><button class="light" data-page="assets">詳細</button></div>
      <div class="stats"><div class="stat"><span class="stat-label">資産</span><span class="stat-value">${yen(assets)}</span></div><div class="stat"><span class="stat-label">カード負債</span><span class="stat-value">${yen(debt)}</span></div><div class="stat"><span class="stat-label">純資産</span><span class="stat-value">${yen(assets-debt)}</span></div></div>
    </section>
    <section class="card"><h3>最近の記録</h3>${recent.map(t=>`<div class="list-item"><div class="between"><b>${esc(t.description)}</b><b>${yen(t.amount)}</b></div><div class="muted small">${esc(t.transaction_date)} ・ ${esc(t.category_name||'その他')} ・ ${esc(t.payment_method_name||'')}</div></div>`).join('')||'<p class="muted">まだ記録がありません。</p>'}</section>`)
}
