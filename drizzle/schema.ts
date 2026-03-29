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
  time,
} from "drizzle-orm/mysql-core";

// ============================================================
// AUTH - Tabela de usuários do sistema (OAuth)
// ============================================================
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

// ============================================================
// CADASTROS - Entidades base do negócio
// ============================================================

/** Funcionários / Diaristas */
export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  cpf: varchar("cpf", { length: 14 }).unique(), // 000.000.000-00
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  city: varchar("city", { length: 100 }),
  pixKey: varchar("pixKey", { length: 255 }), // Chave PIX (CPF, email, telefone, aleatória)
  pixKeyType: mysqlEnum("pixKeyType", ["cpf", "email", "phone", "random", "cnpj"]),
  status: mysqlEnum("status", ["diarista", "inativo", "pendente"]).default("diarista").notNull(),
  admissionDate: datetime("admissionDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

/** Clientes (Empresas de logística) */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 20 }),
  city: varchar("city", { length: 100 }),
  address: varchar("address", { length: 500 }),
  contactName: varchar("contactName", { length: 255 }),
  contactPhone: varchar("contactPhone", { length: 20 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/** Unidades / Locais dentro do cliente */
export const clientUnits = mysqlTable("client_units", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // ex: Sorotama, Base, Dufrio, RG
  address: varchar("address", { length: 500 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientUnit = typeof clientUnits.$inferSelect;
export type InsertClientUnit = typeof clientUnits.$inferInsert;

/** Funções e Salários (Aux. Carga e Descarga, Líder, etc.) */
export const jobFunctions = mysqlTable("job_functions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // ex: Aux. Carga e Descarga
  defaultPayValue: decimal("defaultPayValue", { precision: 10, scale: 2 }), // Valor padrão que paga ao diarista
  defaultReceiveValue: decimal("defaultReceiveValue", { precision: 10, scale: 2 }), // Valor padrão que recebe do cliente
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type JobFunction = typeof jobFunctions.$inferSelect;
export type InsertJobFunction = typeof jobFunctions.$inferInsert;

/** Funções associadas a cada Cliente (com valores específicos) */
export const clientFunctions = mysqlTable("client_functions", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  jobFunctionId: int("jobFunctionId").notNull(),
  payValue: decimal("payValue", { precision: 10, scale: 2 }), // Valor que paga ao diarista neste cliente
  receiveValue: decimal("receiveValue", { precision: 10, scale: 2 }), // Valor que recebe do cliente
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientFunction = typeof clientFunctions.$inferSelect;
export type InsertClientFunction = typeof clientFunctions.$inferInsert;

/** Turnos de trabalho (MLT-1 a MLT-13) */
export const shifts = mysqlTable("shifts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull(), // ex: MLT-1, MLT-2
  startTime: time("startTime").notNull(), // 06:00
  endTime: time("endTime").notNull(), // 15:00
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Shift = typeof shifts.$inferSelect;
export type InsertShift = typeof shifts.$inferInsert;

/** Centros de Custo */
export const costCenters = mysqlTable("cost_centers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CostCenter = typeof costCenters.$inferSelect;
export type InsertCostCenter = typeof costCenters.$inferInsert;

/** Fornecedores */
export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 20 }),
  city: varchar("city", { length: 100 }),
  pixKey: varchar("pixKey", { length: 255 }),
  contactPhone: varchar("contactPhone", { length: 20 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

// ============================================================
// FINANCEIRO - Contas a Pagar e Receber
// ============================================================

/** Contas Bancárias da empresa */
export const bankAccounts = mysqlTable("bank_accounts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  bankName: varchar("bankName", { length: 100 }),
  accountNumber: varchar("accountNumber", { length: 50 }),
  agency: varchar("agency", { length: 20 }),
  accountType: mysqlEnum("accountType", ["checking", "savings", "investment"]).default("checking"),
  initialBalance: decimal("initialBalance", { precision: 15, scale: 2 }).default("0"),
  currentBalance: decimal("currentBalance", { precision: 15, scale: 2 }).default("0"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = typeof bankAccounts.$inferInsert;

/** Contas a Pagar */
export const accountsPayable = mysqlTable("accounts_payable", {
  id: int("id").autoincrement().primaryKey(),
  description: varchar("description", { length: 255 }).notNull(),
  supplierId: int("supplierId"),
  clientId: int("clientId"),
  costCenterId: int("costCenterId"),
  bankAccountId: int("bankAccountId"),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  dueDate: datetime("dueDate").notNull(),
  paymentDate: datetime("paymentDate"),
  status: mysqlEnum("status", ["pendente", "pago", "vencido", "cancelado"]).default("pendente").notNull(),
  notes: text("notes"),
  documentUrl: varchar("documentUrl", { length: 500 }), // Comprovante em S3
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccountPayable = typeof accountsPayable.$inferSelect;
export type InsertAccountPayable = typeof accountsPayable.$inferInsert;

/** Contas a Receber */
export const accountsReceivable = mysqlTable("accounts_receivable", {
  id: int("id").autoincrement().primaryKey(),
  description: varchar("description", { length: 255 }).notNull(),
  clientId: int("clientId"),
  costCenterId: int("costCenterId"),
  bankAccountId: int("bankAccountId"),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  dueDate: datetime("dueDate").notNull(),
  receiveDate: datetime("receiveDate"),
  status: mysqlEnum("status", ["pendente", "recebido", "vencido", "cancelado"]).default("pendente").notNull(),
  notes: text("notes"),
  documentUrl: varchar("documentUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccountReceivable = typeof accountsReceivable.$inferSelect;
export type InsertAccountReceivable = typeof accountsReceivable.$inferInsert;

/** Lotes de Pagamento de Funcionários */
export const paymentBatches = mysqlTable("payment_batches", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(), // ex: "Mar/2026 - Todos os Funcionários"
  periodStart: datetime("periodStart").notNull(),
  periodEnd: datetime("periodEnd").notNull(),
  totalAmount: decimal("totalAmount", { precision: 15, scale: 2 }).default("0"),
  employeeCount: int("employeeCount").default(0),
  status: mysqlEnum("status", ["pendente", "pago", "cancelado"]).default("pendente").notNull(),
  paidAt: datetime("paidAt"),
  bankAccountId: int("bankAccountId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentBatch = typeof paymentBatches.$inferSelect;
export type InsertPaymentBatch = typeof paymentBatches.$inferInsert;

/** Itens do Lote de Pagamento */
export const paymentBatchItems = mysqlTable("payment_batch_items", {
  id: int("id").autoincrement().primaryKey(),
  batchId: int("batchId").notNull(),
  employeeId: int("employeeId").notNull(),
  daysWorked: int("daysWorked").default(0),
  dailyRate: decimal("dailyRate", { precision: 10, scale: 2 }).default("0"),
  mealAllowance: decimal("mealAllowance", { precision: 10, scale: 2 }).default("0"), // Marmita
  bonus: decimal("bonus", { precision: 10, scale: 2 }).default("0"),
  voucher: decimal("voucher", { precision: 10, scale: 2 }).default("0"), // Vale
  totalAmount: decimal("totalAmount", { precision: 15, scale: 2 }).default("0"),
  pixKey: varchar("pixKey", { length: 255 }), // Snapshot da chave PIX no momento do pagamento
  status: mysqlEnum("status", ["pendente", "pago", "erro"]).default("pendente").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentBatchItem = typeof paymentBatchItems.$inferSelect;
export type InsertPaymentBatchItem = typeof paymentBatchItems.$inferInsert;

// ============================================================
// DOCUMENTOS E AUDITORIA
// ============================================================

/** Documentos Fiscais */
export const fiscalDocuments = mysqlTable("fiscal_documents", {
  id: int("id").autoincrement().primaryKey(),
  documentType: mysqlEnum("documentType", ["invoice", "receipt", "bill", "proof", "order_of_service"]).notNull(),
  documentNumber: varchar("documentNumber", { length: 100 }),
  relatedEntityType: varchar("relatedEntityType", { length: 50 }), // accounts_payable, accounts_receivable
  relatedEntityId: int("relatedEntityId"),
  issuerName: varchar("issuerName", { length: 255 }),
  issuerCNPJ: varchar("issuerCNPJ", { length: 20 }),
  amount: decimal("amount", { precision: 15, scale: 2 }),
  issueDate: datetime("issueDate"),
  description: text("description"),
  s3Key: varchar("s3Key", { length: 500 }),
  s3Url: varchar("s3Url", { length: 500 }),
  mimeType: varchar("mimeType", { length: 50 }),
  fileSize: int("fileSize"),
  extractedData: longtext("extractedData"),
  status: mysqlEnum("status", ["pending", "processed", "verified", "archived"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FiscalDocument = typeof fiscalDocuments.$inferSelect;
export type InsertFiscalDocument = typeof fiscalDocuments.$inferInsert;

/** Logs de Auditoria */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: int("entityId"),
  oldValues: longtext("oldValues"),
  newValues: longtext("newValues"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  status: mysqlEnum("status", ["success", "failure"]).default("success").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/** Notificações */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["payment_due", "payment_overdue", "low_balance", "system", "alert"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/** Permissões granulares por módulo por usuário */
export const userPermissions = mysqlTable("user_permissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  module: varchar("module", { length: 50 }).notNull(), // dashboard, employees, clients, suppliers, shifts, functions, cost_centers, bank_accounts, accounts_payable, accounts_receivable, payment_batches, documents, analytics, users
  canView: boolean("canView").default(false).notNull(),
  canCreate: boolean("canCreate").default(false).notNull(),
  canEdit: boolean("canEdit").default(false).notNull(),
  canDelete: boolean("canDelete").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = typeof userPermissions.$inferInsert;

/** Módulos disponíveis no sistema */
export const SYSTEM_MODULES = [
  "dashboard",
  "employees",
  "clients",
  "suppliers",
  "shifts",
  "functions",
  "cost_centers",
  "bank_accounts",
  "accounts_payable",
  "accounts_receivable",
  "payment_batches",
  "documents",
  "analytics",
  "users",
] as const;

export type SystemModule = typeof SYSTEM_MODULES[number];
