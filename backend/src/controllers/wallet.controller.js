const { sendResponse } = require('../utils/apiResponse');
const Transaction = require('../models/Transaction');

// GET /api/v1/wallet — الرصيد + العمليات
const summary = async (req, res, next) => {
  try {
    const txs = await Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(100).lean();
    let available = 0; let escrow = 0;
    txs.forEach((t) => {
      if (t.status !== 'completed') return;
      if (t.type === 'deposit' || t.type === 'refund') available += t.amount;
      if (t.type === 'withdraw' || t.type === 'payment') available -= t.amount;
      if (t.type === 'escrow_hold') escrow += t.amount;
      if (t.type === 'escrow_release') escrow -= t.amount;
    });
    return sendResponse(res, 200, true, 'تم جلب المحفظة بنجاح.', { availableBalance: available, escrowBalance: escrow, transactions: txs });
  } catch (error) { next(error); }
};

const addTx = async (req, res, next, type, title) => {
  try {
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) return sendResponse(res, 400, false, 'من فضلك أدخل مبلغًا صحيحًا.');
    const tx = await Transaction.create({ userId: req.user.id, type, amount, title: title || req.body.title || type });
    return sendResponse(res, 201, true, 'تمت العملية بنجاح.', tx);
  } catch (error) { next(error); }
};

const deposit = (req, res, next) => addTx(req, res, next, 'deposit', 'إيداع في المحفظة');
const withdraw = (req, res, next) => addTx(req, res, next, 'withdraw', 'سحب من المحفظة');

module.exports = { summary, deposit, withdraw };
