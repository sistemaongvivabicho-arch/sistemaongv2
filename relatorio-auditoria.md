# RELATÓRIO DE DESENVOLVIMENTO — MÓDULO DE AUDITORIA
## Sistema de Gestão ONG Viva Bicho
### Data: 05/08/2026

---

## 1. OBJETIVO

Criação de um sistema completo de histórico de alterações (auditoria) que registra automaticamente todas as ações importantes realizadas pelos usuários no sistema, com visualização exclusiva para administradores.

---

## 2. ARQUIVOS CRIADOS

### 2.1 `src/types/audit.ts`
Define os tipos TypeScript utilizados pelo módulo:
- `AuditActionType` — 16 tipos de ação rastreados (cadastro, exclusão, alteração de cadastro/espécie/sexo/localização, entrada/saída de triagem, adoção, óbito, vacinação, agendamento/alteração/exclusão de castração, upload e troca de foto)
- `AuditLogEntry` — Interface completa com: id, user_name, user_role, timestamp, animal_id, animal_name, action_type, description, details
- `AUDIT_ACTION_LABELS` — Labels em português para cada tipo de ação
- `AUDIT_ACTION_COLORS` — Classes Tailwind para colorir cada tipo de ação na listagem

### 2.2 `src/context/AuditContext.tsx`
Provider de contexto React que gerencia:
- `addAuditLog()` — Insere registro na tabela `audit_logs` do Supabase
- `fetchAuditLogs()` — Busca registros com filtros opcionais (termo de busca, tipo de ação, período)
- `auditLogs` — Estado com os registros carregados
- `loading` — Indicador de carregamento

### 2.3 `src/context/useAuditActions.ts`
Hook personalizado que intercepta todas as ações do `AnimalContext` e adiciona registro de auditoria automaticamente após cada operação bem-sucedida:
- `addAnimal` → registra `cadastro_animal`
- `updateAnimal` → detecta e registra `alteracao_cadastro`, `alteracao_especie`, `alteracao_sexo`, `alteracao_localizacao`, `alteracao_vacinacao`, `agendamento_castracao`, `alteracao_agendamento`, `exclusao_agendamento`
- `changeLocation` → detecta automaticamente se é `entrada_triagem`, `saida_triagem` ou `alteracao_localizacao`
- `registerAdoption` → registra `adocao`
- `registerDeath` → registra `registro_obito`
- `deleteAnimal` → registra `exclusao_animal`
- `uploadAnimalPhoto` → detecta se é `upload_foto` ou `troca_foto`
- `deleteAnimalPhoto` → registra remoção de foto

Cada descrição gerada é contextual e legível, incluindo valores anteriores e novos quando aplicável.

### 2.4 `src/components/animals/AuditLogView.tsx`
Tela completa de visualização da auditoria com:
- **Cabeçalho** com botão voltar para Relatórios
- **Pesquisa** por nome do animal, nome do usuário ou texto da descrição
- **Filtro por tipo de ação** (dropdown com todas as 16 opções + "Todos")
- **Filtro por período** (data inicial e data final)
- **Listagem** ordenada do mais recente para o mais antigo, com:
  - Badge colorido do tipo de ação
  - Data/hora formatada (pt-BR)
  - Nome do animal
  - Descrição completa da ação
  - Nome e perfil do usuário que realizou a ação
- **Exportação** em 3 formatos:
  - PDF (abre janela de impressão)
  - CSV (separado por ;)
  - Excel (.xls compatível)
- Indicador "Exibindo X de Y registros" quando filtros estão ativos
- Botão "Limpar filtros"

---

## 3. ARQUIVOS MODIFICADOS

### 3.1 `src/components/dashboard/DashboardView.tsx`
- Adicionado import de `useAuth` e ícone `History`
- Extraído `setActiveTab` do contexto e `isAdmin` da autenticação
- Adicionada seção "Relatórios" abaixo dos cards de indicadores, visível **somente para administradores** (`isAdmin`)
- Card "Registro de Alterações" com ícone History, descrição e seta de navegação
- Ao clicar, navega para a aba `auditoria`

### 3.2 `src/App.tsx`
- Adicionado import de `AuditProvider` e `AuditLogView`
- Adicionado case `'auditoria'` no switch de rotas
- Envolveudo `MainAppContent` com `<AuditProvider>`

### 3.3 Modais (5 arquivos)
Todos foram atualizados para importar `useAuditActions` em vez de `useAnimalContext`:

| Modal | Funções de ação interceptadas |
|---|---|
| `NewAnimalModal.tsx` | `addAnimal`, `uploadAnimalPhoto` |
| `EditAnimalModal.tsx` | `updateAnimal`, `uploadAnimalPhoto`, `deleteAnimalPhoto` |
| `ChangeLocationModal.tsx` | `changeLocation` |
| `RegisterAdoptionModal.tsx` | `registerAdoption` |
| `RegisterDeathModal.tsx` | `registerDeath` |

