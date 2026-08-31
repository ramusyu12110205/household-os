import { layout } from '../../components/layout.js';
import { $,yen,esc,billingMonth } from '../../core/utils.js';
import { supabase } from '../../core/supabase.js';

export function renderHistory(s){
  const rows=[...s.transactions].sort((a,b)=>String(b.transaction_date).localeCompare(String(a.transaction_date))||String(b.created_at||'').localeCompare(String(a.created_at||'')));
  return layout('💰 家計簿OS','history',`<section class="card"><div class="between"><div><h2>📋 履歴</h2><div class="muted small">${rows.length}件</div></div><button class="primary" data-page="input">＋ 記録</button></div><div class="list">${rows.map(t=>`<div class="list-item"><div class="between"><div><b>${esc(t.description)}</b><div class="muted small">${esc(t.transaction_date)} ・ ${esc(t.category_name||'その他')} ・ ${esc(t.payment_method_name||'')} ・ ${esc(t.process_type||'normal')}</div></div><b>${yen(t.amount)}</b></div><div class="row"><span class="badge">実決済 ${yen(t.actual_payment??Math.max(0,Number(t.amount||0)-Number(t.points_used||0)))}</span>${t.billing_year_month?`<span class="badge">請求 ${esc(String(t.billing_year_month).slice(0,7))}</span>`:''}${t.from_account_id||t.to_account_id?`<span class="badge">資産移動</span>`:''}<button class="secondary" data-edit-tx="${t.id}">編集</button><button class="danger" data-delete-tx="${t.id}">削除</button></div></div>`).join('')||'<p class="muted">まだ記録がありません。</p>'}</div></section>`)
}

export function bindHistory(refresh){
  document.querySelectorAll('[data-delete-tx]').forEach(b=>b.onclick=async()=>{if(!confirm('この記録を削除しますか？'))return;const{error}=await supabase.from('household_transactions').delete().eq('id',b.dataset.deleteTx);if(error)return alert(error.message);await refresh('history')});
  document.querySelectorAll('[data-edit-tx]').forEach(b=>b.onclick=()=>editTx(safeTx(b.dataset.editTx),refresh));
}
function safeTx(id){return window.__household_state?.transactions?.find(t=>String(t.id)===String(id))}

async function editTx(t,refresh){
  if(!t)return alert('編集対象を取得できませんでした。');
  const description=prompt('内容',t.description??'');
  if(description===null)return;
  const date=prompt('取引日（YYYY-MM-DD）',t.transaction_date??'');
  if(date===null)return;
  const amountText=prompt('金額',String(t.amount??0));
  if(amountText===null)return;
  const pointsText=prompt('ポイント利用',String(t.points_used??0));
  if(pointsText===null)return;
  const amount=Number(amountText),points=Number(pointsText);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!date||amountText.trim()===''||!Number.isFinite(amount)||amount<=0||!Number.isFinite(points)||points<0||points>amount||!description.trim())return alert('取引日・内容・金額・ポイントを確認してください。');
  const update={description:description.trim(),transaction_date:date,amount,points_used:points,effect_amount:Math.max(0,amount-points)};
  if(t.billing_card_id&&['normal','charge'].includes(t.process_type))update.billing_year_month=billingMonth(date,{id:t.billing_card_id});
  const{error}=await supabase.from('household_transactions').update(update).eq('id',t.id);
  if(error)return alert('更新失敗：'+error.message);
  await refresh('history')
}
