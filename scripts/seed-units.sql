-- Inserir units para os clientes existentes
-- Primeiro, obter o ID do cliente "Empresa Teste LTDA"

-- Verificar clientes
SELECT id, name FROM clients LIMIT 5;

-- Inserir units para o primeiro cliente (ID 1)
INSERT INTO client_units (clientId, name, address, isActive, createdAt, updatedAt)
VALUES 
  (1, 'Sorotama', 'Rua A, 123 - São Paulo, SP', 1, NOW(), NOW()),
  (1, 'Base Central', 'Avenida B, 456 - São Paulo, SP', 1, NOW(), NOW()),
  (1, 'Dufrio', 'Rua C, 789 - Guarulhos, SP', 1, NOW(), NOW()),
  (1, 'Unidade RG', 'Rua D, 321 - São Paulo, SP', 1, NOW(), NOW());

-- Verificar units inseridas
SELECT * FROM client_units WHERE clientId = 1;
