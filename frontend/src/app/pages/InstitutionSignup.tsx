import { useState } from 'react';
import { useSearchParams } from 'react-router';
import apiClient from '../api/client';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Building2, CheckCircle2, Globe, Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export function InstitutionSignup() {
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const selectedPackage = searchParams.get('package'); 

  const [formData, setFormData] = useState({
    name: '', slug: '', admin_email: '', admin_password: '',admin_password_confirm: '', admin_name: ''
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.admin_password !== formData.admin_password_confirm) {
      return toast.error("Passwords do not match");
    }

    setLoading(true);

   
    const cleanSlug = formData.slug
        .toLowerCase()       // Force lowercase
        .replace(/_/g, '-')  // Change underscores to hyphens
        .replace(/\s+/g, '-') // Change spaces to hyphens
        .replace(/-+/g, '-'); // Change multiple hyphens (---) to single (-)

    try {
        const res = await apiClient.post('/core/owner/register-university/', {
            ...formData, 
            slug: cleanSlug,  
            package: selectedPackage
        });
        
        toast.info("Account created. Redirecting...");

        if (res.data.checkout_url) {
            window.location.href = res.data.checkout_url;
        } else {
            window.location.href = res.data.portal_url;
        }
    } catch (err: any) {
        const errors = err.response?.data;
       if (errors?.slug) {
            toast.error(`Slug Error: ${errors.slug[0]}`); // "This subdomain is already taken"
         } else if (errors?.admin_email) {
            toast.error(`Email Error: ${errors.admin_email[0]}`);
        } else if (errors?.error) {
            toast.error(errors.error); // Catch-all for our manual raises
        } else {
            toast.error("Registration failed. Please check your network.");
        }
    } finally {
        setLoading(false);
    }
}; 

const handleCollegeNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;

    const slug = name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")        // spaces → hyphens
        .replace(/[^a-z0-9-]/g, "")  // remove special characters
        .replace(/-+/g, "-");        // remove duplicate hyphens

    setFormData({
        ...formData,
        name: name,
        slug: slug,
    });
};

// const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//   const value = e.target.value
//     .toLowerCase()
//     .replace(/_/g, '-')
//     .replace(/\s+/g, '-');
    
//   setFormData({ ...formData, slug: value });
// };
  
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full grid md:grid-cols-2 bg-white rounded-[40px] shadow-2xl shadow-indigo-100 overflow-hidden border border-slate-100">
        
        {/* LEFT: INFORMATION */}
        <div className="bg-emerald-600 p-12 text-white flex flex-col justify-between">
            <div>
                <Building2 size={48} className="mb-8 opacity-70" />
                <h2 className="text-3xl font-black leading-tight mb-4">Start your Institutional Journey.</h2>
                <p className="text-yellow-100 leading-relaxed">Create a dedicated workspace for your college and empower your students today.</p>
            </div>
            <div className="space-y-4">
                <div className="flex gap-3 items-center text-sm font-medium">
                    <CheckCircle2 size={18} className="text-yellow-300" />
                    <span>Private Subdomain Access</span>
                </div>
                <div className="flex gap-3 items-center text-sm font-medium">
                    <CheckCircle2 size={18} className="text-yellow-300" />
                    <span>Real-time Dean Analytics</span>
                </div>
            </div>
        </div>

        {/* RIGHT: FORM */}
        <div className="p-12">
            <h1 className="text-2xl font-bold text-slate-900 mb-8">Register Institution</h1>
            <form onSubmit={handleSignup} className="space-y-5">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        College Name <span className="text-red-500">*</span>
                    </label>
                    <Input 
                        placeholder="e.g. Damat Hotel and Business College" 
                        required
                        onChange={handleCollegeNameChange}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                </div>
                
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Desired Domain <span className="text-red-500">*</span>
                    </label>
                    <Input placeholder="universal-college" value={formData.slug} readOnly className="rounded-r-none border-r-0" />
                    <span className="h-10 px-4 flex items-center bg-slate-50 border border-slate-200 border-l-0 rounded-r-md text-slate-400 font-bold text-sm">
                        .ethioexitexamprep.xyz
                    </span> 
                </div>

                <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-100">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Admin Name <span className="text-red-500">*</span>
                        </label>
                        <Input 
                            required 
                            onChange={e => setFormData({...formData, admin_name: e.target.value})}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Admin Email <span className="text-red-500">*</span>
                        </label>
                        <Input 
                            type="email" 
                            required onChange={e => setFormData({...formData, admin_email: e.target.value})}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Set Password <span className="text-red-500">*</span>
                        </label>
                        <Input 
                            type="password" 
                            required onChange={e => setFormData({...formData, admin_password: e.target.value})}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <Input 
                            type="password" 
                            required onChange={e => setFormData({...formData, admin_password_confirm: e.target.value})}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                            />
                    </div>
                    
                </div>

                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-14 rounded-2xl font-bold mt-6" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : "Create Institutional Portal"}
                </Button>
            </form>
        </div>
      </div>
    </div>
  );
}

 