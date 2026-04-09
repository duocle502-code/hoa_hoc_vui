import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { callGeminiAI, SYSTEM_PROMPT } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

export const AITutor: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
    { role: 'ai', content: 'Chào bạn! Mình là AI Tutor Hóa học. Bạn cần giải đáp thắc mắc gì về các thí nghiệm hôm nay không?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const prompt = `${SYSTEM_PROMPT}\n\nLịch sử trò chuyện:\n${messages.map(m => `${m.role === 'user' ? 'Học sinh' : 'AI'}: ${m.content}`).join('\n')}\nHọc sinh: ${userMessage}`;
      const response = await callGeminiAI(prompt);
      
      if (response) {
        setMessages(prev => [...prev, { role: 'ai', content: response }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: 'Xin lỗi, mình không thể kết nối với bộ não AI lúc này. Bạn đã nhập API Key chưa?' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Có lỗi xảy ra khi gọi AI. Vui lòng thử lại sau.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-lg neon-glow">
            <Bot className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-100">AI Tutor</h3>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Trực tuyến
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-lg' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700/50'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-3 rounded-2xl text-sm ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-tr-sm shadow-lg shadow-violet-500/10' 
                  : 'bg-slate-800/80 text-slate-300 rounded-tl-sm border border-slate-700/30'
              }`}>
                <div className="prose prose-sm prose-invert max-w-none prose-p:leading-relaxed prose-p:text-current">
                  <ReactMarkdown>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-700/50">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/80 text-slate-500 flex items-center gap-2 border border-slate-700/30">
                <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                <span className="text-sm">AI đang suy nghĩ...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700/30">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Hỏi AI về hóa học..."
            className="w-full pl-4 pr-12 py-3 dark-input text-sm"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
