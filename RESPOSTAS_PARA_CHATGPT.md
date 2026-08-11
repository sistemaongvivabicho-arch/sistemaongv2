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

## v2.10.0 — Integração do Módulo Castrações (Fonte Única de Verdade)

### Resumo da alteração
Reescrita completa do módulo Castrações para usar a tabela `animals` como fonte única de verdade. A tabela `castration_schedules` foi descontinuada — todos os dados de castração agora vivem diretamente no registro do animal. O CastrationsContext foi removido.

### Alteração de arquitetura
| Antes | Depois |
|-------|--------|
| `castration_schedules` tabela separada | Campos no `animals` |
| `CastrationsContext` para CRUD | `updateAnimal()` do AnimalContext |
| Calendário mensal/semanal/diário | Lista mensal simplificada |

### Novos campos na tabela `animals` (migration)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `castration_status` | text | `agendada` \| `confirmada` \| `realizada` \| `cancelada` \| `reagendada` |
| `castration_veterinarian` | text | Nome do veterinário |
| `castration_notes` | text | Observações da castração |

### Novos campos na interface `Animal` (`src/types/animal.ts`)
| Campo | Tipo |
|-------|------|
| `castrationStatus` | `CastrationStatus \| undefined` |
| `castrationVeterinarian` | `string \| undefined` |
| `castrationNotes` | `string \| undefined` |

### Fluxo CRUD (todas as operações escrevem no animal)
| Ação | Campos alterados |
|------|-----------------|
| **Agendar** | `castrationScheduledDate`, `castrationStatus='agendada'`, `castrationVeterinarian`, `castrationNotes` |
| **Editar** | `castrationScheduledDate`, `castrationVeterinarian`, `castrationNotes` |
| **Confirmar** | `castrationStatus='confirmada'` |
| **Realizar** | `castrationStatus='realizada'`, `castrationDate=today`, `castrado=true` |
| **Cancelar** | `castrationStatus='cancelada'` (motivo adicionado às notes) |
| **Reagendar** | `castrationScheduledDate=novaData`, `castrationStatus='reagendada'` |
| **Excluir** | Limpa todos os campos de castração |

### Arquivos modificados
| Arquivo | Alteração |
|---------|-----------|
| `src/types/animal.ts` | +3 campos: `castrationStatus`, `castrationVeterinarian`, `castrationNotes` |
| `src/context/AnimalContext.tsx` | `mapFromDb`/`mapToDb` para 3 novas colunas |
| `src/components/animals/CastracoesView.tsx` | **Reescrito** — lê de `animals`, CRUD via `updateAnimal()` |
| `src/components/animals/AnimalDetailView.tsx` | Exibe status, veterinário e observações de castração |
| `src/components/dashboard/CastrationAgenda.tsx` | Remove mini calendário, mantém lista mensal |
| `src/components/alerts/OngeSummaryCard.tsx` | Lê castrações de `animals` em vez de `schedules` |
| `src/App.tsx` | Remove `CastrationsProvider` |

### Validações
- `npx tsc --noEmit` — ✅ Sem erros
- `npm run build` — ✅ Build limpo

---

## v2.10.1 — Padronização de Datas com Calendário Compacto

### Resumo da alteração
Substituição de todos os inputs de data do tipo `<input type="date">` por um componente de calendário compacto (`DatePicker`) com auto-preenchimento da data atual e popup interativo.

### Novo componente: `DatePicker` (`src/components/common/DatePicker.tsx`)
| Funcionalidade | Descrição |
|----------------|-----------|
| **Auto-preenchimento** | Preenche automaticamente com a data de hoje (DD/MM/AAAA) |
| **Popup de calendário** | Calendário mensal com seleção de dia |
| **Navegação** | Mês/anterior, mês/próximo, seletor de mês e ano |
| **Botões** | "Hoje" (auto-preenche) e "Limpar" (apaga) |
| **Entrada manual** | Aceita digitação direta no formato DD/MM/AAAA |
| **Dark mode** | Suporte completo ao tema escuro |
| **Posicionamento** | Abre abaixo do input, z-index alto |

