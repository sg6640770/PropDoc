import {
  useDocument,
  useAuditLogs,
  useApproveSigning,
  useCheckSignStatus,
} from "@/hooks/use-resources";
import { useRoute, Link } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { format, isValid } from "date-fns";
import {
  ArrowLeft,
  Clock,
  FileText,
  Send,
  User,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/* ================= SAFE DATE FORMATTER ================= */
function formatDate(
  value?: string | Date | null,
  pattern = "PPP"
): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (!isValid(date)) return "—";
  return format(date, pattern);
}

export default function DocumentDetails() {
  const [, params] = useRoute("/documents/:id");
  const id = Number(params?.id);

  const { data: document, isLoading: docLoading } = useDocument(id);
  const { data: auditLogs, isLoading: logsLoading } = useAuditLogs(id);
  const approveMutation = useApproveSigning();
  const checkStatusMutation = useCheckSignStatus();

  if (docLoading) return <DetailsSkeleton />;
  if (!document) return <div>Document not found</div>;

  const meta = document.metadata as any;
  const docData = document as any;

  /* ================= TEMPLATE DYNAMIC RENDER ================= */
  const templateData = {
    agreementDay: meta?.agreementDay || formatDate(document.createdAt, "d"),
    agreementMonth: meta?.agreementMonth || formatDate(document.createdAt, "MMMM"),
    agreementYear: meta?.agreementYear || formatDate(document.createdAt, "yyyy"),
    agreementPlace: meta?.agreementPlace || "[agreementPlace]",
    stateName: meta?.stateName || "[stateName]",
    jurisdictionCity: meta?.jurisdictionCity || "[jurisdictionCity]",
    arbitrationCity: meta?.arbitrationCity || "[arbitrationCity]",
    sellerName: meta?.seller?.name || meta?.sellerName || "[sellerName]",
    sellerParentName: meta?.seller?.parentName || meta?.sellerParentName || "[sellerParentName]",
    sellerAge: meta?.seller?.age || meta?.sellerAge || "[sellerAge]",
    sellerOccupation: meta?.seller?.occupation || meta?.sellerOccupation || "[sellerOccupation]",
    sellerAddress: meta?.seller?.address || meta?.sellerAddress || "[sellerAddress]",
    sellerPAN: meta?.seller?.pan || meta?.sellerPAN || "[sellerPAN]",
    sellerAadhaar: meta?.seller?.aadhaar || meta?.sellerAadhaar || "[sellerAadhaar]",
    buyerName: meta?.buyer?.name || meta?.buyerName || "[buyerName]",
    buyerParentName: meta?.buyer?.parentName || "[buyerParentName]",
    buyerAge: meta?.buyer?.age || "[buyerAge]",
    buyerOccupation: meta?.buyer?.occupation || "[buyerOccupation]",
    buyerAddress: meta?.buyer?.address || "[buyerAddress]",
    buyerPAN: meta?.buyer?.pan || "[buyerPAN]",
    buyerAadhaar: meta?.buyer?.aadhaar || "[buyerAadhaar]",
    propertyType: meta?.property?.type || "[propertyType]",
    propertyAddress: meta?.property?.address || meta?.propertyAddress || "[propertyAddress]",
    surveyNo: meta?.property?.surveyNo || "[surveyNo]",
    municipalNo: meta?.property?.municipalNo || "[municipalNo]",
    area: meta?.property?.area || "[area]",
    builtUpArea: meta?.property?.builtUpArea || "[builtUpArea]",
    carpetArea: meta?.property?.carpetArea || "[carpetArea]",
    boundaryNorth: meta?.property?.boundaryNorth || "[boundaryNorth]",
    boundarySouth: meta?.property?.boundarySouth || "[boundarySouth]",
    boundaryEast: meta?.property?.boundaryEast || "[boundaryEast]",
    boundaryWest: meta?.property?.boundaryWest || "[boundaryWest]",
    saleAmount: meta?.financial?.saleAmount || meta?.price || "[saleAmount]",
    saleAmountWords: meta?.financial?.saleAmountWords || "[saleAmountWords]",
    earnestMoney: meta?.financial?.earnestMoney || "[earnestMoney]",
    balanceAmount: meta?.financial?.balanceAmount || "[balanceAmount]",
    paymentMode: meta?.financial?.paymentMode || "[paymentMode]",
    reraNumber: meta?.reraNumber || "[reraNumber]",
    stampDutyBearer: meta?.stampDutyBearer || "[stampDutyBearer]",
    witness1Name: meta?.witness1Name || "[witness1Name]",
    witness1Address: meta?.witness1Address || "[witness1Address]",
    witness2Name: meta?.witness2Name || "[witness2Name]",
    witness2Address: meta?.witness2Address || "[witness2Address]",
  };

  const renderedTemplate = docData.template?.content
    ? docData.template.content.replace(/\{\{(.*?)\}\}/g, (_: string, key: string) => {
        const value = templateData[key as keyof typeof templateData];
        return value !== undefined ? String(value) : `[${key}]`;
      })
    : null;

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/documents">
            <Button variant="outline" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                Document #{document.id}
              </h1>
              <StatusBadge status={document.status} />
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Created on {formatDate(document.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => checkStatusMutation.mutate(id)}
            disabled={checkStatusMutation.isPending}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${
                checkStatusMutation.isPending ? "animate-spin" : ""
              }`}
            />
            Check Sign Status
          </Button>

          {document.status === "pending" && (
            <Button
              className="btn-primary"
              onClick={() => approveMutation.mutate(id)}
              disabled={approveMutation.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              {approveMutation.isPending
                ? "Processing..."
                : "Approve & Send for Signing"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ================= MAIN ================= */}
        <div className="lg:col-span-2 space-y-6">
          {/* ================= TRANSACTION DETAILS ================= */}
          <Card className="border-slate-100">
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid sm:grid-cols-2 gap-6">
  <div>
    <dt className="text-sm text-slate-500">
      Property Address
    </dt>
    <dd className="font-semibold">
      {meta?.property?.address ?? "—"}
    </dd>
  </div>

  <div>
    <dt className="text-sm text-slate-500">
      Sale Price
    </dt>
    <dd className="font-semibold">
      {meta?.financial?.saleAmount ?? "—"}
    </dd>
  </div>

  <div className="sm:col-span-2 border-t pt-4">
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="flex gap-3">
        <User className="w-5 h-5 text-blue-600" />
        <div>
          <p className="text-xs text-slate-500">Buyer</p>
          <p className="font-medium">
            {meta?.buyer?.name ?? "—"}
          </p>
          <p className="text-xs text-slate-400">
            {meta?.buyer?.email ?? "—"}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <UserCheck className="w-5 h-5 text-purple-600" />
        <div>
          <p className="text-xs text-slate-500">Seller</p>
          <p className="font-medium">
            {meta?.seller?.name ?? "—"}
          </p>
          <p className="text-xs text-slate-400">
            {meta?.seller?.email ?? "—"}
          </p>
        </div>
      </div>
    </div>
  </div>
</dl>
            </CardContent>
          </Card>

          {/* ================= DOCUMENT PREVIEW ================= */}
          <Card className="border-slate-100">
            <CardHeader>
              <CardTitle>Document Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 min-h-[300px] font-serif text-slate-700 leading-relaxed overflow-auto max-h-[600px]">
                {renderedTemplate ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: renderedTemplate,
                    }}
                    className="prose prose-slate max-w-none"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 italic py-12">
                    <FileText className="w-12 h-12 mb-2 opacity-20" />
                    <p>No template content available for this document.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ================= AUDIT LOG ================= */}
        <div>
          <Card className="border-slate-100 h-full">
            <CardHeader>
              <CardTitle>History & Audit Log</CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {auditLogs?.length ? (
                    auditLogs.map((log, idx) => (
                      <div key={idx}>
                        <p className="text-sm font-medium">
                          {log.action}
                        </p>
                        <p className="text-xs text-slate-500">
                          by {log.actor}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          {formatDate(log.timestamp, "MMM d, HH:mm")}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 italic">
                      No activity recorded yet.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ================= SKELETON ================= */
function DetailsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-full" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    </div>
  );
}