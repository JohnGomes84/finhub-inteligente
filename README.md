# FinHub Inteligente v3.0

**Sistema de Gestão Financeira e Operacional para ML Serviços**

Plataforma completa para gerenciar escalas de trabalho, alocação de funcionários, contas a pagar/receber, e operações de campo com controle multi-usuário e RBAC granular.

---

## Características Principais

### 🎯 Módulo de Planejamentos (Escalas de Trabalho)
- **Criação de escalas** com turno, cliente, local e funções
- **Alocação de funcionários** com valores individuais (paga, recebe, marmita, vale, bônus)
- **Validação anti-duplicidade** — bloqueia funcionário alocado 2x no mesmo dia (com opção de exceção justificada)
- **Resumo expandível** — visualizar total de pessoas, valores, marmitas, vales, bônus sem abrir modal
- **Lançamento rápido** — adicionar vale/bônus/marmita por CPF + Data + Valor
- **Controle de presença** — Presente / Faltou / Parcial por funcionário
- **Observações** — campo para registrar ocorrências e lembretes

### 👨‍💼 Portal do Líder (Mobile-First)
Interface separada para líderes de operação:
- **Meus Planejamentos** — lista de escalas onde é líder
- **Check-in/Check-out** — registra chegada/saída com timestamp
- **Controle de Presença** — marca presença dos funcionários em tempo real
- **Lançamento Rápido de Vale** — sem abrir planejamento completo
- **Solicitação de Alteração PIX** — líder solicita, admin aprova
- **Cadastro Rápido de Funcionário** — nome, CPF, RG, PIX, foto documento (frente/verso)

### 💰 Módulo Financeiro
- **Contas a Pagar** — gestão de despesas com filtros e exportação
- **Contas a Receber** — gestão de receitas com filtros e exportação
- **Lotes de Pagamento** — agrupar e processar pagamentos em lote
- **Exportação Excel/PDF** — relatórios com dados filtrados

### 📋 Cadastros Essenciais
- **Funcionários** — nome, CPF, RG, email, telefone, chave PIX, data de cadastro, status
- **Clientes** — nome, CNPJ, email, telefone, unidades
- **Fornecedores** — nome, CNPJ, email, telefone, dados bancários
- **Turnos** — nome, horário início/fim, descrição
- **Funções** — nome, descrição, valores padrão (paga/recebe)
- **Centros de Custo** — para organização financeira
- **Contas Bancárias** — para transferências

### 👥 Gestão de Usuários e Permissões
- **Multi-usuário** — cada usuário tem perfil e permissões específicas
- **RBAC Granular** — 14 módulos × 4 ações (visualizar, criar, editar, excluir)
- **Perfis** — admin, user, leader
- **Admin bloqueia/libera** — funcionalidades por usuário
- **Auditoria completa** — log de todas as ações

### 📊 Dashboard e Analytics
- **KPIs em tempo real** — total de planejamentos, pessoas, valores
- **Gráficos** — evolução mensal, composição de despesas
- **Filtros** — por período, cliente, turno

---

## Fluxo de Uso

### 1. Administrador
1. Faz login com email @mlservicoseco.com.br (ou pessoal)
2. Acessa Dashboard para ver KPIs
3. Cadastra funcionários, clientes, turnos, funções
4. Cria planejamentos para cada dia
5. Aloca funcionários e define valores
6. Gerencia usuários e suas permissões
7. Aprova solicitações de alteração PIX

### 2. Líder de Operação
1. Faz login com email pessoal (@gmail.com ou outro)
2. Acessa Portal do Líder (interface mobile-first)
3. Vê seus planejamentos do dia
4. Faz check-in dos funcionários
5. Registra presença (Presente/Faltou/Parcial)
6. Lança vale/bônus rapidamente por CPF
7. Solicita alteração de PIX se necessário
8. Faz check-out ao final da operação

### 3. Usuário Comum
1. Faz login
2. Acessa apenas os módulos que o admin liberou
3. Pode visualizar, criar, editar ou excluir conforme permissões
4. Não vê dados financeiros (se não tiver permissão)

---

## Estrutura de Dados

### Tabelas Principais

