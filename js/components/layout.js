export const nav=[['home','🏠 ホーム'],['input','📝 記録'],['history','📋 履歴'],['monthly','📊 月次'],['cards','💳 カード'],['assets','🏦 資産'],['settings','⚙ 設定']];
export function navHtml(active){return nav.map(([id,label])=>`<button class="secondary ${id===active?'active':''}" data-page="${id}">${label}</button>`).join('')}
export function layout(title,active,content){return `<div class="container"><header class="between"><h1>${title}</h1><button class="secondary" data-action="logout">ログアウト</button></header><nav class="nav">${navHtml(active)}</nav><main>${content}</main></div>`}
