import { supabase } from './supabase.js';
import { HOUSEHOLD_RULEBOOK } from './householdRulebook.js';

async function ensureHouseholdRulebook(userId){
  const cards=HOUSEHOLD_RULEBOOK.cards.map(([name,close,before,after,withdrawal])=>({user_id:userId,name,close_day:close,billing_month_before_close:before,billing_month_after_close:after,withdrawal_day:withdrawal,archived:false}));
  const {error:ce}=await supabase.from('household_cards').upsert(cards,{onConflict:'user_id,name',ignoreDuplicates:true}); if(ce)throw ce;
  const cardRows=await supabase.from('household_cards').select('id,name').eq('user_id',userId).eq('archived',false); if(cardRows.error)throw cardRows.error;
  const cardMap=Object.fromEntries((cardRows.data||[]).map(x=>[x.name,x.id]));
  const payments=HOUSEHOLD_RULEBOOK.payments.map(([name,type,linked])=>({user_id:userId,name,method_type:type,linked_card_id:linked?cardMap[linked]||null:null,archived:false}));
  const {error:pe}=await supabase.from('household_payment_methods').upsert(payments,{onConflict:'user_id,name',ignoreDuplicates:true}); if(pe)throw pe;
  for(const [name,,linked] of HOUSEHOLD_RULEBOOK.payments.filter(x=>x[2])){if(cardMap[linked]){const r=await supabase.from('household_payment_methods').update({method_type:name==='Au Pay'||name==='楽天Pay'?'wallet':'card',linked_card_id:cardMap[linked]}).eq('user_id',userId).eq('name',name);if(r.error)throw r.error}}
  const accounts=HOUSEHOLD_RULEBOOK.accounts.map(name=>({user_id:userId,name,account_type:['交通系（りく）','交通系（ひま）'].includes(name)?'transit':['PayPay','d払い','メルペイ','ロピア 電子マネー'].includes(name)?'wallet':name==='現金'?'cash':'bank',initial_balance:0,actual_balance:0,archived:false}));
  const {error:ae}=await supabase.from('household_accounts').upsert(accounts,{onConflict:'user_id,name',ignoreDuplicates:true}); if(ae)throw ae;
  const categories=[...new Set(HOUSEHOLD_RULEBOOK.summaries.map(x=>x[2]).filter(Boolean))].map((name,i)=>({user_id:userId,name,kind:'expense',sort_order:i,archived:false}));
  const {error:cate}=await supabase.from('household_categories').upsert(categories,{onConflict:'user_id,name',ignoreDuplicates:true}); if(cate)throw cate;
  const summaries=HOUSEHOLD_RULEBOOK.summaries.map(([name,cashflow,category,subType,target])=>({user_id:userId,name,cashflow_type:cashflow,category_name:category||null,process_type:cashflow==='income'?(subType==='借入'?'borrowing':'income'):cashflow==='repayment'?'repayment':cashflow==='transfer'?(subType==='引落'?'card_payment':subType==='チャージ'?'charge':'transfer'):'normal',target_name:target||null,archived:false}));
  const {error:se}=await supabase.from('household_summaries').upsert(summaries,{onConflict:'user_id,name',ignoreDuplicates:true}); if(se)throw se;
  for(const [name,cashflow,category,subType,target] of HOUSEHOLD_RULEBOOK.summaries){const process=cashflow==='income'?(subType==='借入'?'borrowing':'income'):cashflow==='repayment'?'repayment':cashflow==='transfer'?(subType==='引落'?'card_payment':subType==='チャージ'?'charge':'transfer'):'normal';const patch={cashflow_type:cashflow,category_name:category||null,process_type:process,target_name:target||null};if(process==='charge'){if(name==='交通系チャージ（りく）')patch.charge_source_card_id=cardMap['JCB W']||null;if(name==='交通系チャージ（ひま）')patch.charge_source_card_id=cardMap['JCB W']||null;if(name==='ロピア 電子マネーチャージ')patch.charge_source_card_id=null;const targetAccount=target?HOUSEHOLD_RULEBOOK.accounts.find(a=>a===target):null;if(targetAccount){const r=await supabase.from('household_accounts').select('id').eq('user_id',userId).eq('name',target).maybeSingle();if(r.error)throw r.error;patch.charge_target_account_id=r.data?.id||null}}if(process==='card_payment'){const r=await supabase.from('household_cards').select('id').eq('user_id',userId).eq('name',target).maybeSingle();if(r.error)throw r.error;patch.withdrawal_card_id=r.data?.id||null}const r=await supabase.from('household_summaries').update(patch).eq('user_id',userId).eq('name',name);if(r.error)throw r.error}}
  const now=new Date(); const ym=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
  const budgets=HOUSEHOLD_RULEBOOK.budgets.map(([category,amount])=>({user_id:userId,year_month:ym,category_name:category,amount}));
  const {error:be}=await supabase.from('household_budgets').upsert(budgets,{onConflict:'user_id,year_month,category_name',ignoreDuplicates:true}); if(be)throw be;
}

export async function loadHousehold(userId){
  await ensureHouseholdRulebook(userId);
  const [settings,summaries,payments,cards,accounts,categories,budgets,transactions]=await Promise.all([
    supabase.from('household_settings').select('*').eq('user_id',userId).maybeSingle(),
    supabase.from('household_summaries').select('*').eq('user_id',userId).eq('archived',false).order('sort_order').order('name'),
    supabase.from('household_payment_methods').select('*').eq('user_id',userId).eq('archived',false).order('name'),
    supabase.from('household_cards').select('*').eq('user_id',userId).eq('archived',false).order('name'),
    supabase.from('household_accounts').select('*').eq('user_id',userId).eq('archived',false).order('name'),
    supabase.from('household_categories').select('*').eq('user_id',userId).eq('archived',false).order('sort_order').order('name'),
    supabase.from('household_budgets').select('*').eq('user_id',userId).order('year_month',{ascending:false}),
    supabase.from('household_transactions').select('*').eq('user_id',userId).order('transaction_date',{ascending:false}).order('created_at',{ascending:false})
  ]);
  const rs=[settings,summaries,payments,cards,accounts,categories,budgets,transactions]; const error=rs.find(r=>r.error)?.error; if(error)throw error;
  return{settings:settings.data,summaries:summaries.data||[],payments:payments.data||[],cards:cards.data||[],accounts:accounts.data||[],categories:categories.data||[],budgets:budgets.data||[],transactions:transactions.data||[]};
}
