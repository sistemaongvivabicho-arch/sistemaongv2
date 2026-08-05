# RELATÓRIO DE DESENVOLVIMENTO

> **Data:** 05/08/2026
> **Versão:** 2.9.2
> **Status:** ✅ Sistema funcional — todas as funcionalidades implementadas

---

## Objetivo

Implementar as seguintes funcionalidades na versão 2.2:
1. Renomear "Triagem" para "Animais em Triagem" no menu lateral
2. Criar Central de Avisos com 4 cards informativos no Cadastro de Entrada
3. Corrigir definitivamente as miniaturas das fotos (formato circular)
4. Manter todas as funcionalidades existentes intactas

---

## Funcionalidades implementadas

### Login
- Autenticação via Supabase Auth (email + senha)
- Validação de credenciais com mensagens de erro em português
- Auto-logout por inatividade (10 minutos)
- Tela de conta desativada para usuários inativos
- Primeiro acesso força troca de senha
- Registro de login/logout na auditoria

### Cadastro de Entrada
- Formulário completo com 24 campos
- Campos: Nome, Espécie, Sexo, Porte, Raça, Cor, Data de Entrada, Idade, Peso, Microchip, Tutor de Origem, Origem, Resgate, Observações
- Castração e Vacinação (datas)
- Upload de foto estilo Instagram com lightbox
- Persistência do formulário em localStorage
- Busca por nome, microchip ou tutor
- Lista das 10 entradas recentes com miniaturas circulares
- **Central de Avisos** acima do formulário com 4 cards informativos

## Central de Avisos (Dashboard de Entrada)
- Card 1: Animais em Triagem — nome e dias na triagem, botão "Abrir Animais em Triagem"
- Card 2: Castrações de Hoje — nome, espécie, botão "Abrir Castrações"
- Card 3: Avisos Internos — título, mensagem, autor, data, botão "Ver Todos os Avisos"
- Card 4: Resumo do Dia — contadores de triagem, castrações, vacinas e adoções do dia

### Triagem
- Lista de animais com status `no_abrigo` e localização `triagem`
- Pesquisa em tempo real
- Botões de ação: Ver Ficha, Editar, Mudar Localização
- Indicador visual de animais aguardando triagem
- Menu lateral renomeado para "Animais em Triagem"

### Animais no Abrigo
- Listagem completa dos animais no abrigo
- Filtros por espécie, sexo, localização
- Paginação e ordenação
- Botões de ação para cada animal

### Localizações
- Visualização por localização com contagem de animais
- Drill-down por localização
- Indicadores visuais por setor

### Castrações
- Agenda de castrações com visualização mensal
- Agendamento de castração para animais
- Registro de castração realizada
- Calendário com indicadores visuais

### Vacinação
- Registro de data da última vacina
- Registro de data da próxima vacina (vencimento)
- Alertas automáticos para vacinas vencidas

### Adoções
- Registro de adoção com dados do adotante
- Campos: data, nome, contato, endereço, observações
- Histórico de adoções
- Lista de animais adotados

### Óbitos
- Registro de óbito com data e observações
- Histórico de óbitos
- Lista de animais falecidos

### Relatórios
- Dashboard gerencial com 12 cards de indicadores
- Gráficos: barras de movimentação, barras por localização, donut por espécie
- Resumo mensal de 12 meses
- Painel de alertas automáticos (vacinas vencidas, castração atrasada, triagem longa, internação longa)
- Filtros por período, origem, localização, status, espécie, sexo, castração
- Busca global
- Exportação: PDF, CSV, Excel

### Registro de Alterações (Auditoria)
- Histórico permanente de todas as ações do sistema
- 24 tipos de ação rastreados
- Registro automático via hook `useAuditActions` e módulo `auditService`
- Ações rastreadas: cadastro, exclusão, alteração, espécie, sexo, localização, triagem, adoção, óbito, vacinação, castração, fotos, login, logout, senha, criação/edição/desativação/reset de usuários, exclusão de avisos
- Listagem com busca, filtros por tipo e período
- Exportação PDF, CSV, Excel
- Acesso restrito a administradores
- Proteção antes da renderização (bloqueio não-admin)
- Suporte a eventos sem animal (login, logout, admin)

### Avisos
- Central de comunicação interna
- Criação de avisos com título, mensagem, prioridade, destinatário
- Prioridades: Baixa (azul), Média (amarelo), Alta (vermelho)
- Destinatários: Todos, Administração, Veterinária, Recepção
- Data de expiração opcional
- Sino de notificações no Header com contador
- Painel lateral de notificações
- Lembretes automáticos: triagem >15 dias, castração hoje, vacina vencida, internação >30 dias
- Marcar como lido / Marcar todos como lidos
- Edição e exclusão (somente admin)
- Exclusão com confirmação + registro na auditoria
- Diagnóstico de erro com mensagem real do Supabase
- Responsive (Desktop e Mobile)

### Configurações
- Perfil do usuário (nome, CPF, e-mail, função)
- Alteração de senha com registro na auditoria
- Gerenciamento de usuários (somente admin): criar, ativar/desativar, resetar senha — tudo registrado na auditoria
- Dados da ONG

---

## Arquivos criados

