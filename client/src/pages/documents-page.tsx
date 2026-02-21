import { useDocuments, useTemplates, useCreateDocument } from "@/hooks/use-resources";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, FileText, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Helper schema for the multi-step form
const multiStepFormSchema = z.object({
  templateId: z.string().min(1, "Template is required"),
  agreementDay: z.string().min(1),
  agreementMonth: z.string().min(1),
  agreementYear: z.string().min(1),
  agreementPlace: z.string().min(1),
  stateName: z.string().min(1),
  jurisdictionCity: z.string().min(1),
  arbitrationCity: z.string().min(1),

  seller: z.object({
    name: z.string().min(1, "Seller name is required"),
    parentName: z.string().min(1),
    age: z.string().min(1),
    occupation: z.string().min(1),
    address: z.string().min(1),
    pan: z.string().min(1),
    aadhaar: z.string().min(1)
  }),

  buyer: z.object({
    name: z.string().min(1, "Buyer name is required"),
    parentName: z.string().min(1),
    age: z.string().min(1),
    occupation: z.string().min(1),
    address: z.string().min(1),
    pan: z.string().min(1),
    aadhaar: z.string().min(1)
  }),

  property: z.object({
    type: z.string().min(1),
    address: z.string().min(1),
    surveyNo: z.string().min(1),
    municipalNo: z.string().min(1),
    area: z.string().min(1),
    builtUpArea: z.string().min(1),
    carpetArea: z.string().min(1),
    boundaryNorth: z.string().min(1),
    boundarySouth: z.string().min(1),
    boundaryEast: z.string().min(1),
    boundaryWest: z.string().min(1)
  }),

  financial: z.object({
    saleAmount: z.string().min(1),
    saleAmountWords: z.string().min(1),
    earnestMoney: z.string().min(1),
    balanceAmount: z.string().min(1),
    paymentMode: z.string().min(1)
  }),

  reraNumber: z.string().optional(),
  stampDutyBearer: z.string().min(1),
  witness1Name: z.string().min(1),
  witness1Address: z.string().min(1),
  witness2Name: z.string().min(1),
  witness2Address: z.string().min(1)
});

type MultiStepFormData = z.infer<typeof multiStepFormSchema>;

