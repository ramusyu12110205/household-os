export function enhanceContentSummaryFilter(s){
  const input=document.getElementById('tx-desc'),summary=document.getElementById('tx-summary');
  if(!input||!summary)return;
  if(!input.getAttribute('list')){
    const list=document.createElement('datalist');
    list.id='tx-content-list';
    list.innerHTML=(s.contentRules||[]).map(r=>`<option value="${String(r.name).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}"></option>`).join('');
    document.getElementById('app')?.appendChild(list);
    input.setAttribute('list','tx-content-list');
  }
  const allOptions=()=>[...summary.options].map(o=>({value:o.value,text:o.text}));
  const apply=()=>{
    const value=input.value.trim();
    const rule=(s.contentRules||[]).find(r=>String(r.name).trim()===value);
    if(!rule)return;
    const allowed=new Set((rule.summary_ids||[]).map(String));
    const current=summary.value;
    const options=allOptions();
    summary.innerHTML='';
    options.filter(o=>!o.value||allowed.has(String(o.value))).forEach(o=>{const el=document.createElement('option');el.value=o.value;el.textContent=o.text;summary.appendChild(el)});
    if([...summary.options].some(o=>o.value===current))summary.value=current;
    if(!summary.value&&allowed.size===1)summary.value=[...allowed][0];
    summary.dispatchEvent(new Event('change',{bubbles:true}));
  };
  input.addEventListener('input',apply);
}
