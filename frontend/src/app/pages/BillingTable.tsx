export function BillingTable({ transactions }: any) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        <th className="p-4">Reference</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Seats</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {transactions.map((tx: any) => (
                        <tr key={tx.tx_ref}>
                            <td className="p-4 font-mono text-xs">{tx.tx_ref}</td>
                            <td className="p-4 text-sm font-bold">{tx.amount} ETB</td>
                            <td className="p-4 text-sm">{tx.credits_purchased}</td>
                            <td className="p-4 text-xs text-slate-500">{tx.date}</td>
                            <td className="p-4">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded ${tx.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {tx.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {transactions.length === 0 && <p className="text-center py-10 text-slate-400 italic">No purchase history yet.</p>}
        </div>
    );
}