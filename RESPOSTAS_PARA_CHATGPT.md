# RESPOSTAS PARA CHATGPT — ONG Viva Bicho

---

## INVESTIGAÇÃO — CONTADOR DE ANIMAIS EM TRIAGEM / ÓBITO DIRETO

### 1. Problema Encontrado

Uma funcionária registrou o **óbito de 6 animais diretamente** enquanto eles ainda estavam na etapa de **triagem**. Esses animais foram corretamente marcados com `status: 'obito'`, porém o **contador** em algumas partes do sistema continua exibindo esses 6 animais como "em triagem". Ao acessar a tela de "Animais em Triagem", nenhum desses animais aparece, pois a tela filtra corretamente por `status === 'no_abrigo'`.

### 2. Arquivos Analisados

| Arquivo | Tipo | Responsabilidade |
|---------|------|------------------|
| `src/types/animal.ts` | Tipos | Define `AnimalStatus`, `LocationType`, `TRIAGE_LOCATION` |
| `src/context/AnimalContext.tsx` | Context | Carrega animais do Supabase; funções `registerDeath`, `addAnimal` |
| `src/components/layout/Sidebar.tsx` | Layout | Menu lateral (SEM contador de triagem) |
| `src/components/animals/TriageAnimalsView.tsx` | Tela | Lista de animais em triagem |
| `src/components/alerts/OngeSummaryCard.tsx` | Card/Resumo | Card "Resumo Geral da ONG" — exibe contador de triagem |
| `src/components/dashboard/DashboardView.tsx` | Dashboard | Cards de indicadores — exibe contador de triagem |
| `src/components/dashboard/CentralDeAvisos.tsx` | Dashboard | Central de Avisos / Resumo do Dia — exibe contador de triagem |
| `src/components/modals/RegisterDeathModal.tsx` | Modal | Modal de registro de óbito |

### 3. Funções Analisadas

| Função/Componente | Arquivo | Linha | Filtro Utilizado |
|-------------------|---------|-------|------------------|
| `TriageAnimalsView` (tela) | `TriageAnimalsView.tsx` | 49-51 | `a.status === 'no_abrigo' && a.currentLocation === 'triagem'` |
| `OngeSummaryCard` (card resumo) | `OngeSummaryCard.tsx` | 30 | `a.currentLocation === 'triagem'` |
| `DashboardView` (card triagem) | `DashboardView.tsx` | 92-93, 135 | `a.currentLocation === loc` (via `byLocation`) |
| `CentralDeAvisos` (resumo dia) | `CentralDeAvisos.tsx` | 43-45 | `a.currentLocation === 'triagem' && a.status === 'no_abrigo'` |
| `registerDeath` (ctx) | `AnimalContext.tsx` | 756-824 | Atualiza `status: 'obito'` — **NÃO altera `currentLocation`** |

### 4. Campos/Status Envolvidos

**Campo `status` (AnimalStatus):**
- `'no_abrigo'` — Animal ativo no abrigo
- `'adotado'` — Animal adotado
- `'obito'` — Animal falecido

**Campo `currentLocation` (LocationType):**
- `'triagem'` — Animal na etapa de triagem
- `'internacao_gatos'`, `'internacao_caes'`, `'gatil'`, `'area_caes'`, `'lar_temporario'`, `'guarda_compartilhada'`, `'clinica_parceira'` — outras localizações

### 5. Lógica Atual do Contador

**`OngeSummaryCard.tsx` (linha 30):**
```tsx
const triagem = animals.filter((a) => a.currentLocation === 'triagem').length;
```
→ Filtra **APENAS** por `currentLocation === 'triagem'`. **NÃO verifica o `status`.**

**`DashboardView.tsx` (linhas 92-93, 135):**
```tsx
const byLocation = (loc: Animal['currentLocation']) =>
  periodBase.filter((a) => a.currentLocation === loc);
// ...
count: byLocation('triagem').length,
```
→ Filtra **APENAS** por `currentLocation`. **NÃO verifica o `status`.**

### 6. Lógica da Tela de Triagem

**`TriageAnimalsView.tsx` (linhas 49-51):**
```tsx
const triageAnimals = animals.filter(
  (a) => a.status === 'no_abrigo' && a.currentLocation === 'triagem'
);
```
→ Filtra por **AMBOS** `status === 'no_abrigo'` E `currentLocation === 'triagem'`. **CORRETO.**

**`CentralDeAvisos.tsx` (linhas 43-45):**
```tsx
const triagemAnimals = useMemo(
  () => animals.filter((a) => a.currentLocation === 'triagem' && a.status === 'no_abrigo'),
  [animals]
);
```
→ Filtra por **AMBOS**. **CORRETO.**

