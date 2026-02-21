import { useDocuments, useTransactions } from "@/hooks/use-resources";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Files, FileCheck, FileClock, AlertCircle, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { StatusBadge } from "@/components/status-badge";
import { format, isValid } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

function safeFormatDate(value?: string | Date | null) {
  if (!value) return "—";
  const date = new Date(value);
  return isValid(date) ? format(date, "MMM d, yyyy HH:mm") : "—";
}

export default function Dashboard() {
  const { data: documents, isLoading: docsLoading } = useDocuments();
  const { data: transactions, isLoading: txLoading } = useTransactions();

  if (docsLoading || txLoading) {
    return <DashboardSkeleton />;
  }

  const stats = [
    {
      title: "Total Documents",
      value: documents?.length || 0,
      icon: Files,
      color: "text-blue-600",
      bg: "bg-blue-100"
    },
    {
      title: "Pending Signature",
      value: documents?.filter(d => d.status === "pending").length || 0,
      icon: FileClock,
      color: "text-amber-600",
      bg: "bg-amber-100"
    },
    {
      title: "Completed",
      value: documents?.filter(d => d.status === "signed").length || 0,
      icon: FileCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-100"
    },
    {
      title: "Needs Attention",
      value: documents?.filter(d => d.status === "declined").length || 0,
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-100"
    }
  ];

  const chartData = [
    { name: "Pending", value: documents?.filter(d => d.status === "pending").length || 0, color: "#f59e0b" },
    { name: "Approved", value: documents?.filter(d => d.status === "approved").length || 0, color: "#3b82f6" },
    { name: "Signed", value: documents?.filter(d => d.status === "signed").length || 0, color: "#10b981" },
    { name: "Declined", value: documents?.filter(d => d.status === "declined").length || 0, color: "#ef4444" }
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your document activity</p>
        </div>
        <Link href="/documents">
          <button className="btn-primary flex items-center gap-2">
            View All Documents <ArrowUpRight className="w-4 h-4" />
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <Card key={i} className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <Card className="lg:col-span-3 border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-slate-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Transaction ID</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions?.slice(0, 5).map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        #{tx.id.toString().padStart(6, "0")}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {safeFormatDate(tx.timestamp)}
                      </td>
                    </tr>
                  ))}
                  {(!transactions || transactions.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                        No transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-slate-100 shadow-sm">
  <CardHeader>
    <CardTitle>Document Status</CardTitle>
  </CardHeader>

  <CardContent className="h-[320px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
      >
        <XAxis
          dataKey="name"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          interval={0}
        />

        <YAxis
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={30}
          allowDecimals={false}
        />

        <Tooltip
          cursor={{ fill: "transparent" }}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e2e8f0"
          }}
        />

        <Bar
          dataKey="value"
          radius={[6, 6, 0, 0]}
          barSize={40}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-10 w-48 bg-slate-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}
