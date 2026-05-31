// import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import apiClient from '../api/client';
// import { useNavigate } from 'react-router';
// import { toast } from 'sonner';
// import axios from 'axios';


// interface User {
//   id: string;
//   email: string;
//   name: string;
//   voucher_code?: string;
//   department: string;
//   university: string;
// }

// interface AuthContextType {
//   user: User | null;
//   login: (email: string, password: string) => Promise<boolean>;
//   register: (name: string, email: string, password: string, voucherCode: string) => Promise<boolean>;
//   logout: () => void;
//   isLoading: boolean;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// }

// // Mock users database (in production, this would be a real backend)
// // const MOCK_USERS = [
// //   {
// //     id: '1',
// //     email: 'student@university.edu',
// //     password: 'password123',
// //     name: 'Sarah Johnson',
// //     department: 'Nursing',
// //     university: 'Addis Ababa University',
// //   },
// // ];

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const navigate = useNavigate();
//   const [error, setError] = useState('');

//   // Check for existing session on mount
//   useEffect(() => {
//     const storedUser = localStorage.getItem('user');
//     const token = localStorage.getItem('access_token');

//     if (storedUser && token) {
//       setUser(JSON.parse(storedUser));
//     }
//     setIsLoading(false);
//   }, []);
    
//     const login = async (email: string, password: string): Promise<boolean> => {
//       try {
//         const response = await apiClient.post('/token/', { email, password });
//         const { access, refresh, user: userData } = response.data;

//         localStorage.setItem('access_token', access);
//         localStorage.setItem('refresh_token', refresh);
//         localStorage.setItem('user', JSON.stringify(userData));

//         setUser(userData);
//         return true;
//       } catch (error) {
//         console.error('Auth Error:', error);
//         return false;
//       }
//   };
 
//   const register = async (
//     name: string,
//     email: string,
//     password: string,
//     voucherCode: string
//   ): Promise<any> => {
    
//     await new Promise((resolve) => setTimeout(resolve, 500));
//     try {
//       const response = await apiClient.post("users/register/", {
//         full_name: name,
//         email: email,
//         password: password,
//         voucher_code: voucherCode.trim()  
//       });
//       console.log('Registration response:', response.data);
//       if (response.status === 201) {
//         toast.success("Registration successful! Please sign in.");
//         navigate('/login');
//       }
//     } catch (err: any) {
//       // Handle specific Django errors (Voucher invalid, Email taken, etc.)
//       const backendError = err.response?.data?.error || "Registration failed. Please try again.";
//       setError(backendError);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const logout = () => {
//     setUser(null);
//     localStorage.removeItem('user');
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }




import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '../api/client';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  department_name: string;
  university_name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<any>;
  register: (name: string, email: string, password: string, voucherCode: string) => Promise<any>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const syncSession = async () => {
      const storedUser = localStorage.getItem('user_data');
      const token = localStorage.getItem('access_token');

      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.clear();
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Validate backend/tenant using a quick authenticated request.
        // If the backend rejects (tenant missing, 400, 401, etc.) clear session.
        try {
          await apiClient.get('dashboard/');
        } catch (err: any) {
          const payload = err?.response?.data ?? {};
          const message = String(payload.error ?? payload.detail ?? '');
          // detect tenant validation message or auth failures
          const tenantMsg = message.includes('No valid university workspace detected');
          const status = err?.response?.status;
          if (tenantMsg || status === 400 || status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user_data');
            setUser(null);
          }
        }
      }

      setIsLoading(false);
    };

    syncSession();
  }, []);

  const login = async (email: string, password: string): Promise<any> => {
    try {
      const response = await apiClient.post('token/', { email, password });
      const { access, refresh, user: userData } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user_data', JSON.stringify(userData));

      setUser(userData);
      // Return full backend payload so callers can display messages or data
      return response.data;
    } catch (error: any) {
      // Normalize and bubble up backend error object
      const payload = error?.response?.data ?? { error: 'Login failed' };
      return Promise.reject(payload);
    }
  };

  const register = async (name: string, email: string, password: string, voucherCode: string): Promise<any> => {
    try {
      const response = await apiClient.post('users/register/', {
        full_name: name,
        email: email,
        password: password,
        voucher_code: voucherCode.trim(),
      });
      // Return backend response payload (message, created user, etc.)
      return response.data;
    } catch (error: any) {
      const payload = error?.response?.data ?? { error: 'Registration failed' };
      return Promise.reject(payload);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}