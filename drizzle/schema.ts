import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  datetime,
  longtext,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with financial system requirements.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Transaction Categories - Categorização de lançamentos
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  color: varchar("color", { length: 7 }), // Hex color
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Bank Accounts - Contas bancárias do usuário
 */
export const bankAccounts = mysqlTable("bank_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  bankName: varchar("bankName", { length: 100 }),
  accountNumber: varchar("accountNumber", { length: 50 }),
  accountType: mysqlEnum("accountType", ["checking", "savings", "investment"]).default("checking"),
  initialBalance: decimal("initialBalance", { precision: 15, scale: 2 }).default("0"),
  currentBalance: decimal("currentBalance", { precision: 15, scale: 2 }).default("0"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = typeof bankAccounts.$inferInsert;

/**
 * Financial Transactions - Lançamentos de pagamentos e recebimentos
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bankAccountId: int("bankAccountId"),
  categoryId: int("categoryId"),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  transactionDate: datetime("transactionDate").notNull(),
  dueDate: datetime("dueDate"),
  paymentDate: datetime("paymentDate"),
  status: mysqlEnum("status", ["pending", "paid", "overdue", "cancelled"]).default("pending").notNull(),
  reconciliationStatus: mysqlEnum("reconciliationStatus", ["unreconciled", "reconciled", "disputed"]).default("unreconciled").notNull(),
  reference: varchar("reference", { length: 100 }), // Número de nota fiscal, cheque, etc
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Fiscal Documents - Notas fiscais, recibos e comprovantes
 */
export const fiscalDocuments = mysqlTable("fiscal_documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  transactionId: int("transactionId"),
  documentType: mysqlEnum("documentType", ["invoice", "receipt", "bill", "proof"]).notNull(),
  documentNumber: varchar("documentNumber", { length: 100 }),
  issuerName: varchar("issuerName", { length: 255 }),
  issuerCNPJ: varchar("issuerCNPJ", { length: 20 }),
  amount: decimal("amount", { precision: 15, scale: 2 }),
  issueDate: datetime("issueDate"),
  dueDate: datetime("dueDate"),
  description: text("description"),
  s3Key: varchar("s3Key", { length: 500 }), // Referência ao arquivo em S3
  s3Url: varchar("s3Url", { length: 500 }), // URL pública do arquivo
  mimeType: varchar("mimeType", { length: 50 }), // application/pdf, image/jpeg, etc
  fileSize: int("fileSize"), // Tamanho em bytes
  extractedData: longtext("extractedData"), // JSON com dados extraídos pela IA
  status: mysqlEnum("status", ["pending", "processed", "verified", "archived"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FiscalDocument = typeof fiscalDocuments.$inferSelect;
export type InsertFiscalDocument = typeof fiscalDocuments.$inferInsert;

/**
 * Bank Statements - Extratos bancários (OFX)
 */
export const bankStatements = mysqlTable("bank_statements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bankAccountId: int("bankAccountId").notNull(),
  statementDate: datetime("statementDate").notNull(),
  startDate: datetime("startDate"),
  endDate: datetime("endDate"),
  openingBalance: decimal("openingBalance", { precision: 15, scale: 2 }),
  closingBalance: decimal("closingBalance", { precision: 15, scale: 2 }),
  s3Key: varchar("s3Key", { length: 500 }), // Referência ao arquivo OFX em S3
  s3Url: varchar("s3Url", { length: 500 }), // URL pública do arquivo
  totalTransactions: int("totalTransactions").default(0),
  processedTransactions: int("processedTransactions").default(0),
  status: mysqlEnum("status", ["pending", "processing", "completed", "error"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BankStatement = typeof bankStatements.$inferSelect;
export type InsertBankStatement = typeof bankStatements.$inferInsert;

/**
 * Reconciliation Matches - Relacionamento entre transações e extratos bancários
 */
export const reconciliationMatches = mysqlTable("reconciliation_matches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  transactionId: int("transactionId").notNull(),
  bankStatementId: int("bankStatementId"),
  matchType: mysqlEnum("matchType", ["auto", "manual", "suggested"]).default("auto").notNull(),
  confidence: int("confidence"), // 0-100, confiança do match automático
  status: mysqlEnum("status", ["matched", "disputed", "unmatched"]).default("matched").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReconciliationMatch = typeof reconciliationMatches.$inferSelect;
export type InsertReconciliationMatch = typeof reconciliationMatches.$inferInsert;

/**
 * Audit Logs - Logs de auditoria para operações sensíveis
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(), // CREATE, UPDATE, DELETE, RECONCILE, etc
  entityType: varchar("entityType", { length: 50 }).notNull(), // transaction, document, account, etc
  entityId: int("entityId"),
  oldValues: longtext("oldValues"), // JSON com valores anteriores
  newValues: longtext("newValues"), // JSON com novos valores
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  status: mysqlEnum("status", ["success", "failure"]).default("success").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Notifications - Notificações de alertas e vencimentos
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["payment_due", "payment_overdue", "low_balance", "reconciliation_alert", "system"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  relatedTransactionId: int("relatedTransactionId"),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * User Consent - Rastreamento de consentimento LGPD
 */
export const userConsent = mysqlTable("user_consent", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  privacyPolicyAccepted: boolean("privacyPolicyAccepted").default(false).notNull(),
  dataProcessingAccepted: boolean("dataProcessingAccepted").default(false).notNull(),
  acceptedAt: timestamp("acceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserConsent = typeof userConsent.$inferSelect;
export type InsertUserConsent = typeof userConsent.$inferInsert;
