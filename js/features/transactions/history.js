import { layout } from '../../components/layout.js';
import { $,yen,esc,billingMonth } from '../../core/utils.js';
import { supabase } from '../../core/supabase.js';

export function renderHistory(s){
  const rows=[...s.transactions].sort((a,b)=>String(b.transaction_date).localeCompare(String(a.transaction_date))||String(b.created_at||'').localeCompare(String(a.created_at||'')));
  return layout('💰 家計簿OS','history',`<section class="card"><div class="between"><div><h2>📋 履歴</h2><div class="muted small">${rows.length}件</div></div><button class="primary" data-page="input">＋ 記録</button></div><div class="list">${rows.map(t=>`<div class="list-item"><div class="between"><div><b>${esc(t.description)}</b><div class="muted small">${esc(t.transaction_date)} ・ ${esc(t.category_name||'その他')} ・ ${esc(t.payment_method_name||'')} ・ ${esc(t.process_type||'normal')}</div></div><b>${yen(t.amount)}</b></div><div class="row"><span class="badge">実決済 ${yen(t.actual_payment??Math.max(0,Number(t.amount||0)-Number(t.points_used||0)))}</span>${t.billing_year_month?`<span class="badge">請求 ${esc(String(t.billing_year_month).slice(0,7))}</span>`:''}${t.from_account_id||t.to_account_id?`<span class="badge">資産移動</span>`:''}<button class="secondary" data-edit-tx="${t.id}">編集</button><button class="danger" data-delete-tx="${t.id}">削除</button></div></div>`).join('')||'<p class="muted">まだ記録がありません。</p>'}</div></section>`)
}

export function bindHistory(render){
  document.querySelectorAll('[data-delete-tx]').forEach(b=>b.onclick=async()=>{
    if(!confirm('この記録を削除しますか？'))return;
    const{error}=await supabase.from('household_transactions').delete().eq('id',b.dataset.deleteTx);
    if(error)return alert(error.message);
    const state=window.__household_state;
    if(state?.transactions)state.transactions=state.transactions.filter(t=>String(t.id)!==String(b.dataset.deleteTx));
    render('history');
  });
  document.querySelectorAll('[data-edit-tx]').forEach(b=>b.onclick=()=>editTx(safeTx(b.dataset.editTx),render));
}
function safeTx(id){return window.__household_state?.transactions?.find(t=>String(t.id)===String(id))}

