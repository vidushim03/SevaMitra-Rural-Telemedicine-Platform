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
import { CreditCard, IndianRupee, ReceiptText, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { useAppData } from "../contexts/AppDataContext";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useTranslation } from "./translations";

const STATUS_COLORS: Record<string, string> = {
  paid: "#10b981",
  pending: "#f59e0b",
  failed: "#ef4444",
  refunded: "#94a3b8",
};

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

export function PaymentAnalytics() {
  const { data } = useAppData();
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = useTranslation(language);

  const doctorMap = useMemo(() => {
    const m = new Map<string, { name: string; specialty: string }>();
    data.users.forEach((u) => {
      if (u.role === "doctor") m.set(u.id, { name: u.name, specialty: u.specialty || "General" });
    });
    return m;
  }, [data.users]);

  const patientMap = useMemo(() => {
    const m = new Map<string, string>();
    data.users.forEach((u) => {
      if (u.role === "patient") m.set(u.id, u.name);
    });
    return m;
  }, [data.users]);

  if (!user) {
    return <div className="rounded-2xl border bg-card p-6">{t.pleaseLoginToViewAnalytics}</div>;
  }

 if (user.role === "admin") return <AdminView data={data} doctorMap={doctorMap} patientMap={patientMap} t={t} />;
  if (user.role === "doctor") return <DoctorView data={data} user={user} doctorMap={doctorMap} patientMap={patientMap} t={t} />;
  return <PatientView data={data} user={user} doctorMap={doctorMap} t={t} />;
}

