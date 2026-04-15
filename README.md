# Encuesta JTBD — Colegios

Web app para correr la encuesta de **Jobs to be Done** a padres de colegios, con detección automática del Job dominante, dashboard administrativo y export a Excel.

## Stack

- **Next.js 15** (App Router, TypeScript, Tailwind)
- **Supabase** (Postgres + Auth para admin)
- **Recharts** (gráficos)
- **SheetJS / xlsx** (export Excel)

## Estructura

```
src/
  app/
    encuesta/[slug]/   # encuesta pública por colegio
    admin/
      login/           # login Supabase
      dashboard/       # KPIs y gráficos
      colegios/        # CRUD + links únicos
      respuestas/      # tabla + export Excel
  components/
    form/              # PreguntaRenderer, EncuestaForm
    admin/             # DashboardCharts, ColegiosManager, RespuestasTable, LogoutButton
    ui/                # Button, ProgressBar
  data/
    preguntas.ts       # catálogo editable de preguntas (posicionamiento, filtro, por Job, Gabor-Granger)
  lib/
    supabase/          # clients (browser + server)
    auth.ts            # requireAuth helper
    scoring.ts         # calcularScores + determinarJob
    export.ts          # generación Excel multi-hoja
  types/
supabase/
  schema.sql           # tablas + RLS
```

## Setup

### 1. Supabase

1. Crear proyecto en [supabase.com](https://supabase.com).
2. **SQL editor → New query** → pegar contenido de [supabase/schema.sql](supabase/schema.sql) y ejecutar.
3. **Authentication → Users → Add user** → crear el primer admin con email + password.
4. Copiar `Project URL` y `anon public key` desde **Project Settings → API**.

### 2. Variables de entorno

```bash
cp .env.local.example .env.local
```

Editar `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 3. Desarrollo local

> Requiere Node ≥ 20.9 (Next 15). Si tu Node es 20.0, actualiza con `nvm install 20`.

```bash
npm install
npm run dev
```

Abrir <http://localhost:3000>.

### 4. Deploy a Vercel

1. Push del repo a GitHub.
2. En Vercel: **New Project → Import** del repo.
3. Agregar las dos variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Deploy.

## Flujo de la encuesta

1. **Intro + datos opcionales** (nombre/email).
2. **Posicionamiento** del colegio (común a todos): atributo distintivo, asociación de marca, cumplimiento de promesa, irreemplazable.
3. **Filtro de Job** (3 preguntas con opciones que mapean a Job 1 / 2 / 3). Cada selección suma 1 punto al Job correspondiente.
4. **Cálculo del Job dominante**. Empate → prioriza Job 1 > Job 3 > Job 2.
5. **Bloque específico del Job** detectado: ponderación 100 pts + atributo emergente + Likert 1-9 con sub-abiertas.
6. **Gabor-Granger** de precio adaptado al framing del Job ($250–$700, escala 1-9 por escalón).
7. Insert en `respuestas` (`completada=true`).

## Dashboard

- KPIs globales (total, completadas, % completitud, colegios activos).
- Tarjetas por Job con % global.
- Pie chart de distribución global.
- Bar chart apilado por colegio.
- CRUD de colegios → cada uno genera su link único `/encuesta/<slug>`.
- Tabla de respuestas con filtros (colegio + Job).
- Export Excel con hojas: `Resumen`, `Job 1`, `Job 2`, `Job 3`, `Por Colegio`.

## Personalizar preguntas

Todas las preguntas están en [src/data/preguntas.ts](src/data/preguntas.ts). Editá el wording, agregá ítems o cambiá los pasos del Gabor-Granger sin tocar componentes.

## Notas de seguridad

- RLS habilitado en ambas tablas.
- `colegios`: lectura pública solo de los `activo=true`; escritura solo autenticados.
- `respuestas`: insert/update público (la encuesta es anónima por diseño); lectura solo autenticados. Si necesitás cerrar el insert público, agregá un token firmado por colegio.
