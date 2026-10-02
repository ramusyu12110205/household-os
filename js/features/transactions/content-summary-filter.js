import { supabase } from '../../core/supabase.js';

export async function enhanceContentSummaryFilter(s){
  const input=document.getElementById('tx-desc');
  const summary=document.getElementById('tx-summary');
  if(!input||!summary||!s?.user?.id)return;
  const {data:rules,error}=await supabase.from('household_content_rules')
    .select('name,summary_ids,source_type,source_id,source_values')
    .eq('user_id',s.user.id).eq('archived',false);
  if(error)return;
  const contentRules=Array.isArray(rules)?rules:[];
  const allSummaryOptions=[...summary.options].map(o=>({value:o.value,text:o.text}));
  let lastAutoSource='';
  const restoreSummaries=()=>{
    const current=summary.value;
    summary.innerHTML='';
    allSummaryOptions.forEach(o=>{const el=document.createElement('option');el.value=o.value;el.textContent=o.text;summary.appendChild(el)});
    if(allSummaryOptions.some(o=>String(o.value)===String(current)))summary.value=current;
  };
  const apply=()=>{
    const value=input.value.trim();
    const rule=contentRules.find(r=>String(r.name||'').trim()===value);
    if(!rule){
      restoreSummaries();
      const source=document.getElementById('tx-source');
      if(source&&lastAutoSource&&source.value===lastAutoSource){source.value='';source.dispatchEvent(new Event('change',{bubbles:true}));}
      lastAutoSource='';
      return;
    }
    const ids=(Array.isArray(rule.summary_ids)?rule.summary_ids:[]).map(String);
    const current=summary.value;
    const options=allSummaryOptions.filter(o=>!o.value||ids.includes(String(o.value)));
    summary.innerHTML='';
    options.forEach(o=>{const el=document.createElement('option');el.value=o.value;el.textContent=o.text;summary.appendChild(el)});
    if(ids.length===1)summary.value=ids[0];
    else if(options.some(o=>String(o.value)===String(current)))summary.value=current;
    else summary.value='';
    summary.dispatchEvent(new Event('change',{bubbles:true}));

    setTimeout(()=>{
      const source=document.getElementById('tx-source');
      if(!source)return;
      let sourceValues=Array.isArray(rule.source_values)?rule.source_values.filter(Boolean).map(String):[];
      if(!sourceValues.length&&rule.source_type&&rule.source_id)sourceValues=[rule.source_type+':'+rule.source_id];
      if(!sourceValues.length)return;

      [...source.options].forEach(option=>{
        if(option.value && !sourceValues.includes(String(option.value)))option.remove();
      });

      if(sourceValues.length===1 && [...source.options].some(o=>String(o.value)===sourceValues[0])){
        source.value=sourceValues[0];
        lastAutoSource=sourceValues[0];
        source.dispatchEvent(new Event('change',{bubbles:true}));
      }else{
        source.value='';
        lastAutoSource='';
        source.dispatchEvent(new Event('change',{bubbles:true}));
      }
    },0);
  };
  input.addEventListener('input',apply);
  apply();
}
