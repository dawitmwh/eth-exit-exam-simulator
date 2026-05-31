# Authentication Guide - Exit Examiner

## 🎉 What's New

Your app now has **full authentication** with login and registration!

## 🔐 Features Added

### 1. **Login Page** (`/login`)
- Email & password authentication
- Form validation
- Error handling
- Link to registration
- Demo credentials shown

### 2. **Registration Page** (`/register`)
- Create new account
- Password strength validation
- Confirm password check
- Duplicate email detection
- Auto-login after registration

### 3. **Protected Routes**
- All main pages now require authentication
- Automatic redirect to login if not authenticated
- Session persisted in localStorage

### 4. **User Context**
- Global authentication state
- User info available throughout app
- Login, logout, register functions

## 🚀 How to Use

### Access the App

Visit: **http://localhost:5173**

You'll automatically be redirected to the login page.

### Demo Credentials

```
Email: student@university.edu
Password: password123
```

### Create New Account

1. Click "Sign up" on login page
2. Fill in your details:
   - Full name
   - Email
   - Password (min 8 characters)
   - Confirm password
3. Click "Create Account"
4. You'll be automatically logged in!

### Pages

- **`/login`** - Login page (public)
- **`/register`** - Registration page (public)
- **`/`** - Dashboard (protected)
- **`/exams`** - Exams list (protected)
- **`/analytics`** - Analytics (protected)
- **`/profile`** - Profile with logout (protected)

## 🗂️ New Files Created

```
src/app/
├── contexts/
│   └── AuthContext.tsx       # ✅ Authentication provider
├── pages/
│   ├── Login.tsx             # ✅ Login page
│   └── Register.tsx          # ✅ Registration page
└── components/
    └── ProtectedRoute.tsx    # ✅ Route protection wrapper
```

## 📝 Code Overview

### 1. AuthContext (Global Auth State)

```typescript
// src/app/contexts/AuthContext.tsx
const { user, login, register, logout } = useAuth();

// Available anywhere in your app after wrapping with AuthProvider
```

**Methods:**
- `user` - Current logged-in user or null
- `login(email, password)` - Login function
- `register(name, email, password)` - Registration function
- `logout()` - Logout function
- `isLoading` - Loading state

### 2. ProtectedRoute Component

```typescript
// Wraps routes that require authentication
<Route path="/" element={
  <ProtectedRoute>
    <MobileLayout />
  </ProtectedRoute>
}>
```

### 3. Using Auth in Components

```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, logout } = useAuth();
  
  return (
    <div>
      <p>Welcome {user?.name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## 🔄 Flow

### Login Flow
1. User visits app → Redirected to `/login`
2. Enter credentials
3. Click "Sign In"
4. If valid → Redirected to `/dashboard`
5. If invalid → Error message shown

### Registration Flow
1. User clicks "Sign up" on login page
2. Fill registration form
3. Click "Create Account"
4. If email exists → Error shown
5. If successful → Auto-login → Dashboard

### Logout Flow
1. User clicks "Sign Out" in profile
2. Auth state cleared
3. Redirected to `/login`

## 💾 Data Storage

Currently using **mock data** stored in memory:

```typescript
// Default user
{
  email: 'student@university.edu',
  password: 'password123',
  name: 'Sarah Johnson',
  department: 'Nursing',
  university: 'Addis Ababa University'
}
```

**Session Storage:**
- User info stored in `localStorage`
- Persists across page refreshes
- Cleared on logout

## 🔧 Customization

### Add More Default Users

Edit `src/app/contexts/AuthContext.tsx`:

```typescript
const MOCK_USERS = [
  {
    id: '1',
    email: 'student@university.edu',
    password: 'password123',
    name: 'Sarah Johnson',
    department: 'Nursing',
    university: 'Addis Ababa University',
  },
  // Add more users here
  {
    id: '2',
    email: 'john@university.edu',
    password: 'password123',
    name: 'John Doe',
    department: 'Engineering',
    university: 'University of Technology',
  },
];
```

### Connect to Real Backend

Replace the mock authentication in `AuthContext.tsx`:

```typescript
const login = async (email: string, password: string) => {
  // Replace this with real API call
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    setUser(data.user);
    localStorage.setItem('token', data.token);
    return true;
  }
  
  return false;
};
```

### Add Password Reset

Create a new page `ForgotPassword.tsx` and add route:

```typescript
<Route path="/forgot-password" element={<ForgotPassword />} />
```

### Add Email Verification

Modify registration flow to send verification email.

## 🎨 Styling

Both login and registration pages use:
- Gradient background matching app theme
- Animated entrance with Motion
- Card-based form layout
- Responsive design (mobile & desktop)
- Loading states
- Error messages

## 🔒 Security Notes

### Current (Development)
- ⚠️ Passwords stored in plain text (mock data)
- ⚠️ No rate limiting
- ⚠️ No CSRF protection
- ✅ Client-side validation
- ✅ Session persistence

### For Production
- ✅ Hash passwords (bcrypt)
- ✅ Use JWT tokens
- ✅ Add rate limiting
- ✅ HTTPS only
- ✅ CSRF tokens
- ✅ Input sanitization
- ✅ Password requirements

## 🐛 Troubleshooting

### Can't Login
- Check console for errors
- Verify credentials match demo account
- Clear localStorage: `localStorage.clear()`
- Refresh page

### Infinite Redirect Loop
- Clear browser cache
- Check `ProtectedRoute` logic
- Verify `isLoading` state

### Registration Not Working
- Check email isn't already used
- Ensure password is 8+ characters
- Passwords must match

## 📚 Next Steps

1. **Connect Real Database**
   - Replace mock data with API calls
   - Use JWT for token management

2. **Add Features**
   - Password reset
   - Email verification
   - Social login (Google, Facebook)
   - Two-factor authentication

3. **Enhance Security**
   - Hash passwords
   - Rate limiting
   - Session timeout
   - CSRF protection

4. **User Management**
   - Edit profile
   - Change password
   - Delete account
   - Avatar upload

## 🎯 Key Files Modified

- `src/app/App.tsx` - Added AuthProvider & routes
- `src/app/components/Profile.tsx` - Added logout functionality
- `src/app/components/Dashboard.tsx` - Shows user's name

## ✅ Testing Checklist

- [ ] Can login with demo credentials
- [ ] Can create new account
- [ ] Can logout
- [ ] Protected routes redirect to login
- [ ] Session persists on refresh
- [ ] Error messages shown correctly
- [ ] Mobile responsive
- [ ] Desktop responsive

---

**🎉 Authentication is ready! Visit http://localhost:5173 to try it!**