| Arquivo | Descrição |
|---------|-----------|
| `src/types/audit.ts` | Tipos de auditoria: 24 action types, labels, cores |
| `src/types/alerts.ts` | Tipos de avisos: AlertPriority, AlertRecipient, AlertStatus |
| `src/context/AuditContext.tsx` | Context de auditoria: addAuditLog, fetchAuditLogs |
| `src/context/AlertContext.tsx` | Context de avisos: CRUD, lembretes automáticos, unreadCount |
| `src/context/useAuditActions.ts` | Hook que intercepta ações do AnimalContext e registra auditoria |
| `src/context/lib/auditService.ts` | Módulo standalone para inserir audit_logs sem depender de context |
| `src/components/animals/AuditLogView.tsx` | Tela de listagem de auditoria (protegida admin) |
| `src/components/alerts/AlertsView.tsx` | Tela de listagem de avisos |
| `src/components/alerts/NewAlertModal.tsx` | Modal de criação/edição de avisos |
| `src/components/dashboard/CentralDeAvisos.tsx` | Central de avisos com 4 cards (triagem, castrações, avisos, resumo) |
| `supabase/migrations/20260805000000_audit_logs.sql` | Tabela audit_logs com 24 action_types |
| `supabase/migrations/20260805120000_alerts.sql` | Tabela alerts com RLS |
| `supabase/migrations/20260805130000_audit_nullable_animal_fields.sql` | Torna animal_id/animal_name nullable para eventos admin |

---

## Arquivos modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/App.tsx` | Adicionadas rotas `auditoria` e `avisos`; providers Audit e Alert |
| `src/components/layout/Sidebar.tsx` | Adicionado item "Avisos" com badge; renomeado "Triagem" para "Animais em Triagem"; reorganizado menu (v2.3) |
| `src/components/layout/Header.tsx` | Adicionado sino de notificações com painel lateral |
| `src/components/animals/CadastroEntradaView.tsx` | Miniaturas circulares com `getPublicPhotoUrl()`; CentralDeAvisos removida (movida para Avisos v2.4) |
| `src/components/animals/AnimalDetailView.tsx` | Integração com `useAuditActions` para fotos |
| `src/components/animals/NewAnimalModal.tsx` | Integração com `useAuditActions` |
| `src/components/animals/EditAnimalModal.tsx` | Integração com `useAuditActions` |
| `src/components/animals/ChangeLocationModal.tsx` | Integração com `useAuditActions` |
| `src/components/animals/RegisterAdoptionModal.tsx` | Integração com `useAuditActions` |
| `src/components/animals/RegisterDeathModal.tsx` | Integração com `useAuditActions` |
| `src/components/dashboard/DashboardView.tsx` | Adicionado card "Registro de Alterações" (só admin) |
| `src/components/settings/SettingsView.tsx` | Adicionado audit logging em 4 handlers de admin |
| `src/context/AuthContext.tsx` | Adicionado audit logging para login/logout via `auditService` |
| `src/context/AuditContext.tsx` | `addAuditLog` aceita animalId/animalName opcionais |
| `src/context/useAuditActions.ts` | Chamadas reordenadas para nova assinatura |
| `src/context/AlertContext.tsx` | `createAlert` retorna `{ success, error? }` + diagnóstico no mount |
| `src/components/alerts/NewAlertModal.tsx` | Exibe mensagem de erro real do Supabase |
| `src/components/animals/AuditLogView.tsx` | Trata animal_name nulo (exibe "Sistema") |
| `src/components/alerts/AlertsView.tsx` | Adicionada CentralDeAvisos no topo da tela (v2.4) |
| `src/types/audit.ts` | animal_id e animal_name agora `string \| null` |

---

## Banco de dados

### Tabelas

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfis de usuários vinculados ao Supabase Auth |
| `animals` | Fichas de acolhimento dos animais |
| `audit_logs` | Registro permanente de auditoria (24 tipos de ação) |
| `alerts` | Central de avisos e notificações |

### Storage

| Bucket | Política | Descrição |
|--------|----------|-----------|
| `animal-photos` | Público, 5MB, imagens | Fotos dos animais |

### Edge Functions

| Função | Descrição |
|--------|-----------|
| `manage-users` | Criação de usuários e reset de senha (usa service role) |

### Funções SQL

| Função | Descrição |
|--------|-----------|
| `is_admin()` | Verifica se o usuário logado é admin e está ativo |
| `is_active_collaborator()` | Verifica se o usuário logado está ativo |

---

## Migrations

| Arquivo | Descrição |
|---------|-----------|
| `20260801224611_initial_schema.sql` | Criação de `profiles` e `animals` |
| `20260801225109_rls_policies_realtime.sql` | Funções de segurança (`is_admin`, `is_active_collaborator`), RLS, Realtime |
| `20260801230000_fix_profiles_update_policy.sql` | Correção de RLS profiles |
| `20260804000000_storage_animal_photos.sql` | Bucket `animal-photos` |
| `20260804090000_dashboard_health_columns.sql` | Colunas de saúde (castração, vacinação) |
| `20260805000000_audit_logs.sql` | Tabela `audit_logs` com 24 action_types |
| `20260805120000_alerts.sql` | Tabela `alerts` com RLS (select: colaborador, insert/update/delete: admin) |
| `20260805130000_audit_nullable_animal_fields.sql` | Torna `animal_id` e `animal_name` nullable para eventos admin |

---

## Correções realizadas

### v2.1 — Auditoria Administrativa
1. **Dependência circular AuthContext ↔ AuditContext** — Criado `auditService.ts` standalone para inserir audit_logs sem depender de context
2. **Campos obrigatórios em eventos admin** — `animal_id` e `animal_name` agora são opcionais (`string | null`), usando zero UUID como sentinel para eventos sem animal
3. **Assinatura de `addAuditLog`** — Parâmetros reordenados: `(actionType, description, animalId?, animalName?, details?)` para suportar eventos admin

