import React, { useState } from 'react';
import { Settings, Key, Eye, EyeOff, CheckCircle2, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { motion } from 'motion/react';

export const ApiKeyModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    Swal.fire({
      title: 'Đã lưu!',
      text: 'API Key của bạn đã được lưu an toàn.',
      icon: 'success',
      confirmButtonColor: '#8b5cf6'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-md p-6 glass-panel rounded-2xl neon-border"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-lg neon-glow">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">Cài đặt API Key</h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-slate-400 leading-relaxed">
            Để sử dụng tính năng AI Tutor, bạn cần nhập Gemini API Key. 
            Key này được lưu trữ cục bộ trên trình duyệt của bạn.
          </p>

          {/* Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
              <Key className="w-5 h-5" />
            </div>
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full pl-10 pr-12 py-3 dark-input"
              placeholder="Nhập API Key của bạn..."
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Info box */}
          <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
            <h4 className="text-sm font-semibold text-cyan-300 mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Hướng dẫn lấy Key
            </h4>
            <p className="text-xs text-cyan-400/70 leading-relaxed">
              Truy cập <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-bold text-cyan-300 hover:text-cyan-200 transition-colors">Google AI Studio</a> để tạo API Key miễn phí.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 font-semibold text-slate-400 bg-slate-800/80 border border-slate-700/50 rounded-xl hover:bg-slate-700/80 hover:text-slate-200 transition-all"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 font-semibold text-white bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl hover:from-violet-500 hover:to-cyan-500 transition-all shadow-lg shadow-violet-500/20 glow-btn"
            >
              Lưu cấu hình
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