function optionList(items,value,labelFn){return items.map(x=>`<option value="${esc(String(x.id))}" ${String(x.id)===String(value)?'selected':''}>${esc(labelFn(x))}</option>`).join('')}
function accountList(s,value){return `<option value="">選択してください</option>${optionList(s.accounts.filter(x=>x.account_type!=='liability'),value,x=>x.name)}`}
function liabilityList(s,value){return `<option value="">選択してください</option>${optionList(s.accounts.filter(x=>x.account_type==='liability'),value,x=>x.name)}`}
function cardList(s,value){return `<option value="">選択してください</option>${optionList(s.cards,value,x=>x.name)}`}
function summaryList(s,value){return `<option value="">選択してください</option>${optionList(s.summaries,value,x=>x.name)}`}
function sourceList(s,t){
  const accountId=t.account_id||t.from_account_id||null;
  const cardId=t.billing_card_id||null;
  return `<option value="">選択してください</option><optgroup label="口座・現金・電子マネー">${optionList(s.accounts.filter(x=>x.account_type!=='liability'),accountId,x=>x.name).replace(/<option value="">選択してください<\/option>/,'')}</optgroup><optgroup label="クレジットカード">${optionList(s.cards,cardId,x=>x.name).replace(/<option value="">選択してください<\/option>/,'').replace(/value="/g,'value="card:')}</optgroup>`
}
function sourceValue(t){
  if(t.billing_card_id)return `card:${t.billing_card_id}`;
  if(t.account_id)return `account:${t.account_id}`;
  if(t.from_account_id)return `account:${t.from_account_id}`;
  return '';
}
function targetFields(s,t,summary){
  const p=summary?.process_type;
  if(p==='transfer')return `<label>移動先</label><select id="et-to-account">${accountList(s,t.to_account_id)}</select>`;
  if(p==='borrowing')return `<label>入金先口座</label><select id="et-target-account">${accountList(s,t.account_id||t.target_account_id)}</select><label>借入先負債</label><select id="et-target-liability">${liabilityList(s,t.target_account_id)}</select>`;
  if(p==='charge')return `<label>チャージ先</label><select id="et-target-account">${accountList(s,t.target_account_id||t.account_id)}</select>`;
  if(p==='card_payment')return `<label>引落元口座</label><select id="et-target-account">${accountList(s,t.account_id)}</select><label>支払対象カード</label><select id="et-target-card">${cardList(s,t.target_card_id||t.billing_card_id)}</select>`;
  if(p==='repayment')return `<label>返済元口座</label><select id="et-target-account">${accountList(s,t.account_id)}</select><label>返済対象負債</label><select id="et-target-liability">${liabilityList(s,t.target_account_id)}</select>`;
  return '';
}
function openEditModal(s,t){
  document.getElementById('household-edit-modal')?.remove();
  const summary=s.summaries.find(x=>String(x.id)===String(t.summary_id));
  const source=sourceValue(t);
  const modal=document.createElement('div');
  modal.id='household-edit-modal';
  modal.innerHTML=`<div class="household-edit-backdrop"><div class="household-edit-card"><div class="between"><h2 style="margin:0">✏️ 履歴を編集</h2><button type="button" class="light" id="et-close">閉じる</button></div><div class="grid" style="margin-top:14px"><div><label>取引日</label><input id="et-date" type="date" value="${esc(t.transaction_date||'')}"><label>内容</label><input id="et-desc" value="${esc(t.description||'')}"><label>摘要</label><select id="et-summary">${summaryList(s,t.summary_id)}</select><label id="et-source-label">支払元</label><select id="et-source">${sourceList(s,t)}</select><div id="et-targets">${targetFields(s,t,summary)}</div></div><div><label>金額</label><input id="et-amount" type="number" min="1" value="${Number(t.amount||0)}"><label>ポイント利用</label><input id="et-points" type="number" min="0" value="${Number(t.points_used||0)}"><label>補足</label><input id="et-target" value="${esc(t.target_input||'')}"><label>メモ</label><input id="et-memo" value="${esc(t.memo||'')}"></div></div><div id="et-preview" class="stat" style="margin-top:12px"></div><div class="row" style="margin-top:12px"><button class="primary" id="et-save" style="flex:1">この内容で保存</button><button class="danger" id="et-cancel">キャンセル</button></div></div></div>`;
  const style=document.createElement('style');style.textContent='.household-edit-backdrop{position:fixed;inset:0;background:rgba(3,7,18,.72);z-index:9999;display:flex;align-items:center;justify-content:center;padding:18px}.household-edit-card{width:min(900px,100%);max-height:90vh;overflow:auto;background:#10182a;border:1px solid #2b3857;border-radius:18px;padding:20px;box-shadow:0 24px 80px rgba(0,0,0,.45)}.household-edit-card label{display:block;margin-top:10px}.household-edit-card input,.household-edit-card select{width:100%}';document.head.appendChild(style);
  document.body.appendChild(modal);
  const src=document.getElementById('et-source');if(src)src.value=source;
  const refresh=()=>{const q=s.summaries.find(x=>String(x.id)===String(document.getElementById('et-summary')?.value));document.getElementById('et-targets').innerHTML=targetFields(s,t,q);previewEdit(s,t)};
  document.getElementById('et-summary').onchange=()=>{const q=s.summaries.find(x=>String(x.id)===String(document.getElementById('et-summary').value));document.getElementById('et-targets').innerHTML=targetFields(s,t,q);previewEdit(s,t)};
  ['et-date','et-amount','et-points','et-source'].forEach(id=>document.getElementById(id)?.addEventListener(id==='et-source'?'change':'input',()=>previewEdit(s,t)));
  document.getElementById('et-close').onclick=()=>modal.remove();document.getElementById('et-cancel').onclick=()=>modal.remove();document.getElementById('et-save').onclick=()=>saveEdit(s,t,render);
  previewEdit(s,t);
}
function previewEdit(s,t){
  const box=document.getElementById('et-preview');if(!box)return;
  const summary=s.summaries.find(x=>String(x.id)===String(document.getElementById('et-summary')?.value));
  const source=document.getElementById('et-source')?.value||'';let sourceName='—';if(source.startsWith('card:'))sourceName=s.cards.find(x=>String(x.id)===source.slice(5))?.name||'—';else if(source.startsWith('account:'))sourceName=s.accounts.find(x=>String(x.id)===source.slice(8))?.name||'—';
  const p=summary?.process_type;let target=sourceName;if(p==='transfer')target=`${sourceName} → ${s.accounts.find(x=>String(x.id)===String(document.getElementById('et-to-account')?.value))?.name||'—'}`;if(p==='borrowing')target=`${s.accounts.find(x=>String(x.id)===String(document.getElementById('et-target-account')?.value))?.name||'—'} → ${s.accounts.find(x=>String(x.id)===String(document.getElementById('et-target-liability')?.value))?.name||'—'}`;if(p==='charge')target=`${sourceName} → ${s.accounts.find(x=>String(x.id)===String(document.getElementById('et-target-account')?.value))?.name||'—'}`;if(p==='card_payment')target=`${s.accounts.find(x=>String(x.id)===String(document.getElementById('et-target-account')?.value))?.name||'—'} → ${s.cards.find(x=>String(x.id)===String(document.getElementById('et-target-card')?.value))?.name||'—'}`;if(p==='repayment')target=`${s.accounts.find(x=>String(x.id)===String(document.getElementById('et-target-account')?.value))?.name||'—'} → ${s.accounts.find(x=>String(x.id)===String(document.getElementById('et-target-liability')?.value))?.name||'—'}`;
  box.innerHTML=`<b>自動判定</b><div class="small">分類：<b>${esc(p||'—')}</b> ／ カテゴリ：<b>${esc(summary?.category_name||'—')}</b></div><div class="small">資金移動：<b>${esc(target)}</b> ／ 請求年月：<b>${esc(billingMonth(document.getElementById('et-date')?.value||'',p==='card_payment'?s.cards.find(x=>String(x.id)===String(document.getElementById('et-target-card')?.value)):source.startsWith('card:')?s.cards.find(x=>String(x.id)===source.slice(5)):null)||'—')}</b></div><div class="small">金額：<b>${yen(Number(document.getElementById('et-amount')?.value||0))}</b> ／ 実決済：<b>${yen(Math.max(0,Number(document.getElementById('et-amount')?.value||0)-Number(document.getElementById('et-points')?.value||0)))}</b></div>`;
}
async function saveEdit(s,t,render){
  const summary=s.summaries.find(x=>String(x.id)===String(document.getElementById('et-summary')?.value));
  const date=document.getElementById('et-date')?.value||'',description=document.getElementById('et-desc')?.value.trim()||'',amount=Number(document.getElementById('et-amount')?.value||0),points=Number(document.getElementById('et-points')?.value||0),source=document.getElementById('et-source')?.value||'',p=summary?.process_type;
  if(!summary||!date||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!description||!Number.isFinite(amount)||amount<=0||!Number.isFinite(points)||points<0||points>amount)return alert('取引日・内容・摘要・金額・ポイントを確認してください。');
  const accountId=source.startsWith('account:')?source.slice(8):null,cardId=source.startsWith('card:')?source.slice(5):null;
  const targetAccountId=document.getElementById('et-target-account')?.value||null,targetCardId=document.getElementById('et-target-card')?.value||null,targetLiabilityId=document.getElementById('et-target-liability')?.value||null,toAccountId=document.getElementById('et-to-account')?.value||null;
  if(p==='transfer'&&(!accountId||!toAccountId||accountId===toAccountId))return alert('移動元と移動先を確認してください。');
  if(p==='borrowing'&&(!targetAccountId||!targetLiabilityId))return alert('入金先口座と借入先（負債）を確認してください。');
  if(p==='charge'&&(!targetAccountId||!cardId))return alert('チャージ元カードとチャージ先を確認してください。');
  if(p==='card_payment'&&(!targetAccountId||!targetCardId))return alert('引落元口座と対象カードを確認してください。');
  if(p==='repayment'&&(!targetAccountId||!targetLiabilityId))return alert('返済元口座と返済対象負債を確認してください。');
  if(!['transfer','charge','card_payment','repayment','borrowing'].includes(p)&&!accountId&&!cardId)return alert('支払元を選択してください。');
  const update={transaction_date:date,description,summary_id:summary.id,summary_name:summary.name,amount,points_used:points,effect_amount:Math.max(0,amount-points),target_input:document.getElementById('et-target')?.value.trim()||null,memo:document.getElementById('et-memo')?.value.trim()||null,category_name:summary.category_name||null,process_type:p||'normal',cashflow_type:['transfer','charge'].includes(p)?'transfer':summary.cashflow_type||'expense',target_auto:summary.target_name||null,billing_type:summary.billing_type||null};
  if(p==='transfer'){update.account_id=accountId;update.from_account_id=accountId;update.to_account_id=toAccountId;update.target_account_id=null;update.target_card_id=null;update.billing_card_id=null;update.billing_card_name=null;update.payment_method_id=null;update.payment_method_name=s.accounts.find(x=>String(x.id)===String(accountId))?.name||null}
  else if(p==='borrowing'){update.account_id=targetAccountId;update.target_account_id=targetLiabilityId;update.from_account_id=null;update.to_account_id=null;update.target_card_id=null;update.billing_card_id=null;update.billing_card_name=null;update.payment_method_id=null;update.payment_method_name=s.accounts.find(x=>String(x.id)===String(targetAccountId))?.name||null}
  else if(p==='charge'){const card=s.cards.find(x=>String(x.id)===String(cardId));update.account_id=targetAccountId;update.target_account_id=targetAccountId;update.target_card_id=null;update.billing_card_id=null;update.billing_card_name=null;update.payment_method_id=s.payments.find(v=>String(v.linked_card_id)===String(cardId)&&v.method_type==='card')?.id||null;update.payment_method_name=card?.name||null}
  else if(p==='card_payment'){const card=s.cards.find(x=>String(x.id)===String(targetCardId));update.account_id=targetAccountId;update.target_account_id=targetAccountId;update.target_card_id=targetCardId;update.billing_card_id=targetCardId;update.billing_card_name=card?.name||null;update.payment_method_id=s.payments.find(v=>String(v.linked_card_id)===String(targetCardId)&&v.method_type==='card')?.id||null;update.payment_method_name=card?.name||null}
  else if(p==='repayment'){update.account_id=targetAccountId;update.target_account_id=targetLiabilityId;update.target_card_id=null;update.billing_card_id=null;update.billing_card_name=null;update.payment_method_id=null;update.payment_method_name=s.accounts.find(x=>String(x.id)===String(targetAccountId))?.name||null}
  else {const account=accountId?s.accounts.find(x=>String(x.id)===String(accountId)):null,card=cardId?s.cards.find(x=>String(x.id)===String(cardId)):null;update.account_id=accountId;update.billing_card_id=cardId;update.billing_card_name=card?.name||null;update.payment_method_id=card?s.payments.find(v=>String(v.linked_card_id)===String(cardId)&&v.method_type==='card')?.id||null:s.payments.find(v=>v.name===account?.name)?.id||null;update.payment_method_name=card?.name||account?.name||null;}
  const billingCard=update.billing_card_id?s.cards.find(x=>String(x.id)===String(update.billing_card_id)):null;update.billing_year_month=billingMonth(date,billingCard);
  const{error}=await supabase.from('household_transactions').update(update).eq('id',t.id);if(error)return alert('更新失敗：'+error.message);
  Object.assign(t,update);document.getElementById('household-edit-modal')?.remove();render('history');
}

function editTx(t,render){
  const s=window.__household_state;if(!s)return alert('状態を取得できませんでした。');
  openEditModal(s,t);
}
