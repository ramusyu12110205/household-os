export const $=id=>document.getElementById(id);
export const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
export const currentMonth=()=>today().slice(0,7);
export const toMonth=v=>String(v||'').slice(0,7);
export const yen=v=>Number(v||0).toLocaleString('ja-JP')+'円';
export const esc=v=>String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));
export const addMonths=(month,n)=>{const d=new Date(`${month}-01T00:00:00`);d.setMonth(d.getMonth()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`};
export const billingMonth=(date,card)=>{if(!date||!card)return null;const day=Number(String(date).slice(8,10));const add=Number(card.billing_month_after_close??1)+(day>Number(card.close_day)?1:0);return addMonths(toMonth(date),add)+'-01'};
