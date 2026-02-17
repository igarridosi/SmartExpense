# SmartExpense

Aplicación de control de gastos construida con Next.js, Supabase y Tailwind.

---

## Índice

- [Resumen rápido](#resumen-rápido)
- [Requisitos](#requisitos)
- [Setup inicial](#setup-inicial)
- [Migración product_events](#migración-product_events)
- [Tracking de eventos](#tracking-de-eventos)
- [Storybook](#storybook)
- [Visual regression con Chromatic](#visual-regression-con-chromatic)
- [CI en Pull Requests](#ci-en-pull-requests)
- [Checklist de validación](#checklist-de-validación)
- [Troubleshooting](#troubleshooting)

---

## Resumen rápido

```bash
npm install
npm run dev
```

App local: `http://localhost:3000`

---

## Requisitos

| Herramienta | Versión mínima | Recomendado |
|---|---:|---:|
| Node.js | 20.19.0 | 20.19.0 |
| npm | 10 | Última estable |
| Supabase | Proyecto activo | CLI instalada |

Referencia de versión Node recomendada en `.nvmrc`.

---

## Setup inicial

1. Instala dependencias:

```bash
npm install
```

2. Configura variables de entorno en `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

3. Levanta la app:

```bash
npm run dev
```

---

## Migración product_events

Archivo SQL: `supabase/migrations/003_product_events.sql`

### Opción A — Supabase CLI (recomendada)

1. Instala Supabase CLI (Windows PowerShell):

```powershell
winget install Supabase.CLI
```

2. Inicia sesión y vincula el proyecto:

```powershell
supabase login
supabase link --project-ref <TU_PROJECT_REF>
```

3. Aplica migraciones:

```powershell
supabase db push
```

### Opción B — SQL Editor (manual)

1. Abre Supabase Dashboard → SQL Editor.
2. Copia y pega `supabase/migrations/003_product_events.sql`.
3. Ejecuta el script.
4. Verifica tabla `public.product_events` y políticas RLS.

---

## Tracking de eventos

Eventos implementados:

- `auth_login_success`
- `auth_signup_success`
- `expense_created`
- `expense_updated`
- `expense_deleted`
- `insights_viewed`
- `insights_whatif_changed`
- `insights_goal_updated`

Endpoint API interno:

- `POST /api/events/track`

---

## Storybook

> Storybook `10.2.x` requiere Node `20.19+` o `22.12+`.

1. Verifica versión actual:

```bash
node -v
```

2. Si no cumples versión (recomendado con nvm):

```bash
nvm install 20.19.0
nvm use 20.19.0
```

3. Levanta Storybook:

```bash
npm run storybook
```

4. Genera build estático:

```bash
npm run build-storybook
```

---

## Visual regression con Chromatic

1. Crea proyecto en Chromatic y copia `CHROMATIC_PROJECT_TOKEN`.
2. Define token en PowerShell:

```powershell
$env:CHROMATIC_PROJECT_TOKEN="<TU_TOKEN>"
```

3. Ejecuta snapshot visual:

```powershell
npm run test:visual -- --project-token=$env:CHROMATIC_PROJECT_TOKEN
```

Alternativa directa:

```powershell
npx chromatic --project-token $env:CHROMATIC_PROJECT_TOKEN --exit-zero-on-changes
```

---

## CI en Pull Requests

Se incluye workflow en `.github/workflows/ci-pr.yml` con estos jobs automáticos por PR:

- `npm run lint`
- `npm run build`
- `npm run build-storybook`
- `npm run test:visual` (Chromatic, solo si existe secreto)

### Configuración manual en GitHub

1. Ve a `Repository Settings` → `Secrets and variables` → `Actions`.
2. Crea un secreto llamado `CHROMATIC_PROJECT_TOKEN`.
3. Pega el token de tu proyecto Chromatic.
4. Abre/actualiza un PR para ejecutar el pipeline.

Si no configuras el secreto, los checks de calidad seguirán ejecutándose y el job de Chromatic se omitirá automáticamente.

---

## Checklist de validación

```bash
npm run lint
npm run build
```

Si usas Storybook:

```bash
npm run build-storybook
```

---

## Troubleshooting

### `npm run storybook` falla por versión de Node

- Error esperado en este caso: Node menor a `20.19` o `22.12`.
- Solución:

```bash
nvm install 20.19.0
nvm use 20.19.0
node -v
```

### `supabase` no se reconoce en terminal

- Instala CLI:

```powershell
winget install Supabase.CLI
```

- Cierra y abre terminal, luego valida:

```powershell
supabase --version
```
