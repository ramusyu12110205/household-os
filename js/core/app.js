/*
 * Household OS / core
 *
 * このファイルは全機能から使う「薄い共通層」を置く場所。
 * 個別機能のDB処理・画面HTMLはここに集約しない。
 */

export const APP_NAME = '家計簿OS';

export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function yearMonth(date = todayISO()) {
  return String(date).slice(0, 7);
}

export function yen(value) {
  return `${Number(value || 0).toLocaleString('ja-JP')}円`;
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[ch]));
}

export function assertOk(result, context = '処理') {
  if (result?.error) throw new Error(`${context}: ${result.error.message}`);
  return result?.data;
}
