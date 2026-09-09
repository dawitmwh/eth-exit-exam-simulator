import { History, CreditCard, ArrowUpRight, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface Transaction {
  tx_ref: string;
  amount: string;
  credits_purchased: number;
  status: string;
  date: string;
}

export function BillingTable({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="py-20 text-center bg-white rounded-3xl border border-slate-100">
        <History className="mx-auto mb-4 opacity-10" size={64} />
        <p className="text-slate-400 font-medium">No transaction history found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-50">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
            <th className="p-4">Reference</th>
            <th className="p-4">Amount</th>
            <th className="p-4">Seats Added</th>
            <th className="p-4">Date</th>
            <th className="p-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {transactions.map((tx) => (
            <tr key={tx.tx_ref} className="hover:bg-slate-50/30 transition-colors">
              <td className="p-4 font-mono text-xs text-slate-500">{tx.tx_ref}</td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900">{tx.amount}</span>
                  <span className="text-[10px] font-bold text-slate-400">ETB</span>
                </div>
              </td>
              <td className="p-4 font-bold text-emerald-600">
                +{tx.credits_purchased}
              </td>
              <td className="p-4 text-xs font-medium text-slate-500">
                {tx.date}
              </td>
              <td className="p-4">
                <StatusBadge status={tx.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status.toUpperCase()) {
    case 'SUCCESS':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
          <CheckCircle2 size={10} /> COMPLETED
        </span>
      );
    case 'PENDING':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
          <Clock size={10} /> PENDING
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
          <XCircle size={10} /> FAILED
        </span>
      );
  }
}