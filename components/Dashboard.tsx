import React from 'react';
import { UserStats } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import { Trophy, Target, TrendingUp, AlertCircle } from 'lucide-react';

// Mock data generator for visualization
const mockTopicData = [
  { topic: 'Algebra', mastery: 85 },
  { topic: 'Physics', mastery: 65 },
  { topic: 'Chemistry', mastery: 45 },
  { topic: 'History', mastery: 75 },
  { topic: 'Biology', mastery: 90 },
];

const mockProgressData = [
  { day: 'Mon', score: 65 },
  { day: 'Tue', score: 70 },
  { day: 'Wed', score: 68 },
  { day: 'Thu', score: 82 },
  { day: 'Fri', score: 88 },
  { day: 'Sat', score: 90 },
  { day: 'Sun', score: 92 },
];

export const Dashboard: React.FC = () => {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Welcome back, Alex! 👋</h2>
        <p className="text-slate-500">Here is your learning progress for this week.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Trophy className="text-yellow-600" />} 
          label="Total XP" 
          value="2,450" 
          trend="+15%" 
          color="bg-yellow-50"
        />
        <StatCard 
          icon={<Target className="text-blue-600" />} 
          label="Accuracy" 
          value="78%" 
          trend="+5%" 
          color="bg-blue-50"
        />
        <StatCard 
          icon={<TrendingUp className="text-green-600" />} 
          label="Current Streak" 
          value="7 Days" 
          trend="Keep it up!" 
          color="bg-green-50"
        />
        <StatCard 
          icon={<AlertCircle className="text-red-600" />} 
          label="Weak Area" 
          value="Chemistry" 
          trend="Needs focus" 
          color="bg-red-50"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Topic Mastery</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockTopicData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="topic" type="category" width={80} tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{fill: '#f1f5f9'}}
                />
                <Bar dataKey="mastery" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Learning Velocity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockProgressData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#8b5cf6" 
                  strokeWidth={3} 
                  dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string, trend: string, color: string }> = ({ icon, label, value, trend, color }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-slate-500 text-sm font-medium mb-1">{label}</p>
      <h4 className="text-2xl font-bold text-slate-800">{value}</h4>
      <p className="text-xs font-medium text-slate-400 mt-2">{trend}</p>
    </div>
    <div className={`p-3 rounded-xl ${color}`}>
      {icon}
    </div>
  </div>
);
