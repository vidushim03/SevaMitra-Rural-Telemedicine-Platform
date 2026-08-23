import { useMemo, useState } from "react";
import { useAppData } from "../contexts/AppDataContext";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../components/translations";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  CreditCard,
  CheckCircle,
  Clock,
  FileText,
  IndianRupee,
  Copy,
  Smartphone,
  Users,
  Truck,
  Printer,
} from "lucide-react";

const HOSPITAL_UPI_ID = "sevamitra@upi";

export function PaymentsPage() {
  const { data, markPayment } = useAppData();
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];

  const translateStatus = (s) => {
    if (s === "paid") return t.paid;
    if (s === "pending") return t.pending;
    if (s === "failed") return t.failed;
    return s;
  };

  const [filter, setFilter] = useState("all");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [expandedPayId, setExpandedPayId] = useState(null);

  const payments = useMemo(() => {
    if (!user) return [];
    let list = data.payments;
    if (user.role === "patient")
      list = list.filter((p) => p.patientId === user.id);
    if (user.role === "doctor")
      list = list.filter((p) => p.doctorId === user.id);
    if (filter !== "all") list = list.filter((p) => p.status === filter);
    return list;
  }, [data.payments, user, filter]);

  const getDoctorName = (doctorId) =>
    data.users.find((u) => u.id === doctorId)?.name ?? "Unknown";
  const getPatientName = (patientId) =>
    data.users.find((u) => u.id === patientId)?.name ?? "Unknown";
  const getSpecialty = (doctorId) =>
    data.users.find((u) => u.id === doctorId)?.specialty ?? "";

  const handlePrintBill = (p) => {
    const patientName = getPatientName(p.patientId);
    const doctorName = getDoctorName(p.doctorId);
    const specialty = getSpecialty(p.doctorId);
    const billNumber = p.id.replace("pay_", "");
    const billDate = new Date(p.date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const lineItemsHtml =
      p.lineItems && p.lineItems.length > 0
        ? p.lineItems
            .map(
              (item) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${item.description}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">₹${item.unitPrice.toFixed(2)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">₹${item.total.toFixed(2)}</td>
          </tr>`,
            )
            .join("")
        : `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;" colspan="2">Consultation Fee</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">1</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">₹${p.consultationFee.toFixed(2)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">₹${p.consultationFee.toFixed(2)}</td>
        </tr>`;

    const statusColor =
      p.status === "paid"
        ? "#16a34a"
        : p.status === "pending"
          ? "#d97706"
          : "#dc2626";
    const statusBg =
      p.status === "paid"
        ? "#dcfce7"
        : p.status === "pending"
          ? "#fef3c7"
          : "#fee2e2";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Bill #${billNumber} - SevaMitra</title>
<style>
  @media print {
    body { margin: 0; }
    .no-print { display: none !important; }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; background: #fff; }
  .bill-container { max-width: 750px; margin: 20px auto; padding: 40px; border: 1px solid #e2e8f0; }
  .header { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 20px; margin-bottom: 24px; }
  .header h1 { font-size: 22px; color: #0d9488; margin-bottom: 4px; }
  .header p { font-size: 13px; color: #64748b; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 14px; }
  .meta div { line-height: 1.8; }
  .meta strong { color: #475569; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
  thead th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #cbd5e1; }
  thead th:nth-child(2) { text-align: center; }
  thead th:nth-child(3), thead th:nth-child(4) { text-align: right; }
  .summary { margin-left: auto; width: 280px; font-size: 14px; }
  .summary-row { display: flex; justify-content: space-between; padding: 6px 0; }
  .summary-row.total { border-top: 2px solid #0d9488; padding-top: 10px; margin-top: 4px; font-weight: 700; font-size: 16px; color: #0d9488; }
  .status-badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; color: ${statusColor}; background: ${statusBg}; }
  .notes { background: #f8fafc; border-left: 3px solid #94a3b8; padding: 12px 16px; margin: 20px 0; font-size: 13px; color: #475569; border-radius: 0 6px 6px 0; }
  .footer { text-align: center; margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
</style>
</head>
<body>
<div class="bill-container">
  <div class="header">
    <h1>SevaMitra - Rural Telemedicine Platform</h1>
    <p>Quality healthcare, accessible to everyone</p>
  </div>

  <div class="meta">
    <div>
      <strong>Bill No:</strong> #${billNumber}<br>
      <strong>Date:</strong> ${billDate}<br>
      <strong>Payment Method:</strong> ${p.method.toUpperCase()}
    </div>
    <div style="text-align:right;">
      <strong>Status:</strong> <span class="status-badge">${p.status.toUpperCase()}</span>
    </div>
  </div>

  <div class="meta">
    <div>
      <strong>Patient:</strong> ${patientName}
    </div>
    <div style="text-align:right;">
      <strong>Doctor:</strong> ${doctorName}${specialty ? ` (${specialty})` : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemsHtml}
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-row"><span>Consultation Fee</span><span>₹${p.consultationFee.toFixed(2)}</span></div>
    <div class="summary-row"><span>Medicine Total</span><span>₹${p.medicineTotal.toFixed(2)}</span></div>
    <div class="summary-row total"><span>Grand Total</span><span>₹${p.amount.toFixed(2)}</span></div>
  </div>

  ${p.notes ? `<div class="notes"><strong>Notes:</strong> ${p.notes}</div>` : ""}

  <div class="footer">This is a computer-generated bill</div>
</div>
</body>
</html>`;

    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">
          {user.role === "patient" ? t.myBills : t.allBills}
        </h2>
        <div className="flex gap-2">
          {["all", "pending", "paid"].map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              className="rounded-xl"
              onClick={() => setFilter(f)}
            >
              {f === "all" ? t.all : f === "pending" ? t.pending : t.paid}
            </Button>
          ))}
        </div>
      </div>

      {payments.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">{t.noBillsFound}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {payments.map((p) => (
            <Card key={p.id} className="glass-card overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${p.status === "paid" ? "bg-green-100 dark:bg-green-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}
                    >
                      {p.status === "paid" ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Bill #{p.id.replace("pay_", "")}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {getDoctorName(p.doctorId)} →{" "}
                        {getPatientName(p.patientId)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={p.status === "paid" ? "default" : "secondary"}
                    className={
                      p.status === "paid" ? "bg-green-600" : "bg-amber-500"
                    }
                  >
                    {translateStatus(p.status)}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl gap-1.5"
                    onClick={() => handlePrintBill(p)}
                  >
                    <Printer size={14} />
                    {t.printBill}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl bg-slate-50 dark:bg-zinc-900 p-4">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <FileText size={14} /> {t.billDetails}
                  </h4>
                  {p.lineItems && p.lineItems.length > 0 ? (
                    <div className="space-y-1">
                      {p.lineItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.description}
                          </span>
                          <span className="font-medium">₹{item.total}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t.consultationFee}
                      </span>
                      <span className="font-medium">₹{p.amount}</span>
                    </div>
                  )}
                  <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                    <span>{t.billTotal}</span>
                    <span className="text-primary flex items-center gap-1">
                      <IndianRupee size={14} />
                      {p.amount}
                    </span>
                  </div>
                </div>

                {p.notes && (
                  <p className="text-xs text-muted-foreground">{p.notes}</p>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(p.date).toLocaleDateString()} •{" "}
                    {p.method.toUpperCase()}
                  </span>
                  {p.status === "pending" && user.role === "patient" && (
                    <div className="flex flex-col gap-2 items-end">
                      {expandedPayId === p.id ? (
                        <div className="w-72 space-y-2 rounded-xl border p-3 bg-white dark:bg-zinc-950">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">
                            {t.chooseHowToPay} ₹{p.amount}:
                          </p>

                          {/* UPI Option */}
                          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
                            <Smartphone
                              size={14}
                              className="text-emerald-600 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium">
                                {t.payViaUpi}
                              </p>
                              <p className="text-xs font-mono text-muted-foreground truncate">
                                {HOSPITAL_UPI_ID}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(HOSPITAL_UPI_ID);
                                setCopiedUpi(true);
                                setTimeout(() => setCopiedUpi(false), 2000);
                              }}
                              className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-800 transition-colors shrink-0"
                            >
                              <Copy size={12} className="text-emerald-600" />
                            </button>
                          </div>
                          {copiedUpi && (
                            <p className="text-xs text-emerald-600">
                              {t.upiIdCopied}
                            </p>
                          )}

                          {/* ASHA Worker Option */}
                          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
                            <Users
                              size={14}
                              className="text-blue-600 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium">
                                {t.payViaAshaWorker}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {t.askAshaToCollect}
                              </p>
                            </div>
                          </div>

                          {/* Medicine Delivery Option */}
                          <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg px-3 py-2">
                            <Truck
                              size={14}
                              className="text-orange-600 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium">
                                {t.payOnDelivery}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {t.payCashWhenDelivered}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => setExpandedPayId(null)}
                            className="text-xs text-muted-foreground hover:text-foreground text-center w-full pt-1"
                          >
                            Close
                          </button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => setExpandedPayId(p.id)}
                        >
                          Pay ₹{p.amount}
                        </Button>
                      )}
                    </div>
                  )}
                  {p.status === "pending" &&
                    (user.role === "admin" || user.role === "doctor") && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl text-red-600 border-red-200"
                          onClick={() => markPayment(p.id, "failed")}
                        >
                          Fail
                        </Button>
                        <Button
                          size="sm"
                          className="rounded-xl bg-green-600"
                          onClick={() => markPayment(p.id, "paid")}
                        >
                          Mark Paid (Cash)
                        </Button>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
