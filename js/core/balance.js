import { actualAmount } from './transactionRules.js';

export function calculateBalances(state){
  const accounts=new Map(state.accounts.map(a=>[String(a.id),{...a,balance:Number(a.initial_balance||0)}]));
  const cards=new Map(state.cards.map(c=>[String(c.id),{...c,balance:0}]));
  const txs=[...state.transactions].sort((a,b)=>String(a.transaction_date).localeCompare(String(b.transaction_date))||String(a.created_at||'').localeCompare(String(b.created_at||'')));
  for(const t of txs){
    const n=actualAmount(t.amount,t.points_used);
    const accountId=t.account_id?String(t.account_id):null;
    const cardId=t.billing_card_id?String(t.billing_card_id):null;
    const targetCardId=t.target_card_id?String(t.target_card_id):null;
    switch(t.process_type){
      case'normal':
        if(accountId&&accounts.has(accountId))accounts.get(accountId).balance-=n;
        if(cardId&&cards.has(cardId))cards.get(cardId).balance+=n;
        break;
      case'income':case'borrowing':
        if(accountId&&accounts.has(accountId))accounts.get(accountId).balance+=n;
        break;
      case'transfer':{
        const from=t.from_account_id?String(t.from_account_id):null,to=t.to_account_id?String(t.to_account_id):null;
        if(from&&accounts.has(from))accounts.get(from).balance-=n;
        if(to&&accounts.has(to))accounts.get(to).balance+=n;
        break;
      }
      case'charge':{
        const to=t.to_account_id?String(t.to_account_id):null;
        if(to&&accounts.has(to))accounts.get(to).balance+=n;
        // A charge is paid by the source card, so it increases that card's liability.
        if(targetCardId&&cards.has(targetCardId))cards.get(targetCardId).balance+=n;
        break;
      }
      case'repayment':case'card_payment':
        if(accountId&&accounts.has(accountId))accounts.get(accountId).balance-=n;
        if(targetCardId&&cards.has(targetCardId))cards.get(targetCardId).balance-=n;
        break;
    }
  }
  return{accounts:[...accounts.values()],cards:[...cards.values()]};
}
