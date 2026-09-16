import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { 
  GraduationCap, BarChart3, ShieldCheck, Smartphone, 
  ArrowRight, CheckCircle2, Building2, Zap, Globe 
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export function MarketingLandingPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth(); // Get auth state

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100">
      {/* NAVIGATION */}
      <nav className="border-b border-slate-200/60 sticky top-0 bg-white/80 backdrop-blur-xl z-50">
        <div className="container max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="bg-emerald-600 p-2 rounded-xl group-hover:rotate-12 transition-transform">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">EXIT<span className="text-emerald-600">EXAMINER</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <nav className="flex gap-6 text-sm font-bold text-slate-500">
               <a href="#features" className="hover:text-emerald-600 transition-colors">Platform</a>
               <a href="#pricing" className="hover:text-emerald-600 transition-colors">Pricing</a>
            </nav>
             {isAuthenticated && user?.is_superuser ? (
              // If the Boss is logged in, show the door to the Owner Dashboard
              <Button 
                onClick={() => navigate('/owner')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 font-black shadow-lg"
              >
                Enter Command Center <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              // Otherwise show the standard signup for colleges
              <Button 
                onClick={() => navigate('/signup-institution')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 font-bold"
              >
                Partner with Us
              </Button>
            )}
          </div>
        </div>
      </nav> 

      {/* HERO SECTION */}
      <header className="relative pt-24 pb-20 border-b border-slate-200/50 bg-white">
        <div className="container max-w-7xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-black uppercase tracking-widest mb-8">
              <Zap className="w-3 h-3 fill-current" /> Trusted by 20+ Colleges
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-8 leading-[1.05]">
              The Gold Standard in <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-600">Exam Competency.</span>
            </h1>
            <p className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed">
              Equip your students with the tools to master the Ethiopian National Exit Exam. Standardized mocks, real-time analytics, and seamless institutional management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/signup-institution')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-16 px-10 text-lg rounded-2xl shadow-xl shadow-indigo-200"
              >
                Get Your Subdomain <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        </div>
      </header>

      {/* PRICING SECTION (The redPrepaid Model) */}
      <section id="pricing" className="py-24 bg-white">
        <div className="container max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-black mb-4">Transparent Seat Pricing</h2>
                <p className="text-slate-500">Pay only for the students you onboard. No monthly overhead.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                <PriceCard id="starter" title="Starter" seats="50" price="1,000" description="Perfect for small private colleges." />
                <PriceCard id="standard" title="Standard" seats="250" price="4,500" description="Ideal for growing departments." featured />
                <PriceCard id="university" title="University" seats="1000" price="15,000" description="Full institutional coverage." />
            </div>
        </div>
      </section>red

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white py-20">
         <div className="container max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
            <div className="col-span-2">
                <span className="text-2xl font-black tracking-tighter">EXIT<span className="text-emerald-400">EXAMINER</span></span>
                <p className="mt-4 text-slate-400 max-w-sm">Building the future of Ethiopian higher education through data-driven preparation.</p>
            </div>
            <div className="text-sm space-y-4">
                <p className="font-bold text-slate-200">Product</p>
                <p className="text-slate-500">Practice Mocks</p>
                <p className="text-slate-500">Dean Analytics</p>
            </div>
            <div className="text-sm space-y-4">
                <p className="font-bold text-slate-200">Company</p>
                <p className="text-slate-500">Contact Support</p>
                <p className="text-slate-500">Privacy Policy</p>
            </div>
         </div>
      </footer>
    </div>
  );
}

// --- SUBCOMPONENTS ---

function PriceCard({ title, seats, price, description, id, featured = false }: any) {
  const navigate = useNavigate();
    return (
        <div className={`p-10 rounded-[32px] border-2 transition-all ${featured ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xl scale-105' : 'border-slate-100 bg-slate-50 text-slate-900'}`}>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className={`text-sm mb-8 ${featured ? 'text-indigo-100' : 'text-slate-500'}`}>{description}</p>
            <div className="mb-8">
                <span className="text-4xl font-black">{price} ETB</span>
                <p className={`text-xs font-bold mt-1 ${featured ? 'text-yellow-200' : 'text-slate-400'}`}>FOR {seats} STUDENT SEATS</p>
            </div>
            <ul className="space-y-4 mb-10 text-sm font-medium">
                <li className="flex gap-2"><CheckCircle2 size={18} className={featured ? 'text-yellow-300' : 'text-emerald-600'}/> Verified Exam Book</li>
                <li className="flex gap-2"><CheckCircle2 size={18} className={featured ? 'text-yellow-300' : 'text-emerald-600'}/> Dean Analytics</li>
            </ul>
             <Button 
                onClick={() => navigate(`/signup-institution?package=${id}`)} // Pass package ID
                className={`w-full py-6 rounded-xl font-bold ${featured ? 'bg-white text-emerald-600' : 'bg-emerald-600 text-white'}`}
            >
                Select {title}
            </Button>
        </div>
    )
}


 