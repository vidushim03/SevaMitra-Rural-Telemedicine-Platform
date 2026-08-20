import { useMemo, useState } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { CreditCard, CheckCircle, Clock, FileText, IndianRupee, Copy, Smartphone, Users, Truck } from 'lucide-react';

const HOSPITAL_UPI_ID = 'sevamitra@upi';

export function PaymentsPage() {
  const { data, markPayment } = useAppData();
  const { user } = useAuth();
  const { language } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [expandedPayId, setExpandedPayId] = useState<string | null>(null);

  const payments = useMemo(() => {
    if (!user) return [];
    let list = data.payments;
    if (user.role === 'patient') list = list.filter(p => p.patientId === user.id);
    if (user.role === 'doctor') list = list.filter(p => p.doctorId === user.id);
    if (filter !== 'all') list = list.filter(p => p.status === filter);
    return list;
  }, [data.payments, user, filter]);

  const getDoctorName = (doctorId: string) => data.users.find(u => u.id === doctorId)?.name ?? 'Unknown';
  const getPatientName = (patientId: string) => data.users.find(u => u.id === patientId)?.name ?? 'Unknown';

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">
          {user.role === 'patient' ? 'My Bills' : 'Bills & Payments'}
        </h2>
        <div className="flex gap-2">
          {(['all', 'pending', 'paid'] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              className="rounded-xl"
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {payments.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No bills found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {payments.map(p => (
            <Card key={p.id} className="glass-card overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${p.status === 'paid' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                      {p.status === 'paid' ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Clock className="h-5 w-5 text-amber-600" />}
                    </div>
                    <div>
                      <CardTitle className="text-lg">Bill #{p.id.replace('pay_', '')}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {getDoctorName(p.doctorId)} → {getPatientName(p.patientId)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={p.status === 'paid' ? 'default' : 'secondary'} className={p.status === 'paid' ? 'bg-green-600' : 'bg-amber-500'}>
                    {p.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl bg-slate-50 dark:bg-zinc-900 p-4">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <FileText size={14} /> Bill Details
                  </h4>
                  {p.lineItems && p.lineItems.length > 0 ? (
                    <div className="space-y-1">
                      {p.lineItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.description}</span>
                          <span className="font-medium">₹{item.total}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Consultation fee</span>
                      <span className="font-medium">₹{p.amount}</span>
                    </div>
                  )}
                  <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-primary flex items-center gap-1">
                      <IndianRupee size={14} />{p.amount}
                    </span>
                  </div>
                </div>

                {p.notes && (
                  <p className="text-xs text-muted-foreground">{p.notes}</p>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(p.date).toLocaleDateString()} • {p.method.toUpperCase()}
                  </span>
                  {p.status === 'pending' && user.role === 'patient' && (
                    <div className="flex flex-col gap-2 items-end">
                      {expandedPayId === p.id ? (
                        <div className="w-72 space-y-2 rounded-xl border p-3 bg-white dark:bg-zinc-950">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Choose how to pay ₹{p.amount}:</p>

                          {/* UPI Option */}
                          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
                            <Smartphone size={14} className="text-emerald-600 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium">Pay via UPI</p>
                              <p className="text-xs font-mono text-muted-foreground truncate">{HOSPITAL_UPI_ID}</p>
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
                          {copiedUpi && <p className="text-xs text-emerald-600">UPI ID copied!</p>}

                          {/* ASHA Worker Option */}
                          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
                            <Users size={14} className="text-blue-600 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium">Pay via ASHA Worker</p>
                              <p className="text-xs text-muted-foreground">Ask your local ASHA worker to collect</p>
                            </div>
                          </div>

                          {/* Medicine Delivery Option */}
                          <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg px-3 py-2">
                            <Truck size={14} className="text-orange-600 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium">Pay on Medicine Delivery</p>
                              <p className="text-xs text-muted-foreground">Pay cash when medicines arrive</p>
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
                  {p.status === 'pending' && (user.role === 'admin' || user.role === 'doctor') && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-red-600 border-red-200"
                        onClick={() => markPayment(p.id, 'failed')}
                      >
                        Fail
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-xl bg-green-600"
                        onClick={() => markPayment(p.id, 'paid')}
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
