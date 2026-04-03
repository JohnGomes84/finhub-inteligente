-- Backup SQL PRE-CLEAN: Salva todos os dados de teste antes da limpeza
-- Gerado em: 2026-04-03
-- Restaurar com: mysql -u user -p database < backup-pre-clean.sql

-- Backup: audit_logs
CREATE TABLE IF NOT EXISTS backup_audit_logs AS SELECT * FROM audit_logs;

-- Backup: pix_change_requests
CREATE TABLE IF NOT EXISTS backup_pix_change_requests AS SELECT * FROM pix_change_requests;

-- Backup: schedule_allocations
CREATE TABLE IF NOT EXISTS backup_schedule_allocations AS SELECT * FROM schedule_allocations;

-- Backup: schedule_functions
CREATE TABLE IF NOT EXISTS backup_schedule_functions AS SELECT * FROM schedule_functions;

-- Backup: work_schedules
CREATE TABLE IF NOT EXISTS backup_work_schedules AS SELECT * FROM work_schedules;

-- Backup: payment_batches
CREATE TABLE IF NOT EXISTS backup_payment_batches AS SELECT * FROM payment_batches;

-- Backup: accounts_payable
CREATE TABLE IF NOT EXISTS backup_accounts_payable AS SELECT * FROM accounts_payable;

-- Backup: accounts_receivable
CREATE TABLE IF NOT EXISTS backup_accounts_receivable AS SELECT * FROM accounts_receivable;

-- Backup: employees
CREATE TABLE IF NOT EXISTS backup_employees AS SELECT * FROM employees;

-- Backup: pre_registrations
CREATE TABLE IF NOT EXISTS backup_pre_registrations AS SELECT * FROM pre_registrations;

-- Backup: clients
CREATE TABLE IF NOT EXISTS backup_clients AS SELECT * FROM clients;

-- Backup: suppliers
CREATE TABLE IF NOT EXISTS backup_suppliers AS SELECT * FROM suppliers;
