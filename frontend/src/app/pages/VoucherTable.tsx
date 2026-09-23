import { Copy, Check, User, Ticket, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/ui/button';

interface Voucher {
  id: number;
  code: string;
  department_name: string;
  is_redeemed: boolean;
  redeemed_by_email: string | null;
  created_at: string;
}

interface VoucherTableProps {
  vouchers: Voucher[];
  copiedCode: string | null;
  copyToClipboard: (code: string) => void;
}

export function VoucherTable({ vouchers, copiedCode, copyToClipboard }: VoucherTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Adjust this number as needed

  // 1. First, Filter by Search
  const filteredVouchers = vouchers.filter(v => 
    v.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.department_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 2. Then, Calculate Pagination
  const totalPages = Math.ceil(filteredVouchers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredVouchers.slice(indexOfFirstItem, indexOfLastItem);

  // 3. Reset to page 1 when searching
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  if (vouchers.length === 0) {
    return (
      <div className="py-20 text-center bg-white rounded-3xl border border-slate-100">
        <Ticket className="mx-auto mb-4 opacity-10" size={64} />
        <p className="text-slate-400 font-medium">No vouchers generated yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text"
          placeholder="Search codes..."
          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 ring-indigo-500 outline-none transition-all"
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
              <th className="p-4">Voucher Code</th>
              <th className="p-4">Department</th>
              <th className="p-4">Status</th>
              <th className="p-4">Redeemed By</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {currentItems.map((v) => (
              <tr key={v.id} className="group hover:bg-slate-50/30 transition-colors">
                <td className="p-4">
                  <span className="font-mono font-bold text-indigo-900 bg-indigo-50/50 px-2.5 py-1.5 rounded-lg border border-indigo-100/50">
                    {v.code}
                  </span>
                </td>
                <td className="p-4 text-sm font-semibold text-slate-600">
                  {v.department_name}
                </td>
                <td className="p-4">
                  {v.is_redeemed ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                      USED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                      AVAILABLE
                    </span>
                  )}
                </td>
                <td className="p-4">
                  {v.is_redeemed ? (
                    <div className="flex items-center gap-2 max-w-[150px]">
                      <User size={14} className="text-indigo-400 shrink-0" />
                      <span className="text-xs font-medium text-slate-500 truncate">{v.redeemed_by_email}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-300 italic uppercase">Unclaimed</span>
                  )}
                </td>
                <td className="p-4 text-right">
                  {!v.is_redeemed && (
                    <button
                      onClick={() => copyToClipboard(v.code)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    >
                      {copiedCode === v.code ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- PAGINATION CONTROLS --- */}
      <div className="flex items-center justify-between px-2 py-4 border-t border-slate-100">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredVouchers.length)} of {filteredVouchers.length}
        </p>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl h-10 w-10 p-0 border-slate-200"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            <ChevronLeft size={18} />
          </Button>

          <div className="flex items-center gap-1">
             <span className="text-xs font-black text-slate-900 bg-indigo-50 h-10 w-10 flex items-center justify-center rounded-xl border border-indigo-100">
                {currentPage}
             </span>
             <span className="text-xs font-bold text-slate-400 px-2">of {totalPages}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="rounded-xl h-10 w-10 p-0 border-slate-200"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}

 