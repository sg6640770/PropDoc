import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { LayoutShell } from "@/components/layout-shell";
import { queryClient } from "./lib/queryClient";
import { Loader2 } from "lucide-react";

// Pages
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import TemplatesPage from "@/pages/templates-page";
import DocumentsPage from "@/pages/documents-page";
import DocumentDetails from "@/pages/document-details";
import TransactionsPage from "@/pages/transactions-page";
import NotFound from "@/pages/not-found";

/* ================= PROTECTED ROUTE (NO LAYOUT) ================= */
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return <Component />;
}

/* ================= ROUTER ================= */
function Router() {
  return (
    <Switch>
      {/* ---------- AUTH (NO LAYOUT) ---------- */}
      <Route path="/auth" component={AuthPage} />

      {/* ---------- APP (WITH LAYOUT) ---------- */}
      <LayoutShell>
        <Route path="/">
          <ProtectedRoute component={Dashboard} />
        </Route>

        <Route path="/templates">
          <ProtectedRoute component={TemplatesPage} />
        </Route>

        <Route path="/documents">
          <ProtectedRoute component={DocumentsPage} />
        </Route>

        <Route path="/documents/:id">
          <ProtectedRoute component={DocumentDetails} />
        </Route>

        <Route path="/transactions">
          <ProtectedRoute component={TransactionsPage} />
        </Route>
      </LayoutShell>

      <Route component={NotFound} />
    </Switch>
  );
}

/* ================= APP ROOT ================= */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
