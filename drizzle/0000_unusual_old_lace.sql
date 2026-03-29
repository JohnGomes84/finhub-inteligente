CREATE TABLE `accounts_payable` (
	`id` int AUTO_INCREMENT NOT NULL,
	`description` varchar(255) NOT NULL,
	`supplierId` int,
	`clientId` int,
	`costCenterId` int,
	`bankAccountId` int,
	`amount` decimal(15,2) NOT NULL,
	`dueDate` datetime NOT NULL,
	`paymentDate` datetime,
	`status` enum('pendente','pago','vencido','cancelado') NOT NULL DEFAULT 'pendente',
	`notes` text,
	`documentUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_payable_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accounts_receivable` (
	`id` int AUTO_INCREMENT NOT NULL,
	`description` varchar(255) NOT NULL,
	`clientId` int,
	`costCenterId` int,
	`bankAccountId` int,
	`amount` decimal(15,2) NOT NULL,
	`dueDate` datetime NOT NULL,
	`receiveDate` datetime,
	`status` enum('pendente','recebido','vencido','cancelado') NOT NULL DEFAULT 'pendente',
	`notes` text,
	`documentUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_receivable_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` int,
	`oldValues` longtext,
	`newValues` longtext,
	`ipAddress` varchar(45),
	`status` enum('success','failure') NOT NULL DEFAULT 'success',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bank_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`bankName` varchar(100),
	`accountNumber` varchar(50),
	`agency` varchar(20),
	`accountType` enum('checking','savings','investment') DEFAULT 'checking',
	`initialBalance` decimal(15,2) DEFAULT '0',
	`currentBalance` decimal(15,2) DEFAULT '0',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bank_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_functions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`jobFunctionId` int NOT NULL,
	`payValue` decimal(10,2),
	`receiveValue` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_functions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_units` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` varchar(500),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_units_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`cnpj` varchar(20),
	`city` varchar(100),
	`address` varchar(500),
	`contactName` varchar(255),
	`contactPhone` varchar(20),
	`contactEmail` varchar(320),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cost_centers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cost_centers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`cpf` varchar(14),
	`email` varchar(320),
	`phone` varchar(20),
	`city` varchar(100),
	`pixKey` varchar(255),
	`pixKeyType` enum('cpf','email','phone','random','cnpj'),
	`status` enum('diarista','inativo','pendente') NOT NULL DEFAULT 'diarista',
	`admissionDate` datetime,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_cpf_unique` UNIQUE(`cpf`)
);
--> statement-breakpoint
CREATE TABLE `fiscal_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentType` enum('invoice','receipt','bill','proof','order_of_service') NOT NULL,
	`documentNumber` varchar(100),
	`relatedEntityType` varchar(50),
	`relatedEntityId` int,
	`issuerName` varchar(255),
	`issuerCNPJ` varchar(20),
	`amount` decimal(15,2),
	`issueDate` datetime,
	`description` text,
	`s3Key` varchar(500),
	`s3Url` varchar(500),
	`mimeType` varchar(50),
	`fileSize` int,
	`extractedData` longtext,
	`status` enum('pending','processed','verified','archived') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fiscal_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_functions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`defaultPayValue` decimal(10,2),
	`defaultReceiveValue` decimal(10,2),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `job_functions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('payment_due','payment_overdue','low_balance','system','alert') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text,
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_batch_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batchId` int NOT NULL,
	`employeeId` int NOT NULL,
	`daysWorked` int DEFAULT 0,
	`dailyRate` decimal(10,2) DEFAULT '0',
	`mealAllowance` decimal(10,2) DEFAULT '0',
	`bonus` decimal(10,2) DEFAULT '0',
	`voucher` decimal(10,2) DEFAULT '0',
	`totalAmount` decimal(15,2) DEFAULT '0',
	`pixKey` varchar(255),
	`status` enum('pendente','pago','erro') NOT NULL DEFAULT 'pendente',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_batch_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_batches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`periodStart` datetime NOT NULL,
	`periodEnd` datetime NOT NULL,
	`totalAmount` decimal(15,2) DEFAULT '0',
	`employeeCount` int DEFAULT 0,
	`status` enum('pendente','pago','cancelado') NOT NULL DEFAULT 'pendente',
	`paidAt` datetime,
	`bankAccountId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_batches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`startTime` time NOT NULL,
	`endTime` time NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shifts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`cnpj` varchar(20),
	`city` varchar(100),
	`pixKey` varchar(255),
	`contactPhone` varchar(20),
	`contactEmail` varchar(320),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
