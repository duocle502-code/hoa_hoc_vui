import React, { useState } from 'react';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { Question } from '../types';
import { cn } from '../lib/utils';
import Swal from 'sweetalert2';

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: 'q1',
    subjectId: 'voco',
    content: 'Chất nào sau đây làm đổi màu quỳ tím sang đỏ?',
    type: 'multiple-choice',
    options: ['NaOH', 'HCl', 'NaCl', 'H2O'],
    correctAnswer: 'HCl',
    explanation: 'HCl là một axit mạnh, có khả năng làm quỳ tím chuyển sang màu đỏ.',
    difficulty: 'easy'
  },
  {
    id: 'q2',
    subjectId: 'voco',
    content: 'Phản ứng giữa Axit và Bazơ tạo ra sản phẩm gì?',
    type: 'multiple-choice',
    options: ['Muối và Nước', 'Kim loại và Khí', 'Oxit và Nước', 'Chỉ có Muối'],
    correctAnswer: 'Muối và Nước',
    explanation: 'Đây là phản ứng trung hòa đặc trưng giữa axit và bazơ.',
    difficulty: 'easy'
  },
  {
    id: 'q3',
    subjectId: 'voco',
    content: 'Kim loại nào sau đây không tác dụng với dung dịch HCl?',
    type: 'multiple-choice',
    options: ['Fe', 'Zn', 'Cu', 'Al'],
    correctAnswer: 'Cu',
    explanation: 'Đồng (Cu) đứng sau Hidro trong dãy hoạt động hóa học nên không đẩy được Hidro ra khỏi axit HCl.',
    difficulty: 'medium'
  }
];

