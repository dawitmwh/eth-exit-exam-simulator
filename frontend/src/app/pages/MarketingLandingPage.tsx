import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { 
  GraduationCap, 
  BarChart3, 
  ShieldCheck, 
  Smartphone, 
  ArrowRight, 
  CheckCircle2,
  Building2
} from 'lucide-react';
import { motion } from 'motion/react';

export function MarketingLandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100">
      {/* 1. NAVIGATION */}
      <nav className="border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="container max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">Exit Examiner</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">How it Works</a>
            <Button 
              onClick={() => navigate('/signup-institution')}
              className="bg-primary/80 hover:bg-primary/90 text-white rounded-full px-6"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="container max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge text="The Standard for Ethiopian Higher Education" />
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mt-6 mb-8 leading-[1.1]">
                Empower Your Graduates. <br />
                <span className="text-indigo-600">Elevate Your Institution.</span>
              </h1>
              <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl">
                The comprehensive preparatory platform designed specifically for the Ethiopian National Exit Examination. Provide your students with standardized mocks and track institutional progress in real-time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/signup-institution')}
                  className="bg-primary/80 hover:bg-primary text-white h-14 px-8 text-lg rounded-xl shadow-lg shadow-indigo-200"
                >
                  Onboard Your University <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-xl border-slate-200">
                  View Demo
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 -z-10 translate-x-1/4 -translate-y-1/4">
          <div className="w-[600px] h-[600px] bg-indigo-50 rounded-full blur-3xl opacity-50" />
        </div>
      </section>

      {/* 3. FEATURES GRID */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything your campus needs</h2>
            <p className="text-slate-600">A complete ecosystem for administrators to manage and students to excel.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<ShieldCheck className="w-6 h-6 text-indigo-600" />}
              title="Standardized Content"
              desc="Access a vast bank of validated questions across Nursing, Engineering, Management, and more."
            />
            <FeatureCard 
              icon={<BarChart3 className="w-6 h-6 text-indigo-600" />}
              title="Dean's Analytics"
              desc="Monitor your university's performance against national benchmarks with detailed group statistics."
            />
            <FeatureCard 
              icon={<Smartphone className="w-6 h-6 text-indigo-600" />}
              title="Mobile First"
              desc="Students can practice anywhere with our dedicated Flutter app featuring offline sync capabilities."
            />
          </div>
        </div>
      </section>

      {/* 4. THE VOUCHER MODEL (HOW IT WORKS) */}
      <section id="how-it-works" className="py-24">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="bg-primary rounded-[32px] p-8 md:p-16 text-white overflow-hidden relative">
            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Simple, Scalable Onboarding</h2>
                <ul className="space-y-6">
                  <StepItem num="1" title="Register Institution" desc="Choose your unique subdomain (e.g., adama.exitexam.com)." />
                  <StepItem num="2" title="Purchase Seat Vouchers" desc="Buy prep-access in bulk for your graduating departments." />
                  <StepItem num="3" title="Student Redemption" desc="Students use codes to join your private, branded portal." />
                </ul>
              </div>
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl">
                <Building2 className="w-12 h-12 text-indigo-300 mb-6" />
                <h3 className="text-xl font-bold mb-4 text-indigo-100">Ready to secure your spot?</h3>
                <p className="text-indigo-100/60 mb-8">Join over 20+ colleges using our standardized preparation framework.</p>
                <Button 
                  onClick={() => navigate('/signup-institution')}
                  className="w-full bg-white text-indigo-900 hover:bg-indigo-50 py-6 font-bold"
                >
                  Create University Portal
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-slate-100">
        <div className="container max-w-7xl mx-auto px-6 flex flex-col md:row items-center justify-between gap-6">
          <div className="text-slate-400 text-sm">
            © 2026 Exit Examiner SaaS. All rights reserved.
          </div>
          <div className="flex gap-8 text-sm text-slate-600 font-medium">
            <a href="#" className="hover:text-indigo-600">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600">Terms of Service</a>
            <a href="#" className="hover:text-indigo-600">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function Badge({ text }: { text: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider">
      <CheckCircle2 className="w-3 h-3" /> {text}
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="p-8 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-xl hover:shadow-indigo-50 group">
      <div className="mb-6 p-3 bg-slate-50 rounded-xl w-fit group-hover:bg-indigo-50 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function StepItem({ num, title, desc }: { num: string, title: string, desc: string }) {
  return (
    <li className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">{num}</div>
      <div>
        <h4 className="font-bold text-lg text-white">{title}</h4>
        <p className="text-indigo-100/60 text-sm">{desc}</p>
      </div>
    </li>
  );
}