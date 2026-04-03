-- Script de Limpeza de Dados de Teste
-- Deleta todos os dados de teste mantendo apenas estrutura e cadastros base
-- Respeita ordem de foreign keys

-- 1. Deletar audit_logs
DELETE FROM audit_logs;
ALTER TABLE audit_logs AUTO_INCREMENT = 1;

-- 2. Deletar pix_change_requests
DELETE FROM pix_change_requests;
ALTER TABLE pix_change_requests AUTO_INCREMENT = 1;

-- 3. Deletar schedule_allocations
DELETE FROM schedule_allocations;
ALTER TABLE schedule_allocations AUTO_INCREMENT = 1;

-- 4. Deletar schedule_functions
DELETE FROM schedule_functions;
ALTER TABLE schedule_functions AUTO_INCREMENT = 1;

-- 5. Deletar work_schedules
DELETE FROM work_schedules;
ALTER TABLE work_schedules AUTO_INCREMENT = 1;

-- 6. Deletar payment_batches
DELETE FROM payment_batches;
ALTER TABLE payment_batches AUTO_INCREMENT = 1;

-- 7. Deletar accounts_payable
DELETE FROM accounts_payable;
ALTER TABLE accounts_payable AUTO_INCREMENT = 1;

-- 8. Deletar accounts_receivable
DELETE FROM accounts_receivable;
ALTER TABLE accounts_receivable AUTO_INCREMENT = 1;

-- 9. Deletar employees
DELETE FROM employees;
ALTER TABLE employees AUTO_INCREMENT = 1;

-- 10. Deletar pre_registrations
DELETE FROM pre_registrations;
ALTER TABLE pre_registrations AUTO_INCREMENT = 1;

-- 11. Deletar clients
DELETE FROM clients;
ALTER TABLE clients AUTO_INCREMENT = 1;

-- 12. Deletar suppliers
DELETE FROM suppliers;
ALTER TABLE suppliers AUTO_INCREMENT = 1;

-- Manter intactos:
-- - users (admins)
-- - shifts
-- - job_functions
-- - cost_centers
-- - units
