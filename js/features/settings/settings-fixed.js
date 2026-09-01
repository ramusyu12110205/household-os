import { renderSettings as baseRenderSettings, bindSettings as baseBindSettings } from './settings.js';
import { $ } from '../../core/utils.js';

export function renderSettings(s){ return baseRenderSettings(s); }
function fillEdit(type,x){
 const set=(id,v)=>{const e=$(id);if(e)e.value=v??'';};
 if(type==='summary'){set('summary-id',x.id);set('summary-name',x.name);set('summary-category',x.category_name);set('summary-process',x.process_type||'normal');const c=$('summary-cancel');if(c)c.style.display='inline-block';const b=$('summary-save');if(b)b.textContent='更新';}
 else if(type==='payment'){set('payment-id',x.id);set('payment-name',x.name);set('payment-type',x.method_type||'cash');set('payment-card',x.linked_card_id);const c=$('payment-cancel');if(c)c.style.display='inline-block';const b=$('payment-save');if(b)b.textContent='更新';}
 else if(type==='card'){set('card-id',x.id);set('card-name',x.name);set('card-close',x.close_day??15);set('card-withdraw',x.withdrawal_day??10);set('card-after',x.billing_month_after_close??1);const c=$('card-cancel');if(c)c.style.display='inline-block';const b=$('card-save');if(b)b.textContent='更新';}
 else if(type==='account'){set('account-id',x.id);set('account-name',x.name);set('account-type',x.account_type||'bank');set('account-balance',x.actual_balance??x.initial_balance??0);const c=$('account-cancel');if(c)c.style.display='inline-block';const b=$('account-save');if(b)b.textContent='更新';}
 else if(type==='category'){set('category-id',x.id);set('category-name',x.name);const c=$('category-cancel');if(c)c.style.display='inline-block';const b=$('category-save');if(b)b.textContent='更新';}
}
export function bindSettings(s,refresh){
 baseBindSettings(s,refresh);
 window.editHouseholdSummary=x=>fillEdit('summary',x);
 window.editHouseholdPayment=x=>fillEdit('payment',x);
 window.editHouseholdCard=x=>fillEdit('card',x);
 window.editHouseholdAccount=x=>fillEdit('account',x);
 window.editHouseholdCategory=x=>fillEdit('category',x);
}
