import { supabase } from '../../core/supabase.js';
import { esc } from '../../core/utils.js';

export function enhanceSummaryPaymentLinks(s,refresh){
  const host=document.querySelector('#app');
  if(!host)return;
  const old=host.querySelector('[data-summary-payment-link]');
  if(old)old.remove();
  const section=document.createElement('section');
  section.className='card';
  section.setAttribute('data-summary-payment-link','1');
  section.innerHTML=`<h3>摘要と決済方法</h3><p class="muted small">摘要ごとに、記録画面で使用できる決済方法を限定できます。未設定の摘要は、これまで通りすべての決済方法を使えます。</p><div class="list">${s.summaries.map(x=>{
    const ids=Array.isArray(x.payment_method_ids)?x.payment_method_ids:[];
    return `<details class="summary-payment-item" data-summary-id="${x.id}"><summary><b>${esc(x.name)}</b><span class="muted small">${ids.length?`${ids.length}件を許可`:'すべて許可'}</span></summary><div style="padding:10px 4px"><div class="grid">${s.payments.map(p=>`<label style="display:flex;align-items:center;gap:8px"><input type="checkbox" data-summary-payment="${p.id}" ${ids.map(String).includes(String(p.id))?'checked':''}>${esc(p.name)}</label>`).join('')}</div><button class="primary" type="button" data-summary-payment-save="${x.id}" style="margin-top:10px">保存</button></div></details>`;
  }).join('')}</div>`;
  host.querySelector('.card:last-child')?.insertAdjacentElement('afterend',section) || host.appendChild(section);
  section.querySelectorAll('[data-summary-payment-save]').forEach(btn=>btn.addEventListener('click',async()=>{
    const id=btn.dataset.summaryPaymentSave;
    const row=section.querySelector(`[data-summary-id="${id}"]`);
    const ids=[...row.querySelectorAll('[data-summary-payment]:checked')].map(x=>x.dataset.summaryPayment);
    btn.disabled=true;btn.textContent='保存中…';
    const {error}=await supabase.from('household_summaries').update({payment_method_ids:ids}).eq('id',id).eq('user_id',s.user.id);
    btn.disabled=false;btn.textContent='保存';
    if(error)return alert(error.message);
    await refresh('settings');
  }));
}