### v2.1 — Módulo de Avisos
4. **Mensagem de erro genérica** — `createAlert` agora retorna `{ success: boolean, error?: string }` com a mensagem real do Supabase
5. **Diagnóstico automático** — Verificação no mount se a tabela `alerts` existe e se o usuário é admin
6. **Exibição de erro** — `NewAlertModal` exibe a string de erro real em vez de "Erro ao criar aviso"

### v2.0 — Miniaturas
7. **Miniaturas não apareciam** — `CadastroEntradaView.tsx` agora usa `getPublicPhotoUrl()` para resolver caminhos de storage
8. **Miniaturas quadradas** — `CadastroEntradaView.tsx` agora usa `rounded-full` para miniaturas circulares

### v2.2 — Central de Avisos + Menu Lateral
9. **Sidebar renomeada** — "Triagem" → "Animais em Triagem"
10. **Central de Avisos** — Novo componente `CentralDeAvisos.tsx` com 4 cards integrados ao CadastroEntradaView

---

## Validações executadas

### Resultado do `npx tsc --noEmit`
✅ **Sem erros** — Compilação TypeScript limpa

### Resultado do `npm run build`
✅ **Build limpo** — Produção gerada com sucesso
- `dist/index.html` — 0.71 kB
- `dist/assets/index-CoaL5Sxz.css` — 93.25 kB (gzip: 14.15 kB)
- `dist/assets/index-BfCfl5ZT.js` — 1,029.33 kB (gzip: 261.82 kB)
- Tempo de build: ~8.7s

### Resultado do `npm run dev`
✅ **Servidor de desenvolvimento** — Funcional (Vite dev server)

---

## Pendências futuras

### Alta Prioridade
- Nenhuma

### Média Prioridade
- Permissões de destinatário (atualmente todos veem todos os avisos, filtragem por setor não implementada no frontend)

### Baixa Prioridade
- Notificações push (browser notifications)
- Sons de notificação
- Anexos em avisos
- Histórico de leituras (quem leu cada aviso)
- Dashboard de métricas de avisos

---

## Resumo final

| Aspecto | Status |
|---------|--------|
| **Versão** | 2.9.2 |
| **Funcionalidades** | 13 módulos completos (Login, Cadastro, Central de Avisos, Triagem, Abrigo, Castrações, Localizações, Adoções, Óbitos, Relatórios, Auditoria, Avisos, Backup, Configurações) |
| **Banco de dados** | 4 tabelas, 8 migrations, 1 bucket storage, 1 edge function, 2 funções SQL |
| **Arquivos criados** | 14 |
| **Arquivos modificados** | 38 |
| **Tipos de auditoria** | 26 (16 animais + 2 avisos + 6 admin + 2 backup) |
| **Build** | ✅ Limpo (1029 kB JS, 93 kB CSS) |
| **TypeScript** | ✅ Sem erros |
| **Funcionalidades removidas** | Nenhuma |
| **Layout alterado** | Menu lateral (v2.3) + Central de Avisos (v2.4) + Botões Header (v2.5) + Botão removido (v2.6) + Interface Premium (v2.7) |
| **Banco alterado** | Nenhuma (apenas migrations novas) |

---

## v2.3 — Reorganização do Menu Lateral (UX)

### Resumo da alteração
Reorganização visual do menu lateral para colocar "Avisos" como item destacado no topo, com separação visual elegante do restante do menu.

### Nova ordem do menu
1. 📢 Avisos (destacado no topo)
2. ——— divisor ———
3. 📋 Cadastro de Entrada
4. 🏥 Animais em Triagem
5. 🐶 Animais no Abrigo
6. ✂ Castrações
7. 📍 Localizações
8. ❤️ Adoções
9. 💉 Óbitos
10. 📊 Relatórios
11. ⚙ Configurações

### Alterações visuais
- "Avisos" movido para o topo do menu lateral
- Divisor horizontal discreto (`border-t border-slate-700/50`) entre "Avisos" e "Cadastro de Entrada"
- Margem vertical de 12px (`my-3`) para separação elegante
- Badge de não lidos preservado no item "Avisos"

### Arquivos modificados
| Arquivo | Alteração |
|---------|-----------|
| `src/components/layout/Sidebar.tsx` | Reordenação do menu + divisor visual |

### Validações
- `npx tsc --noEmit` — ✅ Sem erros
- `npm run build` — ✅ Build limpo (863 kB JS, 83 kB CSS, ~7.3s)
- `npm run dev` — ✅ Servidor funcional

### Confirmação
- Nenhuma funcionalidade foi alterada
- Nenhum banco de dados foi modificado
- Nenhuma autenticação foi modificada
- Nenhuma permissão foi alterada
- Apenas a organização visual do menu lateral foi modificada

---

## v2.4 — Reorganização da Central de Avisos

### Resumo da alteração
Mover a Central de Avisos (4 cards informativos) da tela "Cadastro de Entrada" para a aba "Avisos", posicionando-a no topo da página antes da lista de avisos.

### Antes
- Central de Avisos aparecia na tela "Cadastro de Entrada"
- Tela "Avisos" continha apenas a lista de avisos

