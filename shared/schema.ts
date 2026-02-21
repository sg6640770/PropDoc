
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === ENUMS ===
export const documentStatusEnum = pgEnum("document_status", ["pending", "approved", "signed", "declined"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["success", "failed", "pending"]);

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  documentType: text("document_type").notNull(),
  content: text("content").notNull(), // HTML or Rich Text
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => templates.id).notNull(),
  status: documentStatusEnum("status").default("pending").notNull(),
  metadata: jsonb("metadata").notNull(), // Buyer, Seller, Property details
  n8nId: text("n8n_id"), // ID from n8n if available
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id),
  status: transactionStatusEnum("status").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  action: text("action").notNull(), // "created", "approved", "viewed", "signed"
  actor: text("actor").notNull(), // User name or "System"
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata"), // IP, User Agent, etc.
});

// === RELATIONS ===

export const documentsRelations = relations(documents, ({ one, many }) => ({
  template: one(templates, {
    fields: [documents.templateId],
    references: [templates.id],
  }),
  auditLogs: many(auditLogs),
  transactions: many(transactions),
}));

export const templatesRelations = relations(templates, ({ many }) => ({
  documents: many(documents),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  document: one(documents, {
    fields: [auditLogs.documentId],
    references: [documents.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  document: one(documents, {
    fields: [transactions.documentId],
    references: [documents.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertTemplateSchema = createInsertSchema(templates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true, updatedAt: true, status: true, n8nId: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, timestamp: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, timestamp: true });

// === EXPLICIT API CONTRACT TYPES ===

// Base types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// Request types
export type CreateUserRequest = InsertUser;
export type LoginRequest = Pick<InsertUser, "email" | "password">;

export type CreateTemplateRequest = InsertTemplate;
export type UpdateTemplateRequest = Partial<InsertTemplate>;

export type CreateDocumentRequest = InsertDocument;
export type UpdateDocumentStatusRequest = { status: "pending" | "approved" | "signed" | "declined" };

// Response types
export type AuthResponse = { user: User; token: string };
export type TemplateResponse = Template;
export type DocumentResponse = Document & { template?: Template }; // Include template data
export type AuditLogResponse = AuditLog;
