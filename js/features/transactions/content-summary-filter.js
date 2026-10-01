import { supabase } from '../../core/supabase.js';

export async function enhanceContentSummaryFilter(s){
  const input=document.getElementById('tx-desc'),summary=document.getElementById('tx-summary');
  if(!input||!summary||!s?.user?.id)return;
  const {data:rules,error}=await supabase.from('household_content_rules').select('name,summary_ids,source_type,source_id').eq('user_id',s.user.id).eq('archived',false);
  if(error)return;
  const contentRules=Array.isArray(rules)?rules:[];
  const original=[...summary.options].map(o=>({value:o.value,text:o.text}));
  const getSource=()=>document.getElementById('tx-source');
  const apply=()=>{
    const value=input.value.trim();
    const rule=contentRules.find(r=>String(r.name).trim()===value);
    if(!rule)return;
    const ids=(rule.summary_ids||[]).map(String);
    const options=original.filter(o=>!o.value||ids.includes(String(o.value)));
    const current=summary.value;
    summary.innerHTML='';
    options.forEach(o=>{const el=document.createElement('option');el.value=o.value;el.textContent=o.text;summary.appendChild(el)});
    if(ids.length===1)summary.value=ids[0];
    else if(options.some(o=>String(o.value)===String(current)))summary.value=current;
    summary.dispatchEvent(new Event('change',{bubbles:true}));
    setTimeout(()=>{
      const source=getSource();
      if(!source||!rule.source_type||!rule.source_id)return;
      const sourceValue=rule.source_type+':'+rule.source_id;
      if([...source.options].some(o=>String(o.value)===sourceValue)){
        source.value=sourceValue;
        source.dispatchEvent(new Event('change',{bubbles:true}));
      }
    },0);
  };
  input.addEventListener('input',apply);
  apply();
}
