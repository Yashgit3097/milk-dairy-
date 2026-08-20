import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { KeyRound, Sparkles, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function Activation() {
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { activate } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!mobile.trim() || !code.trim()) {
      setError('Mobile number and activation code are required.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    const result = await activate(code.trim(), mobile.trim());
    setIsSubmitting(false);

    if (result.success) {
      navigate('/customer/overview');
    } else {
      setError(result.error || 'Activation failed. Please check your credentials.');
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-slate-100/60 mt-12 animate-fadeIn relative overflow-hidden">
      {/* Background card accent glows */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>

      <div className="text-center space-y-2 relative">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-sm">
          <KeyRound className="w-5.5 h-5.5" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-900 tracking-tight pt-2">Activate Your Diary</h2>
        <p className="text-slate-500 text-xs px-2 leading-relaxed">
          Enter the unique activation code shared by your milk vendor to start tracking daily delivery.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 rounded-xl p-3 flex items-start gap-2.5 text-xs animate-shake mt-4">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-4 pt-4 text-xs font-semibold relative" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block text-center">Mobile Number</label>
          <input
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="Enter 10-digit registered number"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 text-center tracking-wide font-medium text-sm"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block text-center">Activation Code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="MILK-XXXX-XXXX"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-indigo-600 font-mono font-black placeholder:text-slate-300 focus:outline-none focus:bg-white focus:border-indigo-500 text-center uppercase tracking-widest text-sm"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/10 transition-all duration-200 flex items-center justify-center gap-2 mt-4 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying Code...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Activate Account</span>
            </>
          )}
        </button>
      </form>
      
      <div className="text-center pt-4 border-t border-slate-100 mt-5 relative">
        <button
          onClick={() => navigate('/')}
          className="text-xs text-slate-400 hover:text-slate-650 transition-colors inline-flex items-center gap-1.5 font-medium cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to portals</span>
        </button>
      </div>
    </div>
  );
}
