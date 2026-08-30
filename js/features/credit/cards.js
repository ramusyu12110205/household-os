import { layout } from '../../components/layout.js';
import { currentMonth,toMonth,addMonths,yen,esc } from '../../core/utils.js';

export function renderCards(s){
  const m=toMonth(s.settings?.target_year_month)||currentMonth();
  const months=[m,addMonths(m,1),addMonths(m,2)];
  const cards=s.cards;
  return layout('💰 家計簿OS','cards',`<section class="card"><h2>💳 カード請求</h2><p class="muted small">利用日は支出、請求・引落は負債決済として扱います。請求額は利用履歴から算出します。</p>${months.map(x=>{const rows=s.transactions.filter(t=>toMonth(t.billing_year_month)===x&&t.billing_card_id&&['normal','income','borrowing'].includes(t.process_type));const sum=rows.reduce((a,t)=>a+Number(t.actual_payment??Math.max(0,Number(t.amount||0)-Number(t.points_used||0))),0);return `<section class="card"><div class="between"><h3>${esc(x)}</h3><b>${yen(sum)}</b></div>${cards.map(c=>{const cr=rows.filter(t=>String(t.billing_card_id)===String(c.id)),cs=cr.reduce((a,t)=>a+Number(t.actual_payment??Math.max(0,Number(t.amount||0)-Number(t.points_used||0))),0);return `<div class="list-item"><div class="between"><b>${esc(c.name)}</b><b>${yen(cs)}</b></div>${cr.map(t=>`<div class="small muted">${esc(t.transaction_date)} ・ ${esc(t.description)} ・ ${yen(t.actual_payment??Math.max(0,Number(t.amount||0)-Number(t.points_used||0)))}</div>`).join('')||'<div class="small muted">利用なし</div>'}</div>`}).join('')}</section>`}).join('')}</section>`)}
