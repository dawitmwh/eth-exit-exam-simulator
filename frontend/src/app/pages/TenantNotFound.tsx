import { useMemo } from 'react';
import { Building2, AlertTriangle, ArrowRight, Home, PlusCircle, HelpCircle, ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

interface TenantNotFoundProps {
  requestedSlug?: string;
}

export function TenantNotFound({ requestedSlug }: TenantNotFoundProps) {
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  // Extract root domain URL (e.g. from 'aau.ethioexitexamprep.xyz' -> 'http://ethioexitexamprep.xyz')
  const rootDomainUrl = useMemo(() => {
    if (!currentHostname) return '/';
    
    // In cloud sandboxes or localhost
    if (currentHostname.includes('run.app') || currentHostname.includes('webcontainer') || currentHostname === 'localhost') {
      return '/';
    }

    const parts = currentHostname.split('.');
    const protocol = window.location.protocol;
    const port = window.location.port ? `:${window.location.port}` : '';

    // If subdomain is present (e.g. ['xyz', 'ethioexitexamprep', 'xyz'])
    if (parts.length >= 3) {
      const rootHost = parts.slice(1).join('.');
      return `${protocol}//${rootHost}${port}`;
    }

    return `${protocol}//${currentHostname}${port}`;
  }, [currentHostname]);

  const slug = requestedSlug || (currentHostname.includes('.') ? currentHostname.split('.')[0] : 'unknown');
  const institutionSignupUrl = `${rootDomainUrl}/signup-institution?slug=${encodeURIComponent(slug)}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100 flex flex-col justify-between p-4 md:p-8">
      {/* Header Bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
            EE
          </div>
          <div>
            <span className="font-bold text-slate-100 tracking-tight">Exit Examiner</span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              National Portal
            </span>
          </div>
        </div>

        <a
          href={rootDomainUrl}
          className="text-xs md:text-sm text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
        >
          <Home className="w-4 h-4" />
          <span>Main Platform</span>
        </a>
      </header>

      {/* Main Error Hero */}
      <main className="max-w-2xl w-full mx-auto my-12 text-center">
        <div className="relative inline-block mb-6">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-xl shadow-amber-500/5">
            <Building2 className="w-10 h-10 md:w-12 md:h-12 opacity-80" />
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <ShieldAlert className="w-3.5 h-3.5" />
          HTTP 404 — Subdomain Not Registered
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
          Institution Portal Not Found
        </h1>

        <p className="text-slate-300 text-base md:text-lg mb-6 leading-relaxed max-w-xl mx-auto">
          The university subdomain{' '}
          <code className="px-2 py-0.5 bg-slate-800/90 text-amber-300 rounded border border-slate-700 font-mono text-sm font-semibold">
            {currentHostname || `${slug}.ethioexitexamprep.xyz`}
          </code>{' '}
          has not been registered on the Exit Examiner platform, or may have been deactivated.
        </p>

        {/* Info Card */}
        <Card className="bg-slate-900/80 border-slate-800 p-6 rounded-2xl text-left mb-8 shadow-xl">
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-3">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            What does this mean?
          </h2>
          <ul className="text-xs md:text-sm text-slate-400 space-y-2.5">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-2 flex-shrink-0" />
              <span>
                <strong>Students & Faculty:</strong> Please double-check the exact link provided by your college dean or department head.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-2 flex-shrink-0" />
              <span>
                <strong>College Administrators:</strong> If you are the dean or IT manager for this institution, you can register and claim this subdomain now.
              </span>
            </li>
          </ul>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <a href={rootDomainUrl} className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full border-slate-700 hover:bg-slate-800 text-slate-200 gap-2 h-12 px-6"
            >
              <Home className="w-4 h-4" />
              Back to Main Platform
            </Button>
          </a>

          <a href={institutionSignupUrl} className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-2 h-12 px-6 shadow-lg shadow-emerald-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              Register '{slug}' University
              <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto py-4 border-t border-slate-800/80 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>&copy; {new Date().getFullYear()} Exit Examiner — Ethiopian Higher Education Exam Readiness.</p>
        <p className="text-slate-400">
          Wildcard Gateway Active • Verified Nameservers
        </p>
      </footer>
    </div>
  );
}