### 7. Causa Identificada

Quando o `registerDeath` é chamado (`AnimalContext.tsx`, linha 784-788):
```tsx
const updatedAnimal: Animal = {
  ...current,
  status: 'obito',        // ← Status é atualizado para 'obito'
  deathDetails: deathObj,
  history: [newHistoryEntry, ...current.history]
};
```

O **`currentLocation` NÃO é alterado** — o animal permanece com `currentLocation: 'triagem'` no banco de dados.

**Resultado:**
- Animal no banco: `{ currentLocation: 'triagem', status: 'obito' }`
- Contador (`OngeSummaryCard`, `DashboardView`): Conta porque filtra só `currentLocation === 'triagem'`
- Tela (`TriageAnimalsView`): Não mostra porque filtra `status === 'no_abrigo' && currentLocation === 'triagem'`

**Há uma INCONSISTÊNCIA entre a lógica do contador e a lógica da tela.**

### 8. Correção Mínima Recomendada

Adicionar a condição `a.status === 'no_abrigo'` aos filtros que calculam o contador de triagem:

**Arquivo 1: `src/components/alerts/OngeSummaryCard.tsx` (linha 30)**
```tsx
// DE:
const triagem = animals.filter((a) => a.currentLocation === 'triagem').length;

// PARA:
const triagem = animals.filter((a) => a.currentLocation === 'triagem' && a.status === 'no_abrigo').length;
```

**Arquivo 2: `src/components/dashboard/DashboardView.tsx` (linhas 92-93)**
```tsx
// DE:
const byLocation = (loc: Animal['currentLocation']) =>
  periodBase.filter((a) => a.currentLocation === loc);

// PARA:
const byLocation = (loc: Animal['currentLocation']) =>
  periodBase.filter((a) => a.currentLocation === loc && a.status === 'no_abrigo');
```

> **Nota:** A alteração em `DashboardView.tsx` afeta TODOS os cards de localização. Se for desejado manter o filtro de status apenas para triagem, a correção deve ser feita de forma específica no card de triagem (linha 135) em vez de na função `byLocation`.

**Alternativa mais segura (apenas para triagem):**
```tsx
// DashboardView.tsx — card de triagem (linha 135-139)
{
  id: 'triagem',
  title: 'Animais em triagem',
  count: periodBase.filter((a) => a.currentLocation === 'triagem' && a.status === 'no_abrigo').length,
  icon: ClipboardCheck,
  gradient: 'from-sky-500 to-cyan-600',
  subtitle: 'Local: Triagem',
  animals: periodBase.filter((a) => a.currentLocation === 'triagem' && a.status === 'no_abrigo')
}
```

### 9. Possíveis Efeitos Colaterais

| Efeito | Risco | Descrição |
|--------|-------|-----------|
| Contador de triagem diminui | Baixo | Correto — animais em óbito não devem ser contados como "em triagem" |
| Dashboard cards de outras localizações | Baixo | Se `byLocation` for alterado globalmente, outros locais também filtrarão por `status === 'no_abrigo'`. Isso pode ser indesejado para locais como "internação" onde animais podem ter outros status |
| Dados históricos | Nenhum | Nenhum dado é alterado no banco — apenas a lógica de exibição/contagem |
| Tela de triagem | Nenhum | Já filtra corretamente — nenhuma mudança necessária |
| Central de Avisos | Nenhum | Já filtra corretamente — nenhuma mudança necessária |

### 10. Observações Importantes

1. **A correção mais segura** é alterar apenas os dois arquivos identificados (`OngeSummaryCard.tsx` e `DashboardView.tsx`), sem tocar no banco de dados.

2. **O Sidebar.tsx NÃO exibe contador de triagem** — ele apenas mostra o nome do item de menu "Animais em Triagem" sem badge numérico. O contador de triagem aparece em:
   - Card "Resumo Geral da ONG" (`OngeSummaryCard.tsx`)
   - Card de indicadores no Dashboard (`DashboardView.tsx`)
   - Central de Avisos (`CentralDeAvisos.tsx` — já correto)

3. **Os 6 animais não precisam ser alterados.** O histórico de óbito continua correto. Apenas a lógica de contagem precisa ser ajustada.

4. **Não há necessidade de alterar o `currentLocation`** dos animais em óbito. Manter `currentLocation: 'triagem'` é aceitável desde que o filtro de contagem verifique também o `status`.

