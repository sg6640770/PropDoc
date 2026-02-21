
import { z } from 'zod';
import { insertUserSchema, insertTemplateSchema, insertDocumentSchema, templates, documents, auditLogs, transactions, users } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  auth: {
    signup: {
      method: 'POST' as const,
      path: '/api/auth/signup' as const,
      input: insertUserSchema,
      responses: {
        201: z.object({ user: z.custom<typeof users.$inferSelect>(), token: z.string() }),
        400: errorSchemas.validation,
      },
    },
    signin: {
      method: 'POST' as const,
      path: '/api/auth/signin' as const,
      input: z.object({ email: z.string(), password: z.string() }),
      responses: {
        200: z.object({ user: z.custom<typeof users.$inferSelect>(), token: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
  },
  templates: {
    list: {
      method: 'GET' as const,
      path: '/api/templates' as const,
      responses: {
        200: z.array(z.custom<typeof templates.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/templates' as const,
      input: insertTemplateSchema,
      responses: {
        201: z.custom<typeof templates.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  documents: {
    list: {
      method: 'GET' as const,
      path: '/api/documents' as const,
      responses: {
        200: z.array(z.custom<typeof documents.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/documents/:id' as const,
      responses: {
        200: z.custom<typeof documents.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/documents' as const,
      input: insertDocumentSchema,
      responses: {
        201: z.custom<typeof documents.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    approveSigning: {
      method: 'POST' as const,
      path: '/api/documents/:id/approve-signing' as const,
      responses: {
        200: z.custom<typeof documents.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
     checkSignStatus: {
      method: 'GET' as const,
      path: '/api/documents/:id/sign-status' as const,
      responses: {
        200: z.custom<typeof documents.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  transactions: {
    list: {
      method: 'GET' as const,
      path: '/api/transactions' as const,
      responses: {
        200: z.array(z.custom<typeof transactions.$inferSelect>()),
      },
    },
  },
  auditLogs: {
    list: {
      method: 'GET' as const,
      path: '/api/audit-logs/:documentId' as const,
      responses: {
        200: z.array(z.custom<typeof auditLogs.$inferSelect>()),
      },
    },
  },
  // N8N Webhooks
  webhooks: {
    documentStatus: {
      method: 'POST' as const,
      path: '/api/webhook/document-status' as const,
      input: z.object({
        documentId: z.number(),
        status: z.enum(["pending", "approved", "signed", "declined"]),
        n8nId: z.string().optional()
      }),
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
    auditLog: {
      method: 'POST' as const,
      path: '/api/webhook/audit-log' as const,
      input: z.object({
        documentId: z.number(),
        action: z.string(),
        actor: z.string(),
        metadata: z.any().optional()
      }),
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type CreateTemplateRequest = z.infer<typeof api.templates.create.input>;
export type CreateDocumentRequest = z.infer<typeof api.documents.create.input>;
