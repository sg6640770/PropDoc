import { useTemplates, useCreateTemplate } from "@/hooks/use-resources";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Code, Eye } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTemplateSchema } from "@shared/schema";
import { z } from "zod";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function TemplatesPage() {
  const { data: templates, isLoading } = useTemplates();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-900">Templates</h1>
          <p className="text-slate-500 mt-1">Manage document templates for automation.</p>
        </div>
        <CreateTemplateDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />
          ))
        ) : (
          templates?.map((template) => (
            <Card key={template.id} className="group hover:shadow-lg transition-all border-slate-100">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FileText className="w-6 h-6" />
                </div>
                <CardTitle className="flex items-center justify-between">
                  {template.name}
                </CardTitle>
                <CardDescription>Type: {template.documentType}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded border font-mono truncate">
                  ID: {template.id}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}

function CreateTemplateDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const createTemplate = useCreateTemplate();
  
  const form = useForm<z.infer<typeof insertTemplateSchema>>({
    resolver: zodResolver(insertTemplateSchema),
    defaultValues: {
      name: "",
      documentType: "contract",
      content: "<h1>New Document</h1><p>Start typing...</p>"
    }
  });

  const onSubmit = (data: z.infer<typeof insertTemplateSchema>) => {
    createTemplate.mutate(data, {
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
          New Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
  <DialogHeader>
    <DialogTitle>Create Template</DialogTitle>
    <DialogDescription>
      Define the structure for new automated documents.
    </DialogDescription>
  </DialogHeader>

  <form
    onSubmit={form.handleSubmit(onSubmit)}
    className="flex flex-col flex-1 overflow-hidden"
  >
    {/* Scrollable Content */}
    <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-2">
      
      <div className="space-y-2">
        <Label>Template Name</Label>
        <Input
          {...form.register("name")}
          placeholder="e.g. Standard Lease Agreement"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-500">Required</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Document Type</Label>
        <Input
          {...form.register("documentType")}
          placeholder="e.g. contract, invoice, letter"
        />
        {form.formState.errors.documentType && (
          <p className="text-sm text-red-500">Required</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="flex items-center justify-between">
          <span>Template Content</span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Code className="w-3 h-3" /> HTML Supported
          </span>
        </Label>

        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Code className="w-4 h-4" /> Edit HTML
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" /> Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="mt-2">
            <Textarea
              {...form.register("content")}
              className="font-mono text-xs min-h-[200px]"
              placeholder="<html>...</html>"
            />
          </TabsContent>

          <TabsContent value="preview" className="mt-2">
            <div className="border rounded-md p-4 min-h-[200px] bg-white overflow-auto max-h-[400px]">
              <div
                dangerouslySetInnerHTML={{ __html: form.watch("content") }}
                className="prose prose-sm max-w-none"
              />
            </div>
          </TabsContent>
        </Tabs>

        {form.formState.errors.content && (
          <p className="text-sm text-red-500">Required</p>
        )}
      </div>
    </div>

    {/* Fixed Footer */}
    <div className="flex justify-end pt-4 border-t bg-white">
      <Button type="submit" disabled={createTemplate.isPending}>
        {createTemplate.isPending ? "Creating..." : "Save Template"}
      </Button>
    </div>
  </form>
</DialogContent>
  </Dialog>
  );
}