function AdminView({ data, doctorMap, patientMap, t }: { data: ReturnType<typeof useAppData>["data"]; doctorMap: Map<string, { name: string; specialty: string }>; patientMap: Map<string, string>; t: any }) {
  const paidBills = useMemo(() => data.payments.filter((p) => p.status === "paid"), [data.payments]);
  const pendingBills = useMemo(() => data.payments.filter((p) => p.status === "pending"), [data.payments]);

  const totalRevenue = useMemo(() => paidBills.reduce((s, p) => s + p.amount, 0), [paidBills]);
  const totalPending = useMemo(() => pendingBills.reduce((s, p) => s + p.amount, 0), [pendingBills]);
  const collectionRate = useMemo(() => {
    const total = totalRevenue + totalPending;
    return total === 0 ? 0 : Math.round((totalRevenue / total) * 100);
  }, [totalRevenue, totalPending]);

  const revenueByDoctor = useMemo(() => {
    const m = new Map<string, number>();
    paidBills.forEach((p) => m.set(p.doctorId, (m.get(p.doctorId) || 0) + p.amount));
    return Array.from(m.entries())
      .map(([id, value]) => ({ name: doctorMap.get(id)?.name || id, value }))
      .sort((x, y) => y.value - x.value);
  }, [paidBills, doctorMap]);

  const revenueBySpecialty = useMemo(() => {
    const m = new Map<string, number>();
    paidBills.forEach((p) => {
      const spec = doctorMap.get(p.doctorId)?.specialty || "General";
      m.set(spec, (m.get(spec) || 0) + p.amount);
    });
    return Array.from(m.entries()).map(([name, value]) => ({ name, value }));
  }, [paidBills, doctorMap]);

  const statusDistribution = useMemo(() => {
    const m = new Map<string, number>();
    data.payments.forEach((p) => m.set(p.status, (m.get(p.status) || 0) + 1));
    return Array.from(m.entries()).map(([name, value]) => ({ name, value }));
  }, [data.payments]);

  const monthlyRevenue = useMemo(() => {
    const m = new Map<string, number>();
    paidBills.forEach((p) => {
      const month = p.date.slice(0, 7);
      m.set(month, (m.get(month) || 0) + p.amount);
    });
    return Array.from(m.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((x, y) => x.month.localeCompare(y.month));
  }, [paidBills]);

  const outstandingByDoctor = useMemo(() => {
    const m = new Map<string, { total: number; count: number }>();
    pendingBills.forEach((p) => {
      const entry = m.get(p.doctorId) || { total: 0, count: 0 };
      entry.total += p.amount;
      entry.count += 1;
      m.set(p.doctorId, entry);
    });
    return Array.from(m.entries())
      .map(([id, v]) => ({
        doctorId: id,
        doctorName: doctorMap.get(id)?.name || id,
        specialty: doctorMap.get(id)?.specialty || "General",
        pendingAmount: v.total,
        pendingCount: v.count,
      }))
      .sort((x, y) => y.pendingAmount - x.pendingAmount);
  }, [pendingBills, doctorMap]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={<IndianRupee size={20} />} label={t.totalRevenue} value={`₹${totalRevenue.toLocaleString("en-IN")}`} sub={`${paidBills.length} ${t.paid}`} />
        <KpiCard icon={<AlertCircle size={20} />} label={t.outstandingDues} value={`₹${totalPending.toLocaleString("en-IN")}`} sub={`${pendingBills.length} ${t.pending}`} />
        <KpiCard icon={<ReceiptText size={20} />} label={t.totalBills} value={data.payments.length} sub={`₹${(totalRevenue + totalPending).toLocaleString("en-IN")} ${t.bills}`} />
        <KpiCard icon={<CheckCircle size={20} />} label={t.collectionRate} value={`${collectionRate}%`} sub={t.paymentStatus} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title={t.revenueByDoctor}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueByDoctor}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, t.revenue]} />
              <Bar dataKey="value" name={t.revenue} fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t.revenueBySpecialty}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={revenueBySpecialty} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {revenueBySpecialty.map((entry, i) => (
                  <Cell key={entry.name} fill={["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"][i % 6]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, t.revenue]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t.paymentStatusDistribution}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {statusDistribution.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t.monthlyTrend}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyRevenue}>
              <defs>
                <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, t.revenue]} />
              <Area type="monotone" dataKey="revenue" name={t.revenue} stroke="#10b981" fill="url(#gRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <h3 className="font-semibold flex items-center gap-2">
          <AlertCircle size={16} className="text-amber-500" /> {t.outstandingDuesByDoctor}
        </h3>
        {outstandingByDoctor.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-2">{t.noOutstandingDues}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">{t.doctorLabel}</th>
                  <th className="pb-2 pr-4">{t.specialtyLabel}</th>
                  <th className="pb-2 pr-4 text-right">{t.pendingAmount}</th>
                  <th className="pb-2 text-right">{t.pendingBills}</th>
                </tr>
              </thead>
              <tbody>
                {outstandingByDoctor.map((row) => (
                  <tr key={row.doctorId} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{row.doctorName}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{row.specialty}</td>
                    <td className="py-2 pr-4 text-right font-semibold text-amber-600">₹{row.pendingAmount.toLocaleString("en-IN")}</td>
                    <td className="py-2 text-right">{row.pendingCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function DoctorView({ data, user, doctorMap, patientMap, t }: { data: ReturnType<typeof useAppData>["data"]; user: { id: string }; doctorMap: Map<string, { name: string; specialty: string }>; patientMap: Map<string, string>; t: any }) {
  const myPaid = useMemo(() => data.payments.filter((p) => p.doctorId === user.id && p.status === "paid"), [data.payments, user.id]);
  const myPending = useMemo(() => data.payments.filter((p) => p.doctorId === user.id && p.status === "pending"), [data.payments, user.id]);
  const myAll = useMemo(() => data.payments.filter((p) => p.doctorId === user.id), [data.payments, user.id]);

  const myRevenue = useMemo(() => myPaid.reduce((s, p) => s + p.amount, 0), [myPaid]);
  const myPendingAmount = useMemo(() => myPending.reduce((s, p) => s + p.amount, 0), [myPending]);

  const patientDues = useMemo(() => {
    return myPending.map((p) => ({
      id: p.id,
      patientName: patientMap.get(p.patientId) || p.patientId,
      amount: p.amount,
      date: p.date,
      method: p.method,
    }));
  }, [myPending, patientMap]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={<IndianRupee size={20} />} label={t.myRevenue} value={`₹${myRevenue.toLocaleString("en-IN")}`} sub={`${myPaid.length} ${t.paid}`} />
        <KpiCard icon={<AlertCircle size={20} />} label={t.myPending} value={`₹${myPendingAmount.toLocaleString("en-IN")}`} sub={`${myPending.length} ${t.pending}`} />
        <KpiCard icon={<ReceiptText size={20} />} label={t.myBillsLabel} value={myAll.length} sub={`${myAll.length} ${t.all}`} />
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <h3 className="font-semibold flex items-center gap-2">
          <AlertCircle size={16} className="text-amber-500" /> {t.patientOutstandingDues}
        </h3>
        {patientDues.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-2">{t.noPendingDuesFromPatients}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">{t.patientLabel}</th>
                  <th className="pb-2 pr-4">{t.dateLabel}</th>
                  <th className="pb-2 pr-4">{t.methodLabel}</th>
                  <th className="pb-2 text-right">{t.amountLabel}</th>
                </tr>
              </thead>
              <tbody>
                {patientDues.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{row.patientName}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{row.date}</td>
                    <td className="py-2 pr-4 capitalize">{row.method}</td>
                    <td className="py-2 text-right font-semibold text-amber-600">₹{row.amount.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PatientView({ data, user, doctorMap, t }: { data: ReturnType<typeof useAppData>["data"]; user: { id: string }; doctorMap: Map<string, { name: string; specialty: string }>; t: any }) {
  const myBills = useMemo(() => data.payments.filter((p) => p.patientId === user.id), [data.payments, user.id]);
  const totalBilled = useMemo(() => myBills.reduce((s, p) => s + p.amount, 0), [myBills]);
  const totalPaid = useMemo(() => myBills.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0), [myBills]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={<ReceiptText size={20} />} label={t.totalBilled} value={`₹${totalBilled.toLocaleString("en-IN")}`} sub={`${myBills.length} ${t.bills}`} />
        <KpiCard icon={<CheckCircle size={20} />} label={t.totalPaidLabel} value={`₹${totalPaid.toLocaleString("en-IN")}`} sub={`₹${(totalBilled - totalPaid).toLocaleString("en-IN")} ${t.pending}`} />
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <h3 className="font-semibold flex items-center gap-2">
          <CreditCard size={16} className="text-blue-500" /> {t.billsHistory}
        </h3>
        {myBills.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-2">{t.noBillsYet}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">{t.doctorLabel}</th>
                  <th className="pb-2 pr-4">{t.dateLabel}</th>
                  <th className="pb-2 pr-4">{t.methodLabel}</th>
                  <th className="pb-2 pr-4 text-right">{t.amountLabel}</th>
                  <th className="pb-2 text-right">{t.statusLabel}</th>
                </tr>
              </thead>
              <tbody>
                {myBills.map((bill) => (
                  <tr key={bill.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{doctorMap.get(bill.doctorId)?.name || bill.doctorId}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{bill.date}</td>
                    <td className="py-2 pr-4 capitalize">{bill.method}</td>
                    <td className="py-2 pr-4 text-right">₹{bill.amount.toLocaleString("en-IN")}</td>
                    <td className="py-2 text-right">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        bill.status === "paid" ? "bg-green-100 text-green-700" :
                        bill.status === "pending" ? "bg-amber-100 text-amber-700" :
                        bill.status === "failed" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {bill.status === "paid" && <CheckCircle size={12} />}
                        {bill.status === "failed" && <XCircle size={12} />}
                        {t[`${bill.status}Status`] || bill.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