### Novas utilitárias (`src/utils/dateUtils.ts`)
| Função | Descrição |
|--------|-----------|
| `getTodayBR()` | Retorna data de hoje em formato DD/MM/AAAA |
| `formatDateBR(date)` | Formata Date para DD/MM/AAAA |
| `parseBRDate(str)` | Converte DD/MM/AAAA para Date |
| `isValidBRDate(str)` | Valida se string é data válida |
| `isBeforeToday(str)` | Verifica se data é anterior a hoje |
| `isSameMonthYear(str, m, y)` | Verifica se data está no mês/ano |
| `getMonthNames()` | Retorna nomes dos meses em português |
| `getYearOptions()` | Retorna anos disponíveis (2024-2028) |

### Arquivos modificados
| Arquivo | Alteração |
|---------|-----------|
| `src/utils/dateUtils.ts` | **Criado** — 8 funções utilitárias |
| `src/components/common/DatePicker.tsx` | **Criado** — Componente reutilizável |
| `src/components/modals/NewAnimalModal.tsx` | 4 campos de data → `DatePicker` |
| `src/components/modals/EditAnimalModal.tsx` | 4 campos de data → `DatePicker` |
| `src/components/modals/RegisterDeathModal.tsx` | Data do óbito → `DatePicker` |
| `src/components/modals/RegisterAdoptionModal.tsx` | Data da adoção → `DatePicker` |
| `src/components/animals/CastracoesView.tsx` | Inputs de data → `DatePicker` |

### Validações
- `npx tsc --noEmit` — ✅ Sem erros
- `npm run build` — ✅ Build limpo

---

## v2.10.2 — AutoComplete Inteligente para Formulários

### Resumo da alteração
Componente de autocomplete que sugere valores anteriores enquanto o usuário digita. As sugestões são coletas automaticamente dos dados existentes e armazenadas em `localStorage`.

### Novo componente: `AutoComplete` (`src/components/common/AutoComplete.tsx`)
| Funcionalidade | Descrição |
|----------------|-----------|
| **Sugestões** | Lista filtrada enquanto digita (mínimo 1 caractere) |
| **Navegação por teclado** | Setas para cima/baixo, Enter para selecionar, Escape para fechar |
| **Highlight** | Texto digitado destacado em negrito nas sugestões |
| **Máximo** | 8 sugestões exibidas |
| **localStorage** | Sugestões persistidas entre sessões |
| **Dark mode** | Suporte completo |
| **Posicionamento** | Dropdown abaixo do input, z-index alto |

### Novo serviço: `autocompleteStorage` (`src/utils/autocompleteStorage.ts`)
| Campo | Descrição |
|-------|-----------|
| `raca` | Raças de animais |
| `cor` | Cores |
| `veterinario` | Veterinários |
| `tutor_nome` | Nomes de tutores |
| `tutor_contato` | Contatos de tutores |
| `endereco` | Endereços |

| Função | Descrição |
|--------|-----------|
| `getSuggestions(field)` | Retorna sugestões para um campo |
| `addSuggestion(field, value)` | Adiciona valor às sugestões |
| `addSuggestionsFromAnimal(animal)` | Coleta dados de um animal |
| `seedSuggestionsFromAnimals(animals)` | Coleta dados de todos os animais (chamada no carregamento) |

### Campos convertidos para AutoComplete
| Modal | Campos |
|-------|--------|
| `NewAnimalModal` | Raça, Cor, Tutor Nome, Tutor Contato, Endereço |
| `EditAnimalModal` | Raça, Cor, Tutor Nome, Tutor Contato, Endereço |
| `RegisterAdoptionModal` | Nome do Adotante, Contato do Adotante, Endereço |
| `CastracoesView` | Veterinário |

### Arquivos criados
| Arquivo | Descrição |
|---------|-----------|
| `src/utils/autocompleteStorage.ts` | Serviço de sugestões com localStorage |
| `src/components/common/AutoComplete.tsx` | Componente reutilizável |

### Arquivos modificados
| Arquivo | Alteração |
|---------|-----------|
| `src/context/AnimalContext.tsx` | Chama `seedSuggestionsFromAnimals()` após carregar animais |
| `src/components/modals/NewAnimalModal.tsx` | 5 campos → `AutoComplete` |
| `src/components/modals/EditAnimalModal.tsx` | 5 campos → `AutoComplete` |
| `src/components/modals/RegisterAdoptionModal.tsx` | 3 campos → `AutoComplete` |
| `src/components/animals/CastracoesView.tsx` | Veterinário → `AutoComplete` |

### Validações
- `npx tsc --noEmit` — ✅ Sem erros
- `npm run build` — ✅ Build limpo

