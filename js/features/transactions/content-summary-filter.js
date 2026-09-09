export function enhanceContentSummaryFilter(s){
  const input=document.getElementById('tx-desc'),summary=document.getElementById('tx-summary');
  if(!input||!summary)return;
  const original=[...summary.options].map(o=>({value:o.value,text:o.text}));
  if(!input.getAttribute('list')){const list=document.createElement('datalist');list.id='tx-content-list';list.innerHTML=(s.contentRules||[]).map(r=>`<option value="${String(r.name).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}"></option>`).join('');document.getElementById('app')?.appendChild(list);input.setAttribute('list','tx-content-list');}
  const apply=()=>{const value=input.value.trim();const rule=(s.contentRules||[]).find(r=>String(r.name).trim()===value);const current=summary.value;const options=rule?[...original].filter(o=>!o.value||(rHas(rule,o.value))]:original;summary.innerHTML='';options.forEach(o=>{const el=document.createElement('option');el.value=o.value;el.textContent=o.text;summary.appendChild(el)});if([...summary.options].some(o=>o.value===current))summary.value=current;else if(rule&&(rule.summary_ids||[]).length===1)summary.value=String(rule.summary_ids[0]);summary.dispatchEvent(new Event('change',{bubbles:true}));};
  const rHas=(rule,id)=>(rule.summary_ids||[]).map(String).includes(String(id));
  input.addEventListener('input',apply);
}
