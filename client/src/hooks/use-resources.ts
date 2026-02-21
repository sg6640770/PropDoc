import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateTemplateRequest, type CreateDocumentRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

// ==================== TEMPLATES ====================

export function useTemplates() {
  return useQuery({
    queryKey: [api.templates.list.path],
    queryFn: async () => {
      const token = localStorage.getItem("propdoc_token");
      const res = await fetch(api.templates.list.path, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch templates");
      return api.templates.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: CreateTemplateRequest) => {
      const token = localStorage.getItem("propdoc_token");
      const res = await fetch(api.templates.create.path, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create template");
      return api.templates.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.templates.list.path] });
      toast({ title: "Template Created", description: "Ready for use in documents." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create template", variant: "destructive" });
    }
  });
}

// ==================== DOCUMENTS ====================

export function useDocuments() {
  return useQuery({
    queryKey: [api.documents.list.path],
    queryFn: async () => {
      const token = localStorage.getItem("propdoc_token");
      const res = await fetch(api.documents.list.path, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch documents");
      return api.documents.list.responses[200].parse(await res.json());
    },
  });
}

export function useDocument(id: number) {
  return useQuery({
    queryKey: [api.documents.get.path, id],
    queryFn: async () => {
      const token = localStorage.getItem("propdoc_token");
      const url = buildUrl(api.documents.get.path, { id });
      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch document");
      return api.documents.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateDocumentRequest) => {
      const token = localStorage.getItem("propdoc_token");
      const res = await fetch(api.documents.create.path, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create document");
      return api.documents.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.documents.list.path] });
      toast({ title: "Document Created", description: "Draft saved successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create document", variant: "destructive" });
    }
  });
}

export function useApproveSigning() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("propdoc_token");
      const url = buildUrl(api.documents.approveSigning.path, { id });
      const res = await fetch(url, { 
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to approve document");
      return api.documents.approveSigning.responses[200].parse(await res.json());
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [api.documents.get.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.documents.list.path] });
      toast({ title: "Sent for Signing", description: "Document status updated to approved." });
    },
  });
}

export function useCheckSignStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("propdoc_token");
      const url = buildUrl(api.documents.checkSignStatus.path, { id });
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to check status");
      return api.documents.checkSignStatus.responses[200].parse(await res.json());
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [api.documents.get.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.documents.list.path] });
      toast({ title: "Status Updated", description: "Document signature status has been refreshed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to refresh status", variant: "destructive" });
    }
  });
}

// ==================== TRANSACTIONS ====================

export function useTransactions() {
  return useQuery({
    queryKey: [api.transactions.list.path],
    queryFn: async () => {
      const token = localStorage.getItem("propdoc_token");
      const res = await fetch(api.transactions.list.path, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return api.transactions.list.responses[200].parse(await res.json());
    },
  });
}

// ==================== AUDIT LOGS ====================

export function useAuditLogs(documentId: number) {
  return useQuery({
    queryKey: [api.auditLogs.list.path, documentId],
    queryFn: async () => {
      const token = localStorage.getItem("propdoc_token");
      const url = buildUrl(api.auditLogs.list.path, { documentId });
      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch logs");
      return api.auditLogs.list.responses[200].parse(await res.json());
    },
    enabled: !!documentId,
  });
}
