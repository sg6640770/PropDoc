
import { db } from "./db";
import {
  users, templates, documents, transactions, auditLogs,
  type User, type InsertUser,
  type Template, type InsertTemplate,
  type Document, type InsertDocument,
  type Transaction, type InsertTransaction,
  type AuditLog, type InsertAuditLog
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;

  // Templates
  getTemplates(): Promise<Template[]>;
  getTemplate(id: number): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;

  // Documents
  getDocuments(): Promise<(Document & { template: Template | null })[]>;
  getDocument(id: number): Promise<(Document & { template: Template | null }) | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocumentStatus(id: number, status: "pending" | "approved" | "signed" | "declined"): Promise<Document | undefined>;
  updateDocumentN8nId(id: number, n8nId: string): Promise<Document | undefined>;

  // Transactions
  getTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;

  // Audit Logs
  getAuditLogs(documentId: number): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: any): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Templates
  async getTemplates(): Promise<Template[]> {
    return await db.select().from(templates).orderBy(desc(templates.createdAt));
  }

  async getTemplate(id: number): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template;
  }

  async createTemplate(template: InsertTemplate): Promise<Template> {
    const [newTemplate] = await db.insert(templates).values(template).returning();
    return newTemplate;
  }

  // Documents
  async getDocuments(): Promise<(Document & { template: Template | null })[]> {
    const result = await db.query.documents.findMany({
      with: {
        template: true
      },
      orderBy: desc(documents.createdAt)
    });
    return result;
  }

  async getDocument(id: number): Promise<(Document & { template: Template | null }) | undefined> {
    const result = await db.query.documents.findFirst({
      where: eq(documents.id, id),
      with: {
        template: true
      }
    });
    return result;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values({
      ...document,
      viewerEmails: document.viewerEmails || []
    }).returning();
    return newDocument;
  }

  async updateDocumentStatus(id: number, status: "pending" | "approved" | "signed" | "declined"): Promise<Document | undefined> {
    const [updated] = await db.update(documents)
      .set({ status, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return updated;
  }

  async updateDocumentN8nId(id: number, n8nId: string): Promise<Document | undefined> {
    const [updated] = await db.update(documents)
      .set({ n8nId, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return updated;
  }

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.timestamp));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  // Audit Logs
  async getAuditLogs(documentId: number): Promise<AuditLog[]> {
    return await db.select().from(auditLogs)
      .where(eq(auditLogs.documentId, documentId))
      .orderBy(desc(auditLogs.timestamp));
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  }
}

export const storage = new DatabaseStorage();
