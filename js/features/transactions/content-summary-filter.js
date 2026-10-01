import { supabase } from '../../core/supabase.js';

export async function enhanceContentSummaryFilter(s){
  const input=document.getElementById('tx-desc');
  const summary=document.getElementById('tx-summary');
  const source=()=>document.getElementById('tx-source');
  if(!input||!summary||!s?.user?.id)return;

  const {data:rules,error}=await supabase.from('household_content_rules')
    .select('name,summary_ids')
    .eq('user_id',s.user.id).eq('archived',false)
    .order('sort_order',{ascending:true}).order('name');
  if(error)return;

  const contentRules=Array.isArray(rules)?rules:[];
  const originalSummaries=[...summary.options].map(o=>({value:o.value,text:o.text}));
  const originalSources=[
    ...s.accounts.filter(x=>x.account_type!=='liability').map(x=>({value:'account:'+x.id,text:x.name})),
    ...s.cards.map(x=>({value:'card:'+x.id,text:x.name}))
  ];
  const escapeAttr=value=>String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  if(!input.getAttribute('list')){
    const list=document.createElement('datalist');
    list.id='tx-content-list';
    list.innerHTML=contentRules.map(r=>'<option value="'+escapeAttr(r.name)+'"></option>').join('');
    document.getElementById('app')?.appendChild(list);
    input.setAttribute('list','tx-content-list');
  }

  const rHas=(rule,id)=>(rule.summary_ids||[]).map(String).includes(String(id));

  const rebuildSummary=(options,current)=>{
    summary.innerHTML='';
    options.forEach(o=>{
      const el=document.createElement('option');
      el.value=o.value;
      el.textContent=o.text;
      summary.appendChild(el);
    });
    if([...summary.options].some(o=>o.value===current))summary.value=current;
    else if(options.length===2&&options[1]?.value)summary.value=options[1].value;
  };

  const getMatchedSourceOptions=(value,summaryValue)=>{
    if(!value)return originalSources;
    const histories=(s.transactions||[]).filter(t=>String(t.description||'').trim()===value);
    const selectedSummary=originalSummaries.find(o=>String(o.value)===String(summaryValue));
    const matched=summaryValue
      ? histories.filter(t=>String(t.summary_id||'')===String(summaryValue)||String(t.summary_name||'')===String(selectedSummary?.text||''))
      : histories;

    const counts=new Map();
    matched.forEach(t=>{
      let key=null;
      if(t.account_id)key='account:'+t.account_id;
      else if(t.billing_card_id)key='card:'+t.billing_card_id;
      else if(t.payment_method_name){
        const found=originalSources.find(o=>String(o.text)===String(t.payment_method_name));
        if(found)key=found.value;
      }
      if(key)counts.set(key,(counts.get(key)||0)+1);
    });

    if(!counts.size)return originalSources;
    return originalSources
      .filter(o=>counts.has(o.value))
      .sort((a,b)=>(counts.get(b.value)||0)-(counts.get(a.value)||0));
  };

  const rebuildSource=options=>{
    const el=source();
    if(!el)return;
    const p=s.summaries.find(x=>String(x.id)===String(summary.value))?.process_type;
    if(['borrowing','card_payment','repayment'].includes(p))return;
    const current=el.value;
    el.innerHTML='<option value="">選択してください</option>'+options.map(o=>'<option value="'+escapeAttr(o.value)+'">'+escapeAttr(o.text)+'</option>').join('');
    if(options.some(o=>o.value===current))el.value=current;
  };

  const apply=()=>{
    const value=input.value.trim();
    const rule=contentRules.find(r=>String(r.name).trim()===value);
    const currentSummary=summary.value;
    let summaryOptions=originalSummaries;
    if(rule)summaryOptions=originalSummaries.filter(o=>!o.value||rHas(rule,o.value));

    rebuildSummary(summaryOptions,currentSummary);

    // summaryのchangeでinput.js側が支払元selectを作り直すため、その後に再絞り込みする。
    const applySource=()=>{
      const valueNow=input.value.trim();
      const options=getMatchedSourceOptions(valueNow,summary.value);
      rebuildSource(options);
    };

    applySource();
    queueMicrotask(applySource);
  };

  input.addEventListener('input',apply);
  apply();
}