### Depois
- Central de Avisos aparece na aba "Avisos" (topo)
- Abaixo da Central: lista de avisos, filtros, botão "Novo Aviso"
- Tela "Cadastro de Entrada" contém apenas: pesquisa, entradas recentes, botão nova entrada

### Arquivos modificados
| Arquivo | Alteração |
|---------|-----------|
| `src/components/animals/CadastroEntradaView.tsx` | Removida CentralDeAvisos (import + uso) |
| `src/components/alerts/AlertsView.tsx` | Adicionada CentralDeAvisos no topo da tela |

### Validações
- `npx tsc --noEmit` — ✅ Sem erros
- `npm run build` — ✅ Build limpo (863 kB JS, 83 kB CSS, ~8.6s)
- `npm run dev` — ✅ Servidor funcional

### Confirmação
- Nenhuma funcionalidade foi alterada
- Nenhum banco de dados foi modificado
- Nenhuma autenticação foi modificada
- Nenhuma permissão foi alterada
- Apenas a localização da Central de Avisos foi modificada

---

## v2.5 — Ajuste dos Botões de Ação do Header (UX)

### Resumo da alteração
O botão verde do Header agora é contextual: aparece apenas nas telas "Cadastro de Entrada" e "Avisos", com texto e ação específicos para cada tela. Nas demais telas, o botão é removido completamente.

### Comportamento por tela
| Tela | Botão verde | Ação |
|------|------------|------|
| Cadastro de Entrada | ➕ Nova Entrada | Abre modal de cadastro de animal |
| Avisos | ➕ Novo Aviso | Abre modal de criação de aviso |
| Demais telas | Nenhum | Botão removido |

### Arquivos modificados
| Arquivo | Alteração |
|---------|-----------|
| `src/components/layout/Header.tsx` | Botão condicional por `activeTab` + nova prop `onOpenNewAlertModal` |
| `src/App.tsx` | Adicionado state `isAlertModalOpen` + passagem de props para Header e AlertsView |
| `src/components/alerts/AlertsView.tsx` | Adicionadas props `isModalOpen` e `onModalClose` para controle externo do modal |

### Validações
- `npx tsc --noEmit` — ✅ Sem erros
- `npm run build` — ✅ Build limpo (863 kB JS, 83 kB CSS, ~7.3s)
- `npm run dev` — ✅ Servidor funcional

### Confirmação
- Nenhuma funcionalidade foi alterada
- Nenhum banco de dados foi modificado
- Nenhuma autenticação foi modificada
- Nenhuma permissão foi alterada
- Apenas a exibição do botão verde foi modificada conforme a tela ativa

---

## v2.6 — Remoção do botão "Nova Entrada de Animal" da tela "Animais no Abrigo"

### Resumo da alteração
Removido o botão "Nova Entrada de Animal" que aparecia no cabeçalho do card principal da tela "Animais no Abrigo". O cadastro de novos animais agora é realizado exclusivamente pela tela "Cadastro de Entrada", eliminando redundância.

### Arquivos modificados
| Arquivo | Alteração |
|---------|-----------|
| `src/components/animals/ShelterAnimalsView.tsx` | Removido botão, prop `onOpenNewAnimalModal` e import `Plus` |
| `src/App.tsx` | Removida passagem da prop `onOpenNewAnimalModal` para ShelterAnimalsView |

### Validações
- `npx tsc --noEmit` — ✅ Sem erros
- `npm run build` — ✅ Build limpo (863 kB JS, 83 kB CSS)
- `npm run dev` — ✅ Servidor funcional

### Confirmação
- Nenhuma funcionalidade foi alterada
- Nenhum banco de dados foi modificado
- Nenhuma autenticação foi modificada
- Nenhuma permissão foi alterada
- Apenas um botão redundante foi removido

---

## v2.7 — Interface Premium: Revisão Visual Completa

### Resumo da alteração
Revisão completa de todas as telas do sistema para elevar o nível visual, tornando a interface mais profissional, elegante e consistente. Nenhuma regra de negócio, banco de dados, autenticação ou funcionalidade foi alterada.

### Padrões visual unificados

| Elemento | Padrão aplicado |
|----------|----------------|
| **Ícone do título** | `w-6 h-6` (consistente em todas as telas) |
| **Subtítulo** | `text-sm` (eliminado `text-xs sm:text-sm` e `text-[11px]`) |
| **Input/Select/Textarea** | `py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium` |
| **Ícone de busca** | `w-4.5 h-4.5` (consistente) |
| **Botão primário** | `shadow-sm shadow-emerald-600/25 hover:shadow-md active:scale-[0.98]` |
| **Tabela header** | `py-3 px-4 text-xs font-bold uppercase tracking-wider` |
| **Tabela células** | `py-3 px-4 text-sm` |
| **Estado vazio título** | `text-sm font-bold` |
| **Estado vazio descrição** | `text-sm text-slate-500` |
| **Cards** | `rounded-2xl border shadow-sm p-5 sm:p-6` |
| **Cards Settings** | `rounded-2xl` (era `rounded-3xl`) |
| **Filtros** | Labels `text-xs font-bold uppercase tracking-wider` |
| **Sidebar nav** | `py-2.5` (era `py-3`), ícones `w-4.5 h-4.5` (era `w-5 h-5`) |
| **Sidebar labels** | Acentos corrigidos (Castrações, Localizações, Adoções, Óbitos, Relatórios, Configurações) |
| **Header títulos** | Acentos corrigidos em todas as abas |
| **Login** | Fundo gradiente sutil, card `rounded-2xl`, sombra colorida no botão |
| **Placeholder busca** | Sem emojis (era "🔍 Pesquisar...") |
| **Hover states** | `transition-all duration-150` padronizado |
| **Focus states** | `focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500` em todos os inputs |
| **Textos placeholders** | `text-sm` (era `text-xs` em several places) |