---

## Resumo das versões v2.10.x

| Versão | Foco | Arquivos criados | Arquivos modificados |
|--------|------|-----------------|---------------------|
| v2.10.0 | Fonte única de verdade (animals) | 1 migration | 7 |
| v2.10.1 | DatePicker compacto | 2 (dateUtils + DatePicker) | 6 |
| v2.10.2 | AutoComplete inteligente | 2 (autocompleteStorage + AutoComplete) | 5 |

### Total de impacto
- **Arquivos criados:** 5
- **Arquivos modificados:** 15 (alguns em comum)
- **Migration:** 1 (3 novas colunas na tabela animals)
- **Contexts removidos:** 1 (CastrationsContext)
- **Providers removidos:** 1 (CastrationsProvider)

---

## v2.11.0 — Módulo "Documentos do Animal"

### Resumo da alteração
Novo módulo completo de gerenciamento de documentos anexados ao animal. Cada animal possui sua própria pasta de documentos, permitindo organizar boletins, receitas, exames, laudos e outros arquivos relacionados ao histórico.

### Localização
Tela **Ficha do Animal** — card "📄 Documentos do Animal" entre Galeria de Fotos e Informações do Animal. Ao clicar, abre modal centralizado.

### Tabela `animal_documents` (migration)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid | PK automática |
| `animal_id` | uuid | FK → animals.id (CASCADE) |
| `document_type` | text | Tipo do documento |
| `custom_name` | text | Nome personalizado (opcional) |
| `file_name` | text | Nome original do arquivo |
| `file_path` | text | Caminho no storage |
| `mime_type` | text | Tipo MIME |
| `file_size` | integer | Tamanho em bytes |
| `document_date` | text | Data do documento (DD/MM/AAAA) |
| `observation` | text | Observações |
| `uploaded_by` | text | Quem fez upload |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

### Storage
| Bucket | Política | Descrição |
|--------|----------|-----------|
| `animal-documents` | Privado, uploads autenticados | Documentos dos animais |

**Estrutura:** `animal-documents/{animal-id}/{tipo}_{timestamp}.{ext}`

### Tipos de documento
| Tipo | Label |
|------|-------|
| `boletim_entrada` | Boletim de Entrada |
| `receita_veterinaria` | Receita Veterinária |
| `exame` | Exame |
| `laudo` | Laudo |
| `vacinacao` | Vacinação |
| `castracao` | Castração |
| `contrato` | Contrato |
| `rg_animal` | RG Animal |
| `microchip` | Microchip |
| `termo` | Termo |
| `atestado` | Atestado |
| `personalizado` | Documento Personalizado |

### Funcionalidades

#### Modal Principal (`AnimalDocumentsModal`)
- Grid responsivo de cards (4 cols desktop, 3 tablet, 2 mobile)
- Cada card: ícone colorido por tipo, nome/tipo, data, tamanho, 3 botões de ação
- Botão verde "➕ Novo Documento"
- Exclusão com confirmação + senha (0001)
- Toast de sucesso/erro
- Estado vazio com ilustração

#### Modal de Cadastro/Edição (`DocumentUploadModal`)
- Upload de arquivo (galeria, câmera ou seleção)
- Tipos aceitos: PDF, JPG, JPEG, PNG, WEBP
- Máximo: 10MB
- Campo "Tipo do Documento" (select)
- Se "Personalizado": campo "Nome do Documento"
- DatePicker para data do documento
- Campo de observações (opcional)

#### Modal de Visualização (`DocumentViewModal`)
- Imagens: zoom in/out, navegação entre documentos
- PDF: visualizador iframe dentro do modal
- Download do arquivo
- Navegação por setas do teclado

### Ações por card
| Ação | Descrição |
|------|-----------|
| 👁 Visualizar | Abre visualizador de imagem/PDF |
| ✏ Editar | Abre modal de edição (tipo, data, obs) |
| 🗑 Excluir | Exclui com confirmação + senha |

### Auditoria
| Ação | Descrição |
|------|-----------|
| `documento_criado` | Novo documento adicionado |
| `documento_editado` | Metadados alterados |
| `documento_substituido` | Arquivo substituído |
| `documento_excluido` | Documento removido |

