import React, { useState, useEffect } from 'react';
import { generateQuestion, generateVoiceExplanation } from '../services/geminiService';
import { decode, decodeAudioData, playAudioBuffer } from '../services/audioUtils';
import { Question, Difficulty, ExamType } from '../types';
import { MarkdownContent } from './MarkdownContent';
import {
  Play,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
  Volume2,
  Settings2,
  Trophy,
  Eye,
  Book,
  ChevronDown,
  Target,
  Zap,
  ClipboardCheck,
  RotateCcw,
  BookOpen,
  Sparkles,
  ChevronRight
} from 'lucide-react';

import { SYLLABUS } from '../utils/syllabus';

type SessionMode = 'setup' | 'quiz' | 'summary';

interface AnswerHistory {
  question: Question;
  selectedOption: number | null;
}

interface PracticeProps {
  initialTopic?: string;
}

export const Practice: React.FC<PracticeProps> = ({ initialTopic }) => {
  // Session Configuration
  const [mode, setMode] = useState<SessionMode>('setup');
  const [examType, setExamType] = useState<ExamType>('JEE');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [isQuizMode, setIsQuizMode] = useState(false);

  useEffect(() => {
    const subjects = Object.keys(SYLLABUS[examType as keyof typeof SYLLABUS]);
    setSubject(subjects[0]);
    setTopic((SYLLABUS[examType as keyof typeof SYLLABUS] as any)[subjects[0]][0]);
  }, [examType]);

  // Adjust topic when subject changes
  useEffect(() => {
    const examData = SYLLABUS[examType as keyof typeof SYLLABUS] as any;
    if (subject && examData[subject]) {
      setTopic(examData[subject][0]);
    }
  }, [subject, examType]);

  // Update topic if initialTopic changes (e.g., navigating from doubts)
  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
      setMode('setup'); // Ensure we are in setup if a new topic comes in
    }
  }, [initialTopic]);

  // Quiz State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<AnswerHistory[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Audio State
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  // Initialize Audio Context on user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioContext) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx);
      }
    };
    window.addEventListener('click', initAudio, { once: true });
    return () => window.removeEventListener('click', initAudio);
  }, [audioContext]);

  const startSession = () => {
    if (!topic.trim()) {
      alert("Please enter a topic");
      return;
    }
    setMode('quiz');
    setCurrentQuestionIndex(0);
    setScore(0);
    setHistory([]);
    loadQuestion(difficulty);
  };

  const loadQuestion = async (diff: Difficulty) => {
    setIsLoading(true);
    setQuestion(null);
    setSelectedOption(null);
    setIsSubmitted(false);

    try {
      const q = await generateQuestion(topic, diff, examType);
      setQuestion(q);
      setError(null);
    } catch (err: any) {
      console.error("Failed to load question", err);
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (selectedOption === null || !question) return;

    if (isQuizMode) {
      handleNext();
    } else {
      setIsSubmitted(true);
      if (selectedOption === question.correctIndex) {
        setScore(s => s + 1);
      }
    }
  };

  const handleNext = () => {
    if (!question) return;

    const newHistory = [...history, { question, selectedOption }];
    setHistory(newHistory);

    if (isQuizMode && selectedOption === question.correctIndex) {
      setScore(s => s + 1);
    }

    if (currentQuestionIndex + 1 >= totalQuestions) {
      setMode('summary');
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      loadQuestion(difficulty);
    }
  };

  const playExplanation = async (text?: string) => {
    const explanationText = text || question?.explanation;
    if (!explanationText) return;

    setIsAudioLoading(true);
    try {
      const base64Audio = await generateVoiceExplanation(explanationText);
      if (base64Audio && audioContext) {
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        const audioData = decode(base64Audio);
        const buffer = await decodeAudioData(audioData, audioContext);
        await playAudioBuffer(buffer);
      }
    } catch (err) {
      console.error("Audio playback error", err);
    } finally {
      setIsAudioLoading(false);
    }
  };

  const restart = () => {
    setMode('setup');
    setQuestion(null);
    setHistory([]);
  };

  if (mode === 'setup') {
    return (
      <div className="p-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Practice Session Setup</h2>
          <p className="text-slate-500">Customize your exam preparation journey</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Target size={20} className="text-indigo-600" /> Select Exam
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {(['JEE', 'NEET', 'UPSC'] as ExamType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setExamType(type)}
                  className={`
                    p-4 rounded-xl border-2 text-sm font-bold transition-all relative overflow-hidden group
                    ${examType === type
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md'
                      : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-300'}
                  `}
                >
                  <div className={`absolute top-0 right-0 p-1 ${examType === type ? 'opacity-100' : 'opacity-0'}`}>
                    <CheckCircle2 size={14} className="text-indigo-600" />
                  </div>
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Book size={16} className="text-indigo-500" /> Select Subject
                </label>
                <div className="relative">
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm appearance-none font-medium text-slate-700 cursor-pointer"
                  >
                    {Object.keys(SYLLABUS[examType as keyof typeof SYLLABUS]).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Target size={16} className="text-indigo-500" /> Specific Topic
                </label>
                <div className="relative">
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm appearance-none font-medium text-slate-700 cursor-pointer"
                  >
                    {(SYLLABUS[examType as keyof typeof SYLLABUS] as any)[subject]?.map((t: string) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value={Difficulty.EASY}>Easy</option>
                  <option value={Difficulty.MEDIUM}>Medium</option>
                  <option value={Difficulty.HARD}>Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Total Questions</label>
                <select
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  {[5, 10, 15, 20, 25].map(n => (
                    <option key={n} value={n}>{n} Questions</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <button
            onClick={() => setIsQuizMode(false)}
            className={`flex flex-col items-center p-6 rounded-2xl border-2 transition-all text-center ${!isQuizMode ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'bg-white border-slate-100 hover:border-slate-300'}`}
          >
            <Zap className={`mb-2 ${!isQuizMode ? 'text-indigo-600' : 'text-slate-400'}`} size={32} />
            <h4 className="font-bold text-slate-800">Adaptive Practice</h4>
            <p className="text-xs text-slate-500 mt-1">Immediate feedback & explanations after every question.</p>
          </button>
          <button
            onClick={() => setIsQuizMode(true)}
            className={`flex flex-col items-center p-6 rounded-2xl border-2 transition-all text-center ${isQuizMode ? 'border-slate-800 bg-slate-50 shadow-md' : 'bg-white border-slate-100 hover:border-slate-300'}`}
          >
            <ClipboardCheck className={`mb-2 ${isQuizMode ? 'text-slate-800' : 'text-slate-400'}`} size={32} />
            <h4 className="font-bold text-slate-800">Quiz Mode</h4>
            <p className="text-xs text-slate-500 mt-1">Simulate real exam conditions. No feedback until the end.</p>
          </button>
        </div>

        <div className="mt-12 flex justify-center">
          <button
            onClick={startSession}
            disabled={!topic.trim()}
            className="px-12 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all transform active:scale-95 disabled:opacity-50 disabled:shadow-none"
          >
            Start {isQuizMode ? 'Exam Simulation' : 'Practice Session'}
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'summary') {
    const percentage = Math.round((score / totalQuestions) * 100);
    return (
      <div className="p-6 max-w-4xl mx-auto animate-in fade-in zoom-in duration-300">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-6 text-yellow-600">
            <Trophy size={40} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            {isQuizMode ? 'Exam Completed!' : 'Practice Session Complete!'}
          </h2>
          <p className="text-slate-500 mb-8">Subject: {topic} ({examType})</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Score</p>
              <p className="text-2xl font-bold text-indigo-600">{score}/{totalQuestions}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Accuracy</p>
              <p className="text-2xl font-bold text-green-600">{percentage}%</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Difficulty</p>
              <p className="text-xl font-bold text-orange-600">{difficulty}</p>
            </div>
          </div>

          <button
            onClick={restart}
            className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg"
          >
            <RotateCcw size={20} /> Back to Menu
          </button>
        </div>

        {/* Detailed Results Review for Quiz Mode */}
        {isQuizMode && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Eye size={20} className="text-indigo-600" /> Question Review
            </h3>
            {history.map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${item.selectedOption === item.question.correctIndex ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <MarkdownContent content={item.question.text} className="text-slate-800 font-medium text-lg" />
                  </div>
                </div>

                <div className="space-y-2 mb-4 pl-12">
                  {item.question.options.map((opt, oIdx) => {
                    const isCorrect = oIdx === item.question.correctIndex;
                    const isSelected = oIdx === item.selectedOption;
                    return (
                      <div key={oIdx} className={`p-3 rounded-lg text-sm flex items-center justify-between ${isCorrect ? 'bg-green-50 text-green-700 font-semibold border border-green-100' : isSelected ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-slate-50 text-slate-500'}`}>
                        <MarkdownContent content={opt} className="text-sm font-medium" />
                        {isCorrect && <CheckCircle2 size={16} />}
                        {isSelected && !isCorrect && <XCircle size={16} />}
                      </div>
                    );
                  })}
                </div>

                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 ml-12">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Explanation</span>
                    <button
                      onClick={() => playExplanation(item.question.explanation)}
                      className="text-indigo-600 hover:text-indigo-800"
                      title="Listen to explanation"
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>
                  <MarkdownContent content={item.question.explanation} className="text-sm text-slate-700 leading-relaxed" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`
               px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide
               ${examType === 'JEE' ? 'bg-red-100 text-red-700' :
                examType === 'NEET' ? 'bg-blue-100 text-blue-700' :
                  examType === 'UPSC' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'}
             `}>
              {examType}
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm truncate max-w-[150px] md:max-w-none">{topic}</h3>
              <p className="text-xs text-slate-400">{difficulty} Level • {isQuizMode ? 'Quiz Mode' : 'Practice Mode'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-medium uppercase mb-1">Progress</p>
            <p className="text-xl font-bold text-indigo-600 leading-none">
              {currentQuestionIndex + 1} <span className="text-slate-300 text-sm">/ {totalQuestions}</span>
            </p>
          </div>
        </div>
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden shadow-inner">
          <div
            className="bg-indigo-600 h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(79,70,229,0.5)]"
            style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-80 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
          <p className="text-slate-500 font-medium">Preparing Question {currentQuestionIndex + 1}...</p>
          <p className="text-xs text-slate-400 mt-2">Tailoring to {examType} standards</p>
        </div>
      ) : question ? (
        <div className="bg-white rounded-3xl shadow-lg shadow-slate-100 border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="p-8 md:p-10">
            <MarkdownContent content={question.text} className="text-xl md:text-2xl font-medium text-slate-800 mb-8 leading-relaxed" />

            <div className="space-y-4">
              {question.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = question.correctIndex === idx;

                let containerClass = "border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm";
                if (isSubmitted) {
                  if (isCorrect) containerClass = "bg-green-50 border-green-300 ring-1 ring-green-300";
                  else if (isSelected) containerClass = "bg-red-50 border-red-300 ring-1 ring-red-300";
                  else containerClass = "opacity-60 border-slate-100 grayscale";
                } else if (isSelected) {
                  containerClass = "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => !isSubmitted && setSelectedOption(idx)}
                    disabled={isSubmitted}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group ${containerClass}`}
                  >
                    <div className={`font-medium text-lg ${isSubmitted && isCorrect ? 'text-green-800' : isSubmitted && isSelected ? 'text-red-800' : 'text-slate-700'}`}>
                      <MarkdownContent content={opt} className="prose-sm" />
                    </div>
                    {!isQuizMode && isSubmitted && isCorrect && <CheckCircle2 className="text-green-600 shrink-0" size={24} />}
                    {!isQuizMode && isSubmitted && isSelected && !isCorrect && <XCircle className="text-red-500 shrink-0" size={24} />}
                  </button>
                );
              })}
            </div>

            {!isQuizMode && isSubmitted && (
              <div className={`mt-8 p-6 rounded-2xl border animate-in fade-in slide-in-from-bottom-2 duration-300 ${selectedOption === question.correctIndex ? 'bg-green-50 border-green-100' : 'bg-indigo-50/50 border-indigo-100'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`font-bold flex items-center gap-2 ${selectedOption === question.correctIndex ? 'text-green-800' : 'text-slate-800'}`}>
                    <BookOpen size={18} className={selectedOption === question.correctIndex ? 'text-green-600' : 'text-indigo-600'} />
                    Explanation
                  </h4>
                  {selectedOption === question.correctIndex && (
                    <div className="flex items-center gap-1 text-green-600 text-xs font-bold uppercase tracking-wider">
                      <Sparkles size={14} /> Correct!
                    </div>
                  )}
                </div>
                <MarkdownContent
                  content={question.explanation}
                  className={`${selectedOption === question.correctIndex ? 'text-green-900' : 'text-slate-700'} leading-relaxed`}
                />
              </div>
            )}

            <div className="mt-10 flex flex-col md:flex-row justify-end gap-4">
              {!isSubmitted ? (
                <button
                  onClick={handleSubmit}
                  disabled={selectedOption === null}
                  className={`px-8 py-4 text-white rounded-xl font-bold text-lg shadow-lg transition-all w-full md:w-auto flex items-center justify-center gap-2 ${isQuizMode ? 'bg-slate-900 hover:bg-slate-800' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'} disabled:opacity-50 disabled:shadow-none`}
                >
                  {isQuizMode ? (
                    <>
                      Save & Continue <ChevronRight size={20} />
                    </>
                  ) : 'Check Answer'}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => playExplanation()}
                    disabled={isAudioLoading}
                    className={`flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-lg border-2 transition-all w-full md:w-auto shadow-sm
                      ${selectedOption === question.correctIndex
                        ? 'bg-green-600 text-white border-green-600 hover:bg-green-700 shadow-green-100'
                        : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'}
                      disabled:opacity-50`}
                  >
                    {isAudioLoading ? <Loader2 className="animate-spin" size={20} /> : <Volume2 size={20} />}
                    {selectedOption === question.correctIndex ? 'Hear Explanation' : 'Audio Explanation'}
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 transition-all w-full md:w-auto"
                  >
                    {currentQuestionIndex + 1 >= totalQuestions ? 'Finish Session' : 'Next Question'} <ArrowRight size={20} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-slate-400">
          <p className="mb-2">Something went wrong.</p>
          {error && <p className="text-red-500 text-sm bg-red-50 p-4 rounded-xl inline-block max-w-lg">{error}</p>}
          <button onClick={() => loadQuestion(difficulty)} className="block mx-auto mt-4 text-indigo-600 font-semibold hover:underline">Try Again</button>
        </div>
      )}
    </div>
  );
};