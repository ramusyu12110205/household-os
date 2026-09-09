import { supabase } from '../../core/supabase.js';

export async function enhanceContentSummaryFilter(s){
  const input=document.getElementById('tx-desc'),summary=document.getElementById('tx-summary');
  if(!input||!summary||!s?.user?.id)return;
  const {data:rules,error}=await supabase.from('household_content_rules').select('name,summary_ids').eq('user_id',s.user.id).eq('archived',false).order('sort_order',{ascending:true}).order('name');
  if(error)return;
  const contentRules=Array.isArray(rules)?rules:[];
  const original=[...summary.options].map(o=>({value:o.value,text:o.text}));
  const escapeAttr=value=>String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  if(!input.getAttribute('list')){
    const list=document.createElement('datalist');
    list.id='tx-content-list';
    list.innerHTML=contentRules.map(r=>`<option value="${escapeAttr(r.name)}"></option>`).join('');
    document.getElementById('app')?.appendChild(list);
    input.setAttribute('list','tx-content-list');
  }
  const rHas=(rule,id)=>(rule.summary_ids||[]).map(String).includes(String(id));
  const apply=()=>{
    const value=input.value.trim();
    const rule=contentRules.find(r=>String(r.name).trim()===value);
    const current=summary.value;
    const options=rule?[...original].filter(o=>!o.value||rHas(rule,o.value)):original;
    summary.innerHTML='';
    options.forEach(o=>{const el=document.createElement('option');el.value=o.value;el.textContent=o.text;summary.appendChild(el)});
    if([...summary.options].some(o=>o.value===current))summary.value=current;
    else if(rule&&(rule.summary_ids||[]).length===1)summary.value=String(rule.summary_ids[0]);
    summary.dispatchEvent(new Event('change',{bubbles:true}));
  };
  input.addEventListener('input',apply);
}