export const QuizView: React.FC<{ onComplete: (score: number) => void }> = ({ onComplete }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const currentQuestion = SAMPLE_QUESTIONS[currentIdx];

  const handleSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
  };

  const handleCheck = () => {
    if (!selectedOption) return;
    setIsAnswered(true);
    if (selectedOption === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < SAMPLE_QUESTIONS.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
      onComplete(score + (selectedOption === currentQuestion.correctAnswer ? 1 : 0));
    }
  };

  const resetQuiz = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setShowResult(false);
  };

  if (showResult) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="w-24 h-24 bg-gradient-to-br from-violet-600 to-cyan-500 rounded-full flex items-center justify-center text-white mb-6 shadow-2xl neon-glow"
        >
          <Trophy className="w-12 h-12" />
        </motion.div>
        <h2 className="text-3xl font-extrabold text-slate-100 mb-2">Kết quả bài kiểm tra</h2>
        <p className="text-slate-400 mb-8">Bạn đã hoàn thành xuất sắc bài kiểm tra kiến thức!</p>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
          <div className="glass-card p-5 rounded-2xl">
            <div className="text-3xl font-extrabold text-emerald-400">{score}/{SAMPLE_QUESTIONS.length}</div>
            <div className="text-xs text-emerald-400/70 font-medium mt-1">Câu đúng</div>
          </div>
          <div className="glass-card p-5 rounded-2xl">
            <div className="text-3xl font-extrabold gradient-text-v2">{Math.round((score / SAMPLE_QUESTIONS.length) * 100)}%</div>
            <div className="text-xs text-violet-400/70 font-medium mt-1">Tỷ lệ</div>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={resetQuiz}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800/80 border border-slate-700/50 text-slate-300 rounded-xl font-bold hover:bg-slate-700/80 hover:text-white transition-all"
          >
            <RotateCcw className="w-5 h-5" /> Làm lại
          </button>
          <button 
            onClick={() => Swal.fire('Thông báo', 'Tính năng lưu kết quả đang được phát triển!', 'info')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl font-bold hover:from-violet-500 hover:to-cyan-500 transition-all shadow-lg shadow-violet-500/20 glow-btn"
          >
            Lưu báo cáo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-violet-400 uppercase tracking-wider">Câu hỏi {currentIdx + 1}/{SAMPLE_QUESTIONS.length}</h3>
          <div className="h-1.5 w-48 bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full" 
              initial={{ width: 0 }}
              animate={{ width: `${((currentIdx + 1) / SAMPLE_QUESTIONS.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-bold uppercase border",
          currentQuestion.difficulty === 'easy' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
          currentQuestion.difficulty === 'medium' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
          "bg-red-500/10 text-red-400 border-red-500/20"
        )}>
          {currentQuestion.difficulty === 'easy' ? 'Dễ' : currentQuestion.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
        </div>
      </div>

      {/* Question */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-100 leading-tight">
          {currentQuestion.content}
        </h2>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3">
          {currentQuestion.options.map((option, idx) => (
            <motion.button
              key={option}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              onClick={() => handleSelect(option)}
              className={cn(
                "flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left group",
                // Default state
                !isAnswered && selectedOption !== option && "border-slate-700/50 bg-slate-800/40 hover:border-violet-500/30 hover:bg-slate-800/60",
                // Selected but not yet answered
                !isAnswered && selectedOption === option && "border-violet-500/50 bg-violet-500/10",
                // Correct answer after check
                isAnswered && option === currentQuestion.correctAnswer && "border-emerald-500/50 bg-emerald-500/10",
                // Wrong answer after check
                isAnswered && selectedOption === option && selectedOption !== currentQuestion.correctAnswer && "border-red-500/50 bg-red-500/10"
              )}
              style={
                !isAnswered && selectedOption === option 
                  ? { boxShadow: '0 0 20px rgba(139, 92, 246, 0.15)' } 
                  : isAnswered && option === currentQuestion.correctAnswer 
                    ? { boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)' }
                    : {}
              }
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors",
                  !isAnswered && selectedOption === option ? "bg-violet-500/20 text-violet-300" :
                  isAnswered && option === currentQuestion.correctAnswer ? "bg-emerald-500/20 text-emerald-400" :
                  isAnswered && selectedOption === option ? "bg-red-500/20 text-red-400" :
                  "bg-slate-700/50 text-slate-400 group-hover:text-slate-200"
                )}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className={cn(
                  "font-medium transition-colors",
                  isAnswered && option === currentQuestion.correctAnswer ? "text-emerald-300" :
                  isAnswered && selectedOption === option && selectedOption !== currentQuestion.correctAnswer ? "text-red-300" :
                  selectedOption === option ? "text-violet-200" : "text-slate-300"
                )}>{option}</span>
              </div>
              {isAnswered && option === currentQuestion.correctAnswer && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isAnswered && selectedOption === option && selectedOption !== currentQuestion.correctAnswer && <XCircle className="w-5 h-5 text-red-400" />}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Explanation */}
      {isAnswered && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-2xl border",
            selectedOption === currentQuestion.correctAnswer 
              ? "bg-emerald-500/5 border-emerald-500/20" 
              : "bg-red-500/5 border-red-500/20"
          )}
        >
          <div className="font-bold mb-1 flex items-center gap-2">
            {selectedOption === currentQuestion.correctAnswer 
              ? <><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="text-emerald-400">Chính xác!</span></>
              : <><XCircle className="w-4 h-4 text-red-400" /><span className="text-red-400">Chưa đúng rồi!</span></>
            }
          </div>
          <p className="text-sm text-slate-400">{currentQuestion.explanation}</p>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex justify-end pt-4">
        {!isAnswered ? (
          <button
            disabled={!selectedOption}
            onClick={handleCheck}
            className="px-8 py-3 bg-slate-800/80 border border-slate-700/50 text-slate-200 rounded-xl font-bold hover:bg-slate-700/80 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Kiểm tra đáp án
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl font-bold hover:from-violet-500 hover:to-cyan-500 transition-all shadow-lg shadow-violet-500/20 glow-btn"
          >
            {currentIdx < SAMPLE_QUESTIONS.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
