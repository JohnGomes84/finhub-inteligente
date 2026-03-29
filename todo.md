# FinHub Inteligente - TODO

## Fase 1: Estrutura Base - Banco de Dados, Autenticação e Módulos de Controle

### Banco de Dados
- [x] Criar tabelas de usuários com roles (admin/user)
- [x] Criar tabelas de lançamentos financeiros (transactions)
- [x] Criar tabelas de categorias de lançamentos
- [x] Criar tabelas de contas bancárias
- [x] Criar tabelas de documentos fiscais (notas, recibos)
- [x] Criar tabelas de logs de auditoria
- [x] Executar migrações SQL no banco de dados

### Autenticação e Segurança
- [x] Validar integração OAuth (já configurada)
- [x] Implementar controle de acesso baseado em roles (RBAC)
- [x] Criar procedimento protegido para admin
- [x] Implementar criptografia de dados sensíveis
- [x] Configurar política de LGPD (consentimento, dados mínimos)

### Módulos de Controle (Backend)
- [x] Criar módulo de controle de usuários
- [x] Criar módulo de controle de lançamentos
- [x] Criar módulo de controle de categorias
- [x] Criar módulo de controle de contas bancárias
- [ ] Criar módulo de controle de documentos
- [x] Criar módulo de logs de auditoria

---

## Fase 2: Módulo de Lançamentos - Interface e Gerenciamento

### Interface de Lançamentos
- [x] Criar página de listagem de lançamentos
- [ ] Criar formulário de novo lançamento (pagamento/recebimento)
- [x] Implementar categorização de lançamentos
- [x] Adicionar filtros (período, categoria, status)
- [ ] Implementar edição e exclusão de lançamentos
- [x] Adicionar validações de entrada

### Gerenciamento de Categorias
- [x] Criar interface de gerenciamento de categorias
- [x] Permitir criar/editar/deletar categorias
- [x] Associar categorias a lançamentos

### Testes
- [x] Criar testes para criação de lançamentos
- [ ] Criar testes para edição de lançamentos
- [ ] Criar testes para exclusão de lançamentos

---

## Fase 3: Dashboard Financeiro - Visualização e Gráficos

### Dashboard Principal
- [x] Criar layout de dashboard com sidebar
- [x] Exibir saldo total consolidado
- [x] Exibir receitas do período
- [x] Exibir despesas do período
- [x] Exibir fluxo de caixa (entradas vs saídas)

### Gráficos e Visualizações
- [x] Gráfico de fluxo de caixa (linha/coluna)
- [x] Gráfico de despesas por categoria (pizza/donut)
- [x] Gráfico de receitas por categoria (pizza/donut)
- [ ] Gráfico de evolução mensal (linha)
- [x] Indicadores KPI (saldo, receita, despesa)

### Filtros e Períodos
- [ ] Filtro por período (dia, semana, mês, ano, customizado)
- [ ] Filtro por categoria
- [ ] Filtro por status de conciliação

---

## Fase 4: Upload e Processamento de Arquivos

### Upload de Arquivos
- [ ] Implementar interface de upload (drag-and-drop)
- [ ] Suportar formatos: OFX, XML, PDF, PNG, JPG
- [ ] Validar tamanho e tipo de arquivo
- [ ] Armazenar arquivos em S3 com referências no BD

### Processamento de Arquivos
- [ ] Parser para OFX (extratos bancários)
- [ ] Parser para XML (notas fiscais)
- [ ] Extrator de dados de PDF (OCR/LLM)
- [ ] Extrator de dados de imagens (OCR/LLM)

### Testes
- [ ] Criar testes de upload de arquivos
- [ ] Criar testes de parsing de OFX
- [ ] Criar testes de parsing de XML

---

## Fase 5: Inteligência de Dados - Extração Automática com IA

### Integração com LLM
- [ ] Configurar chamadas ao LLM para OCR de PDFs
- [ ] Configurar chamadas ao LLM para OCR de imagens
- [ ] Extrair dados estruturados de documentos
- [ ] Sugerir categorização automática

### Processamento Inteligente
- [ ] Identificar tipo de documento (nota fiscal, recibo, etc)
- [ ] Extrair valor, data, fornecedor/cliente
- [ ] Validar dados extraídos
- [ ] Propor lançamentos automáticos

### Testes
- [ ] Criar testes de extração de dados de PDF
- [ ] Criar testes de extração de dados de imagens
- [ ] Criar testes de categorização automática

---

## Fase 6: Conciliação Bancária - Cruzamento Automático

### Lógica de Conciliação
- [ ] Implementar algoritmo de matching entre extratos e lançamentos
- [ ] Suportar matching por valor, data e descrição
- [ ] Identificar lançamentos não conciliados
- [ ] Identificar transações duplicadas

### Interface de Conciliação
- [ ] Criar página de conciliação bancária
- [ ] Exibir lançamentos pendentes vs extratos
- [ ] Permitir conciliação manual
- [ ] Exibir status de conciliação (conciliado, pendente, divergência)

### Testes
- [ ] Criar testes de matching automático
- [ ] Criar testes de detecção de duplicatas
- [ ] Criar testes de conciliação manual

---

## Fase 7: Alertas, Notificações e Relatórios

### Sistema de Alertas
- [ ] Alertas de vencimento de pagamentos
- [ ] Alertas de recebimentos atrasados
- [ ] Alertas de saldo baixo
- [ ] Alertas de divergências na conciliação

### Notificações
- [ ] Implementar notificações no sistema
- [ ] Enviar notificações por email (opcional)
- [ ] Exibir notificações no dashboard

### Relatórios
- [ ] Relatório de fluxo de caixa
- [ ] Relatório de despesas por categoria
- [ ] Relatório de receitas por categoria
- [ ] Relatório de conciliação bancária
- [ ] Exportar relatórios em PDF/Excel

### Testes
- [ ] Criar testes de geração de alertas
- [ ] Criar testes de geração de relatórios

---

## Fase 8: Auditoria e Segurança - Logs e Conformidade LGPD

### Logs de Auditoria
- [ ] Registrar todas as operações financeiras sensíveis
- [ ] Incluir usuário, data/hora, operação, valores
- [ ] Permitir consulta de logs por período
- [ ] Implementar retenção de logs

### Conformidade LGPD
- [ ] Criar política de privacidade
- [ ] Implementar consentimento para coleta de dados
- [ ] Permitir exportação de dados do usuário
- [ ] Permitir exclusão de dados (direito ao esquecimento)
- [ ] Documentar processamento de dados sensíveis

### Segurança Adicional
- [ ] Implementar rate limiting
- [ ] Implementar validação de entrada
- [ ] Implementar proteção contra SQL injection
- [ ] Implementar proteção contra XSS

### Testes
- [ ] Criar testes de logs de auditoria
- [ ] Criar testes de conformidade LGPD

---

## Entrega Final

- [ ] Documentação técnica completa
- [ ] Guia de uso para usuários
- [ ] Guia de administração
- [ ] Checkpoint final e publicação