export default function DocumentsPage() {
  const { data: documents, isLoading } = useDocuments();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredDocs = documents?.filter(d => 
    d.metadata && 
    JSON.stringify(d.metadata).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-900">Documents</h1>
          <p className="text-slate-500 mt-1">Manage and track your real estate contracts.</p>
        </div>
        <CreateDocumentDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      </div>

      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search documents..." 
              className="pl-9 bg-slate-50 border-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Parties</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Property</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">Created</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={6} className="p-8 text-center">Loading documents...</td></tr>
                ) : filteredDocs?.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">No documents found.</td></tr>
                ) : (
                  filteredDocs?.map((doc) => {
                    const meta = doc.metadata as any;
                    const buyerName = meta?.buyer?.name || meta?.buyerName;
                    const sellerName = meta?.seller?.name || meta?.sellerName;
                    const propertyAddress = meta?.property?.address || meta?.propertyAddress;
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">#{doc.id}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {buyerName} & {sellerName}
                        </td>
                        <td className="px-4 py-3 text-slate-600 truncate max-w-[200px]">
                          {propertyAddress}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={doc.status} />
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500">
                          {format(new Date(doc.createdAt || ''), "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/documents/${doc.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary hover:bg-primary/10">
                              View Details
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function CreateDocumentDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { data: templates } = useTemplates();
  const createDoc = useCreateDocument();
  const [step, setStep] = useState(1);
  
  const form = useForm<MultiStepFormData>({
    resolver: zodResolver(multiStepFormSchema),
    defaultValues: {
      templateId: "",
      agreementDay: new Date().getDate().toString(),
      agreementMonth: format(new Date(), "MMMM"),
      agreementYear: new Date().getFullYear().toString(),
      seller: { name: "", parentName: "", age: "", occupation: "", address: "", pan: "", aadhaar: "" },
      buyer: { name: "", parentName: "", age: "", occupation: "", address: "", pan: "", aadhaar: "" },
      property: { type: "Residential", address: "", surveyNo: "", municipalNo: "", area: "", builtUpArea: "", carpetArea: "", boundaryNorth: "", boundarySouth: "", boundaryEast: "", boundaryWest: "" },
      financial: { saleAmount: "", saleAmountWords: "", earnestMoney: "", balanceAmount: "", paymentMode: "Bank Transfer" },
      stampDutyBearer: "Buyer",
      witness1Name: "",
      witness1Address: "",
      witness2Name: "",
      witness2Address: ""
    }
  });

  const saleAmount = form.watch("financial.saleAmount");
  const earnestMoney = form.watch("financial.earnestMoney");

  useMemo(() => {
    const sale = parseFloat(saleAmount) || 0;
    const earnest = parseFloat(earnestMoney) || 0;
    form.setValue("financial.balanceAmount", (sale - earnest).toString());
  }, [saleAmount, earnestMoney, form]);

  const onSubmit = (data: MultiStepFormData) => {
    createDoc.mutate({
      templateId: parseInt(data.templateId),
      metadata: data
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setStep(1);
        form.reset();
      }
    });
  };

  const nextStep = async () => {
    const fieldsByStep: Record<number, any> = {
      1: ["seller", "buyer", "templateId"],
      2: ["property"],
      3: ["financial"],
      4: ["agreementDay", "agreementMonth", "agreementYear", "agreementPlace", "stateName", "jurisdictionCity", "arbitrationCity", "stampDutyBearer"],
      5: ["witness1Name", "witness1Address", "witness2Name", "witness2Address"]
    };

    const isValid = await form.trigger(fieldsByStep[step]);
    if (isValid) setStep(s => s + 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Create Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Agreement to Sell</DialogTitle>
          <DialogDescription>
            Step {step} of 5: {
              step === 1 ? "Seller & Buyer Details" :
              step === 2 ? "Property Details" :
              step === 3 ? "Financial Details" :
              step === 4 ? "Legal Details" : "Witness & Confirmation"
            }
          </DialogDescription>
          <div className="flex gap-2 mt-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <div 
                key={s} 
                className={`h-2 flex-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-slate-100"}`}
              />
            ))}
          </div>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Template</Label>
                <Select onValueChange={(val) => form.setValue("templateId", val)} defaultValue={form.getValues("templateId")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map(t => (
                      <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Seller Details</h3>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input {...form.register("seller.name")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Father's / Mother's Name</Label>
                    <Input {...form.register("seller.parentName")} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Age</Label>
                      <Input {...form.register("seller.age")} type="number" />
                    </div>
                    <div className="space-y-2">
                      <Label>Occupation</Label>
                      <Input {...form.register("seller.occupation")} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input {...form.register("seller.address")} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>PAN</Label>
                      <Input {...form.register("seller.pan")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Aadhaar</Label>
                      <Input {...form.register("seller.aadhaar")} />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Buyer Details</h3>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input {...form.register("buyer.name")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Father's / Mother's Name</Label>
                    <Input {...form.register("buyer.parentName")} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Age</Label>
                      <Input {...form.register("buyer.age")} type="number" />
                    </div>
                    <div className="space-y-2">
                      <Label>Occupation</Label>
                      <Input {...form.register("buyer.occupation")} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input {...form.register("buyer.address")} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>PAN</Label>
                      <Input {...form.register("buyer.pan")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Aadhaar</Label>
                      <Input {...form.register("buyer.aadhaar")} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Property Type</Label>
                  <Select onValueChange={(val) => form.setValue("property.type", val)} defaultValue={form.getValues("property.type")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Residential">Residential</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Agricultural">Agricultural</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Survey / Khasra No.</Label>
                  <Input {...form.register("property.surveyNo")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Full Address</Label>
                <Input {...form.register("property.address")} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label>Municipal No.</Label>
                  <Input {...form.register("property.municipalNo")} />
                </div>
                <div className="space-y-2">
                  <Label>Total Area</Label>
                  <Input {...form.register("property.area")} />
                </div>
                <div className="space-y-2">
                  <Label>Built-up Area</Label>
                  <Input {...form.register("property.builtUpArea")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-4">
                <div className="space-y-2">
                  <Label>North Boundary</Label>
                  <Input {...form.register("property.boundaryNorth")} />
                </div>
                <div className="space-y-2">
                  <Label>South Boundary</Label>
                  <Input {...form.register("property.boundarySouth")} />
                </div>
                <div className="space-y-2">
                  <Label>East Boundary</Label>
                  <Input {...form.register("property.boundaryEast")} />
                </div>
                <div className="space-y-2">
                  <Label>West Boundary</Label>
                  <Input {...form.register("property.boundaryWest")} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total Sale Amount (₹)</Label>
                  <Input {...form.register("financial.saleAmount")} type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Earnest Money (₹)</Label>
                  <Input {...form.register("financial.earnestMoney")} type="number" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Balance Amount (₹)</Label>
                <Input {...form.register("financial.balanceAmount")} disabled />
              </div>
              <div className="space-y-2">
                <Label>Sale Amount in Words</Label>
                <Input {...form.register("financial.saleAmountWords")} placeholder="Rupees Five Lakhs Only" />
              </div>
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select onValueChange={(val) => form.setValue("financial.paymentMode", val)} defaultValue={form.getValues("financial.paymentMode")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank Transfer">Bank Transfer (NEFT/RTGS)</SelectItem>
                    <SelectItem value="Cheque">Cheque / Demand Draft</SelectItem>
                    <SelectItem value="Cash">Cash (Legal limits apply)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2"><Label>Day</Label><Input {...form.register("agreementDay")} /></div>
                <div className="space-y-2"><Label>Month</Label><Input {...form.register("agreementMonth")} /></div>
                <div className="space-y-2"><Label>Year</Label><Input {...form.register("agreementYear")} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Agreement Place</Label><Input {...form.register("agreementPlace")} /></div>
                <div className="space-y-2"><Label>State Name</Label><Input {...form.register("stateName")} /></div>
                <div className="space-y-2"><Label>Jurisdiction City</Label><Input {...form.register("jurisdictionCity")} /></div>
                <div className="space-y-2"><Label>Arbitration City</Label><Input {...form.register("arbitrationCity")} /></div>
                <div className="space-y-2"><Label>RERA Number</Label><Input {...form.register("reraNumber")} placeholder="Optional" /></div>
                <div className="space-y-2">
                  <Label>Stamp Duty Bearer</Label>
                  <Select onValueChange={(val) => form.setValue("stampDutyBearer", val)} defaultValue={form.getValues("stampDutyBearer")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Buyer">Buyer</SelectItem>
                      <SelectItem value="Seller">Seller</SelectItem>
                      <SelectItem value="Both">Both (Equal Share)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Witness 1</h3>
                  <div className="space-y-2"><Label>Name</Label><Input {...form.register("witness1Name")} /></div>
                  <div className="space-y-2"><Label>Address</Label><Input {...form.register("witness1Address")} /></div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Witness 2</h3>
                  <div className="space-y-2"><Label>Name</Label><Input {...form.register("witness2Name")} /></div>
                  <div className="space-y-2"><Label>Address</Label><Input {...form.register("witness2Address")} /></div>
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-6">
                <h3 className="font-bold text-slate-900 mb-2">Final Confirmation</h3>
                <p className="text-sm text-slate-600">Please review all entered details. Once submitted, the agreement will be generated for signing.</p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setStep(s => s - 1)} 
              disabled={step === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            
            {step < 5 ? (
              <Button type="button" onClick={nextStep}>
                Next Step <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" className="btn-primary" disabled={createDoc.isPending}>
                {createDoc.isPending ? "Generating..." : <><Check className="w-4 h-4 mr-2" /> Submit & Generate</>}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
