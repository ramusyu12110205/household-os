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
  return false;
}
function nextBusinessDay(date){const d=new Date(date);while(d.getDay()===0||d.getDay()===6||isBankHoliday(d))d.setDate(d.getDate()+1);return d}
function salaryCycle(from,offset=0){
  const d=new Date(from);d.setHours(0,0,0,0);
  const start=new Date(d.getFullYear(),d.getMonth(),10);
  if(d<start)start.setMonth(start.getMonth()-1);
  start.setMonth(start.getMonth()+offset);
  const end=new Date(start.getFullYear(),start.getMonth()+1,10);
  return {start,end};
}
function billingWithdrawalDate(billingMonth,card){
  if(!billingMonth||!card)return null;
  const [y,m]=String(billingMonth).slice(0,7).split('-').map(Number);
  if(!y||!m)return null;
  const day=Math.min(Number(card.withdrawal_day||26),new Date(y,m,0).getDate());
  return nextBusinessDay(new Date(y,m-1,day));
}
function cycleLabel(start,end){return `${start.getMonth()+1}/${start.getDate()}〜${end.getMonth()+1}/${end.getDate()-1}`}

export function renderHome(s){
  const m=toMonth(s.settings?.target_year_month)||currentMonth();
  const rows=s.transactions.filter(t=>toMonth(t.transaction_date)===m);
  const income=rows.filter(t=>isIncome(t.process_type)).reduce((a,t)=>a+actualAmount(t.amount,t.points_used),0);
  const expense=rows.filter(t=>isExpense(t.process_type)).reduce((a,t)=>a+actualAmount(t.amount,t.points_used),0);
  const move=rows.filter(t=>isAssetMove(t.process_type)).reduce((a,t)=>a+actualAmount(t.amount,t.points_used),0);
  const b=calculateBalances(s);
  const assets=b.accounts.reduce((a,x)=>a+Number(x.balance||0),0);
  const debt=b.cards.reduce((a,x)=>a+Math.max(0,Number(x.balance||0)),0);
  const baseDate=new Date(today()+'T00:00:00');
  const cycles=[0,1,2].map(offset=>salaryCycle(baseDate,offset));
  const payments=[];
  s.cards.forEach(card=>{
    const groups=new Map();
    s.transactions.forEach(t=>{
      if(String(t.billing_card_id)!==String(card.id)||!t.billing_year_month||t.process_type==='card_payment')return;
      const amount=actualAmount(t.amount,t.points_used);
      if(amount<=0)return;
      const key=String(t.billing_year_month).slice(0,7);
      groups.set(key,(groups.get(key)||0)+amount);
    });
    groups.forEach((amount,billingMonth)=>{
      const scheduled=billingWithdrawalDate(billingMonth,card);
      if(!scheduled)return;
      const cycleIndex=cycles.findIndex(c=>scheduled>=c.start&&scheduled<c.end);
      if(cycleIndex>=0)payments.push({date:scheduled,name:card.name,amount,type:'カード引落',billingMonth,cycleIndex});
    });
  });
  payments.sort((a,b)=>a.date-b.date||b.amount-a.amount);
  const cycleBlocks=cycles.map((cycle,index)=>{
    const items=payments.filter(x=>x.cycleIndex===index);
    const total=items.reduce((a,x)=>a+x.amount,0);
    const detail=items.map(x=>`<div class="list-item"><div class="between"><div><b>${esc(x.name)}</b><div class="muted small">引落日：${dateText(x.date)}</div></div><b>${yen(x.amount)}</b></div></div>`).join('')||'<p class="muted">この給与サイクルのカード引落予定はありません。</p>';
    return `<div class="list-item" style="cursor:pointer" onclick="this.nextElementSibling.hidden=!this.nextElementSibling.hidden"><div class="between"><div><b>${index===0?'今期':index===1?'翌月':'翌々月'}の支払い予定</b><div class="muted small">${cycleLabel(cycle.start,cycle.end)}</div></div><b>${yen(total)}</b></div></div><div hidden style="padding:0 10px 8px">${detail}</div>`;
  }).join('');
  const recent=[...rows].sort((a,b)=>String(b.transaction_date).localeCompare(String(a.transaction_date))||String(b.created_at||'').localeCompare(String(a.created_at||''))).slice(0,8);
  return layout('💰 家計簿OS','home',`
    <section class="card"><div class="between"><div><div class="muted small">対象年月</div><h2>${esc(m)}</h2></div><button class="primary" data-page="input">＋ 記録</button></div>
      <div class="stats"><div class="stat"><span class="stat-label">収入・借入</span><span class="stat-value">${yen(income)}</span></div><div class="stat"><span class="stat-label">実支出</span><span class="stat-value">${yen(expense)}</span></div><div class="stat"><span class="stat-label">資産移動・返済</span><span class="stat-value">${yen(move)}</span></div></div>
      <div class="stat" style="margin-top:10px"><span class="stat-label">家計収支（収入・借入−実支出）</span><span class="stat-value">${yen(income-expense)}</span></div>
      <div class="muted small" style="margin-top:8px">資産移動・返済は家計収支には含めません</div>
    </section>
    <section class="card"><h3>📅 次回支払い予定</h3><p class="muted small">給料日（10日）区切りの支払い予定です。各期間をタップするとカードごとの内訳と引落日を確認できます。</p>${cycleBlocks}</section>
    <section class="card"><div class="between"><h3>現在の資産・負債</h3><button class="light" data-page="assets">詳細</button></div>
      <div class="stats"><div class="stat"><span class="stat-label">資産</span><span class="stat-value">${yen(assets)}</span></div><div class="stat"><span class="stat-label">カード負債</span><span class="stat-value">${yen(debt)}</span></div><div class="stat"><span class="stat-label">純資産</span><span class="stat-value">${yen(assets-debt)}</span></div></div>
    </section>
    <section class="card"><h3>最近の記録</h3>${recent.map(t=>`<div class="list-item"><div class="between"><b>${esc(t.description)}</b><b>${yen(t.amount)}</b></div><div class="muted small">${esc(t.transaction_date)} ・ ${esc(t.category_name||'その他')} ・ ${esc(t.payment_method_name||'')}</div></div>`).join('')||'<p class="muted">まだ記録がありません。</p>'}</section>`)
}
