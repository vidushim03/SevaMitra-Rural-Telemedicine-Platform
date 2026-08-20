import { useMemo, useState } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { CreditCard, CheckCircle, Clock, FileText, IndianRupee } from 'lucide-react';

export function PaymentsPage() {
  const { data, markPayment } = useAppData();
  const { user } = useAuth();
  const { language } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');

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
                    <span className="text-sm text-muted-foreground italic">
                      Pay at hospital counter during your visit
                    </span>
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
