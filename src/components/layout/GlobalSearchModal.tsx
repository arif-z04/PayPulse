import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Building2, FileSpreadsheet, BarChart3, X } from 'lucide-react';
import { searchService, GlobalSearchResult } from '@/services/api/searchService';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleClose = () => {
    setQuery('');
    setResults([]);
    onClose();
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsLoading(true);
        try {
          const res = await searchService.searchGlobal(query);
          setResults(res);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'employee':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'department':
        return <Building2 className="w-4 h-4 text-indigo-500" />;
      case 'payroll':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
      case 'report':
        return <BarChart3 className="w-4 h-4 text-amber-500" />;
      default:
        return <Search className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0" onClick={handleClose} aria-hidden="true" />
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-100">
        <div className="flex items-center px-4 py-3 border-b border-slate-200">
          <Search className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type employee name, code, department, payroll ID..."
            className="w-full text-sm text-slate-900 focus:outline-none placeholder:text-slate-400"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {isLoading && (
            <div className="p-4 text-center text-xs text-slate-400">Searching directory...</div>
          )}

          {!isLoading && query.length < 2 && (
            <div className="p-6 text-center text-xs text-slate-400">
              Type at least 2 characters to search across Employees, Departments, Payroll, and Reports.
            </div>
          )}

          {!isLoading && query.length >= 2 && results.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-500">
              No matching records found for <span className="font-semibold text-slate-800">&quot;{query}&quot;</span>.
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="space-y-1">
              {results.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    navigate(r.url);
                    handleClose();
                  }}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 flex items-center gap-3 transition-colors group"
                >
                  <div className="p-2 rounded-md bg-slate-100 group-hover:bg-white border border-slate-200/60 shrink-0">
                    {getIcon(r.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 truncate">{r.title}</p>
                    <p className="text-[11px] text-slate-500 truncate">{r.subtitle}</p>
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded">
                    {r.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-400">
          <span>Press ESC to close</span>
          <span>PayPulse Enterprise Index</span>
        </div>
      </div>
    </div>
  );
};