**work_schedules** — Planejamentos/Escalas
- id, date, shiftId, clientId, unitId, leaderId, status, totalPayValue, totalReceiveValue, totalPeople, notes

**schedule_functions** — Funções dentro de um planejamento
- id, scheduleId, jobFunctionId, payValue, receiveValue

**schedule_allocations** — Funcionários alocados
- id, scheduleId, scheduleFunctionId, employeeId, payValue, receiveValue, mealAllowance, voucher, bonus, attendanceStatus, checkInTime, checkOutTime, allocNotes

**employees** — Funcionários
- id, name, cpf, rg, email, phone, pixKey, registrationDate, status, docFrontUrl, docBackUrl

**users** — Usuários do sistema
- id, email, role (admin/user/leader), createdAt

**user_permissions** — Permissões granulares
- id, userId, module, canView, canCreate, canEdit, canDelete

**pix_change_requests** — Solicitações de alteração PIX
- id, employeeId, requestedBy, oldPixKey, newPixKey, status, createdAt

---

## Endpoints Principais

### Planejamentos
- `schedules.list` — listar com filtros
- `schedules.create` — criar novo
- `schedules.update` — editar
- `schedules.delete` — excluir
- `schedules.getSummary` — resumo expandível
- `schedules.quickAddAllowance` — lançamento rápido

### Portal do Líder
- `portalLider.mySchedules` — meus planejamentos
- `portalLider.getScheduleDetail` — detalhes com alocações
- `portalLider.checkIn` — registrar chegada
- `portalLider.checkOut` — registrar saída
- `portalLider.setAttendance` — marcar presença
- `portalLider.requestPixChange` — solicitar alteração PIX
- `portalLider.quickRegisterEmployee` — cadastro rápido

### Financeiro
- `financeiro.accountsPayable.list` — contas a pagar
- `financeiro.accountsReceivable.list` — contas a receber
- `financeiro.paymentBatches.create` — criar lote
- Exportação: `/api/export/accounts-payable/excel` e `/api/export/accounts-payable/pdf`

### Usuários
- `usuarios.list` — listar usuários
- `usuarios.setRole` — atribuir perfil
- `usuarios.setPermissions` — definir permissões por módulo

---

## Segurança e Governança

✓ **RBAC Granular** — cada usuário tem permissões específicas por módulo e ação
✓ **Trava Anti-Duplicidade** — bloqueia alocação duplicada no mesmo dia
✓ **Auditoria Completa** — log de todas as ações com timestamp e usuário
✓ **Fluxo de Aprovação PIX** — solicitações pendentes até admin aprovar
✓ **Integridade Referencial** — cascata de deleção, sem órfãos
✓ **Validação de Dados** — CPF, CNPJ, valores, datas
✓ **Proteção de Dados Pagos** — não permite alterar alocação já processada em lote

---

## Testes

Todos os testes passando (55+ testes):
- ✓ Stress (50+ planejamentos, 50+ alocações)
- ✓ Segurança (RBAC, SQL injection, autenticação)
- ✓ Governança (fluxo PIX, cascata, integridade)
- ✓ Rastreabilidade (auditoria, check-in/out, presença)

Rodar testes:
```bash
pnpm test
```

---

## Deployment

O sistema está pronto para publicação no Manus. Clique em **Publish** na UI.

**Domínio:** `finhub-inteligente.manus.space` (customizável)
**Banco de Dados:** MySQL/TiDB (gerenciado)
**Armazenamento:** S3 (gerenciado)
**Autenticação:** Manus OAuth

---

## Próximos Passos Sugeridos

1. **Gráficos avançados** — adicionar Chart.js ao Dashboard com evolução mensal
2. **Integração bancária** — conectar com API de bancos para validar PIX
3. **Notificações** — alertas quando líder faz check-out, quando PIX é alterado
4. **Agendamento** — criar planejamentos recorrentes (mesmo cliente, mesmo turno)
5. **Importação em lote** — carregar funcionários/clientes via CSV

---

## Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.

**Versão:** 3.0.0  
**Data:** 30 de Março de 2026  
**Status:** Pronto para Produção ✓
