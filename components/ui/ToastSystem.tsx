import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

// Tipos
type ToastType = 'success' | 'error' | 'info';
interface Toast {
  id: string;
  message: string;
  type: ToastType;
}
interface ToastContextData {
  addToast: (message: string, type?: ToastType) => void;
}

// Contexto
const ToastContext = createContext<ToastContextData>({} as ToastContextData);

// Hook para usar em qualquer lugar
export const useToast = () => useContext(ToastContext);

// Provedor (Envolve o App)
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2);
    setToasts((state) => [...state, { id, message, type }]);
    
    // Auto-remove após 3 segundos
    setTimeout(() => {
      setToasts((state) => state.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((state) => state.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      
      {/* Container Visual (Fica fixo na tela) */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto min-w-[300px] max-w-md p-4 rounded-lg shadow-2xl flex items-start gap-3 animate-fade-in-up border transition-all ${
              toast.type === 'success' ? 'bg-graphite-900 border-green-500/50 text-green-400' :
              toast.type === 'error' ? 'bg-graphite-900 border-red-500/50 text-red-400' :
              'bg-graphite-900 border-blue-500/50 text-blue-400'
            }`}
          >
            {toast.type === 'success' && <CheckCircle size={20} className="shrink-0" />}
            {toast.type === 'error' && <AlertCircle size={20} className="shrink-0" />}
            {toast.type === 'info' && <Info size={20} className="shrink-0" />}
            
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-white">{toast.type}</p>
              <p className="text-sm text-text-secondary mt-0.5">{toast.message}</p>
            </div>

            <button onClick={() => removeToast(toast.id)} className="text-text-muted hover:text-white">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};