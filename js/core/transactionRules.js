export const PROCESS={NORMAL:'normal',INCOME:'income',BORROWING:'borrowing',REPAYMENT:'repayment',TRANSFER:'transfer',CARD_PAYMENT:'card_payment'};
export const isAssetMove=p=>p===PROCESS.TRANSFER;
export const isIncome=p=>p===PROCESS.INCOME||p===PROCESS.BORROWING;
export const isDebtSettlement=p=>p===PROCESS.REPAYMENT||p===PROCESS.CARD_PAYMENT;
export const isExpense=p=>p===PROCESS.NORMAL;
export function actualAmount(amount,points=0){return Math.max(0,Number(amount||0)-Number(points||0))}
export function classify(process){if(isAssetMove(process))return'asset_move';if(isIncome(process))return'income';if(isDebtSettlement(process))return'debt_settlement';return'expense'}