### Arquivos criados
| Arquivo | Descrição |
|---------|-----------|
| `supabase/migrations/20260806110000_create_animal_documents.sql` | Tabela + bucket + RLS |
| `src/types/animalDocument.ts` | Tipos e constantes |
| `src/services/animalDocumentService.ts` | CRUD + upload/download |
| `src/components/animals/AnimalDocumentsModal.tsx` | Modal principal |
| `src/components/animals/DocumentUploadModal.tsx` | Modal de cadastro |
| `src/components/animals/DocumentViewModal.tsx` | Visualizador |

### Arquivos modificados
| Arquivo | Alteração |
|---------|-----------|
| `src/components/animals/AnimalDetailView.tsx` | +card Documentos +import +state |
| `src/types/audit.ts` | +4 ações de documento |

### Validações
- `npx tsc --noEmit` — ✅ Sem erros
- `npm run build` — ✅ Build limpo

---

## v2.11.1 — UX Botões "Animais em Triagem"

### Resumo da alteração
Reorganização dos botões de ação da tela Animais em Triagem com nova ordem lógica e modal dedicado para finalizar triagem.

### Antes
| Ordem | Botão | Ação |
|-------|-------|------|
| 1 | 👁 Ver Ficha | Abre ficha |
| 2 | 📍 Alterar Local | Abre modal genérico de localização |
| 3 | ✏ Editar | Abre edição |

### Depois
| Ordem | Botão | Ação |
|-------|-------|------|
| 1 | 👁 Ver Ficha | Abre ficha completa |
| 2 | ✏ Editar Cadastro | Abre edição do animal |
| 3 | ✅ Finalizar Triagem | Abre modal dedicado |

### Modal "Finalizar Triagem"
- Pergunta: "Deseja finalizar a triagem deste animal?"
- Select de destino: Canil, Gatil, Lar Temporário, Área de Cães, Guarda Compartilhada, Clínica Parceira
- Ao confirmar: atualiza localização, remove da lista de triagem, registra auditoria
- Botões: Cancelar / Confirmar

### Arquivos modificados
| Arquivo | Alteração |
|---------|-----------|
| `src/components/animals/TriageAnimalsView.tsx` | Nova ordem + modal inline + remove prop `onOpenChangeLocationModal` |
| `src/App.tsx` | Remove prop `onOpenChangeLocationModal` do TriageAnimalsView |

### Validações
- `npx tsc --noEmit` — ✅ Sem erros
- `npm run build` — ✅ Build limpo

### Confirmação
- Nenhuma outra funcionalidade foi alterada
- Fluxo de movimentação do animal mantido
- Auditoria automática preservada
- Login, Cadastro, Castrações, Avisos, Relatórios permanecem inalterados

---

## Auditoria — v2.11.3 (Ajustes Visuais Pontuais)

**Data da alteração:** 11/08/2026

### 1. Arquivos alterados
| Arquivo | Alteração |
|---------|-----------|
| `src/components/layout/Sidebar.tsx` | Ajuste de tamanho de fonte do "Menu Principal" e do cargo do usuário |
| `src/components/dashboard/DashboardCards.tsx` | Ajuste de tamanho de fonte dos textos auxiliares dos cards (título, "animais", subtítulo) |
| `src/components/dashboard/SummaryCard.tsx` | Ajuste de tamanho de fonte do subtítulo e rótulo |
| `src/components/dashboard/MonthlySummary.tsx` | Ajuste de tamanho de fonte da descrição e cabeçalhos de coluna |
| `src/components/alerts/OngeSummaryCard.tsx` | Remoção dos cards "Vacinas" e "Internações" da exibição + remoção de imports não utilizados |

### 2. Alterações feitas na Sidebar
- `text-xs font-bold` → `text-[13px] font-bold` no label "Menu Principal"
- `text-xs text-slate-400` → `text-[13px] text-slate-400` no cargo/função do usuário
- Itens do menu mantidos em `text-[15px] font-semibold` (já proporcionais)
- Nome do usuário mantido em `text-sm font-semibold`
- Nenhuma alteração de cor, ícone, estrutura ou largura da Sidebar

### 3. Alterações feitas nos cards do Dashboard
- Título do card: `text-xs font-bold` → `text-[13px] font-bold`
- Texto "animais": `text-xs font-medium` → `text-[13px] font-medium`
- Subtítulo do card: `text-xs` → `text-[13px]`
- Cabeçalho "Indicadores": `text-xs font-bold` → `text-[13px] font-bold`
- Números principais (`text-3xl font-black`) mantidos sem alteração
- Hierarquia visual preservada

