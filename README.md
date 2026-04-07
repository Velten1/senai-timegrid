# SENAI Grade de Horários

Sistema de visualização de grade de horários e localização de cursos para o SENAI-SP. Funciona como um totem digital interativo: exibe automaticamente os horários de aulas, professores e salas a partir de planilhas do Google Sheets, atualizando em tempo real.

---

## Visão geral

O projeto é uma **SPA (Single Page Application)** construída em React + TypeScript. Não possui backend próprio — os dados vêm de **planilhas Google Sheets** exportadas como `.xlsx`, que são baixadas, parseadas e exibidas diretamente no navegador.

### O que o sistema exibe

| Modalidade | Dados | Origem |
|---|---|---|
| **CAI e Cursos Técnicos** | Turmas, disciplinas, professores, salas, horários (manhã e tarde) | 2 planilhas (Manhã + Tarde) |
| **Cursos Livres / FIC** | Cursos, professores, salas, horários (principalmente sábado) | 1 planilha |
| **Cursos Superiores** | Turmas, disciplinas, professores, salas | 1 planilha — abas com prefixo `SUP_` |
| **MBA** | Grade de especialização MBA | Mesma planilha — abas com prefixo `MBA_` |
| **Pós-Graduação (POS)** | Grade de pós-graduação lato sensu | Mesma planilha — abas com prefixo `POS_` |
| **Avisos / Eventos** | Comunicados na página inicial (ex.: feriados, inscrições) | 1 planilha separada |

### Como funciona o fluxo

```
Google Sheets (.xlsx)
       │
       ▼
  fetch (a cada ~30s)
       │
       ▼
  Cache por hash SHA-256
  (se não mudou, não re-parseia)
       │
       ▼
  Parsers especializados
  (técnicos / livres / sup-pos-grad / avisos)
       │
       ▼
  Adapter (excelAdapter.ts)
  Converte para tipos da aplicação
  (Course, Teacher, Room, Class, CompleteClass)
       │
       ▼
  React Contexts (estado global)
       │
       ▼
  Componentes de UI
  (cards, grades, modais, calendários)
```

---

## Stack tecnológica

| Tecnologia | Versão | Uso |
|---|---|---|
| **React** | 18.2 | UI e gerenciamento de estado |
| **TypeScript** | 5.2 | Tipagem estática |
| **Vite** | 5.0 | Bundler e dev server |
| **Tailwind CSS** | 3.3 | Estilização utility-first |
| **React Router** | 6.20 | Roteamento SPA |
| **SheetJS (xlsx)** | 0.18.5 | Leitura e parsing de planilhas `.xlsx` |
| **Lucide React** | 0.563 | Ícones SVG |
| **Montserrat** | Google Fonts | Tipografia (identidade SENAI) |

---

## Estrutura de pastas

