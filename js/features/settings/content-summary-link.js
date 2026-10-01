import { supabase } from '../../core/supabase.js';
import { esc } from '../../core/utils.js';

function sourceOptions(s,selectedType='',selectedId=''){
  const selected=selectedType&&selectedId?selectedType+':'+selectedId:'';
  return `<option value="">指定しない</option><optgroup label="口座・現金・電子マネー">${s.accounts.filter(x=>x.account_type!=='liability').map(x=>`<option value="account:${x.id}" ${selected===`account:${x.id}`?'selected':''}>${esc(x.name)}</option>`).join('')}</optgroup><optgroup label="クレジットカード">${s.cards.map(x=>`<option value="card:${x.id}" ${selected===`card:${x.id}`?'selected':''}>${esc(x.name)}</option>`).join('')}</optgroup>`;
}

export async function enhanceContentSummaryLinks(s,refresh){
  const host=document.querySelector('#app');
  if(!host)return;
  const {data:rules,error}=await supabase.from('household_content_rules').select('id,name,summary_ids,source_type,source_id,archived').eq('user_id',s.user.id).eq('archived',false).order('sort_order',{ascending:true}).order('name');
  if(error)return;
  const contentRules=Array.isArray(rules)?rules:[];
  host.querySelector('[data-content-summary-link]')?.remove();
  const section=document.createElement('section');
  section.className='card';
  section.setAttribute('data-content-summary-link','1');
  section.innerHTML=`<h3>内容と摘要</h3><p class="muted small">「ロピア」などの内容ごとに、記録画面で候補にする摘要と支払元を設定できます。未設定の項目は、これまで通り都度選択します。</p><div class="grid" style="margin-bottom:12px"><div><label>内容</label><input id="content-rule-name" placeholder="ロピア"></div><div><label>摘要</label><div id="content-rule-summaries" class="grid">${s.summaries.map(x=>`<label style="display:flex;align-items:center;gap:8px"><input type="checkbox" data-content-summary="${x.id}">${esc(x.name)}</label>`).join('')}</div></div><div><label>支払元</label><select id="content-rule-source">${sourceOptions(s)}</select></div></div><button class="primary" type="button" id="content-rule-save">追加</button><div class="list" style="margin-top:12px">${contentRules.map(r=>{const ids=Array.isArray(r.summary_ids)?r.summary_ids.map(String):[];const names=s.summaries.filter(x=>ids.includes(String(x.id))).map(x=>x.name);const source=r.source_type&&r.source_id?(r.source_type==='card'?s.cards.find(x=>String(x.id)===String(r.source_id))?.name:s.accounts.find(x=>String(x.id)===String(r.source_id))?.name):'';return `<div class="list-item"><div class="between"><div><b>${esc(r.name)}</b><div class="muted small">摘要：${names.length?esc(names.join(' / ')):'すべて'} ／ 支払元：${source?esc(source):'指定なし'}</div></div><button class="light" type="button" data-content-rule-delete="${r.id}">削除</button></div></div>`}).join('')||'<p class="muted small">まだ登録がありません。</p>'}</div>`;
  host.appendChild(section);
  section.querySelector('#content-rule-save')?.addEventListener('click',async()=>{
    const name=section.querySelector('#content-rule-name')?.value.trim();
    if(!name)return alert('内容を入力してください');
    const ids=[...section.querySelectorAll('[data-content-summary]:checked')].map(x=>x.dataset.contentSummary);
    const sourceValue=section.querySelector('#content-rule-source')?.value||'';
    const [sourceType,sourceId]=sourceValue?sourceValue.split(':'):[null,null];
    const {error}=await supabase.from('household_content_rules').upsert({user_id:s.user.id,name,summary_ids:ids,source_type:sourceType,source_id:sourceId||null,archived:false},{onConflict:'user_id,name'});
    if(error)return alert(error.message);
    await refresh('settings');
  });
  section.querySelectorAll('[data-content-rule-delete]').forEach(btn=>btn.addEventListener('click',async()=>{
    if(!confirm('この内容ルールを削除しますか？'))return;
    const {error}=await supabase.from('household_content_rules').update({archived:true}).eq('id',btn.dataset.contentRuleDelete).eq('user_id',s.user.id);
    if(error)return alert(error.message);
    await refresh('settings');
  }));
}