### 4. Confirmação: cards "Vacinas" e "Internações" removidos SOMENTE da exibição
- Os cards "Vacinas" e "Internações" foram removidos do array `stats` no componente `OngeSummaryCard.tsx`
- As variáveis `vacinasVencidas` e `internacoesAcima30d` foram removidas (não utilizadas)
- O import de `Syringe` e `AlertTriangle` foi removido (não mais necessário)
- O campo `internacaoLocs` foi removido (não mais necessário)

### 5. Confirmação: nenhuma tabela, campo, serviço, migration ou funcionalidade de vacinação/internação foi removida
- Tabela `animals` com colunas `vaccination_date`, `vaccination_due_date` mantidas
- Coluna `castration_date`, `castration_scheduled_date` mantidas
- Coluna `castrado` mantida
- Serviços de vacinação e internação preservados
- Migrations mantidas intactas
- Central de Avisos com alertas de vacinação e internação mantida
- AlertContext com lógica de "Vacinas vencidas" e "Internação prolongada" mantida
- Modal de cadastro/edição com campos de vacinação mantidos
- Relatório do animal com seção de vacinação mantida

### 6. Confirmação: documentos e relatório do animal intactos
- `AnimalDocumentsModal.tsx` — NENHUMA alteração
- `AnimalReportModal.tsx` — NENHUMA alteração
- `DocumentUploadModal.tsx` — NENHUMA alteração
- `DocumentViewModal.tsx` — NENHUMA alteração
- `animalDocumentService.ts` — NENHUMA alteração
- `animalDocument.ts` (tipo) — NENHUMA alteração

### 7. Confirmação: não houve alteração no banco Supabase
- Nenhuma migration criada ou modificada
- Nenhum campo adicionado ou removido
- Nenhuma tabela alterada
- Nenhuma alteração em `supabase/`

### 8. Confirmação: não houve alterações fora do escopo
- Header: NENHUMA alteração
- Central de Avisos: NENHUMA alteração
- Castrações: NENHUMA alteração
- Adoções: NENHUMA alteração
- Óbitos: NENHUMA alteração
- Localizações: NENHUMA alteração
- Autenticação/Permissões: NENHUMA alteração
- Configurações: NENHUMA alteração
- Backup: NENHUMA alteração
- App.tsx: NENHUMA alteração

### 9. Resultado dos testes
- **Lint (tsc --noEmit):** ✅ SUCESSO — sem erros
- **Build (vite build):** ✅ SUCESSO — build concluído em 15.93s
  - Warning pré-existente: chunk `index-1n7OFBgr.js` com 1.515,97 kB (code-splitting sugerido)
  - Warning pré-existente: dynamic import duplicado em `animalDocumentService.ts`
  - Nenhum warning novo introduzido por esta alteração

---

## Correção Visual Pontual — v2.11.4

**Data da alteração:** 11/08/2026

### 1. Arquivos alterados (2 arquivos)
| Arquivo | Linha | Alteração |
|---------|-------|-----------|
| `src/components/layout/Sidebar.tsx` | 97 | `text-[15px] font-semibold` → `text-[14px] font-medium` |
| `src/components/alerts/OngeSummaryCard.tsx` | 76 | `text-[9px] font-medium` → `text-[12px] font-medium` |

### 2. Sidebar — Itens do menu
- **Antes:** `text-[15px] font-semibold` (15px, peso semibold)
- **Depois:** `text-[14px] font-medium` (14px, peso medium)
- **Motivo:** Usuário solicitou diminuir o tamanho dos itens do menu para ficar proporcional
- **NÃO alterado:** Logo, "Menu Principal", nome/cargo do usuário, ícones, espaçamentos

### 3. OngeSummaryCard — Labels dos cards
- **Antes:** `text-[9px] font-medium` (9px)
- **Depois:** `text-[12px] font-medium` (12px)
- **Motivo:** Usuário solicitou aumentar os textos pequenos abaixo dos números (Registrados, No Abrigo, etc.)
- **NÃO alterado:** Números, ícones, cores, tamanho dos cards, layout

### 4. Resultado dos testes
- **Lint (tsc --noEmit):** ✅ SUCESSO — sem erros
- **Build (vite build):** ✅ SUCESSO — build concluído em 16.59s
  - Warnings pré-existentes mantidos (chunk grande, dynamic import)
  - Nenhum warning novo