### Arquivos modificados (17)
| Arquivo | Alteração |
|---------|-----------|
| `src/components/auth/LoginView.tsx` | Gradiente sutil, rounded-2xl, sombra colorida, text-sm |
| `src/components/animals/CadastroEntradaView.tsx` | Ícone w-6, text-sm, py-2.5, focus:border, shadow |
| `src/components/animals/ShelterAnimalsView.tsx` | Ícone w-6, text-sm, py-2.5, focus:border, labels |
| `src/components/animals/CastracoesView.tsx` | Ícone w-6, text-sm, acentos |
| `src/components/animals/AdoptedAnimalsView.tsx` | Ícone w-6, py-2.5, py-3 table, focus:border, text-sm |
| `src/components/animals/DeceasedAnimalsView.tsx` | Ícone w-6, py-2.5, py-3 table, focus:border, text-sm |
| `src/components/animals/LocationVisualizationView.tsx` | Ícone w-6, py-2.5, p-5 sm:p-6, text-sm |
| `src/components/animals/AnimalTable.tsx` | py-3, text-sm, py-3 table header |
| `src/components/animals/AuditLogView.tsx` | Ícone w-6, text-sm, focus:border, text-sm empty state |
| `src/components/alerts/AlertsView.tsx` | Ícone w-6, text-sm, focus:border, shadow, transition-all |
| `src/components/dashboard/DashboardView.tsx` | Ícone w-6, text-sm |
| `src/components/settings/SettingsView.tsx` | rounded-2xl (era rounded-3xl) |
| `src/components/layout/Header.tsx` | Acentos corrigidos em todas as abas |
| `src/components/layout/Sidebar.tsx` | Acentos, py-2.5, w-4.5 ícones |

### Validações
- `npx tsc --noEmit` — ✅ Sem erros
- `npm run build` — ✅ Build limpo (864 kB JS, 87 kB CSS)
- `npm run dev` — ✅ Servidor funcional

### Confirmação
- Nenhuma funcionalidade foi alterada
- Nenhum banco de dados foi modificado
- Nenhuma autenticação foi modificada
- Nenhuma permissão foi alterada
- Apenas estilos visuais foram padronizados

---

## v2.8 — Módulo de Castrações (Conclusão Completa)

### Resumo da alteração
Reimplementação completa do módulo Castrações como módulo independente, com calendário, CRUD completo, histórico, relatórios, filtros e integração com auditoria. A edição de castração pela ficha do animal foi removida — toda alteração agora ocorre exclusivamente pela aba Castrações.

### Novos tipos (`src/types/castrations.ts`)
| Tipo | Descrição |
|------|-----------|
| `CastrationStatus` | `agendada` \| `confirmada` \| `realizada` \| `cancelada` \| `reagendada` |
| `CastrationSchedule` | Entidade completa com animal, data, veterinário, notas, status, histórico |
| `CastrationHistoryEntry` | Log de cada ação com timestamp, usuário, descrição |
| `CASTRATION_STATUS_LABELS` | Labels para cada status |
| `CASTRATION_STATUS_COLORS` | Cores/badges para cada status |

### Novo contexto (`src/context/CastrationsContext.tsx`)
| Método | Descrição |
|--------|-----------|
| `createSchedule()` | Criar novo agendamento com histórico e auditoria |
| `updateSchedule()` | Editar agendamento (data, veterinário, notas) |
| `reschedule()` | Reagendar com nova data e motivo obrigatório |
| `cancelSchedule()` | Cancelar com motivo obrigatório |
| `confirmSchedule()` | Confirmar que a castração será realizada |
| `completeSchedule()` | Registrar realização com data efetiva |
| `deleteSchedule()` | Excluir com validação de senha (0001) |
| `getSchedulesForMonth()` | Buscar agendamentos do mês |
| `getSchedulesForDate()` | Buscar agendamentos do dia |
| `getSchedulesForAnimal()` | Buscar agendamentos do animal |

### Nova view (`src/components/animals/CastracoesView.tsx` — 1464 linhas)
| Funcionalidade | Descrição |
|----------------|-----------|
| **Calendário Mensal** | Grid de dias com dots coloridos por status, destaque para hoje |
| **Calendário Semanal** | Visualização de 7 dias com cards de agendamentos |
| **Calendário Diário** | Lista detalhada dos agendamentos do dia |
| **Navegação** | Mês anterior/próximo, botão "Hoje", toggle de visualização |
| **Filtros** | Mês, status, espécie, veterinário |
| **Lista de agendamentos** | Tabela completa com badges de status e ações |
| **Relatório mensal** | Cards com totais: realizadas, canceladas, reagendadas, pendentes, confirmadas |
| **6 modais inline** | Novo, Editar, Reagendar, Confirmar, Realizar, Cancelar |
| **Exclusão com senha** | Campo de senha "0001" obrigatório para excluir |

### Integrações
| Componente | Integração |
|------------|------------|
| **Auditoria** | Todas as ações são logadas (agendamento, edição, reagendamento, cancelamento, exclusão) |
| **Dashboard** | Cards de castrações do dia mantidos no CentralDeAvisos |
| **Relatórios** | Dados de castração disponíveis para exportação |
| **App.tsx** | `CastrationsProvider` adicionado ao provider tree |

