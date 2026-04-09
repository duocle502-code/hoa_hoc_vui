import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import {
  Upload,
  FileImage,
  FileText,
  File as FileIcon,
  X,
  Loader2,
  Sparkles,
  Beaker,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Eye,
  ClipboardList,
  Atom,
} from 'lucide-react';
import { analyzeLabProblem, LabProblemResult } from '../services/geminiService';

interface ProblemUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onChemicalsGenerated: (result: LabProblemResult) => void;
}

type UploadStep = 'upload' | 'analyzing' | 'results';

const ACCEPTED_TYPES = {
  'image/png': '.png',
  'image/jpeg': '.jpg, .jpeg',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const getFileIcon = (file: File) => {
  if (file.type.startsWith('image/')) return FileImage;
  if (file.type === 'application/pdf') return FileText;
  return FileIcon;
};

const getFileTypeLabel = (file: File) => {
  if (file.type.startsWith('image/')) return 'Hình ảnh';
  if (file.type === 'application/pdf') return 'PDF';
  if (file.name.endsWith('.docx')) return 'Word';
  return 'File';
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const ProblemUploader: React.FC<ProblemUploaderProps> = ({ isOpen, onClose, onChemicalsGenerated }) => {
  const [step, setStep] = useState<UploadStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LabProblemResult | null>(null);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setStep('upload');
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    setResult(null);
    setAnalyzeProgress(0);
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const validateFile = (file: File): string | null => {
    const acceptedMimeTypes = Object.keys(ACCEPTED_TYPES);
    const isAccepted = acceptedMimeTypes.some(type => file.type === type) || file.name.toLowerCase().endsWith('.docx');
    
    if (!isAccepted) {
      return 'Định dạng file không được hỗ trợ. Vui lòng chọn ảnh, PDF hoặc Word (.docx).';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File quá lớn (${formatFileSize(file.size)}). Giới hạn tối đa ${formatFileSize(MAX_FILE_SIZE)}.`;
    }
    return null;
  };

  const handleFileSelected = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelected(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    
    setStep('analyzing');
    setError(null);
    setAnalyzeProgress(0);

    // Fake progress animation
    const progressInterval = setInterval(() => {
      setAnalyzeProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const analysisResult = await analyzeLabProblem(selectedFile);
      clearInterval(progressInterval);
      setAnalyzeProgress(100);

      if (analysisResult) {
        setResult(analysisResult);
        setTimeout(() => setStep('results'), 500);
      } else {
        throw new Error('Không nhận được kết quả phân tích. Vui lòng kiểm tra API Key.');
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || 'Đã xảy ra lỗi khi phân tích đề bài.');
      setStep('upload');
    }
  };

  const handleApplyResults = () => {
    if (result) {
      onChemicalsGenerated(result);
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "relative w-full glass-panel rounded-3xl overflow-hidden neon-border",
            step === 'results' ? 'max-w-4xl max-h-[90vh]' : 'max-w-xl'
          )}
        >
          {/* Ambient glow */}
          <div className="absolute top-0 left-1/4 w-48 h-48 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />

          {/* Header */}
          <div className="relative flex items-center justify-between p-6 border-b border-slate-700/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white shadow-lg neon-glow">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">Phân tích đề bài</h2>
                <p className="text-xs text-slate-500">
                  {step === 'upload' && 'Tải lên đề bài thí nghiệm từ ảnh, PDF hoặc Word'}
                  {step === 'analyzing' && 'AI đang phân tích nội dung...'}
                  {step === 'results' && 'Kết quả phân tích'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className={cn("relative p-6", step === 'results' && "max-h-[calc(90vh-180px)] overflow-y-auto")}>
            <AnimatePresence mode="wait">
              {/* ===== STEP 1: UPLOAD ===== */}
              {step === 'upload' && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  {/* Drop Zone */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300",
                      isDragging
                        ? "border-violet-400 bg-violet-500/10 scale-[1.02]"
                        : selectedFile
                          ? "border-emerald-500/40 bg-emerald-500/5"
                          : "border-slate-600/50 bg-slate-800/30 hover:border-violet-500/30 hover:bg-slate-800/50"
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,.pdf,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelected(file);
                      }}
                      className="hidden"
                    />

                    {selectedFile ? (
                      <div className="space-y-4">
                        {/* Preview */}
                        {preview ? (
                          <div className="relative mx-auto w-48 h-48 rounded-xl overflow-hidden border-2 border-slate-600/50 shadow-lg">
                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute top-2 right-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFile(null);
                                  setPreview(null);
                                }}
                                className="w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-500 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mx-auto w-20 h-20 rounded-2xl bg-slate-700/50 flex items-center justify-center border border-slate-600/30">
                            {React.createElement(getFileIcon(selectedFile), { className: "w-10 h-10 text-cyan-400" })}
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-bold text-slate-200">{selectedFile.name}</p>
                          <div className="flex items-center justify-center gap-3 mt-1">
                            <span className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-600" />
                            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 font-medium border border-violet-500/20">
                              {getFileTypeLabel(selectedFile)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            setPreview(null);
                          }}
                          className="text-xs text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2"
                        >
                          Chọn file khác
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <motion.div
                          animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                          className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/15 to-cyan-500/15 flex items-center justify-center border border-violet-500/20"
                        >
                          <Upload className={cn("w-8 h-8 transition-colors", isDragging ? "text-violet-400" : "text-slate-500")} />
                        </motion.div>
                        <div>
                          <p className="text-sm font-bold text-slate-200">
                            Kéo thả file vào đây
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            hoặc <span className="text-violet-400 font-medium">nhấp để chọn file</span>
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          {[
                            { icon: FileImage, label: 'Ảnh', formats: 'PNG, JPG, WEBP' },
                            { icon: FileText, label: 'PDF', formats: 'PDF' },
                            { icon: FileIcon, label: 'Word', formats: 'DOCX' },
                          ].map((type) => (
                            <div
                              key={type.label}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/30"
                            >
                              <type.icon className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-[10px] font-medium text-slate-400">{type.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
                    >
                      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-300">{error}</p>
                        <button
                          onClick={() => setError(null)}
                          className="text-xs text-red-400/70 hover:text-red-300 mt-1 underline"
                        >
                          Đóng
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Analyze button */}
                  <button
                    onClick={handleAnalyze}
                    disabled={!selectedFile}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all",
                      selectedFile
                        ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 hover:scale-[1.01] active:scale-[0.99] glow-btn"
                        : "bg-slate-800/60 text-slate-600 cursor-not-allowed border border-slate-700/30"
                    )}
                  >
                    <Sparkles className="w-4 h-4" />
                    Phân tích đề bài bằng AI
                  </button>
                </motion.div>
              )}

              {/* ===== STEP 2: ANALYZING ===== */}
              {step === 'analyzing' && (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="py-12 flex flex-col items-center gap-6"
                >
                  {/* Animated Lab Icon */}
                  <div className="relative">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      className="w-20 h-20 rounded-full border-4 border-violet-500/20 border-t-violet-500"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <FlaskConical className="w-8 h-8 text-violet-400" />
                      </motion.div>
                    </div>
                  </div>

                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-bold text-slate-100">Đang phân tích đề bài...</h3>
                    <p className="text-sm text-slate-500">AI đang đọc nội dung và xác định hoá chất cần thiết</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full max-w-xs">
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: `${Math.min(analyzeProgress, 100)}%` }}
                        className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-xs text-slate-600 text-center mt-2">
                      {Math.round(analyzeProgress)}%
                    </p>
                  </div>

                  {/* Steps visualization */}
                  <div className="space-y-2 w-full max-w-xs">
                    {[
                      { label: 'Đọc nội dung file', done: analyzeProgress > 20 },
                      { label: 'Phân tích đề bài', done: analyzeProgress > 50 },
                      { label: 'Xác định hoá chất', done: analyzeProgress > 75 },
                      { label: 'Tạo danh sách', done: analyzeProgress >= 100 },
                    ].map((s, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.3 }}
                        className="flex items-center gap-2"
                      >
                        {s.done ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Loader2 className="w-4 h-4 text-slate-600 animate-spin" />
                        )}
                        <span className={cn("text-xs font-medium", s.done ? "text-emerald-400" : "text-slate-600")}>
                          {s.label}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ===== STEP 3: RESULTS ===== */}
              {step === 'results' && result && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Summary */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Eye className="w-4 h-4 text-violet-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-violet-300 mb-1">Tóm tắt đề bài</h4>
                        <p className="text-sm text-slate-400 leading-relaxed">{result.problem_summary}</p>
                      </div>
                    </div>
                  </div>

                  {/* Chemicals Grid */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Beaker className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-sm font-bold text-slate-200">Hoá chất cần thiết ({result.chemicals.length})</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {result.chemicals.map((chem, i) => (
                        <motion.div
                          key={chem.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/30 hover:border-violet-500/20 transition-colors"
                        >
                          {/* Color swatch */}
                          <div className="relative shrink-0">
                            <div
                              className="w-10 h-14 rounded-lg border-2 border-slate-600/50 relative overflow-hidden"
                              style={{ backgroundColor: '#1e293b' }}
                            >
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-1.5 bg-slate-500/50 rounded-b-sm" />
                              <div
                                className="absolute bottom-0 left-0 right-0"
                                style={{ backgroundColor: chem.color, height: '55%', opacity: 0.85 }}
                              />
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-200 truncate">{chem.name}</span>
                              <span className={cn(
                                "text-[8px] font-bold px-1.5 py-0.5 rounded",
                                chem.state === 'solid' ? "bg-slate-700 text-slate-400" :
                                chem.state === 'gas' ? "bg-sky-500/15 text-sky-400" :
                                "bg-blue-500/15 text-blue-400"
                              )}>
                                {chem.state === 'solid' ? 'Rắn' : chem.state === 'gas' ? 'Khí' : 'Lỏng'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] font-mono font-bold text-violet-400">{chem.formula}</span>
                              {chem.concentration && (
                                <span className="text-[9px] text-slate-500">{chem.concentration}</span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate">{chem.description}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Experiment Steps */}
                  {result.experiment_steps.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <ClipboardList className="w-4 h-4 text-amber-400" />
                        <h4 className="text-sm font-bold text-slate-200">Các bước thí nghiệm</h4>
                      </div>
                      <div className="space-y-2">
                        {result.experiment_steps.map((s, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + i * 0.08 }}
                            className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/20"
                          >
                            <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 border border-amber-500/20">
                              {i + 1}
                            </span>
                            <p className="text-xs text-slate-400 leading-relaxed pt-0.5">{s}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Equations */}
                  {result.equations.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Atom className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-sm font-bold text-slate-200">Phương trình hoá học</h4>
                      </div>
                      <div className="space-y-2">
                        {result.equations.map((eq, i) => (
                          <div
                            key={i}
                            className="px-4 py-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 font-mono text-sm text-cyan-300"
                          >
                            {eq}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expected Results */}
                  {result.expected_results && (
                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                      <h4 className="text-sm font-bold text-emerald-400 mb-1">Kết quả dự kiến</h4>
                      <p className="text-sm text-slate-400">{result.expected_results}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          {step === 'results' && result && (
            <div className="relative flex items-center gap-3 p-6 border-t border-slate-700/30">
              <button
                onClick={resetState}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 text-sm font-medium transition-all border border-slate-700/30"
              >
                <RotateCcw className="w-4 h-4" />
                Phân tích lại
              </button>
              <button
                onClick={handleApplyResults}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all glow-btn"
              >
                <FlaskConical className="w-4 h-4" />
                Bắt đầu thí nghiệm với {result.chemicals.length} hoá chất
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
