import { useDocuments, useTemplates, useCreateDocument } from "@/hooks/use-resources";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";
import { useState } from "react";
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
import { insertDocumentSchema } from "@shared/schema";
import { z } from "zod";

// Helper schema for the form since metadata is JSONB in DB
const createDocFormSchema = z.object({
  templateId: z.string(), // Form returns string, need to coerce
  buyerName: z.string().min(1, "Buyer name is required"),
  buyerEmail: z.string().email("Invalid email").min(1, "Buyer email is required"),
  sellerName: z.string().min(1, "Seller name is required"),
  sellerEmail: z.string().email("Invalid email").min(1, "Seller email is required"),
  propertyAddress: z.string().min(1, "Address is required"),
  price: z.string().min(1, "Price is required")
});

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
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">#{doc.id}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {meta?.buyerName} & {meta?.sellerName}
                        </td>
                        <td className="px-4 py-3 text-slate-600 truncate max-w-[200px]">
                          {meta?.propertyAddress}
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
  
  const form = useForm<z.infer<typeof createDocFormSchema>>({
    resolver: zodResolver(createDocFormSchema),
  });

  const onSubmit = (data: z.infer<typeof createDocFormSchema>) => {
    createDoc.mutate({
      templateId: parseInt(data.templateId),
      metadata: {
        buyerName: data.buyerName,
        buyerEmail: data.buyerEmail,
        sellerName: data.sellerName,
        sellerEmail: data.sellerEmail,
        propertyAddress: data.propertyAddress,
        price: data.price
      }
    }, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Create Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate New Document</DialogTitle>
          <DialogDescription>
            Select a template and fill in the transaction details.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Template</Label>
            <Select onValueChange={(val) => form.setValue("templateId", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates?.map(t => (
                  <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.templateId && <p className="text-sm text-red-500">Required</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Buyer Name</Label>
              <Input {...form.register("buyerName")} placeholder="Jane Doe" />
              {form.formState.errors.buyerName && <p className="text-sm text-red-500">Required</p>}
            </div>
            <div className="space-y-2">
            <Label>Buyer Email</Label>
              <Input {...form.register("buyerEmail")} placeholder="jane@example.com" />
              {form.formState.errors.buyerEmail && <p className="text-sm text-red-500">{form.formState.errors.buyerEmail.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">

              <Label>Seller Name</Label>
              <Input {...form.register("sellerName")} placeholder="John Smith" />
              {form.formState.errors.sellerName && <p className="text-sm text-red-500">Required</p>}
             </div>
            <div className="space-y-2">
              <Label>Seller Email</Label>
              <Input {...form.register("sellerEmail")} placeholder="john@example.com" />
              {form.formState.errors.sellerEmail && <p className="text-sm text-red-500">{form.formState.errors.sellerEmail.message}</p>}
            </div>

          </div>

          <div className="space-y-2">
            <Label>Property Address</Label>
            <Input {...form.register("propertyAddress")} placeholder="123 Main St, City, ST" />
            {form.formState.errors.propertyAddress && <p className="text-sm text-red-500">Required</p>}
          </div>

          <div className="space-y-2">
            <Label>Price</Label>
            <Input {...form.register("price")} placeholder="$500,000" />
            {form.formState.errors.price && <p className="text-sm text-red-500">Required</p>}
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={createDoc.isPending}>
              {createDoc.isPending ? "Creating..." : "Generate Document"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}