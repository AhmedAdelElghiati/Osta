const { sendResponse } = require('../utils/apiResponse');
const Transaction = require('../models/Transaction');
const Job = require('../models/Job');
const User = require('../models/User');

const getWalletData = async (user) => {
  const ownerField = user.role === 'customer' ? 'customerId' : 'artisanId';
  const [txs, escrowJobs] = await Promise.all([
    Transaction.find({ userId: user.id }).sort({ createdAt: -1 }).lean(),
    Job.find({ [ownerField]: user.id, paymentStatus: 'ESCROWED' }).select('price').lean(),
  ]);
  let available = 0;
  txs.forEach(t => {
    if (t.status === 'pending' && t.type === 'withdraw') { available -= t.amount; return; }
    if (t.status !== 'completed') return;
    if (['deposit', 'refund'].includes(t.type)) available += t.amount;
    if (['withdraw', 'payment'].includes(t.type)) available -= t.amount;
    if (t.type === 'escrow_hold' && (t.meta?.direction === 'debit' || user.role === 'customer')) available -= t.amount;
    if (t.type === 'escrow_release' && (t.meta?.direction === 'credit' || user.role === 'artisan')) available += t.amount;
  });
  return { availableBalance: available,
    escrowBalance: escrowJobs.reduce((total, job) => total + Number(job.price || 0), 0),
    transactions: txs.slice(0, 100) };
};

const summary = async (req, res, next) => {
  try { return sendResponse(res, 200, true, 'تم جلب المحفظة.', await getWalletData(req.user)); }
  catch (error) { next(error); }
};
const deposit = (_req, res) => sendResponse(res, 503, false,
  'الإيداع غير متاح حتى تفعيل بوابة الدفع. لم يتم خصم أي مبلغ.');

// Serialize withdrawals across server instances while checking the ledger.
const withdraw = async (req, res, next) => {
  const lockUntil = new Date(Date.now() + 30000);
  let locked = false;
  try {
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount < 1) return sendResponse(res, 400, false, 'أدخل مبلغًا صحيحًا.');
    const user = await User.findOneAndUpdate({ _id: req.user.id,
      $or: [{ withdrawalLockUntil: null }, { withdrawalLockUntil: { $lt: new Date() } }] },
      { $set: { withdrawalLockUntil: lockUntil } }, { new: true }).select('settings.payout');
    if (!user) return sendResponse(res, 409, false, 'فيه طلب سحب بيتنفذ حاليًا. حاول مرة أخرى.');
    locked = true;
    if (!user.settings?.payout?.provider || !user.settings?.payout?.number) {
      return sendResponse(res, 400, false, 'احفظ بيانات حساب السحب في الإعدادات أولًا.');
    }
    const data = await getWalletData(req.user);
    if (amount > data.availableBalance) return sendResponse(res, 409, false, 'المبلغ أكبر من رصيدك المتاح.');
    const tx = await Transaction.create({ userId: req.user.id, type: 'withdraw', amount,
      title: 'طلب سحب', status: 'pending', meta: { payout: user.settings.payout.toObject(), direction: 'debit' } });
    return sendResponse(res, 201, true, 'تم تسجيل طلب السحب للمراجعة.', tx);
  } catch (error) { next(error); }
  finally {
    if (locked) await User.updateOne({ _id: req.user.id, withdrawalLockUntil: lockUntil },
      { $set: { withdrawalLockUntil: null } }).catch(() => {});
  }
};

module.exports = { summary, deposit, withdraw };
