
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { log } from "./index";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const N8N_BASE_URL = process.env.N8N_BASE_URL || "https://n8n.fortivautomation.cloud/webhook-test/prop-flow";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === AUTHENTICATION ===

  app.post(api.auth.signup.path, async (req, res) => {
    try {
      const input = api.auth.signup.input.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(input.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      const user = await storage.createUser({ ...input, password: hashedPassword });
      
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "24h" });
      
      // Exclude password from response
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword, token });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.signin.path, async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "24h" });
      
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json({ user: userWithoutPassword, token });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Middleware for verifying JWT (optional for now, but good practice)
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // === TEMPLATES ===

  app.get(api.templates.list.path, authenticateToken, async (req, res) => {
    const templates = await storage.getTemplates();
    res.json(templates);
  });

  app.post(api.templates.create.path, authenticateToken, async (req, res) => {
    try {
      const input = api.templates.create.input.parse(req.body);
      const template = await storage.createTemplate(input);

      // Trigger n8n webhook
      log(`Triggering n8n create-template: ${N8N_BASE_URL}/create-template`);
      try {
        const n8nRes = await fetch(`${N8N_BASE_URL}/create-template`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(template)
        });
        log(`n8n response: ${n8nRes.status} ${n8nRes.statusText}`);
        if (!n8nRes.ok) {
          const errorText = await n8nRes.text();
          log(`n8n error body: ${errorText}`);
        }
      } catch (e) {
        log(`Failed to trigger n8n create-template webhook: ${e instanceof Error ? e.message : String(e)}`, "error");
      }

      res.status(201).json(template);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === DOCUMENTS ===

  app.get(api.documents.list.path, authenticateToken, async (req, res) => {
    const docs = await storage.getDocuments();
    res.json(docs);
  });

  app.get(api.documents.get.path, authenticateToken, async (req, res) => {
    const doc = await storage.getDocument(Number(req.params.id));
    if (!doc) return res.status(404).json({ message: "Document not found" });
    res.json(doc);
  });

  app.post(api.documents.create.path, authenticateToken, async (req, res) => {
    try {
      const input = api.documents.create.input.parse(req.body);
      const doc = await storage.createDocument(input);

      // Log creation
      await storage.createAuditLog({
        documentId: doc.id,
        action: "created",
        actor: (req as any).user?.email || "Unknown User",
        metadata: { ip: req.ip }
      });

      // Trigger n8n webhook: "Backend forwards data to POST {N8N_BASE_URL}/document-generate"
      log(`Triggering n8n document-generate: ${N8N_BASE_URL}/document-generate`);
      try {
        const n8nRes = await fetch(`${N8N_BASE_URL}/document-generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: doc.id,
            ...doc.metadata as object,
            templateId: doc.templateId
          })
        });
        log(`n8n response: ${n8nRes.status} ${n8nRes.statusText}`);
        if (!n8nRes.ok) {
          const errorText = await n8nRes.text();
          log(`n8n error body: ${errorText}`);
        }
      } catch (e) {
        log(`Failed to trigger n8n document-generate webhook: ${e instanceof Error ? e.message : String(e)}`, "error");
      }

      res.status(201).json(doc);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.documents.approveSigning.path, authenticateToken, async (req, res) => {
    const id = Number(req.params.id);
    const doc = await storage.getDocument(id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    // Update status
    await storage.updateDocumentStatus(id, "approved");

    // Log audit
    await storage.createAuditLog({
      documentId: id,
      action: "approved",
      actor: (req as any).user?.email || "Unknown User",
      metadata: { ip: req.ip }
    });

    // Call n8n
    log(`Triggering n8n approves-signing: ${N8N_BASE_URL}/approves-signing`);
    try {
      const n8nRes = await fetch(`${N8N_BASE_URL}/approves-signing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: id })
      });
      log(`n8n response: ${n8nRes.status} ${n8nRes.statusText}`);
      if (!n8nRes.ok) {
        const errorText = await n8nRes.text();
        log(`n8n error body: ${errorText}`);
      }
    } catch (e) {
      log(`Failed to trigger n8n approves-signing webhook: ${e instanceof Error ? e.message : String(e)}`, "error");
    }

    const updatedDoc = await storage.getDocument(id);
    res.json(updatedDoc);
  });

    app.get(api.documents.checkSignStatus.path, authenticateToken, async (req, res) => {
    const id = parseInt(req.params.id);
    const doc = await storage.getDocument(id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    log(`Checking n8n sign-status: ${N8N_BASE_URL}/sign-status?documentId=${id}`);
    try {
      const n8nRes = await fetch(`${N8N_BASE_URL}/sign-status?documentId=${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      log(`n8n response: ${n8nRes.status} ${n8nRes.statusText}`);
      if (n8nRes.ok) {
        const data = await n8nRes.json();
        // data might contain { status: 'signed', ... }
        if (data.status && data.status !== doc.status) {
          await storage.updateDocumentStatus(id, data.status);
          log(`Updated document ${id} status to ${data.status} from n8n`);
        }
      }
    } catch (e) {
      log(`Failed to check n8n sign-status: ${e instanceof Error ? e.message : String(e)}`, "error");
    }

    const updatedDoc = await storage.getDocument(id);
    res.json(updatedDoc);
  });


  // === TRANSACTIONS ===
  app.get(api.transactions.list.path, authenticateToken, async (req, res) => {
    const transactions = await storage.getTransactions();
    res.json(transactions);
  });

  // === AUDIT LOGS ===
  app.get(api.auditLogs.list.path, authenticateToken, async (req, res) => {
    const logs = await storage.getAuditLogs(Number(req.params.documentId));
    res.json(logs);
  });

  // === WEBHOOKS (N8N Callbacks) ===

  app.post(api.webhooks.documentStatus.path, async (req, res) => {
    try {
      const { documentId, status, n8nId } = req.body;
      
      if (documentId && status) {
        await storage.updateDocumentStatus(documentId, status);
        if (n8nId) {
          await storage.updateDocumentN8nId(documentId, n8nId);
        }
        
        await storage.createAuditLog({
          documentId,
          action: `status_change_to_${status}`,
          actor: "System (n8n)",
          metadata: { n8nId }
        });
      }
      
      res.json({ success: true });
    } catch (e) {
      console.error("Webhook error", e);
      res.status(500).json({ success: false });
    }
  });

  app.post(api.webhooks.auditLog.path, async (req, res) => {
    try {
      const { documentId, action, actor, metadata } = req.body;
      await storage.createAuditLog({
        documentId,
        action,
        actor,
        metadata
      });
      res.json({ success: true });
    } catch (e) {
      console.error("Webhook error", e);
      res.status(500).json({ success: false });
    }
  });

  // Initialize seed data
  await seedDatabase();

  return httpServer;
}

// SEED FUNCTION
export async function seedDatabase() {
  const existingUsers = await storage.getUserByEmail("admin@example.com");
  if (!existingUsers) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await storage.createUser({
      email: "admin@example.com",
      password: hashedPassword,
      name: "Admin User"
    });
    console.log("Seeded admin user");

    // Seed a template
    const template = await storage.createTemplate({
      name: "Standard Sales Agreement",
      documentType: "Sales Contract",
      content: "<h1>Sales Agreement</h1><p>This agreement is between {{buyer}} and {{seller}}...</p>"
    });
    console.log("Seeded template");

    // Seed a document
    await storage.createDocument({
      templateId: template.id,
      metadata: { buyer: "John Doe", seller: "Jane Smith", price: 500000 }
    });
    console.log("Seeded document");
  }
}