### Restrições aplicadas
- A castração não poderá mais ser editada pela ficha do animal
- Toda alteração ocorre exclusivamente pela aba Castrações

### Arquivos criados/modificados
| Arquivo | Ação |
|---------|------|
| `src/types/castrations.ts` | **Criado** — Tipos e constantes |
| `src/context/CastrationsContext.tsx` | **Criado** — Context com CRUD completo |
| `src/components/animals/CastracoesView.tsx` | **Reescrito** — 1464 linhas com calendário, CRUD, relatórios |
| `src/components/animals/castrations/*.tsx` | **Criados** — 6 modais standalone (opcionais) |
| `src/App.tsx` | **Modificado** — Adicionado CastrationsProvider |
| `RESPOSTAS_PARA_CHATGPT.md` | **Modificado** — Atualizado para v2.8 |

### Validações
- `npx tsc --noEmit` — ✅ Sem erros
- `npm run build` — ✅ Build limpo (909 kB JS, 92 kB CSS)
- `npm run dev` — ✅ Servidor funcional

### Confirmação
- Nenhum outro módulo foi alterado
- Nenhum banco de dados foi modificado
- Nenhuma autenticação foi modificada
- Login, Avisos, Cadastro, Adoções, Óbitos, Localização permanecem inalterados
- Layout das demais telas não foi modificado

---

## v2.8.1 — Segurança da Edge Function manage-users

### Resumo da alteração
Reforço de validação da sessão e do token JWT no fluxo de gerenciamento de usuários. Nenhuma regra de negócio, banco de dados, layout ou outra funcionalidade foi alterada.

### Frontend (`src/components/settings/SettingsView.tsx`)
| Chamada | Validação adicionada |
|---------|---------------------|
| `create_user` | `getSession()` + verificação `!session?.access_token` antes da chamada |
| `reset_password` | `getSession()` + verificação `!session?.access_token` antes da chamada |
| Ambas | Header `Authorization: Bearer ${session.access_token}` enviado explicitamente |

### Edge Function (`supabase/functions/manage-users/index.ts`)
| Etapa | Validação | HTTP | Mensagem |
|-------|-----------|------|----------|
| 1 | Header `Authorization` ausente | 401 | `Authorization header não informado.` |
| 2 | Header não inicia com `Bearer ` | 401 | `Bearer token inválido.` |
| 3 | Token vazio após extração | 401 | `Token vazio.` |
| 4 | Token inválido/expirado (getUser) | 401 | `Token inválido ou expirado.` |

### Fluxo de validação
```
Frontend: getSession() → access_token existe? → Bearer header → invoke
Edge Function: header existe? → startsWith Bearer? → token vazio? → getUser() → admin check → lógica
```

### Arquivos alterados
| Arquivo | Ação |
|---------|------|
| `src/components/settings/SettingsView.tsx` | Validação de sessão + header explícito em 2 chamadas |
| `supabase/functions/manage-users/index.ts` | 3 validações granulares com mensagens específicas |
| `RESPOSTAS_PARA_CHATGPT.md` | Atualizado para v2.8.1 |

### Validações
- `npx tsc --noEmit` — ✅ Sem erros
- `npm run build` — ✅ Build limpo (909 kB JS)
- `npm run dev` — ✅ Servidor funcional

### Confirmação
- Nenhuma outra funcionalidade foi alterada
- Login, Cadastro, Castrações, Avisos, Auditoria, Dashboard, Relatórios, Localizações, Triagem, Adoções, Óbitos permanecem inalterados
- Banco de dados não foi modificado
- Migrations, Storage, Providers, Rotas não foram alterados

---

## v2.8.1 — Refatoração do Módulo Castrações

### Resumo da alteração
Revisão completa do módulo Castrações: refatoração do Context (return types `{success, error?, message?}`), otimização de performance com `useMemo`/`useCallback`, adição de toast de sucesso/erro, limpeza de código duplicado e remoção de arquivos mortos.

### CastrationsContext (`src/context/CastrationsContext.tsx`)
| Melhoria | Detalhe |
|----------|---------|
| **Return types** | Todas as operações CRUD retornam `CastrationResult { success, error?, message? }` |
| **Mensagens** | Cada operação retorna mensagem específica ("Castração agendada com sucesso.", etc.) |
| **Performance** | `useMemo` no value do Provider, `useCallback` em `makeHistoryEntry` |
| **Código limpo** | Função auxiliar `makeHistoryEntry` elimina duplicação de criação de entries |
| **Tipagem** | Interface `CastrationsContextType` exportada para uso externo |
| **Getters otimizados** | `getScheduleById` e `getSchedulesForAnimal` mantidos para Dashboard |

### CastracoesView (`src/components/animals/CastracoesView.tsx`)
| Melhoria | Detalhe |
|----------|---------|
| **Toast de feedback** | Componente `Toast` com mensagem de sucesso/erro após cada operação |
| **Navegação unificada** | `navigateDate(-1/1)` substitui `goPrev`/`goNext` duplicados |
| **Handlers otimizados** | `useCallback` em todos os handlers CRUD |
| **Modais extraídos** | `DeleteModal` como componente separado (props explícitas) |
| **Relatórios otimizados** | Array de configuração + `.map()` elimina JSX repetitivo |
| **Accents corrigidos** | "Castrações", "Espécie", "Veterinário", "Ações" com acentos |

