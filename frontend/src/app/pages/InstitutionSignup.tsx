import { useState } from 'react';
import apiClient from '../api/client';

export function InstitutionSignup() {
  const [formData, setFormData] = useState({
    name: '', slug: '', admin_email: '', admin_password: '', admin_name: ''
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Call your RegisterUniversityView
      const res = await apiClient.post('/core/register-university/', formData);
      
      // SUCCESS: Redirect them to their new private subdomain!
      window.location.href = res.data.portal_url; 
    } catch (err) {
      alert("Registration failed. Slug might be taken.");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-10">
      <h1 className="text-3xl font-bold mb-6">Register Your College</h1>
      <form onSubmit={handleSignup} className="space-y-4">
        <input 
          placeholder="University Name (e.g. Adama University)" 
          className="w-full p-3 border rounded"
          onChange={e => setFormData({...formData, name: e.target.value})}
        />
        
        <div className="flex items-center gap-2">
          <input 
            placeholder="subdomain" 
            className="p-3 border rounded"
            onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase()})}
          />
          <span className="font-bold text-slate-500">.exitexaminer.com</span>
        </div>
        <input 
          placeholder="Admin Name"
          className="w-full p-3 border rounded"
          onChange={e => setFormData({...formData, admin_name: e.target.value})}
        />
        <input 
          placeholder="Admin email (e.g. admin@university.edu)" 
          className="w-full p-3 border rounded"
          onChange={e => setFormData({...formData, admin_email: e.target.value})}
        />
        <input 
          placeholder="Password" 
          type="password"
          className="w-full p-3 border rounded"
          onChange={e => setFormData({...formData, admin_password: e.target.value})}
        />
        {/* Admin fields: email, password, name */}
        <button className="w-full bg-primary/80 hover:bg-primary/90 text-white p-4 rounded font-bold">
          Create University Portal
        </button>
      </form>
    </div>
  );
}