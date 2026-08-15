import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, CalendarClock, HeartPulse, Store } from "lucide-react";
import { useAppData } from "../contexts/AppDataContext";
import { useAuth } from "../contexts/AuthContext";
import { getStockAlerts, getStockBreakdown } from "../services/pharmacy-data";

const URGENCY_COLORS: Record<string, string> = {
  emergency: "#ef4444",
  urgent: "#f59e0b",
  routine: "#10b981",
  high: "#f59e0b",
  medium: "#fbbf24",
  low: "#22c55e",
};

const STOCK_COLORS: Record<string, string> = {
  in_stock: "#10b981",
  low_stock: "#f59e0b",
  out_of_stock: "#ef4444",
};

export function AdminAnalytics() {
  const { data } = useAppData();
  const { user } = useAuth();

  const metrics = useMemo(() => {
    const appointments = data.appointments;
    const completed = appointments.filter((a) => a.status === "completed").length;
    const cancelled = appointments.filter((a) => a.status === "cancelled").length;
    const inProgress = appointments.filter((a) => a.status === "in-progress").length;
    const scheduled = appointments.filter((a) => a.status === "scheduled").length;

    const revenue = data.payments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingSync = 0;
    return { total: appointments.length, completed, cancelled, inProgress, scheduled, revenue, pendingSync };
  }, [data]);

  const consultTrend = useMemo(() => {
    const byDay = new Map<string, { consults: number; urgent: number }>();
    data.appointments.forEach((a) => {
      const day = a.date;
      const entry = byDay.get(day) || { consults: 0, urgent: 0 };
      entry.consults += 1;
      if (a.status === "in-progress" || a.reason.toLowerCase().includes("emergency")) {
        entry.urgent += 1;
      }
      byDay.set(day, entry);
    });
    return Array.from(byDay.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((x, y) => x.date.localeCompare(y.date))
      .slice(-14);
  }, [data.appointments]);

  const symptomMix = useMemo(() => {
    const counts = new Map<string, number>();
    data.records.forEach((r) => {
      const key = r.diagnosis.split(",")[0].trim() || "General";
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    if (counts.size === 0) counts.set("No consultations recorded", 1);
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((x, y) => y.value - x.value)
      .slice(0, 8);
  }, [data.records]);

  const urgencyMix = useMemo(() => {
    const counts = new Map<string, number>([
      ["emergency", 0],
      ["urgent", 0],
      ["routine", 0],
    ]);
    data.appointments.forEach((a) => {
      const text = `${a.reason} ${a.status}`.toLowerCase();
      if (text.includes("emergency") || text.includes("chest") || text.includes("breath")) {
        counts.set("emergency", (counts.get("emergency") || 0) + 1);
      } else if (text.includes("urgent") || text.includes("severe") || text.includes("fever")) {
        counts.set("urgent", (counts.get("urgent") || 0) + 1);
      } else {
        counts.set("routine", (counts.get("routine") || 0) + 1);
      }
    });
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [data.appointments]);

  const pharmacyAlerts = useMemo(() => getStockAlerts().slice(0, 8), []);

  const stockBreakdown = useMemo(() => getStockBreakdown(), []);

  if (!user || user.role !== "admin") {
    return <div className="rounded-2xl border bg-card p-6">Admin access only.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={<CalendarClock size={20} />} label="Total Consultations" value={metrics.total} sub={`${metrics.inProgress} in progress`} />
        <KpiCard icon={<HeartPulse size={20} />} label="Completed" value={metrics.completed} sub={`${metrics.cancelled} cancelled`} />
        <KpiCard icon={<Store size={20} />} label="Paid Consultations (₹)" value={metrics.revenue.toLocaleString("en-IN")} sub={`${metrics.pendingSync} ops pending sync`} />
        <KpiCard icon={<AlertTriangle size={20} />} label="Urgent Cases" value={urgencyMix.find((u) => u.name === "emergency")?.value ?? 0} sub="emergency triaged" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Consultation Volume (last 14 days)">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={consultTrend}>
              <defs>
                <linearGradient id="gConsults" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="consults" name="Consultations" stroke="#3b82f6" fill="url(#gConsults)" />
              <Area type="monotone" dataKey="urgent" name="Urgent" stroke="#ef4444" fill="none" strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Urgency Mix">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={urgencyMix} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {urgencyMix.map((entry) => (
                  <Cell key={entry.name} fill={URGENCY_COLORS[entry.name] ?? "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Symptom / Diagnosis Mix">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={symptomMix} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" name="Cases" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Pharmacy Stock Health">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={stockBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {stockBreakdown.map((entry) => (
                  <Cell key={entry.name} fill={STOCK_COLORS[entry.name] ?? "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <h3 className="font-semibold flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500" /> Stock Alerts
        </h3>
        {pharmacyAlerts.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-2">
            No low-stock alerts right now. Connect pharmacy stock data to surface alerts here.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {pharmacyAlerts.map((a, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <span className="font-medium">{a.pharmacy}</span>
                <span className="text-muted-foreground">{a.medicine}</span>
                <span className={`font-semibold ${a.status === "out_of_stock" ? "text-red-600" : "text-amber-600"}`}>
                  {a.status.replace("_", " ")} ({a.quantity})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <p className="text-sm">{label}</p>
      </div>
      <p className="text-3xl font-bold mt-2">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <h3 className="font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}
