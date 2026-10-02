import { supabase } from '../../core/supabase.js';
import { esc } from '../../core/utils.js';

let busy = false;

export function enhanceCategoryOrder(s, refresh) {
  if (!document.querySelector('[data-page="settings"]')) return;
  const existing = document.getElementById('category-order-section');
  if (existing) existing.remove();

  const categories = [...(s.categories || [])].sort((a, b) => Number(a.sort_order ?? 999999) - Number(b.sort_order ?? 999999) || String(a.name).localeCompare(String(b.name), 'ja'));
  const section = document.createElement('section');
  section.id = 'category-order-section';
  section.className = 'card';
  section.innerHTML = `<h3>カテゴリの表示順</h3><p class="muted small">カテゴリを表示する順番を設定します。↑↓で並び替えできます。</p><div id="category-order-list"></div>`;
  const anchor = document.querySelector('#app .card:nth-of-type(2)') || document.querySelector('#app .card');
  if (anchor) anchor.parentNode.insertBefore(section, anchor);

  const list = section.querySelector('#category-order-list');
  if (!categories.length) {
    list.innerHTML = '<p class="muted small">まだカテゴリがありません。</p>';
    return;
  }

  const render = () => {
    list.innerHTML = `<details class="order-parent" closed><summary>カテゴリ一覧<span class="order-count">${categories.length}件</span></summary><div class="order-parent-body">${categories.map((category, index) => `
      <div class="category-order-row" data-category-id="${esc(category.id)}">
        <div><b>${esc(category.name)}</b><div class="muted small">${index + 1}番目</div></div>
        <div class="category-order-actions">
          <button type="button" class="light" data-move="up" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" class="light" data-move="down" ${index === categories.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" class="light" data-category-edit="1">編集</button>
          <button type="button" class="danger" data-category-delete="1">削除</button>
        </div>
      </div>`).join('')}</div></details>`;
  };

  const saveOrder = async () => {
    if (busy) return;
    busy = true;
    section.querySelectorAll('button').forEach((button) => { button.disabled = true; });
    try {
      const results = await Promise.all(categories.map((category, index) =>
        supabase.from('household_categories')
          .update({ sort_order: index })
          .eq('id', category.id)
          .eq('user_id', s.user.id)
      ));
      const error = results.find((result) => result.error)?.error;
      if (error) throw error;
      categories.forEach((category, index) => { category.sort_order = index; });
      await refresh('settings');
    } catch (error) {
      console.error(error);
      alert('カテゴリの表示順を保存できませんでした。');
      render();
    } finally {
      busy = false;
    }
  };

  list.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-category-edit]');
    if (!button || busy) return;
    const row=button.closest('[data-category-id]');const id=row?.dataset.categoryId;const cat=categories.find(x=>String(x.id)===String(id));if(!cat)return;
    const name=prompt('カテゴリの名称を変更',cat.name||'');if(name===null)return;const next=name.trim();if(!next||next===cat.name)return;
    if(categories.some(x=>String(x.id)!==String(id)&&String(x.name).trim()===next))return alert('同じ名前のカテゴリがすでにあります。');
    busy=true;
    try{
      const{error}=await supabase.from('household_categories').update({name:next}).eq('id',id).eq('user_id',s.user.id);if(error)throw error;
      const tx=await supabase.from('household_transactions').update({category_name:next}).eq('category_name',cat.name).eq('user_id',s.user.id);if(tx.error)throw tx.error;
      const sm=await supabase.from('household_summaries').update({category_name:next}).eq('category_name',cat.name).eq('user_id',s.user.id);if(sm.error)throw sm.error;
      const bd=await supabase.from('household_budgets').update({category_name:next}).eq('category_name',cat.name).eq('user_id',s.user.id);if(bd.error)throw bd.error;
      await refresh('settings');
    }catch(e){console.error(e);alert('カテゴリ名を変更できませんでした。\\n\\n'+e.message)}finally{busy=false}
  });

  list.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-move]');
    if (!button || button.disabled) return;
    const row = button.closest('[data-category-id]');
    const index = categories.findIndex((category) => String(category.id) === String(row?.dataset.categoryId));
    if (index < 0) return;
    const next = button.dataset.move === 'up' ? index - 1 : index + 1;
    if (next < 0 || next >= categories.length) return;
    [categories[index], categories[next]] = [categories[next], categories[index]];
    render();
    await saveOrder();
  });

  list.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-category-delete]');
    if (!button || busy) return;
    const row=button.closest('[data-category-id]');const id=row?.dataset.categoryId;const cat=categories.find(x=>String(x.id)===String(id));if(!cat)return;
    if(!confirm('「'+cat.name+'」を削除しますか？\\n\\n過去の取引履歴のカテゴリ名は残ります。'))return;
    busy=true;try{const{error}=await supabase.from('household_categories').update({archived:true}).eq('id',id).eq('user_id',s.user.id);if(error)throw error;await refresh('settings')}catch(e){console.error(e);alert('カテゴリを削除できませんでした。\\n\\n'+e.message)}finally{busy=false}
  });

  if (!document.getElementById('category-order-style')) {
    const style = document.createElement('style');
    style.id = 'category-order-style';
    style.textContent = '.order-parent{border:1px solid #dfe4ee;border-radius:12px;margin-top:8px}.order-parent summary{cursor:pointer;list-style:none;padding:14px 16px;font-weight:700}.order-parent summary::-webkit-details-marker{display:none}.order-parent summary:after{content:"＋";float:right}.order-parent[open] summary:after{content:"−"}.order-count{float:right;margin-right:22px;color:#98a3bf;font-size:12px}.order-parent-body{padding:0 16px 8px}.category-order-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #dfe4ee}.category-order-row:last-child{border-bottom:0}.category-order-actions{display:flex;gap:6px}.category-order-actions button{min-width:44px;min-height:44px}';
    document.head.appendChild(style);
  }
  render();
}