```
frontend/
├── src/
│   ├── components/
│   │   ├── course/
│   │   │   ├── ClassDetailModal.tsx    # Modal com detalhes de uma aula
│   │   │   ├── CourseScheduleCard.tsx  # Card de grade horária de um curso
│   │   │   └── CourseScheduleTable.tsx # Tabelas de grade (classic/technical/mba)
│   │   ├── header/
│   │   │   └── Header.tsx
│   │   ├── map/
│   │   │   ├── CampusMap.tsx           # Grid de cards de cursos
│   │   │   ├── CourseIcon.tsx          # Ícone dinâmico por curso
│   │   │   └── CourseModal.tsx         # Modal calendário completo do curso
│   │   └── TotemIdleReturn.tsx         # Auto-retorno à home após inatividade
│   │
│   ├── contexts/                       # Providers de estado global
│   │   ├── ExcelDataContext.tsx         # Cursos técnicos
│   │   ├── LivresDataContext.tsx        # Cursos livres
│   │   ├── SuperiorPosGradDataContext.tsx # Superior + MBA + POS
│   │   └── AvisosDataContext.tsx        # Avisos/eventos
│   │
│   ├── hooks/
│   │   ├── usePollingData.ts           # Hook genérico de fetch + polling
│   │   ├── useExcelData.ts             # Polling: técnicos
│   │   ├── useExcelDataLivres.ts       # Polling: livres
│   │   ├── useExcelDataSuperiorPosGrad.ts # Polling: superior/MBA/POS
│   │   └── useExcelDataAvisos.ts       # Polling: avisos
│   │
│   ├── services/                       # Parsers de planilhas
│   │   ├── excelServiceTecnicos.ts     # Download + parse técnicos (manhã/tarde)
│   │   ├── excelServiceLivres.ts       # Download + parse livres/FIC
│   │   ├── excelServiceSuperiorPosGrad.ts # Download + parse superior/MBA/POS
│   │   ├── excelServiceAvisos.ts       # Download + parse avisos
│   │   ├── excelSuperiorPosGradParser.ts # Parser detalhado (blocos T1/T2/trimestre)
│   │   ├── excelLivresParser.ts        # Parser dedicado livres (sem T1/T2)
│   │   ├── excelParseHelpers.ts        # Utilitários compartilhados de parsing
│   │   └── excelSheetMatrix.ts         # Conversão de aba para matriz com mesclagens
│   │
│   ├── utils/
│   │   ├── courseSchedule.ts           # Lógica de grade (dias, horários, filtros)
│   │   ├── excelAdapter.ts            # Converte ParsedClass → Course/Teacher/Room/Class
│   │   ├── calendar.ts                # Manipulação de datas (addDays)
│   │   ├── formatting.ts              # Formatação (nomes de dias)
│   │   └── hashUtils.ts               # Hash SHA-256 para cache
│   │
│   ├── pages/
│   │   ├── Home.tsx                    # Página inicial (modalidades + avisos)
│   │   └── CoursesByModality.tsx       # Página de cursos por modalidade
│   │
│   ├── types/
│   │   └── index.ts                    # Tipos centrais (Course, Class, etc.)
│   │
│   ├── data/
│   │   └── mockData.ts                # Dados de exemplo (desenvolvimento)
│   │
│   ├── images/                         # Logos SENAI (branco e vermelho)
│   ├── App.tsx                         # Rotas e providers
│   ├── main.tsx                        # Entry point
│   └── index.css                       # Estilos globais + animações
│
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

---

## Parsers de planilhas (detalhado)

O coração do sistema são os **parsers** — módulos que leem o `.xlsx` e extraem dados estruturados. Cada tipo de planilha tem seu parser especializado.

### Como o download funciona

1. O hook de polling (`usePollingData`) chama a função de parse a cada **30 segundos**.
2. A função faz `fetch` da URL do Google Sheets (export `.xlsx`) com `cache: 'no-store'`.
3. O `ArrayBuffer` recebido passa por um **hash SHA-256**.
4. Se o hash é igual ao da última vez, o resultado anterior é retornado do cache (sem re-parse).
5. Se mudou, o `ArrayBuffer` é parseado com `XLSX.read()` do SheetJS.

### `excelServiceTecnicos.ts` — Cursos Técnicos

- **Entrada:** 2 URLs (planilha Manhã + planilha Tarde), baixadas em paralelo.
- **Detecção de blocos:** procura linhas com pelo menos **5 pares T1/T2** (segunda a sexta).
- **Cabeçalho:** a linha acima de T1/T2 deve conter "Turma", "Aula" e "Horário".
- **Formato por aula:** 3 linhas consecutivas (disciplina, professor, sala).
- **Identificação de turma:** célula na coluna "Turma" que não seja palavra reservada.
- **Saída:** `ParsedClass[]` com turma, dia, horário, grupo (T1/T2), sigla, professor, sala.

### `excelSuperiorPosGradParser.ts` — Superior / MBA / POS

- **Entrada:** 1 URL. As abas são filtradas pelo **prefixo do nome**: `SUP_`, `MBA_` ou `POS_`.
- **Detecção de blocos:** aceita T1/T2 ou "1º Trimestre / 2º Trimestre".
- **Cabeçalho:** procura "CLASSE" (ou "Turma"), "AULA", "HORÁRIO", "Info" + dias por extenso.
- **Formato por aula:** coluna Info com "Disciplina", "Professor", "Local" (3 linhas).
- **Intervalo deslocado:** trata o caso em que um dia tem "INTERVALO" na mesma linha que outros dias têm disciplina.
- **Distribuição de horários:** quando aulas do mesmo bloco não têm horário individual, calcula faixas de 1h automaticamente.
- **Legenda de siglas:** lê as últimas 100 linhas da aba procurando padrões `SIGLA: Nome` ou `SIGLA - Nome`.
- **Período sábado:** se todas as aulas de uma aba MBA/POS são no sábado, normaliza para período "sabado".

### `excelLivresParser.ts` — Cursos Livres / FIC

- **Formato diferente:** sem T1/T2, uma coluna por dia da semana.
- **Detecção:** procura cabeçalho com nomes de dias por extenso e verifica que **não** tem T1/T2 na linha abaixo.
- **Formato por aula:** 2 linhas (Professor, Local).
- **Fallback:** se o parser dedicado não achar aulas, tenta o formato estruturado (T1/T2) e depois o formato legado (salas na coluna A).

### `excelServiceAvisos.ts` — Avisos e Eventos

- **Formato:** planilha com colunas Texto, Tipo, Data Início, Data Fim, Público, Ativo.
- **Detecção de cabeçalho:** procura a linha que contenha a coluna "Texto" (nas primeiras 10 linhas).
- **Filtro:** só retorna linhas com "Ativo" = sim ou 1.
- **Datas:** aceita serial Excel, D/M/AAAA, AAAA-MM-DD e `Date` nativo.

### `excelSheetMatrix.ts` — Resolução de mesclagens

Todas as planilhas usam `sheetToMatrix()` para converter uma aba em matriz densa. Essa função resolve **mesclagens do Excel/Google Sheets**: quando uma célula está dentro de uma região mesclada, o valor da célula-âncora é propagado para todas as posições. Sem isso, o parser veria células vazias onde o Google Sheets mostra texto mesclado.

### `excelParseHelpers.ts` — Utilitários compartilhados

- `parseTimeString` — converte "8h45", "18h25", "8:45" → "08:45"
- `parseTimeRange` — "8h - 8h45" → `{ start: "08:00", end: "08:45" }`
- `extractTimeFromCell` — extrai horário de uma célula (faixa ou horário único)
- `isTurmaName` — verifica se um texto é nome de turma (rejeita palavras reservadas)
- `getDayNumberFromText` — "Segunda" → 1, "Sábado" → 6
- `detectPeriod` — lê primeiras linhas e detecta manhã/tarde/noite/sábado
- `calculateHourlyTimes` — distribui N aulas em faixas de 1h dentro de um intervalo

### `excelAdapter.ts` — Adaptador de dados

Converte o formato intermediário (`ParsedClass[]`) para os tipos da aplicação:

- **`Course`** = uma turma/classe (ex.: "2MB T1", "17MGF 1º Trim")
- **`Teacher`** = professor único (deduplicado por nome)
- **`Room`** = sala/laboratório (deduplicado por nome)
- **`Class`** = um slot de aula (sigla + horário + dia + professor + sala)
- **`CompleteClass`** = `Class` com referências completas para Course, Teacher, Room

Cores e ícones são distribuídos automaticamente por uma paleta cíclica.

---

## Layouts de grade

O componente `CourseScheduleTable` suporta 3 layouts:

| Layout | Usado em | Descrição |
|---|---|---|
| **classic** | Superior, Livres | Horários nas linhas, dias nas colunas (5 dias) |
| **technical** | Técnicos | Dias nas linhas (3 dias), horários no topo (5 faixas) — mais compacto |
| **mba** | MBA, POS | Faixa única de horário (ex.: 09h–16h), uma linha por disciplina |

---

## Rotas

| Rota | Página |
|---|---|
| `/` | Home — modalidades + avisos |
| `/cursos/tecnico` | Picker de período (Manhã/Tarde) |
| `/cursos/tecnico/:period` | Grade dos técnicos filtrada por período |
| `/cursos/superior` | Lista de abas `SUP_*` |
| `/cursos/superior/:sheetKey` | Grade de um curso superior |
| `/cursos/livre` | Grade dos cursos livres |
| `/cursos/especializacao` | Escolha MBA ou Pós |
| `/cursos/especializacao/mba` | Lista de abas `MBA_*` |
| `/cursos/especializacao/pos` | Lista de abas `POS_*` |
| `/cursos/especializacao/:track/:sheetKey` | Grade de um curso MBA/POS |
| `/cursos/pos-graduacao` | Redirect → `/cursos/especializacao` |

---

## Modo Totem

O componente `TotemIdleReturn` monitora interação do usuário. Após **20 segundos** sem toque, tecla, scroll ou rolagem, o sistema volta automaticamente para a página inicial (`/`) e rola para o topo. Isso permite uso como **totem digital** em áreas comuns do SENAI sem que o aluno anterior deixe a tela em uma página interna.

---

## Variáveis de ambiente

Opcionais — permitem trocar as URLs das planilhas sem alterar o código. Criar arquivo `.env` na pasta `frontend/`:

```env
VITE_EXCEL_TECNICOS_MANHA_URL=https://docs.google.com/spreadsheets/d/.../export?format=xlsx
VITE_EXCEL_TECNICOS_TARDE_URL=https://docs.google.com/spreadsheets/d/.../export?format=xlsx
VITE_EXCEL_SUPERIOR_POSGRAD_URL=https://docs.google.com/spreadsheets/d/.../export?format=xlsx
VITE_EXCEL_AVISOS_URL=https://docs.google.com/spreadsheets/d/.../export?format=xlsx
```

Se não existirem, são usadas as URLs padrão definidas em cada serviço.

---

## Como rodar

### Pré-requisitos

- Node.js 18+
- npm

### Instalação e desenvolvimento

```bash
cd frontend
npm install
npm run dev
```

O Vite inicia em `http://localhost:5173`.

### Build de produção

```bash
cd frontend
npm run build
```

Os arquivos ficam em `frontend/dist/`.

### Lint

```bash
cd frontend
npm run lint
```

---

## Identidade visual

O sistema segue o manual de marca do SENAI:

- **Cor primária:** `#e30613` (vermelho SENAI)
- **Cor escura:** `#9a1915`
- **Fundo:** `#ededed`
- **Cinza texto:** `#878787`
- **Fonte:** Montserrat (Google Fonts)
- **Ícones:** Lucide React (estilo SVG, traço fino)

Componentes seguem o padrão visual: borda vermelha lateral esquerda nos cards, botões vermelhos sólidos, header vermelho com logo branca.

---

## Documentação para coordenadores

Na pasta `docs1/` há um manual de integração em HTML + CSS (`index.html` + `style.css`), escrito em linguagem simples para coordenadores que gerenciam as planilhas. Explica o que pode e o que não pode mudar em cada planilha para o sistema continuar funcionando.

---

## Licença

Projeto interno SENAI ANCHIETA - VILA MARIANA. Uso restrito.
