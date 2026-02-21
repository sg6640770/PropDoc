import { useTransactions } from "@/hooks/use-resources";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { format, isValid } from "date-fns";

function formatTimestamp(value?: string | Date | null) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);

  if (!isValid(date)) return "—";

  return format(date, "MMM d, yyyy HH:mm:ss");
}

export default function TransactionsPage() {
  const { data: transactions, isLoading } = useTransactions();

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-slate-900">
          Transactions
        </h1>
        <p className="text-slate-500 mt-1">
          Audit trail of all system events.
        </p>
      </div>

      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">
                    Transaction ID
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">
                    Document ID
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">
                    Timestamp
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center">
                      Loading transactions...
                    </td>
                  </tr>
                ) : !transactions || transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-8 text-center text-slate-500"
                    >
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        #{tx.id}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-blue-600">
                        Doc-{tx.documentId ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {formatTimestamp(tx.timestamp)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