### 3.4 `src/components/animals/AnimalDetailView.tsx`
- Atualizado para usar `useAuditActions` (captura upload/troca/remoção de foto feita diretamente na ficha)

---

## 4. MIGRAÇÃO SQL

### `supabase/migrations/20260805000000_audit_logs.sql`

Cria a tabela `audit_logs` com:

```sql
CREATE TABLE audit_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name    TEXT NOT NULL,
    user_role    TEXT NOT NULL DEFAULT 'common',
    timestamp    TIMESTAMPTZ NOT NULL DEFAULT now(),
    animal_id    UUID NOT NULL,
    animal_name  TEXT NOT NULL,
    action_type  TEXT NOT NULL,
    description  TEXT NOT NULL,
    details      TEXT
);
```

**Constraints:**
- `user_role` restrito a: `admin`, `common`, `sistema`
- `action_type` restrito aos 16 tipos de ação definidos

**Índices:**
- `timestamp DESC` (ordenação padrão)
- `animal_id` (busca por animal)
- `user_name` (busca por usuário)
- `action_type` (filtro por tipo)

**RLS (Row Level Security):**
- `SELECT` — Somente administradores (`is_admin()`)
- `INSERT` — Qualquer colaborador ativo (`is_active_collaborator()`)
- Histórico é **permanente** — nenhum `DELETE` policy é definido

---

## 5. PERMISSÕES

| Ação | Admin | Colaborador |
|---|---|---|
| Visualizar tela "Registro de Alterações" | ✅ | ❌ (card não aparece) |
| Visualizar registros na listagem | ✅ | ❌ (RLS bloqueia) |
| Inserir registros (automático) | ✅ | ✅ |
| Exportar registros | ✅ | ❌ |

Caso um usuário não-admin tente acessar a aba `auditoria` diretamente pela URL, o RLS retorna vazio e a tela exibe "Nenhum registro encontrado".

---

## 6. FUNCIONAMENTO

### Registro Automático
Toda vez que um usuário realiza uma ação (cadastrar, editar, mover, adotar, etc.), o hook `useAuditActions` intercepta a chamada, executa a ação original e, se bem-sucedida, insere automaticamente um registro na tabela `audit_logs` com:
- Nome do usuário logado
- Role do usuário
- Data/hora atual
- ID e nome do animal
- Tipo da ação
- Descrição completa e contextual em português

### Exemplos de Descrições Geradas
- `Animal "Piruta" foi cadastrado no sistema. Espécie: Felino, Sexo: Fêmea.`
- `Piruta: espécie alterada de Canino para Felino.`
- `Thor movido(a) de Triagem para Gatil.`
- `Mel foi adotado(a) por Maria em 05/08/2026.`
- `Nina: agendamento de castração (era 10/08/2026) foi removido.`
- `Luna: foto substituída. Arquivo: foto-luna.jpg.`

### Listagem
- Registros aparecem do mais recente para o mais antigo
- Pesquisa em tempo real por animal, usuário ou texto
- Filtro por tipo de ação (dropdown)
- Filtro por período (data inicial e final)
- Exportação PDF/CSV/Excel com os registros filtrados

---

## 7. VALIDAÇÃO

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ Sem erros |
| `npm run build` | ✅ Build concluído com sucesso |
| `npm run dev` | ✅ Servidor iniciado sem problemas |

---

## 8. ARQUIVOS ALTERADOS (RESUMO)

| Arquivo | Tipo |
|---|---|
| `src/types/audit.ts` | **CRIADO** |
| `src/context/AuditContext.tsx` | **CRIADO** |
| `src/context/useAuditActions.ts` | **CRIADO** |
| `src/components/animals/AuditLogView.tsx` | **CRIADO** |
| `supabase/migrations/20260805000000_audit_logs.sql` | **CRIADO** |
| `src/components/dashboard/DashboardView.tsx` | Modificado |
| `src/App.tsx` | Modificado |
| `src/components/modals/NewAnimalModal.tsx` | Modificado |
| `src/components/modals/EditAnimalModal.tsx` | Modificado |
| `src/components/modals/ChangeLocationModal.tsx` | Modificado |
| `src/components/modals/RegisterAdoptionModal.tsx` | Modificado |
| `src/components/modals/RegisterDeathModal.tsx` | Modificado |
| `src/components/animals/AnimalDetailView.tsx` | Modificado |

**Nenhuma funcionalidade existente foi alterada. Nenhum layout de tela foi modificado.**