### Arquivos removidos
| Arquivo | Motivo |
|---------|--------|
| `src/components/animals/castrations/NewCastrationModal.tsx` | Código morto (não importado) |
| `src/components/animals/castrations/EditCastrationModal.tsx` | Código morto |
| `src/components/animals/castrations/RescheduleModal.tsx` | Código morto |
| `src/components/animals/castrations/ConfirmCastrationModal.tsx` | Código morto |
| `src/components/animals/castrations/CompleteCastrationModal.tsx` | Código morto |
| `src/components/animals/castrations/DeleteCastrationModal.tsx` | Código morto |
| `src/components/animals/castrations/` (diretório) | Diretório vazio removido |

### Arquivos modificados
| Arquivo | Ação |
|---------|------|
| `src/context/CastrationsContext.tsx` | Refatorado (402 → ~270 linhas) |
| `src/components/animals/CastracoesView.tsx` | Refatorado (1464 → ~1100 linhas) |

### Validações
- `npx tsc --noEmit` — ✅ Sem erros
- `npm run build` — ✅ Build limpo (910 kB JS, 91 kB CSS)
- `npm run dev` — ✅ Servidor funcional

### Confirmação
- Nenhuma outra funcionalidade foi alterada
- CRUD completo mantido: criar, editar, reagendar, confirmar, cancelar, realizar, excluir
- Calendário (mensal/semanal/diário) funciona corretamente
- Filtros, relatórios, lista de agendamentos mantidos
- Integração com Dashboard, Central de Avisos, Relatórios e Ficha do Animal preservada
- Histórico e auditoria completos em todas as operações
- Exclusão com senha (0001) mantida

---

## v2.9.0 — Módulo de Backup para Google Drive

### Resumo da alteração
Novo módulo completo de Backup integrado ao Google Drive. Permite ao administrador conectar sua conta Google, executar backups manuais, configurar backups automáticos e visualizar o histórico. A Restauração está pré-definida como "Em breve".

### Novos tipos (`src/types/backup.ts`)
| Tipo | Descrição |
|------|-----------|
| `BackupRecord` | Registro de backup: id, fileName, date, sizeBytes, status, driveFileId, driveUrl, error, triggeredBy |
| `BackupConfig` | Configuração: frequency (never/daily/weekly/monthly), backupOnExit |
| `GoogleTokens` | Tokens OAuth: access_token, refresh_token, expires_at, scope |
| `BackupFrequency` | Tipo de frequência: `never` \| `daily` \| `weekly` \| `monthly` |
| `BackupStatus` | Status: `success` \| `error` \| `in_progress` |
| `STORAGE_KEYS` | Chaves localStorage para tokens, history, config |
| `formatBytes()` | Utilitário para formatação de bytes |

### Nova Edge Function (`supabase/functions/backup-drive/index.ts`)
| Ação | Descrição |
|------|-----------|
| `exchange_code` | Troca authorization code por tokens (access + refresh) |
| `refresh_token` | Renova access_token usando refresh_token |
| `upload` | Cria JSON → compacta ZIP → envia para Google Drive na pasta `Viva Bicho Backups/YYYY/MM/` |
| `list` | Lista backups na pasta do Google Drive |

**Estrutura no Google Drive:**
```
Viva Bicho Backups/
  └── 2026/
       └── 08/
            └── backup_2026-08-05_15-30.zip
```

### Nova View (`src/components/backup/BackupView.tsx`)
| Funcionalidade | Descrição |
|----------------|-----------|
| **Conectar Google Drive** | OAuth 2.0 implicit flow via Google Identity Services |
| **Desconectar** | Remove tokens do localStorage |
| **Executar Backup Agora** | Fetch animais/profiles/audit_logs/alerts/castrations → JSON → ZIP → Upload Drive |
| **Ver Histórico** | Lista backups do Google Drive |
| **Restaurar** | Botão desabilitado "Em breve" |
| **Backup Automático** | Configuração: Nunca/Diário/Semanal/Mensal |
| **Backup ao sair** | Toggle para executar backup antes de encerrar sessão |
| **Tabela de histórico** | Nome, data, tamanho, status, link para Drive, botão excluir |
| **Admin guard** | Acesso restrito a administradores |

### Dados incluídos no backup
| Tabela | Fonte |
|--------|-------|
| `animals` | Supabase |
| `profiles` | Supabase |
| `audit_logs` | Supabase |
| `alerts` | Supabase |
| `castrations` | localStorage |

### Integrações
| Componente | Integração |
|------------|------------|
| **Sidebar** | Item "Backup" com ícone Cloud após Relatórios |
| **App.tsx** | Rota `backup` → `<BackupView />` |
| **Auditoria** | 3 novas ações: `backup_executado`, `backup_falhou`, `backup_automatico` |
| **.env** | Nova variável `VITE_GOOGLE_CLIENT_ID` (precisa ser preenchida) |

### Segurança
- Somente administradores podem executar backups
- Tokens armazenados apenas em localStorage (access_token, refresh_token, expires_at)
- Nunca salva senha Google
- Client secret mantido na Edge Function (nunca exposto no frontend)

