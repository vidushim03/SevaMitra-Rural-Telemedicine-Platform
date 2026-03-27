import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Activity, Heart, Thermometer, Zap } from "lucide-react";

const mockVitals = [
  { time: '10:00', heartRate: 72, bp: 120, temp: 98.6 },
  { time: '12:00', heartRate: 75, bp: 122, temp: 98.8 },
  { time: '14:00', heartRate: 80, bp: 125, temp: 99.1 },
  { time: '16:00', heartRate: 78, bp: 121, temp: 98.7 },
  { time: '18:00', heartRate: 74, bp: 119, temp: 98.5 },
  { time: '20:00', heartRate: 82, bp: 124, temp: 99.0 },
];

export function VitalsDashboard({ language }: { language: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-1">
      {/* Real-time stats cards */}
      <Card className="glass-card">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Heart Rate</p>
            <h3 className="text-2xl font-bold">78 BPM</h3>
          </div>
          <div className="p-3 bg-red-100 rounded-2xl">
            <Heart className="text-red-500 animate-pulse" size={24} />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Blood Pressure</p>
            <h3 className="text-2xl font-bold">120/80</h3>
          </div>
          <div className="p-3 bg-blue-100 rounded-2xl">
            <Activity className="text-blue-500" size={24} />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Temperature</p>
            <h3 className="text-2xl font-bold">98.6 °F</h3>
          </div>
          <div className="p-3 bg-orange-100 rounded-2xl">
            <Thermometer className="text-orange-500" size={24} />
          </div>
        </CardContent>
      </Card>

      {/* Main Chart */}
      <Card className="md:col-span-3 glass-card bg-white/40 border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="text-primary" size={20} />
            Patient Health Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockVitals}>
              <defs>
                <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                  borderRadius: '16px', 
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="heartRate" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorHr)" 
                strokeWidth={3}
              />
              <Area 
                type="monotone" 
                dataKey="bp" 
                stroke="#6366f1" 
                fillOpacity={1} 
                fill="url(#colorHr)" 
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
