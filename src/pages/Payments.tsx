import { FormEvent, useMemo, useState } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import { useAuth } from '../contexts/AuthContext';

export function PaymentsPage() {
  const { data, addPayment, markPayment } = useAppData();
  const { user } = useAuth();
  const [amount, setAmount] = useState(500);
  const [method, setMethod] = useState<'upi' | 'card' | 'cash' | 'wallet'>('upi');

  const payments = useMemo(() => {
    if (!user) return [];
    return data.payments.filter((p) => user.role === 'admin' || p.patientId === user.id);
  }, [data.payments, user]);

  if (!user) return null;

  const onAdd = (e: FormEvent) => {
    e.preventDefault();
    addPayment({
      appointmentId: data.appointments[0]?.id ?? 'apt_manual',
      patientId: user.role === 'patient' ? user.id : 'patient_demo',
      amount,
      status: 'pending',
      method,
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Payments & Receipts</h2>

      <form onSubmit={onAdd} className="rounded-2xl border bg-card p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs">Amount</label>
          <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="block border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-xs">Method</label>
          <select value={method} onChange={(e) => setMethod(e.target.value as any)} className="block border rounded-lg px-3 py-2">
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
            <option value="wallet">Wallet</option>
          </select>
        </div>
        <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">Create Payment</button>
      </form>

      <div className="rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="p-3 text-left">Payment ID</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Method</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.id}</td>
                <td className="p-3">₹{p.amount}</td>
                <td className="p-3 uppercase">{p.method}</td>
                <td className="p-3 capitalize">{p.status}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => markPayment(p.id, 'paid')} className="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/40">Mark Paid</button>
                  <button onClick={() => markPayment(p.id, 'failed')} className="px-2 py-1 rounded bg-rose-100 dark:bg-rose-900/40">Fail</button>
                  <button onClick={() => markPayment(p.id, 'refunded')} className="px-2 py-1 rounded bg-slate-200 dark:bg-zinc-700">Refund</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
