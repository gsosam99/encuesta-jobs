@../CLAUDE.md
@AGENTS.md

# encuesta-jobs — Contexto específico del proyecto

> Extiende el manual de workspace (`../CLAUDE.md`). Las reglas de allí aplican aquí sin
> repetirlas. Este archivo agrega solo lo particular de este proyecto.

---

## Propósito

Encuesta de **Jobs to be Done (JTBD)** para padres de colegios. Detecta el Job dominante
de cada padre (Job 1, 2 o 3) con preguntas de filtro y luego muestra un bloque de preguntas
específico al Job detectado. Incluye dashboard admin con gráficos, CRUD de colegios
(cada uno con URL única) y export a Excel.

**Referencia conceptual:** Metodología de Clayton Christensen y Bob Moesta.

---

## Jobs definidos

| ID | Nombre | Esencia |
|----|--------|---------|
| 1 | Disciplina y Excelencia Académica | Preparación rigurosa, bilingüismo real, disciplina que forme carácter |
| 2 | Seguridad, Atención y Logística | Entorno seguro, atención personalizada, logística integrada |
| 3 | Integralidad, Valores y Felicidad | Coherencia de valores, talentos, felicidad, comunidad diversa |

---

## Estructura de la encuesta (flujo de estados)

```
intro → datos (opcionales) → posicionamiento → filtro → job detectado
→ bloque específico del Job → gabor-granger → enviado
```

**Scoring del Job:** 1 punto por cada opción seleccionada en `PREGUNTAS_FILTRO`.
Desempate: Job 1 > Job 3 > Job 2 (definido en `src/lib/scoring.ts`).

---

## Archivos clave — no refactorizar sin revisar dependencias

| Archivo | Rol |
|---------|-----|
| `src/data/preguntas.ts` | Catálogo completo de preguntas. **Único lugar** para editar wording, agregar ítems, cambiar pasos del Gabor-Granger |
| `src/lib/scoring.ts` | Lógica de cálculo y desempate de Job |
| `src/lib/validacion.ts` | Validador heurístico de respuestas vagas (sin LLM) |
| `src/lib/export.ts` | Genera Excel multi-hoja con SheetJS |
| `supabase/schema.sql` | Schema completo. Ejecutar en Supabase SQL Editor al crear proyecto |

---

## Schema de base de datos

```sql
-- colegios (id, nombre, slug unique, activo bool, created_at)
-- respuestas (id, colegio_id FK, nombre?, email?, job_asignado 1|2|3,
--             scores jsonb, posicionamiento jsonb, filtro jsonb,
--             job_especifico jsonb, precio jsonb, completada bool, created_at)
```

**Slug:** generado automáticamente desde el nombre (slugify en `ColegiosManager.tsx`).
**URL de encuesta:** `/encuesta/[slug]` — acceso público, resuelve colegio desde slug.

---

## Variables de entorno requeridas

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

Solo estas dos. No hay secrets adicionales en este proyecto.

---

## Validación de respuestas abiertas

Reglas en `src/lib/validacion.ts`:
- **Abiertas principales:** mínimo 40 caracteres útiles + 6 palabras únicas.
- **Sub-abiertas (Likert):** mínimo 25 caracteres + 4 palabras únicas.
- Blocklist de 35+ frases vagas normalizadas.
- Anti-spam (palabra repetida).
- UI: contador en vivo + borde rojo/verde + botón Siguiente bloqueado.

Si se agrega una nueva pregunta `tipo: "abierta"` y es `requerida: true`,
la validación se aplica automáticamente. No requiere cambios en el validador.

---

## Reglas de negocio críticas — no cambiar sin confirmación del cliente

1. El filtro usa **mayoría simple** de 3 preguntas (máx 1 punto por pregunta por Job).
2. En empate, el orden de prioridad es Job 1 > Job 3 > Job 2.
3. El Gabor-Granger va de $250 a $700 en pasos de $50 — escala Likert 1-9 por escalón.
4. El Job detectado se muestra al usuario (tarjeta verde informativa) antes del bloque específico.
5. Los datos opcionales (nombre/email) no bloquean el avance — la encuesta es anónima por diseño.

---

## Dashboard admin

- Ruta raíz: `/admin/dashboard` (requiere sesión Supabase Auth).
- Login: `/admin/login` (Supabase email + password).
- CRUD colegios: `/admin/colegios` — crear genera slug, muestra link copiable.
- Tabla respuestas: `/admin/respuestas` — filtros por colegio + Job + botón export.
- Gráficos: Recharts (pie global + bar apilado por colegio) en `DashboardCharts.tsx`.

---

## Comandos útiles de este proyecto

```bash
# Desarrollo local
npm run dev

# Type check (obligatorio antes de push)
npx tsc --noEmit

# Generar tipos de Supabase (cuando cambia el schema)
npx supabase gen types typescript --project-id TU_PROJECT_ID > src/types/supabase.ts

# Build de producción local
npm run build
```

---

## Deuda técnica conocida (no implementar sin pedido explícito)

- [ ] Middleware de Next.js para proteger `/admin/*` a nivel de routing (actualmente cada page llama `requireAuth()`).
- [ ] Paginación en la tabla de respuestas (no necesaria hasta ~500 respuestas).
- [ ] Validación semántica con LLM (Claude Haiku vía `/api/validar`) para respuestas abiertas más exigentes.
- [ ] Dark mode completo (eliminado intencionalmente para evitar bugs de contraste).
- [ ] Tests unitarios para `scoring.ts` y `validacion.ts`.
