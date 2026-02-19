import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { MarkdownContent } from './MarkdownContent';
import { View } from '../types';
import { Send, User, Bot, Loader2, BrainCircuit, CalendarRange, ChevronRight, Trash2, MessageSquarePlus } from 'lucide-react';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

interface Suggestion {
  type: 'PRACTICE' | 'PLANNER';
  topic: string;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  suggestions?: Suggestion[];
  timestamp: number;
}

interface DoubtSolverProps {
  onNavigate: (view: View, state: { topic?: string; goal?: string }) => void;
}

const STORAGE_KEY = 'mindspark_chat_history';
const LATEX_INSTRUCTION = "CRITICAL: Use LaTeX for ALL mathematical expressions, scientific formulas, and symbols. Use $...$ for inline math and $$...$$ for block math. Avoid plain text for formulas.";

const SUGGESTION_INSTRUCTION = `
At the end of your response, if relevant, provide exactly two suggestions for the student to continue their learning. 
Format them strictly as:
[[PRACTICE:Specific Topic Name]]
[[PLANNER:Goal Name]]
Example: [[PRACTICE:Newton's Second Law]] or [[PLANNER:Mastering Organic Chemistry]]. 
Only include these if they are genuinely helpful next steps based on the current doubt.
`;

const INITIAL_MESSAGE: Message = {
  id: '1',
  role: 'model',
  text: 'Hi! I am your AI Tutor. Stuck on a problem? Ask me anything!',
  timestamp: Date.now()
};

export const DoubtSolver: React.FC<DoubtSolverProps> = ({ onNavigate }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatSessionRef = useRef<Chat | null>(null);

  // Initialize: Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    let initialMessages = [INITIAL_MESSAGE];

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          initialMessages = parsed;
        }
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
    setMessages(initialMessages);
    initChatSession(initialMessages);
  }, []);

  // Save to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const initChatSession = (historyMessages: Message[]) => {
    // Convert our message format to the SDK's expected history format
    // Filter out the very first greeting if it's the only one, or keep it if it's part of a real thread
    // The SDK expects history to be alternating User/Model or just Model if it's the first turn.
    const history = historyMessages
      .filter(m => m.id !== '1') // Don't send the static initial greeting to the API as part of history
      .map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

    chatSessionRef.current = ai.chats.create({
      model: "gemini-2.0-flash",
      history: history,
      config: {
        systemInstruction: `You are a friendly, encouraging, and highly knowledgeable tutor. Explain concepts simply. ${LATEX_INSTRUCTION} ${SUGGESTION_INSTRUCTION}`,
      }
    });
  };

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear your chat history?")) {
      const resetMessages = [INITIAL_MESSAGE];
      setMessages(resetMessages);
      localStorage.removeItem(STORAGE_KEY);
      initChatSession(resetMessages);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const parseSuggestions = (text: string): { cleanText: string; suggestions: Suggestion[] } => {
    const suggestions: Suggestion[] = [];
    const regex = /\[\[(PRACTICE|PLANNER):(.*?)\]\]/g;
    let match;
    let cleanText = text;

    while ((match = regex.exec(text)) !== null) {
      suggestions.push({
        type: match[1] as 'PRACTICE' | 'PLANNER',
        topic: match[2].trim()
      });
    }

    cleanText = cleanText.replace(regex, '').trim();
    return { cleanText, suggestions };
  };

  const handleSend = async () => {
    if (!input.trim() || !chatSessionRef.current) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await chatSessionRef.current.sendMessage({ message: userMsg.text });
      const modelText = result.text || "";

      const { cleanText, suggestions } = parseSuggestions(modelText);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: cleanText || "I'm having trouble thinking right now.",
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] max-w-4xl mx-auto p-4 md:p-6 animate-in fade-in duration-500">
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="font-semibold text-slate-700">Live Tutor</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearHistory}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Clear Chat History"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/30">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 opacity-50">
              <MessageSquarePlus size={48} />
              <p>Start a new conversation</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm
                ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-green-600'}
              `}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`max-w-[85%] space-y-3 ${msg.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                <div className={`
                  p-4 rounded-2xl text-sm leading-relaxed
                  ${msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-100'
                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'}
                `}>
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  ) : (
                    <MarkdownContent content={msg.text} />
                  )}
                </div>

                {/* Quick Action Suggestions */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-500">
                    {msg.suggestions.map((suggestion, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => suggestion.type === 'PRACTICE'
                          ? onNavigate('practice', { topic: suggestion.topic })
                          : onNavigate('planner', { goal: suggestion.topic })
                        }
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-indigo-100 rounded-xl text-xs font-semibold text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm group"
                      >
                        {suggestion.type === 'PRACTICE' ? <BrainCircuit size={14} className="group-hover:scale-110 transition-transform" /> : <CalendarRange size={14} className="group-hover:scale-110 transition-transform" />}
                        {suggestion.type === 'PRACTICE' ? 'Practice' : 'Plan'}: {suggestion.topic}
                        <ChevronRight size={12} className="text-indigo-300 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-white border border-slate-200 text-green-600 flex items-center justify-center shrink-0 shadow-sm">
                <Bot size={16} />
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <Loader2 className="animate-spin text-indigo-500" size={18} />
                <span className="text-xs text-slate-400 font-medium">Sparking ideas...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-slate-100">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a follow-up or a new question..."
              className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="p-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 shadow-lg shadow-indigo-100 flex items-center justify-center shrink-0"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};