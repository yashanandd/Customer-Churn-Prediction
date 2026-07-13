import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowLeft, Activity, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { loginUser, registerUser, forgotPassword, verifyOtp } from '../../services/auth';

interface AuthPageProps {
  onAuthSuccess: (token: string, user: any) => void;
}

type AuthView = 'login' | 'register' | 'forgot' | 'reset';

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    clearMessages();
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid login credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !username || !password) {
      setError("Please fill in all fields.");
      return;
    }
    clearMessages();
    setLoading(true);
    try {
      const data = await registerUser(email, username, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setSuccess("Account registered successfully!");
      setTimeout(() => {
        onAuthSuccess(data.token, data.user);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    clearMessages();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSuccess("OTP sent successfully. Please check your inbox (and data/otp_logs.txt).");
      setTimeout(() => {
        setView('reset');
        clearMessages();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to process request.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp || !password) {
      setError("Please fill in all fields.");
      return;
    }
    clearMessages();
    setLoading(true);
    try {
      await verifyOtp(email, otp, password);
      setSuccess("Password reset successful! Redirecting to login...");
      setTimeout(() => {
        setView('login');
        setPassword('');
        setOtp('');
        clearMessages();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  // Card Variants for transitions
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.95, y: -15, transition: { duration: 0.3 } }
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center overflow-hidden font-sans p-4">
      {/* Decorative gradient glowing spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] rounded-full bg-emerald-500/5 blur-[90px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <motion.div 
            initial={{ rotate: -15, scale: 0.8, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center shadow-xl shadow-primary/20 mb-4"
          >
            <Activity className="w-7 h-7 text-white" />
          </motion.div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">ChurnAI</h1>
          <p className="text-gray-400 mt-2 text-sm text-center">Predictive insights to supercharge customer retention</p>
        </div>

        <AnimatePresence mode="wait">
          {view === 'login' && (
            <motion.div key="login" variants={cardVariants} initial="hidden" animate="visible" exit="exit" className="glass-card p-8">
              <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-gray-400 text-sm mb-6">Enter your details to sign in to your dashboard</p>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="form-label">Username or Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="text" 
                      className="form-input pl-11"
                      placeholder="alex@company.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="form-label mb-0">Password</label>
                    <button 
                      type="button" 
                      onClick={() => { setView('forgot'); clearMessages(); }}
                      className="text-sm font-medium text-primary hover:text-purple-400 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      className="form-input pl-11 pr-11" 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-sm rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
                
                <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                  {loading ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Sign In"}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-gray-400">
                Don't have an account?{' '}
                <button 
                  onClick={() => { setView('register'); clearMessages(); }} 
                  className="font-medium text-primary hover:text-purple-400 transition-colors"
                >
                  Create one now
                </button>
              </div>
            </motion.div>
          )}

          {view === 'register' && (
            <motion.div key="register" variants={cardVariants} initial="hidden" animate="visible" exit="exit" className="glass-card p-8">
              <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
              <p className="text-gray-400 text-sm mb-6">Build a profile to manage customer predictions</p>
              
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="form-label">Username</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="text" 
                      className="form-input pl-11" 
                      placeholder="alex_smith"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="email" 
                      className="form-input pl-11" 
                      placeholder="alex@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      className="form-input pl-11 pr-11" 
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-sm rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
                {success && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm rounded-lg flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" />{success}</div>}

                <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                  {loading ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Sign Up"}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-gray-400">
                Already have an account?{' '}
                <button 
                  onClick={() => { setView('login'); clearMessages(); }} 
                  className="font-medium text-primary hover:text-purple-400 transition-colors"
                >
                  Sign In
                </button>
              </div>
            </motion.div>
          )}

          {view === 'forgot' && (
            <motion.div key="forgot" variants={cardVariants} initial="hidden" animate="visible" exit="exit" className="glass-card p-8">
              <button 
                onClick={() => { setView('login'); clearMessages(); }} 
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-6 font-medium"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </button>

              <h2 className="text-2xl font-bold text-white mb-2">Forgot Password?</h2>
              <p className="text-gray-400 text-sm mb-6">Enter your email and we'll send a 6-digit OTP code to reset your password.</p>
              
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="form-label">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="email" 
                      className="form-input pl-11" 
                      placeholder="alex@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {error && <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-sm rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
                {success && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm rounded-lg flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" />{success}</div>}

                <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                  {loading ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Send OTP"}
                </button>
              </form>
            </motion.div>
          )}

          {view === 'reset' && (
            <motion.div key="reset" variants={cardVariants} initial="hidden" animate="visible" exit="exit" className="glass-card p-8">
              <button 
                onClick={() => { setView('forgot'); clearMessages(); }} 
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-6 font-medium"
              >
                <ArrowLeft className="w-4 h-4" /> Request new OTP
              </button>

              <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
              <p className="text-gray-400 text-sm mb-6">Enter the OTP sent to {email} and pick a secure new password.</p>
              
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="form-label">OTP Verification Code</label>
                  <div className="relative font-mono">
                    <input 
                      type="text" 
                      maxLength={6} 
                      className="form-input tracking-[1em] text-center text-xl font-bold" 
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      className="form-input pl-11 pr-11" 
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-sm rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
                {success && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm rounded-lg flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" />{success}</div>}

                <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                  {loading ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Verify & Reset"}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuthPage;
