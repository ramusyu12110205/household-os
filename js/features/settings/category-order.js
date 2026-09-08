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
  section.innerHTML = `<h3>カテゴリの表示順</h3><p class="muted small">家計の記録やカテゴリ一覧で表示する順番を設定します。↑↓で並び替えできます。</p><div id="category-order-list"></div>`;
  const anchor = document.querySelector('#app .card:nth-of-type(2)') || document.querySelector('#app .card');
  if (anchor) anchor.parentNode.insertBefore(section, anchor);

  const list = section.querySelector('#category-order-list');
  if (!categories.length) {
    list.innerHTML = '<p class="muted small">まだカテゴリがありません。</p>';
    return;
  }

  const render = () => {
    list.innerHTML = categories.map((category, index) => `
      <div class="category-order-row" data-category-id="${esc(category.id)}">
        <div><b>${esc(category.name)}</b><div class="muted small">${index + 1}番目</div></div>
        <div class="category-order-actions">
          <button type="button" class="light" data-move="up" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" class="light" data-move="down" ${index === categories.length - 1 ? 'disabled' : ''}>↓</button>
        </div>
      </div>`).join('');
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

  if (!document.getElementById('category-order-style')) {
    const style = document.createElement('style');
    style.id = 'category-order-style';
    style.textContent = '.category-order-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #26314d}.category-order-row:last-child{border-bottom:0}.category-order-actions{display:flex;gap:6px}.category-order-actions button{min-width:44px;min-height:44px}';
    document.head.appendChild(style);
  }
  render();
}