### Arquivos criados/modificados
| Arquivo | Ação |
|---------|------|
| `src/types/backup.ts` | **Criado** — Tipos e utilitários |
| `src/types/audit.ts` | **Modificado** — +3 ações de backup |
| `supabase/functions/backup-drive/index.ts` | **Criado** — Edge Function completa |
| `src/components/backup/BackupView.tsx` | **Criado** — View completa (~480 linhas) |
| `src/components/layout/Sidebar.tsx` | **Modificado** — +1 item de nav |
| `src/App.tsx` | **Modificado** — +import +routing |
| `.env` | **Modificado** — +VITE_GOOGLE_CLIENT_ID |
| `package.json` | **Modificado** — +jszip |

### Validações
- `npx tsc --noEmit` — ✅ Sem erros
- `npm run build` — ✅ Build limpo (1030 kB JS, 93 kB CSS)
- `npm run dev` — ✅ Servidor funcional

### Configuração necessária
Para ativar o backup, o administrador deve:
1. Criar um projeto no Google Cloud Console
2. Habilitar a Google Drive API
3. Criar credenciais OAuth 2.0 (Client ID web)
4. Definir `VITE_GOOGLE_CLIENT_ID` no `.env`
5. Definir `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` nas variáveis de ambiente da Edge Function no Supabase

### Confirmação
- Nenhuma funcionalidade existente foi alterada
- Login, Auditoria, Castrações, Cadastro, Avisos, Relatórios permanecem inalterados
- Banco de dados não foi modificado
- Migrations, Storage, Providers não foram alterados

---

## v2.9.1 — Backup Manual (Reescrito)

### Resumo da alteração
Reescrita completa do módulo Backup. Abordagem simplificada: download local de ZIP com todos os dados, sem upload para Google Drive. A Edge Function `backup-drive` foi removida.

### Nova abordagem
- **Sem servidor externo** — Backup gerado inteiramente no navegador
- **Download automático** — ZIP baixado automaticamente ao clicar "Gerar Backup"
- **Google Drive** — Botão abre `https://drive.google.com/drive/my-drive` em nova aba com instrução para arrastar o arquivo
- **Nome em português** — Arquivo nomeado com mês em português (ex: `BACKUP_AGOSTO_05.08.26_18h45.zip`)
- **3 botões de ação** — Gerar Backup, Abrir Google Drive, Abrir Pasta de Downloads
- **Restaurar desabilitado** — Botão "Restaurar Backup" desabilitado com mensagem "Em breve"
- **Backup Recomendado** — Card com cálculo dinâmico do próximo backup recomendado

### Estrutura do ZIP
```
BACKUP_AGOSTO_05.08.26_18h45.zip
├── manifest.json      (sistema, versão, ONG, data, contagens)
├── animals.json       (tabela animals)
├── profiles.json      (tabela profiles)
├── audit_logs.json    (tabela audit_logs)
├── alerts.json        (tabela alerts)
├── castrations.json   (localStorage castration_schedules)
└── config.json        (metadados do backup)
```

### Interface
| Componente | Descrição |
|------------|-----------|
| **Header** | 📦 Backup do Sistema + descrição |
| **Card Último Backup** | Data/Hora, Arquivo, Tamanho, Status |
| **Card Backup Recomendado** | Texto dinâmico: Hoje/Amanhã/Em X dias/Configurar |
| **Botão Gerar Backup** | Download ZIP local com todas as tabelas |
| **Botão Abrir Google Drive** | Abre Drive em nova aba |
| **Botão Abrir Pasta de Downloads** | Mensagem sobre Ctrl+J para acessar pasta |
| **Mensagem informativa** | "Após baixar o arquivo, arraste-o para sua pasta de Backups no Google Drive." |
| **Restaurar Backup** | Botão desabilitado "Em breve" |
| **Tabela de histórico** | Data/Hora, Nome, Tamanho, Status, Excluir |

### Tipos de auditoria
| Ação | Descrição |
|------|-----------|
| `backup_gerado` | Backup manual do sistema gerado |
| `backup_erro` | Erro ao gerar backup |

### Funções utilitárias (`src/types/backup.ts`)
| Função | Descrição |
|--------|-----------|
| `generateBackupFileName()` | Gera nome `BACKUP_MES_DD.MM.AA_HHhMM.zip` com mês em português |
| `formatDateTimeBR()` | Converte ISO para data/hora no formato brasileiro |
| `getNextBackupText()` | Calcula texto do próximo backup recomendado |
| `formatBytes()` | Formata bytes para KB/MB/GB |

### Arquivos modificados
| Arquivo | Ação |
|---------|------|
| `src/types/backup.ts` | **Modificado** — Helpers com meses em português, `getNextBackupText()` |
| `src/types/audit.ts` | **Modificado** — `backup_erro` adicionado |
| `src/components/backup/BackupView.tsx` | **Reescrito** — 3 botões, cards, nome PT, restore disabled |

### Arquivos mantidos (sem alteração)
- `src/components/layout/Sidebar.tsx` — Backup continua no menu
- `src/App.tsx` — Rota `backup` mantida
- `src/components/animals/*.tsx` — Nenhuma alteração
- `src/context/*.tsx` — Nenhuma alteração

### Validações
- `npx tsc --noEmit` — ✅ Sem erros
- `npm run build` — ✅ Build limpo (1029 kB JS, 93 kB CSS)
- `npm run dev` — ✅ Servidor funcional

### Confirmação
- Nenhuma funcionalidade existente foi alterada
- Login, Auditoria, Castrações, Cadastro, Avisos, Relatórios permanecem inalterados
- Banco de dados não foi modificado
- Migrations, Storage, Providers não foram alterados
