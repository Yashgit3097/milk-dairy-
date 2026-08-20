import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { customerApi } from '../../../api/customerApi';

export default function CustomerForm({ isOpen, onClose, customer, onSuccess }) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [area, setArea] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setMobile(customer.mobile || '');
      setArea(customer.area || '');
      setPricePerLiter(customer.pricePerLiter !== null && customer.pricePerLiter !== undefined ? customer.pricePerLiter : '');
    } else {
      setName('');
      setMobile('');
      setArea('');
      setPricePerLiter('');
    }
    setError(null);
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Simple client-side validation
    if (!name.trim() || !mobile.trim() || !area.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const payload = {
      name: name.trim(),
      mobile: mobile.trim(),
      area: area.trim(),
      pricePerLiter: pricePerLiter !== '' ? Number(pricePerLiter) : null,
    };

    setIsSubmitting(true);
    try {
      let response;
      if (customer) {
        // Edit mode
        response = await customerApi.update(customer._id, payload);
      } else {
        // Add mode
        response = await customerApi.create(payload);
      }

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.error || 'Operation failed');
      }
    } catch (err) {
      setError(err.error || err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose}></div>

      {/* Modal Card */}
      <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-md p-6 relative overflow-hidden shadow-2xl z-10 animate-slideUp">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        <h3 className="text-md font-extrabold text-slate-900 mb-4 uppercase tracking-wider">
          {customer ? 'Edit Customer' : 'Add New Customer'}
        </h3>

        {error && (
          <div className="bg-rose-550/10 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl p-3 flex items-start gap-2 text-xs mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Yash Gupta"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mobile Number *</label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="10-digit number starting with 6-9"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Delivery Area *</label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Scheme No 54, Sector C"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Price Override (Optional)</label>
            <input
              type="number"
              value={pricePerLiter}
              onChange={(e) => setPricePerLiter(e.target.value)}
              placeholder="Use global rate (leave empty)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
            />
            <span className="text-[9px] text-slate-400 block mt-1 leading-normal">Overrides default milk prices just for this customer.</span>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-550/5 hover:bg-slate-50 text-slate-600 font-bold transition-all text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all duration-200 flex items-center justify-center gap-1.5 text-xs disabled:opacity-50 shadow-md shadow-indigo-600/10"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Customer</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
