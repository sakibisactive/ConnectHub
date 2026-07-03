import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, CheckCircle2, AlertCircle, Info, Radio } from 'lucide-react';
import { removeToast } from '../../store/slices/uiSlice';

export const NotificationToast = () => {
  const dispatch = useDispatch();
  const { toasts } = useSelector((state) => state.ui);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto p-4 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl flex items-start justify-between gap-3 animate-slide-up"
        >
          <div className="flex items-start gap-3">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            ) : toast.type === 'warning' ? (
              <Radio className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            )}

            <div>
              <h5 className="text-xs font-bold text-slate-100">{toast.title}</h5>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
          </div>

          <button
            onClick={() => dispatch(removeToast(toast.id))}
            className="text-slate-500 hover:text-slate-300 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
