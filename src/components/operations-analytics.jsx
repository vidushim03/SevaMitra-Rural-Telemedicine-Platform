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
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  Clock,
  FlaskConical,
  HeartPulse,
  Pill,
  Stethoscope,
  Users,
  Zap,
} from "lucide-react";
import operationsData from "../lib/operations-analytics.json";
import { useLanguage } from "../contexts/LanguageContext";
import { useTranslation } from "./translations";

const data = operationsData;

const URGENCY_COLORS = {
  Emergency: "#ef4444",
  High: "#f59e0b",
  Routine: "#10b981",
};

const ACCESS_COLORS = {
  "Rural → Specialist": "#8b5cf6",
  "Rural → General": "#3b82f6",
  "Hub → Specialist": "#f59e0b",
  "Hub → General": "#94a3b8",
};

function pct(v) {
  return `${(v * 100).toFixed(1)}%`;
}

export function OperationsAnalytics() {
  const { language } = useLanguage();
  const t = useTranslation(language);
  const k = data.kpis;
  const flow = data.flow;

  const flowStages = [
    {
      key: "demand",
      icon: <Users size={18} />,
      label: t.demandStage,
      items: [
        {
          label: t.consultsPerDayLabel,
          value: `${flow.demand.consults_per_day}`,
        },
        { label: t.emergencyPerDayLabel, value: flow.demand.emergency_per_day },
        { label: t.activeVillagesLabel, value: flow.demand.active_villages },
        {
          label: t.ruralShareLabel,
          value: pct(Number(flow.demand.rural_share)),
        },
      ],
    },
    {
      key: "capacity",
      icon: <Stethoscope size={18} />,
      label: t.capacityStage,
      items: [
        { label: t.doctorsLabel, value: flow.capacity.doctors },
        {
          label: t.avgUtilizationLabel,
          value: pct(Number(flow.capacity.avg_utilization)),
        },
        { label: t.peakHourLabel, value: `${flow.capacity.peak_hour}:00` },
        { label: t.peakShareOfDayLabel, value: `${flow.capacity.peak_share}%` },
      ],
    },
    {
      key: "outcomes",
      icon: <HeartPulse size={18} />,
      label: t.outcomesStage,
      items: [
        {
          label: t.completionLabel,
          value: pct(Number(flow.outcomes.completion_rate)),
        },
        { label: t.avgWaitLabel, value: `${flow.outcomes.avg_wait_min} min` },
        {
          label: t.rxIssuedLabel,
          value: pct(Number(flow.outcomes.rx_conversion)),
        },
        { label: t.ratingLabel, value: flow.outcomes.avg_rating },
      ],
    },
    {
      key: "pharmacy",
      icon: <Pill size={18} />,
      label: t.pharmacyStage,
      items: [
        {
          label: t.stockOutRateLabel,
          value: pct(Number(flow.pharmacy.stock_out_rate)),
        },
        {
          label: t.medAvailabilityLabel,
          value: pct(Number(flow.pharmacy.medicine_availability)),
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Simulated-data banner */}
      <div className="rounded-2xl border bg-card p-4 flex items-start gap-3">
        <FlaskConical className="h-5 w-5 text-purple-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold">{data.meta.label}</p>
          <p className="text-xs text-muted-foreground">
            Generated {data.meta.generated} · {data.meta.period} · source:{" "}
            {data.meta.source}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            This dashboard renders the same aggregates computed in the{" "}
            <code className="text-[11px]">analysis/</code> notebook and SQL
            queries, and will measure the live platform once it sees real
            traffic. No production numbers are claimed.
          </p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={<CalendarClock size={20} />}
          label={t.consultsPerDay}
          value={k.consults_per_day}
          sub={`${k.consults_per_week}/week across ${k.active_villages} villages`}
        />
        <KpiCard
          icon={<Clock size={20} />}
          label={t.avgWaitTime}
          value={`${k.avg_wait_min} min`}
          sub={`median ${k.median_wait_min} min`}
        />
        <KpiCard
          icon={<Activity size={20} />}
          label={t.doctorUtilization}
          value={pct(k.doctor_utilization)}
          sub={`${k.doctors} doctors in the panel`}
        />
        <KpiCard
          icon={<Zap size={20} />}
          label={t.appointmentCompletion}
          value={pct(k.completion_rate)}
          sub={`no-show ${pct(k.no_show_rate)} · cancelled ${pct(k.cancellation_rate)}`}
        />
      </div>

      {/* Demand → Capacity → Outcomes → Pharmacy */}
      <div>
        <h3 className="font-semibold mb-3">{t.operationalFlow}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {flowStages.map((stage) => (
            <div key={stage.key} className="rounded-2xl border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                {stage.icon}
                <p className="text-sm font-semibold">{stage.label}</p>
              </div>
              <div className="space-y-2">
                {stage.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title={t.demandTrendTitle}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.charts.demand_by_day}>
              <defs>
                <linearGradient id="gOpsDemand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(d) => d.slice(5)}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="consults"
                name="Consultations"
                stroke="#8b5cf6"
                fill="url(#gOpsDemand)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t.hourlyDemandTitle}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.charts.demand_by_hour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar
                dataKey="consults"
                name="Consultations"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t.waitTimeDistributionTitle}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.charts.wait_buckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar
                dataKey="count"
                name="Consults"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t.doctorUtilizationBySpecialtyTitle}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={data.charts.utilization_by_specialty}
              layout="vertical"
              margin={{ left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="specialty"
                width={90}
                tick={{ fontSize: 11 }}
              />
              <Tooltip formatter={(v) => [`${v}%`, "Utilization"]} />
              <Bar
                dataKey="utilization"
                name="Utilization"
                fill="#10b981"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t.urgencyMixTitle}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.charts.urgency_mix}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
              >
                {data.charts.urgency_mix.map((entry) => (
                  <Cell
                    key={String(entry.name)}
                    fill={URGENCY_COLORS[String(entry.name)] ?? "#94a3b8"}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t.languageMixTitle}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.charts.language_mix}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
              >
                {data.charts.language_mix.map((entry, i) => (
                  <Cell
                    key={String(entry.name)}
                    fill={["#3b82f6", "#8b5cf6", "#f59e0b"][i % 3]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t.topSymptomsTitle}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={data.charts.symptom_mix}
              layout="vertical"
              margin={{ left: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fontSize: 10 }}
              />
              <Tooltip />
              <Bar
                dataKey="value"
                name="Cases"
                fill="#0ea5e9"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t.pharmacyStockOutTitle}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.charts.stock_risk_by_specialty}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="specialty" tick={{ fontSize: 10 }} />
              <YAxis unit="%" tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}%`, t.stockOutRateLabel]} />
              <Bar
                dataKey="rate"
                name={t.stockOutRateLabel}
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t.specialistAccessTitle}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.charts.access_mix}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
              >
                {data.charts.access_mix.map((entry) => (
                  <Cell
                    key={String(entry.name)}
                    fill={ACCESS_COLORS[String(entry.name)] ?? "#94a3b8"}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Takeaway strip */}
      <div className="rounded-2xl border bg-card p-4 space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500" />{" "}
          {t.whatNumbersSay}
        </h3>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
          <li>
            {t.peakLoadTakeaway.replace(
              "{peakHour}",
              flow.capacity.peak_hour.toString(),
            )}
          </li>
          <li>
            {t.appointmentsNeverHappenTakeaway.replace(
              "{cancelNoShowPct}",
              pct(Number(k.cancellation_rate) + Number(k.no_show_rate)),
            )}
          </li>
          <li>
            {t.chronicMedicineStockRiskTakeaway
              .replace(
                "{psychRate}",
                data.charts.stock_risk_by_specialty
                  .find((c) => String(c.specialty) === "Psychiatry")
                  ?.rate?.toString() || "0",
              )
              .replace(
                "{cardioRate}",
                data.charts.stock_risk_by_specialty
                  .find((c) => String(c.specialty) === "Cardiology")
                  ?.rate?.toString() || "0",
              )}
          </li>
          <li>
            {t.ruralSpecialistAccessTakeaway.replace(
              "{ruralSpecialistPct}",
              pct(k.rural_specialist_share),
            )}
          </li>
        </ul>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, sub }) {
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

function ChartCard({ title, children }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <h3 className="font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}
