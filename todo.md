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

## Exportação de Relatórios (Contas a Pagar / Receber)
- [x] Instalar exceljs e pdfkit no backend
- [x] Criar endpoint Express de exportação Excel para Contas a Pagar
- [x] Criar endpoint Express de exportação PDF para Contas a Pagar
- [x] Criar endpoint Express de exportação Excel para Contas a Receber
- [x] Criar endpoint Express de exportação PDF para Contas a Receber
- [x] Botões "Exportar Excel" e "Exportar PDF" na página Contas a Pagar
- [x] Botões "Exportar Excel" e "Exportar PDF" na página Contas a Receber
- [x] Testes unitários para exportação (55 testes passando)

## Módulo de Planejamentos (Escalas de Trabalho)
- [x] Criar tabela work_schedules (data, turno, cliente, local, status, valor total, pessoas)
- [x] Criar tabela schedule_functions (função alocada no planejamento com valores paga/recebe)
- [x] Criar tabela schedule_allocations (funcionário alocado com paga/recebe/marmita/vale/bônus)
- [x] Atualizar schema Drizzle com as 3 novas tabelas
- [x] Router tRPC para planejamentos (CRUD + filtros + alocação)
- [x] Listagem com filtros (data, cliente, turno, local, funcionário) e abas (Todos/Pendentes/Validados)
- [x] Modal Novo Planejamento (data, turno, cliente)
- [x] Modal Editar Planejamento (data, turno, cliente, local, funções, alocação de funcionários)
- [x] Modal Alocar Funcionários (busca por nome/CPF/cidade, seleção múltipla)
- [x] Valores individuais por funcionário (paga, recebe, marmita, vale, bônus)
- [x] Integrar na sidebar do DashboardLayout
- [ ] Testes unitários para planejamentos

## Melhorias Planejamentos v2
- [ ] Trava anti-duplicidade: bloquear funcionário alocado 2x no mesmo dia (com opção de exceção justificada)
- [ ] Alerta visual de conflito de alocação
- [ ] Lançamento rápido de Vale/Bônus/Marmita (por CPF + Data + Valor, sem abrir planejamento)
- [ ] Resumo expandível na listagem (seta que expande: pessoas, valor, marmitas, vales, bônus, lista funcionários)
- [ ] Campo observação por planejamento e por alocação
- [ ] Controle de presença por alocação (Presente/Faltou/Parcial)
- [ ] Coluna attendance_status e notes na tabela schedule_allocations
- [x] Testes unitários para novas funcionalidades
- [x] Testes de Stress (50+ planejamentos, 50+ alocações)
- [x] Testes de Segurança (RBAC, SQL injection, autenticação)
- [x] Testes de Governança (fluxo PIX, cascata, integridade)
- [x] Testes de Rastreabilidade (auditoria, check-in/out, presença)

## Portal do Líder
- [ ] Adicionar role 'leader' ao enum de users
- [ ] Campo leaderId no work_schedules
- [ ] Campos checkInTime/checkOutTime no schedule_allocations
- [ ] Campos docFrontUrl/docBackUrl no employees
- [ ] Tabela pix_change_requests (solicitação de alteração PIX)
- [ ] Router portalLider (meus planejamentos, check-in/out, cadastro rápido, solicitação PIX)
- [ ] Tela Portal do Líder mobile-first
- [ ] Cadastro rápido de funcionário (nome, CPF, RG, PIX, foto documento)
- [ ] Upload de foto de documento (frente/verso) via câmera
- [ ] Check-in/check-out de presença com timestamp
- [ ] Solicitação de alteração PIX com fluxo de aprovação
- [ ] Tela admin para aprovar/rejeitar solicitações PIX
- [ ] Integrar na sidebar e App.tsx

## Ajustes
- [x] Alterar "Data de Admissão" para "Data de Cadastro" no schema e telas de funcionários

- [ ] Ajustar lógica: líder é papel separado, não precisa estar em schedule_allocations
- [ ] Líder pode ser: do dia (alocado) ou fixo (só supervisiona, não trabalha)
- [ ] Planejamentos podem não ter líder (leaderId nullable)

## Validação Bancária PIX
- [x] Criar validador PIX robusto (formato, dígitos, instituição, tipo de chave)
- [x] Integrar validação em endpoints de cadastro e alteração de PIX
- [x] Feedback visual de validação no frontend (status, alertas)
- [x] Testes de validação PIX (22 testes passando)

## Fase 8: Sincronização de Dependências
- [x] Sincronizar pnpm-lock.yaml com package.json (resolver ^10.4.1 vs ^10.15.1)
- [x] Validar build sem erros
- [x] Testar deploy

## Fase 9: Frontend Portal do Líder (MVP Mobile-First)
- [x] Criar página PortalLider.tsx com layout mobile-first
- [x] Abas: Minhas Escalas / Presença / Cadastro Rápido / Lançamentos
- [x] Listar escalas do líder com filtros (data, status)
- [x] Implementar check-in/out com timestamp
- [x] Formulário cadastro rápido (nome, CPF, RG, PIX, fotos documento)
- [x] Upload de fotos via câmera ou galeria
- [x] Solicitação de alteração PIX com fluxo de aprovação
- [ ] Tela admin para aprovar/rejeitar PIX
- [ ] Testes de integração do Portal

## Fase 10: Gráficos de Dashboard com Recharts
- [x] Instalar recharts
- [x] Gráfico Evolução Financeira Mensal (receita vs custos)
- [x] Gráfico Composição de Despesas por categoria/cliente
- [x] Gráfico Despesas por Cliente com comparativo
- [x] Integrar gráficos no Analytics
- [x] KPIs em tempo real (Receita, Despesa, Saldo, Margem)
- [ ] Testes de renderização dos gráficos

## Fase 11: Tela Admin para Aprovação de Solicitações PIX
- [x] Analisar endpoints de PIX no backend (listar, aprovar, rejeitar)
- [x] Criar página PixApprovals.tsx com abas (Pendentes/Histórico)
- [x] Implementar filtros (CPF, nome, data)
- [x] Formulário de aprovação com confirmação
- [x] Formulário de rejeição com motivo obrigatório
- [x] Integração com backend (reviewPixRequest)
- [x] Auditoria: registrar quem aprovou/rejeitou e quando
- [ ] Testes de aprovação/rejeição
