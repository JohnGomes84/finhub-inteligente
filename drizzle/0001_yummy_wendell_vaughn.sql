CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` int,
	`oldValues` longtext,
	`newValues` longtext,
	`ipAddress` varchar(45),
	`userAgent` text,
	`status` enum('success','failure') NOT NULL DEFAULT 'success',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bank_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`bankName` varchar(100),
	`accountNumber` varchar(50),
	`accountType` enum('checking','savings','investment') DEFAULT 'checking',
	`initialBalance` decimal(15,2) DEFAULT '0',
	`currentBalance` decimal(15,2) DEFAULT '0',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bank_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bank_statements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bankAccountId` int NOT NULL,
	`statementDate` datetime NOT NULL,
	`startDate` datetime,
	`endDate` datetime,
	`openingBalance` decimal(15,2),
	`closingBalance` decimal(15,2),
	`s3Key` varchar(500),
	`s3Url` varchar(500),
	`totalTransactions` int DEFAULT 0,
	`processedTransactions` int DEFAULT 0,
	`status` enum('pending','processing','completed','error') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bank_statements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`type` enum('income','expense') NOT NULL,
	`color` varchar(7),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fiscal_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`transactionId` int,
	`documentType` enum('invoice','receipt','bill','proof') NOT NULL,
	`documentNumber` varchar(100),
	`issuerName` varchar(255),
	`issuerCNPJ` varchar(20),
	`amount` decimal(15,2),
	`issueDate` datetime,
	`dueDate` datetime,
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
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('payment_due','payment_overdue','low_balance','reconciliation_alert','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text,
	`relatedTransactionId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reconciliation_matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`transactionId` int NOT NULL,
	`bankStatementId` int,
	`matchType` enum('auto','manual','suggested') NOT NULL DEFAULT 'auto',
	`confidence` int,
	`status` enum('matched','disputed','unmatched') NOT NULL DEFAULT 'matched',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reconciliation_matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bankAccountId` int,
	`categoryId` int,
	`type` enum('income','expense') NOT NULL,
	`description` varchar(255) NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`transactionDate` datetime NOT NULL,
	`dueDate` datetime,
	`paymentDate` datetime,
	`status` enum('pending','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
	`reconciliationStatus` enum('unreconciled','reconciled','disputed') NOT NULL DEFAULT 'unreconciled',
	`reference` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_consent` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`privacyPolicyAccepted` boolean NOT NULL DEFAULT false,
	`dataProcessingAccepted` boolean NOT NULL DEFAULT false,
	`acceptedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_consent_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_consent_userId_unique` UNIQUE(`userId`)
);
