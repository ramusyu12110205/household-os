import { supabase } from '../../core/supabase.js';
import { esc } from '../../core/utils.js';

let busy = false;

const TYPES = [
  { key: 'summary', label: '摘要', table: 'household_summaries', stateKey: 'summaries' },
  { key: 'payment', label: '決済方法', table: 'household_payment_methods', stateKey: 'payments' },
  { key: 'card', label: 'カード', table: 'household_cards', stateKey: 'cards' },
  { key: 'account', label: '口座・現金・負債', table: 'household_accounts', stateKey: 'accounts' },
];

function sortItems(items) {
  return [...(items || [])].sort((a, b) => Number(a.sort_order ?? 999999) - Number(b.sort_order ?? 999999) || String(a.name).localeCompare(String(b.name), 'ja'));
}

export function enhanceMasterOrder(s, refresh) {
  if (!document.querySelector('[data-page="settings"]')) return;
  document.getElementById('master-order-section')?.remove();

  const section = document.createElement('section');
  section.id = 'master-order-section';
  section.className = 'card';
  section.innerHTML = `<h3>その他の表示順</h3><p class="muted small">摘要・決済方法・カード・口座・負債を表示する順番を設定します。</p><div id="master-order-groups"></div>`;
  const anchor = document.getElementById('category-order-section') || document.querySelector('#app .card:nth-of-type(2)') || document.querySelector('#app .card');
  if (anchor) anchor.parentNode.insertBefore(section, anchor);

  const groups = section.querySelector('#master-order-groups');
  const lists = {};
  TYPES.forEach((type) => { lists[type.key] = sortItems(s[type.stateKey]); });

  const render = () => {
    const openTypes = new Set([...groups.querySelectorAll('details[open]')].map((el) => el.dataset.orderType));
    groups.innerHTML = TYPES.map((type) => {
      const items = lists[type.key];
      return `<details class="order-parent" data-order-type="${type.key}" ${openTypes.has(type.key) ? 'open' : ''}><summary>${type.label}<span class="order-count">${items.length}件</span></summary><div class="order-parent-body">${items.length ? items.map((item, index) => `
        <div class="master-order-row" data-master-type="${type.key}" data-master-id="${esc(item.id)}">
          <div><b>${esc(item.name)}</b><div class="muted small">${index + 1}番目</div></div>
          <div class="master-order-actions">
            <button type="button" class="light" data-master-move="up" ${index === 0 ? 'disabled' : ''}>↑</button>
            <button type="button" class="light" data-master-move="down" ${index === items.length - 1 ? 'disabled' : ''}>↓</button>
          </div>
        </div>`).join('') : '<p class="muted small">まだ登録がありません。</p>'}</div></details>`;
    }).join('');
  };

  const saveOrder = async (type) => {
    if (busy) return;
    busy = true;
    section.querySelectorAll('button').forEach((button) => { button.disabled = true; });
    try {
      const meta = TYPES.find((x) => x.key === type);
      const items = lists[type];
      const results = await Promise.all(items.map((item, index) =>
        supabase.from(meta.table)
          .update({ sort_order: index })
          .eq('id', item.id)
          .eq('user_id', s.user.id)
      ));
      const error = results.find((result) => result.error)?.error;
      if (error) throw error;
      items.forEach((item, index) => { item.sort_order = index; });
      const stateItems = s[meta.stateKey] || [];
      stateItems.forEach((item) => {
        const updated = items.find((x) => String(x.id) === String(item.id));
        if (updated) item.sort_order = updated.sort_order;
      });
      stateItems.sort((a, b) => Number(a.sort_order ?? 999999) - Number(b.sort_order ?? 999999) || String(a.name).localeCompare(String(b.name), 'ja'));
      render();
    } catch (error) {
      console.error(error);
      alert('表示順を保存できませんでした。');
      render();
    } finally {
      busy = false;
    }
  };

  groups.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-master-move]');
    if (!button || button.disabled) return;
    const row = button.closest('[data-master-id]');
    const type = row?.dataset.masterType;
    const items = lists[type];
    if (!items) return;
    const index = items.findIndex((item) => String(item.id) === String(row.dataset.masterId));
    if (index < 0) return;
    const next = button.dataset.masterMove === 'up' ? index - 1 : index + 1;
    if (next < 0 || next >= items.length) return;
    [items[index], items[next]] = [items[next], items[index]];
    render();
    await saveOrder(type);
  });

  if (!document.getElementById('master-order-style')) {
    const style = document.createElement('style');
    style.id = 'master-order-style';
    style.textContent = '.order-parent{border:1px solid #dfe4ee;border-radius:12px;margin-top:8px}.order-parent summary{cursor:pointer;list-style:none;padding:14px 16px;font-weight:700}.order-parent summary::-webkit-details-marker{display:none}.order-parent summary:after{content:"＋";float:right}.order-parent[open] summary:after{content:"−"}.order-count{float:right;margin-right:22px;color:#98a3bf;font-size:12px}.order-parent-body{padding:0 16px 8px}.master-order-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #dfe4ee}.master-order-row:last-child{border-bottom:0}.master-order-actions{display:flex;gap:6px}.master-order-actions button{min-width:44px;min-height:44px}';
    document.head.appendChild(style);
  }
  render();
}
