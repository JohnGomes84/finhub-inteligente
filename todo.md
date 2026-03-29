# FinHub Inteligente - TODO (ML Serviços - Módulo Financeiro)

## Fase 1: Reestruturar Banco de Dados
- [x] Criar tabela employees (funcionários/diaristas) com CPF, cidade, status, chave PIX, data admissão
- [x] Criar tabela clients (empresas clientes) com nome, cidade, endereço, CNPJ
- [x] Criar tabela client_units (unidades/locais dentro do cliente)
- [x] Criar tabela job_functions (funções: Aux. Carga e Descarga, Líder, etc.)
- [x] Criar tabela shifts (turnos: MLT-1 a MLT-13 com horários)
- [x] Criar tabela cost_centers (centros de custo)
- [x] Criar tabela suppliers (fornecedores com CNPJ e chave PIX)
- [x] Criar tabela accounts_payable (contas a pagar)
- [x] Criar tabela accounts_receivable (contas a receber)
- [x] Criar tabela payment_batches (lotes de pagamento de funcionários)
- [x] Criar tabela payment_batch_items (itens do lote)
- [x] Executar migrações SQL
- [x] Criar tabela user_permissions para RBAC granular por módulo
- [x] DB helpers para cadastros (employees, clients, suppliers, shifts, etc.)
- [x] DB helpers para financeiro (accounts_payable, accounts_receivable, payment_batches)
- [x] Routers tRPC para cadastros
- [x] Routers tRPC para financeiro
- [x] Router tRPC para gestão de usuários e permissões

## Fase 2: Redesign Visual Arrojado
- [x] Definir paleta de cores sofisticada (tema escuro)
- [x] Configurar tipografia premium (Google Fonts - Inter)
- [x] Atualizar index.css com variáveis de tema
- [x] Redesign do DashboardLayout com sidebar moderna
- [x] Configurar App.tsx com todas as rotas e tema escuro

## Fase 3: Multi-Usuário e Permissões
- [x] Tela de gestão de usuários (admin) - listar, editar permissões
- [x] Controle granular de permissões por módulo (visualizar, criar, editar, excluir)
- [x] Bloqueio/liberação de funcionalidades por usuário
- [x] Hook usePermissions no frontend para controle de acesso
- [x] Middleware de permissões no backend (protectedProcedure com check)
- [x] Sidebar dinâmica baseada nas permissões do usuário

## Fase 4: Cadastros Essenciais (CRUD completo)
- [x] Página de Funcionários (listagem + busca + filtros + CRUD)
- [x] Página de Clientes com Unidades (listagem + CRUD + unidades aninhadas)
- [x] Página de Funções e Salários (listagem + CRUD)
- [x] Página de Turnos (listagem + CRUD)
- [x] Página de Centros de Custo (listagem + CRUD)
- [x] Página de Fornecedores (listagem + busca + CRUD)
- [x] CRUD Contas Bancárias

## Fase 5: Contas a Pagar e Contas a Receber
- [x] Página de Contas a Pagar com filtros avançados
- [x] Página de Contas a Receber com filtros
- [x] KPIs: Total a Pagar Pendente, Total Pago, Total a Receber Pendente, Total Recebido
- [x] Lotes de Pagamento de Funcionários
- [x] Formulário Nova Conta a Pagar / Nova Conta a Receber
- [ ] Navegação por mês com setas e botão Exportar

## Fase 6: Dashboard e Analytics
- [x] Dashboard com KPIs (Faturamento Total, Custos Operacionais, Margem de Lucro, Total de Trabalhos)
- [ ] Comparativo vs mês anterior com percentuais
- [ ] Gráfico Evolução Financeira diária
- [x] Analytics: filtros de período
- [x] Analytics: Financeiro Consolidado
- [ ] Analytics: Gráfico Evolução Mensal
- [ ] Analytics: Composição de Despesas por categoria

## Fase 7: Testes e Entrega
- [x] Testes unitários para RBAC e permissões
- [x] Testes para operações financeiras (49 testes passando)
- [x] Verificação TypeScript sem erros
- [x] Checkpoint final
- [ ] Entrega ao usuário

## Branding ML Serviços
- [x] Integrar domínio mlservicoseco.com.br na identidade visual do sistema
- [x] Configurar dados da empresa (nome, domínio, emails) como padrão no sistema
