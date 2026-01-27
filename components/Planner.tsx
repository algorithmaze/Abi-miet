import React, { useState, useEffect } from 'react';
import { generateStudyPlan } from '../services/geminiService';
import { StudyTask } from '../types';
import { Calendar, Clock, BookOpen, Loader2, Plus } from 'lucide-react';

interface PlannerProps {
  initialGoal?: string;
}

export const Planner: React.FC<PlannerProps> = ({ initialGoal }) => {
  const [goal, setGoal] = useState(initialGoal || 'Master Linear Algebra');
  const [days, setDays] = useState(5);
  const [hours, setHours] = useState(2);
  const [plan, setPlan] = useState<StudyTask[] | null>(null);
  const [loading, setLoading] = useState(false);

  // Update goal if initialGoal changes
  useEffect(() => {
    if (initialGoal) {
      setGoal(initialGoal);
      setPlan(null); // Clear previous plan to encourage re-generation
    }
  }, [initialGoal]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const generatedPlan = await generateStudyPlan(goal, days, hours);
      setPlan(generatedPlan);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">AI Study Scheduler</h2>
        <p className="text-slate-500">Generate a personalized roadmap to crush your goals.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Learning Goal</label>
                 <input 
                    type="text" 
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Learn React Native"
                 />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Duration (Days)</label>
                    <input 
                        type="number" 
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        min={1} max={30}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Hours / Day</label>
                    <input 
                        type="number" 
                        value={hours}
                        onChange={(e) => setHours(Number(e.target.value))}
                        min={1} max={12}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
               </div>

               <button
                 onClick={handleGenerate}
                 disabled={loading}
                 className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2"
               >
                 {loading ? <Loader2 className="animate-spin" size={18} /> : <Calendar size={18} />}
                 Generate Plan
               </button>
             </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {plan ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              {plan.map((dayPlan, index) => (
                <div key={index} className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-12 h-12 flex flex-col items-center justify-center bg-indigo-50 text-indigo-700 rounded-lg font-bold border border-indigo-100">
                        <span className="text-[10px] uppercase font-normal">Day</span>
                        <span className="text-xl leading-none">{index + 1}</span>
                      </span>
                      <div>
                        <h4 className="font-semibold text-slate-800">{dayPlan.focus}</h4>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock size={12} /> {hours} Hours
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pl-14">
                    {dayPlan.tasks.map((task, tIdx) => (
                      <div key={tIdx} className="flex items-start gap-2 text-sm text-slate-600">
                        <div className="mt-1.5 min-w-[6px] h-[6px] rounded-full bg-slate-300" />
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 min-h-[300px]">
               <BookOpen size={48} className="mb-4 opacity-20" />
               <p>Your personalized study roadmap will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};