5. **Risco de alteração global em `byLocation`:** Se a função `byLocation` em `DashboardView.tsx` for alterada para incluir `a.status === 'no_abrigo'`, isso afetará TODOS os cards de localização (internação, gatil, etc.). Recomenda-se fazer a correção de forma específica no card de triagem.

---

**INVESTIGAÇÃO CONCLUÍDA — NENHUMA ALTERAÇÃO IMPLEMENTADA.**

*Data da investigação: 12/08/2026*
*Arquivo de resposta: RESPOSTAS_PARA_CHATGPT.md*

---

## CORREÇÃO — CONTADOR DE ANIMAIS EM TRIAGEM (12/08/2026)

### Data da Alteração
12/08/2026

### Problema Identificado
O contador de "Animais em Triagem" exibia 6 animais que já estavam com `status: 'obito'` (registrados diretamente na triagem), mas a tela de Triagem não os listava porque filtrava corretamente por `status === 'no_abrigo'`.

### Causa do Problema
Os contadores filtravam apenas por `currentLocation === 'triagem'` sem verificar o `status`. Animais com `{ currentLocation: 'triagem', status: 'obito'` eram contados erroneamente.

### Arquivos Alterados
1. `src/components/alerts/OngeSummaryCard.tsx`
2. `src/components/dashboard/DashboardView.tsx`

### O que foi alterado em cada arquivo

**Arquivo 1: `src/components/alerts/OngeSummaryCard.tsx` (linha 30)**

```tsx
// ANTES:
const triagem = animals.filter((a) => a.currentLocation === 'triagem').length;

// DEPOIS:
const triagem = animals.filter((a) => a.currentLocation === 'triagem' && a.status === 'no_abrigo').length;
```

**Arquivo 2: `src/components/dashboard/DashboardView.tsx` (linhas 132-140)**

```tsx
// ANTES:
{
  id: 'triagem',
  title: 'Animais em triagem',
  count: byLocation('triagem').length,
  icon: ClipboardCheck,
  gradient: 'from-sky-500 to-cyan-600',
  subtitle: 'Local: Triagem',
  animals: byLocation('triagem')
}

// DEPOIS:
{
  id: 'triagem',
  title: 'Animais em triagem',
  count: periodBase.filter((a) => a.currentLocation === 'triagem' && a.status === 'no_abrigo').length,
  icon: ClipboardCheck,
  gradient: 'from-sky-500 to-cyan-600',
  subtitle: 'Local: Triagem',
  animals: periodBase.filter((a) => a.currentLocation === 'triagem' && a.status === 'no_abrigo')
}
```

> **Nota:** A função `byLocation` NÃO foi alterada. A correção foi aplicada apenas no card de triagem.

### Confirmações

- [x] **Os 6 animais permaneceram intactos** — nenhuma alteração nos registros do banco.
- [x] **Nenhuma alteração no banco/Supabase** — apenas lógica de contagem no frontend.
- [x] **`TriageAnimalsView` não precisou ser alterado** — já filtrava corretamente.
- [x] **`CentralDeAvisos` não precisou ser alterada** — já filtrava corretamente.
- [x] **`AnimalContext` não foi alterado** — `registerDeath` permanece igual.
- [x] **Sidebar não foi alterada** — não exibe contador numérico de triagem.

### Resultado do Typecheck/Lint
```
> tsc --noEmit
```
**Resultado:** Passou sem erros.

### Resultado do Build
```
> vite build
✓ built in 15.80s
```
**Resultado:** Build concluído com sucesso.

### Possíveis Riscos
| Risco | Nível | Descrição |
|-------|-------|-----------|
| Contador diminui | Baixo | Correto — animais em óbito não são mais contados como "em triagem" |
| Outros cards afetados | Nenhum | A função `byLocation` não foi alterada |
| Dados históricos | Nenhum | Nenhum dado foi modificado no banco |
| Funcionalidades existentes | Nenhum | Apenas a lógica de contagem foi ajustada |

### Resumo Final da Correção
A correção foi aplicada em **2 arquivos** com **2 alterações cirúrgicas**:
1. Adicionado `&& a.status === 'no_abrigo'` ao filtro do card "Resumo Geral da ONG"
2. Substituída a chamada `byLocation('triagem')` por filtro explícito `periodBase.filter((a) => a.currentLocation === 'triagem' && a.status === 'no_abrigo')` no card de triagem do Dashboard

O resultado é que animais com `currentLocation: 'triagem'` e `status: 'obito'` **não são mais contados** como "Animais em Triagem", alinhando o comportamento dos contadores ao da tela de triagem.
