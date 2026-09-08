export function enhanceSummaryPaymentFilter(s){
  const summary=document.querySelector('#tx-summary');
  if(!summary)return;
  const apply=()=>{
    const source=document.querySelector('#tx-source');
    if(!source)return;
    const selectedSummary=s.summaries.find(x=>String(x.id)===String(summary.value));
    const ids=Array.isArray(selectedSummary?.payment_method_ids)?selectedSummary.payment_method_ids.map(String):[];
    if(!ids.length){
      source.querySelectorAll('option').forEach(o=>o.hidden=false);
      source.querySelectorAll('optgroup').forEach(g=>g.hidden=false);
      return;
    }
    const allowed=new Set();
    s.payments.filter(p=>ids.includes(String(p.id))).forEach(p=>{
      if(p.linked_card_id)allowed.add(`card:${p.linked_card_id}`);
      if(p.linked_account_id)allowed.add(`account:${p.linked_account_id}`);
      if(!p.linked_card_id&&!p.linked_account_id){
        const account=s.accounts.find(a=>String(a.name)===String(p.name));
        if(account)allowed.add(`account:${account.id}`);
        const card=s.cards.find(c=>String(c.name)===String(p.name));
        if(card)allowed.add(`card:${card.id}`);
      }
    });
    source.querySelectorAll('option').forEach(o=>{
      if(!o.value)return;
      o.hidden=!allowed.has(o.value);
    });
    source.querySelectorAll('optgroup').forEach(g=>{
      g.hidden=[...g.querySelectorAll('option')].every(o=>o.hidden||!o.value);
    });
    if(source.value&&!allowed.has(source.value))source.value='';
  };
  summary.addEventListener('change',()=>setTimeout(apply,0));
  document.addEventListener('household:rendered',e=>{if(e.detail?.page==='input')setTimeout(apply,0)});
  apply();
}
