import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
    setLoading(true);
    try {
      await login(demoEmail, 'password123');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50/50">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm relative">
        
        {/* Title */}
        <div className="text-center mb-8 relative">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Sign In
          </h2>
          <p className="text-xs text-slate-500 mt-2">Access the Smart Hostel OS portal</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs text-center font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 relative">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-950 focus:outline-none focus:border-indigo-500/80 transition-colors pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-950 focus:outline-none focus:border-indigo-500/80 transition-colors pl-10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex justify-center items-center space-x-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <LogIn size={18} />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 relative text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:text-blue-500 font-semibold inline-flex items-center space-x-1">
            <span>Register here</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        {/* Quick Demo Logins */}
        <div className="mt-8 border-t border-slate-100 pt-6 space-y-3">
          <p className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">Demo Quick Access</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin('student1@hostel.com')}
              className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded-xl text-center transition-colors"
            >
              🎓 Student Portal
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('parent@hostel.com')}
              className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded-xl text-center transition-colors"
            >
              👨‍👩‍👦 Parent Portal
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('warden@hostel.com')}
              className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded-xl text-center transition-colors"
            >
              🔑 Warden Portal
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('guard@hostel.com')}
              className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded-xl text-center transition-colors"
            >
              👮 Guard Checkpoint
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('staff@hostel.com')}
              className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded-xl text-center transition-colors"
            >
              🛠️ Staff Repair Jobs
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@hostel.com')}
              className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded-xl text-center transition-colors"
            >
              🛡️ Admin System
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
