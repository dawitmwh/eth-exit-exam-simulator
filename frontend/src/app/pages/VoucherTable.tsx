import { Check, Copy} from 'lucide-react';

export function VoucherTable({ vouchers, copiedCode, copyToClipboard }: any) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        <th className="p-4">Code</th>
                        <th className="p-4">Department</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {vouchers.map((v: any) => (
                        <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 font-mono font-bold text-slate-700">{v.code}</td>
                            <td className="p-4 text-sm text-slate-600">{v.department_name}</td>
                            <td className="p-4">
                                {v.is_redeemed ? (
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">REDEEMED</span>
                                ) : (
                                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded">AVAILABLE</span>
                                )}
                            </td>
                            <td className="p-4 text-right">
                                {!v.is_redeemed && (
                                    <button onClick={() => copyToClipboard(v.code)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                                        {copiedCode === v.code ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}