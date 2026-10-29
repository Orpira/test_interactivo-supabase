# 🧠 WebWiz Quiz – Plataforma de Cuestionarios Interactivos

**Repositorio:** https://github.com/Orpira/test_interactivo-supabase.git

Este proyecto es una plataforma interactiva de retos y quizzes de programación orientada a HTML, CSS y JavaScript. Permite a los usuarios practicar, validar y compartir soluciones en tiempo real, así como realizar quizzes para medir su progreso. El enfoque es educativo y está pensado para bootcamps y autoaprendizaje.

Desarrollada con tecnologías: React, Vite, Tailwind, Zustand, Supabase y más.

> Android: la integración nativa con Capacitor, OAuth móvil, APK/AAB y checklist de Google Play está documentada en [ANDROID.md](./ANDROID.md).

---

## 🚀 Funcionalidades principales

- ✅ Realización de cuestionarios por categoría principal y subcategoría
- ✅ Selección de subcategoría y número de preguntas desde modal dinámica en el navbar
- ✅ Acceso con o sin autenticación (Supabase Auth)
- ✅ Resultados con puntuación y ranking en tiempo real
- ✅ Dashboard y ranking con métricas por categoría y subcategoría
- ✅ Manejo visible de errores en consultas e inserciones de Supabase
- ✅ Banco de preguntas ampliado con contenido de backend y subcategoría Linux
- ✅ Editor de código con soporte para HTML, CSS y JS
- ✅ Guardado de código y visualización de historial
- ✅ Formulario de contacto usando `formsubmit.co`
- ✅ Página de agradecimiento tras el envío del formulario
- ✅ Separación de rutas públicas y privadas
- ✅ Testing unitario
- ✅ Google Analytics integrado

---

## 🏆 Competencias y necesidades cubiertas

| Competencia                                               | Estado |
| --------------------------------------------------------- | ------ |
| Interfaz adaptable con React                              | ✅     |
| Herramienta profesional de construcción (Vite)            | ✅     |
| Gestión de estado profesional (Zustand + Axios)           | ✅     |
| Estilos aislados con Tailwind                             | ✅     |
| Testing profesional (Testing Library, Playwright, Vitest) | ✅     |
| Uso de API externa (Supabase)                             | ✅     |
| Formulario web con `formsubmit.co`                        | ✅     |
| Pruebas unitarias                                         | ✅     |
| Rutas públicas/privadas con OAuth (Supabase Auth)         | ✅     |

---

## 🛠️ Tecnologías utilizadas

| Tecnología          | Uso                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------- |
| **React + Vite**    | SPA rápida y modular                                                                |
| **TypeScript**      | Tipado estático                                                                     |
| **Tailwind CSS**    | Estilos utilitarios modernos y responsivos                                          |
| **Zustand**         | Manejo global de estado                                                             |
| **Axios**           | Consumo de API externa                                                              |
| **Supabase**        | Backend: Base de datos PostgreSQL, Autenticación, RLS                               |
| **Supabase Auth**   | Autenticación OAuth2 (GitHub, Google) y email                                       |
| **formsubmit.co**   | Envío de formularios sin backend propio                                             |
| **Vitest**          | Testing unitario                                                                    |
| **Playwright**      | Testing end-to-end (E2E)                                                            |
| **Testing Library** | Testing unitario de componentes - Documentación en este documento [README_TESTS.md] |

---

## 📁 Estructura del proyecto

```text
├── public/
├── src/
│   ├── assets/
│   ├── components/         # Componentes reutilizables (AuthButton, ContactForm...)
│   ├── features/           # Features agrupadas (auth, editor, quiz, ranking)
│   ├── hooks/              # Custom hooks
│   ├── pages/              # Páginas principales (Home, Quiz, Editor, Ranking...)
│   ├── router/             # Rutas de la app
│   ├── services/           # Servicios externos (supabase, auth)
│   ├── store/              # Zustand store (quizStore)
│   ├── styles/             # Estilos globales
│   ├── test/               # Pruebas unitarias
│   └── vite-env.d.ts
├── tests/                  # Pruebas E2E (Playwright)
├── .husky/                 # Hooks de git (husky)
├── .github/                # Workflows de CI
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── README.md
└── ...
```

---

## 📦 Instalación y ejecución

```bash
git clone https://github.com/Orpira/test_interactivo-supabase.git
cd test_interactivo-supabase
npm install
npm run dev
```

### Variables de entorno necesarias

Crea un archivo `.env` en la raíz con:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
# Solo si Supabase tiene activada la protección CAPTCHA (proveedor: Cloudflare Turnstile)
VITE_TURNSTILE_SITE_KEY=...
```

> La site key de Turnstile es pública (empieza por `0x4…`). La **secret key** se configura únicamente en Supabase, nunca en el frontend. En el widget de Turnstile (panel de Cloudflare) añade los dominios donde se usa la app: `orpira.es`, el dominio de Vercel y `localhost` (APK y desarrollo).

---

## 🧪 Testing

- **Unitarios:**

```bash
npm run test
```

- **End-to-End:**

```bash
npx playwright test
```

---

## 🧩 Flujo actual de quizzes

1. Desde el navbar, el usuario abre `Quizzes` y elige una categoría principal.
2. La aplicación consulta Supabase en la tabla `questions` filtrando primero por `category`.
3. Con ese resultado se construye una modal dinámica con las subcategorías disponibles y el total de preguntas por cada una.
4. El usuario selecciona la subcategoría y la cantidad de preguntas a responder.
5. El runner del quiz consulta `questions` filtrando por `category` y `subcategory`.
6. Si falla la consulta o el guardado en Supabase, la interfaz muestra mensajes de error visibles al usuario.
7. Al finalizar, el resultado guarda categoría, subcategoría y resumen de respuestas para alimentar dashboard, historial y ranking.

## Cambios recientes

### Fase 5: revisión de código de IA, «Explícalo tú», temas nuevos y `/crear`

> ⚠️ **Supabase:** tras las de la Fase 4, ejecuta `20261101_fase5_ia_temas.sql` y después `20261101_fase5_ia_temas_seed.sql`.
>
> **Edge Function «Explícalo tú»:** despliégala con la CLI de Supabase:
>
> ```bash
> supabase secrets set ANTHROPIC_API_KEY=sk-ant-...   # la clave solo vive aquí
> supabase functions deploy explain-review
> ```
>
> Opcionales: `CLAUDE_MODEL` (por defecto `claude-sonnet-5-5`) y `EXPLAIN_DAILY_LIMIT` (por defecto 10).
>
> **Editores de `/crear`:** `INSERT INTO user_roles (user_id, role) VALUES ('<uuid>', 'editor');`

- **Revisa el código de la IA** (`/revisiones`): 8 PR «generados por IA», de 30 a 80 líneas, con 2-3 fallos sutiles (XSS, RLS abierta, `useEffect` sin dependencias, accesibilidad, condiciones de carrera, inyección SQL, N+1…).
  - Comentas una línea y eliges la categoría.
  - Acertar exige la línea (±1) y la categoría; la línea correcta con otra categoría da puntos parciales y los falsos positivos restan.
  - Al terminar se muestran todos los fallos con su explicación.
- **Explícalo tú** (`/explica`): 10 preguntas abiertas que corrige Claude mediante una Supabase Edge Function con una rúbrica de 3 puntos clave y los conceptos erróneos conocidos.
  - La rúbrica no sale de la base de datos.
  - La respuesta de Claude se valida (JSON) antes de mostrarla; si no es válida, aparece un mensaje amable en lugar de un fallo de pantalla.
  - Hay caché por hash de la respuesta y límite diario por usuario.
  - Un concepto erróneo detectado pasa a «A reforzar» y entra en el repaso.
- **Temas nuevos** (10 o más por tema):
  - **Accesibilidad:** auditoría WCAG real con axe-core dentro del iframe, mensajes en español.
  - **Seguridad:** primero se explota el fallo y después se parchea.
  - **Rendimiento:** se mide antes y después (desplazamiento, peticiones, mutaciones, cálculos).
  - **SQL** (`/sql`): PostgreSQL real con PGlite en el navegador; cada ejecución va en una transacción que se deshace.
  - **Git en escenarios** (`/git`): terminal y repositorio en memoria.
  - **Trabajo con IA:** las revisiones y «Explícalo tú».
- **`/crear`** (rol editor): JSON de un reto o una incidencia con plantilla, vista previa del código inicial y de la solución, y validación automática (el inicial falla y la solución pasa; en incidencias también la regresión). Solo se publica lo validado; la RLS lo exige en el servidor.

### Fase 4: «Hoy», confianza, diagnóstico y repaso espaciado

> ⚠️ **Supabase:** tras las de la Fase 3, ejecuta `20261031_fase4_aprendizaje.sql` y `20261031_fase4_aprendizaje_seed.sql`. Añaden `concepts`, `answers`, `concept_cards`, `streaks`, la función `weekly_league()`, un concepto por subcategoría de tus preguntas y 12 preguntas de predicción. Sin ellas la app funciona y guarda el progreso solo en el dispositivo.

- **Confianza** antes de comprobar (Adivino / Creo que sí / Seguro). El feedback combina acierto y confianza («Fallo con confianza alta», «Acierto, pero adivinando»), muestra «Por qué era tentadora» y cuándo vuelve el concepto al repaso.
- **Preguntas de predicción** («¿Qué imprime?») con botón **Ejecutar**, que muestra la salida real (Web Worker). Las 12 del seed se verifican ejecutándolas en `test/unit/predict.test.ts`.
- **Repaso espaciado FSRS** (`ts-fsrs`) por **concepto**: fallo = Again, acierto adivinando = Hard, «Creo que sí» = Good, «Seguro» = Easy. `/repaso` reúne hasta 12 preguntas de los conceptos que vencen hoy.
- **`/hoy`** (inicio con sesión):
  - saludo y racha con protector semanal;
  - Repaso de hoy, Incidencia del día y Continuar;
  - mapa de habilidades por área en 4 estados.
  - Navegación: barra lateral con atajos `G H`, `G P`, `G R`, `G M`, `G K` en escritorio y barra inferior de 5 pestañas en móvil. También `/practicar` y `/mapa`.
- **Diagnóstico inicial** (`/diagnostico`, 8 preguntas de todas las áreas) que fija el nivel.
- **Resultados como diagnóstico:** titular por conceptos, calibración por confianza, dominados / a reforzar, falladas desplegables y una única acción recomendada.
- **Gamificación:** liga semanal (grupos de 20 por nivel; suben los 5 primeros) en Ranking y en la barra lateral, y logros nuevos («Primer concepto dominado», «10 incidencias cerradas», «Calibración perfecta»).

#### Etiquetar el banco de preguntas con Claude (revisión humana)

`scripts/label-questions.mjs propose` pide a Claude conceptos y metadatos de cada opción incorrecta y los guarda en un JSON para revisar. `scripts/label-questions.mjs sql <json>` genera el SQL solo con las preguntas marcadas como `"approved": true`. La clave de Claude solo se usa en tu máquina; nunca llega al cliente.

### Fase 3: Modo Incidencia

> ⚠️ **Supabase:** ejecuta después de las de la Fase 1 `supabase/migrations/20261030_fase3_incidencias.sql` y `supabase/migrations/20261030_fase3_incidencias_seed.sql` (columna `score`, límites de la línea de tiempo y las 10 incidencias con `type = 'incident'`).

- **10 tickets** en `src/content/incidents` (4 CSS, 3 JavaScript, 2 accesibilidad, 1 XSS). Cada uno trae una mini-app rota, un ticket (pasos, esperado/real, dispositivo), red simulada, tests de **aceptación ocultos** y tests de **regresión** visibles.
- **Espacio de trabajo** en `/incidencias/:id`: ticket, editor, vista previa con selector 390/768/1280 px y DevTools simuladas: **Elementos** (árbol del DOM y estilos calculados, propiedades sospechosas en naranja), **Consola** (con número de línea de `app.js`), **Red** (peticiones capturadas y aviso «Ninguna petición a …») y **Regresión**.
- **Contadores en vivo** «Aceptación (ocultos) x/y» y «Regresión x/y», cronómetro y pistas. **Enviar arreglo** (`Ctrl/⌘ + Enter`) cierra el ticket solo si pasan los dos grupos.
- **Cierre:** modal «TICKET #N CERRADO» con tiempo, envíos, líneas cambiadas frente a la solución de referencia, causa raíz, línea de tiempo del diagnóstico y tarjeta PNG para compartir.
- **Puntuación** (`src/features/incidents/scoring.ts`): 1000 base, hasta +300 por tiempo, −75 por envío fallido, −100 por pista, −150 por regresión introducida, +200/+100 por diff mínimo.
- La línea de tiempo y la puntuación se guardan en `challenge_attempts` y se ven en **Historial → Incidencias cerradas**.

#### Añadir o cambiar incidencias

1. Edita `src/content/incidents/*.ts` (tipado con `IncidentSpec`).
2. `npm run db:challenges-seed` regenera también `20261030_fase3_incidencias_seed.sql`.
3. `npm run test:e2e -- tests/e2e/incidents.spec.ts` comprueba que el fallo se reproduce (aceptación falla, regresión pasa) y que la solución pasa ambos.

### Fase 1: sistema de diseño, pantalla de quiz y motor de tests

> ⚠️ **Supabase:** ejecuta en orden `supabase/migrations/20261029_fase1_retos.sql` y `supabase/migrations/20261029_fase1_retos_seed.sql`. La app funciona sin ellas (usa los retos del repo), pero los intentos no se guardan hasta aplicarlas.
> 📱 **Android:** tras actualizar, ejecuta `npm run cap:sync` (nuevo plugin `@capacitor/haptics`).

- **Diseño:** tokens de color en `styles/index.css` (tema oscuro por defecto, claro con contraste AA), tipografías locales Space Grotesk / Inter / JetBrains Mono, estados azul (correcto) y naranja (fallo).
- **Quiz:** opciones en lista vertical, resaltado con Shiki, atajos `1-4`/`A-D`, `Enter`, `E` y `Esc`, barra de progreso, racha, salida con confirmación, progreso guardado al recargar y vibración en Android.
- **Retos:** motor que ejecuta el código en un iframe aislado (DOM) o en un Web Worker (JS y consola), con 2 s por test y protección frente a bucles infinitos. 30 retos nuevos en `src/content/challenges`; los antiguos quedan como `legacy`.
- **NavBar:** paleta de comandos con `Ctrl/⌘ + K`, menú de quizzes por áreas, menú de cuenta y menú móvil nuevo. Ventana de acceso rediseñada.
- **Accesibilidad:** foco visible, radiogroup en opciones, zonas táctiles de 44 px, `prefers-reduced-motion`; axe sin violaciones y Lighthouse Accesibilidad 100 en el quiz.

#### Añadir o cambiar retos

1. Edita `src/content/challenges/{html,css,javascript}.ts` (tipado con `ChallengeSpec`).
2. `npm run db:challenges-seed` regenera la migración con los retos.
3. `npm run test:e2e -- tests/e2e/challenges.spec.ts` comprueba en Chromium que la solución pasa y el código inicial falla (también lo hace el CI).

### Anteriores (PR #1)

### Octubre 2026: estabilidad, seguridad y retos

> ⚠️ **Requiere ejecutar en Supabase** `supabase/migrations/20261028_harden_resultados.sql` (idempotente).

- **Retos de código operativos:** `/editor` lista los retos por categoría; cada reto tiene navegación anterior/siguiente y botón *Verificar solución*.
- **Validación real:** HTML por etiquetas requeridas, CSS por declaraciones de cada selector y JavaScript ejecutando casos de prueba (`expr => valor`) en un Web Worker aislado con límite de 2 s.
- **Seguridad:** la vista previa del editor ya no usa `allow-same-origin` (el código del usuario no puede leer la sesión); solo se pueden insertar resultados propios; el email deja de guardarse en `resultados` (tabla de lectura pública).
- **Quiz:** una sola consulta, preguntas y opciones barajadas, prioridad al nivel del usuario completando con otros niveles, sin doble puntuación por doble clic, botón *Reintentar* ante errores.
- **Resultados:** al guardarse, la URL pasa a `/result?id=…` (recargar ya no duplica el resultado y el enlace se puede compartir).
- **Ranking:** ordenado por porcentaje; corregido un fallo de orden de hooks que podía romper la página al iniciar sesión.
- **Dashboard:** logro «Mejora continua» calculado en orden cronológico, historial ordenado por fecha, CSV con escape correcto y compatible con Excel.
- Página 404, rutas con carga diferida (bundle inicial de 1.081 kB a 580 kB), lint sin errores, 25 tests y CI en GitHub Actions.

### Anteriores

- Se añadió manejo visible de errores en el flujo de quizzes, resultados, ranking y dashboard cuando fallan consultas o escrituras en Supabase.
- Se corrigió el solapamiento del menú `Quizzes` del navbar para evitar que bloqueara clics sobre acciones del ranking, como `Top 10`.
- Se incorporó un nuevo bloque de preguntas en Supabase para `category = backend` y `subcategory = Linux`.
- Se compactó el footer para reducir altura vertical y mantener el estilo visual del producto.
- Se incorporó captura de nivel de experiencia (`junior`, `semi_senior`, `senior`) antes de iniciar el quiz.
- Se añadió feedback adaptativo post-quiz con rating, comentario opcional y motivo obligatorio para ratings bajos.
- Se activó la regla anti-fatiga para feedback: máximo una solicitud cada 7 días por usuario.
- Se mejoró el dashboard con gráficos tipo dona para rendimiento por categoría y subcategoría, incluyendo escala visual de referencia.

### Nota de esquema en Supabase

La tabla `resultados` debe incluir la columna `subcategory` para registrar correctamente los quizzes realizados por subcategoría:

```sql
ALTER TABLE resultados
ADD COLUMN IF NOT EXISTS subcategory TEXT;
```

Además, para soportar experiencia y feedback adaptativo se incorporan estas tablas:

```sql
CREATE TABLE IF NOT EXISTS user_experience (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('junior', 'semi_senior', 'senior')),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID,
  experience_level TEXT NOT NULL CHECK (experience_level IN ('junior', 'semi_senior', 'senior')),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  reason TEXT CHECK (reason IN ('dificultad', 'claridad', 'errores_tecnicos', 'desactualizado')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Estado de implementación

### Evaluación por experiencia del usuario

- [x] Captura de nivel al inicio (`junior`, `semi_senior`, `senior`) antes de iniciar quiz.
- [x] Feedback adaptativo al finalizar quiz con rating (1-5) y comentario opcional.
- [x] Persistencia de evaluación en Supabase (`quiz_feedback`) para análisis de mejora continua.
- [x] Regla anti-fatiga: no solicitar feedback más de una vez cada 7 días por usuario.
- [x] Motivo obligatorio para rating bajo (`dificultad`, `claridad`, `errores_tecnicos`, `desactualizado`).

---

## 🚀 Despliegue

### Producción: Vercel + dominio personalizado

**URL de producción:** https://orpira.es

El proyecto está desplegado en Vercel con dominio personalizado `orpira.es`.

#### Configuración realizada

1. **Build de producción** — `npm run build` (genera carpeta `dist/` con Vite)
2. **vercel.json** — Configuración de Vercel con `outputDirectory: "dist"` y rewrites para SPA:
   ```json
   {
   	"buildCommand": "npm run build",
   	"outputDirectory": "dist",
   	"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```
3. **Dominio personalizado** — `orpira.es` añadido en Vercel → Settings → Domains
4. **Nameservers** — Cambiados en el registrador de dominio (register.domains) de `ns01.dns.nexus` / `ns02.dns.nexus` a:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
5. **SSL/HTTPS** — Certificado generado automáticamente por Vercel (Let's Encrypt)
6. **Variables de entorno en Vercel** — Configuradas en Settings → Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. **Supabase Auth** — Actualizado en Authentication → URL Configuration:
   - **Site URL**: `https://orpira.es`
   - **Redirect URLs**: `https://orpira.es/**`, `https://www.orpira.es/**`
8. **Merge a main** — Rama `categorias` fusionada a `main` con resolución de conflictos en `QuizRunner.tsx` y `useQuestions.ts`
9. **Deploy automático** — Vercel despliega automáticamente con cada push a `main`

#### Resolución de conflictos del merge (categorias → main)

Se resolvieron conflictos en dos archivos conservando la lógica de filtrado por categoría + subcategoría de la rama `categorias`:

- `src/features/quiz/QuizRunner.tsx` — Filtrado con `.in("category", categoryVariants)` + subcategoría opcional
- `src/hooks/useQuestions.ts` — Misma lógica de filtrado por variantes de categoría + subcategoría

#### Configuración alternativa: Manual

1. Configura tu proyecto en [Supabase](https://supabase.com)
2. Ejecuta el schema SQL en el SQL Editor de Supabase
3. Configura las variables de entorno
4. Haz build y despliega:

```bash
npm run build
```

> **Importante:** Si al desplegar ves el error `supabaseUrl is required`, significa que las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` no están configuradas en el entorno de hosting. Agrégalas en el panel de tu proveedor.

> **Importante:** Si al iniciar sesión redirige a `localhost`, ve a Supabase Dashboard → Authentication → URL Configuration y actualiza la **Site URL** y las **Redirect URLs** con la URL de producción (`https://orpira.es`).

---

## Estructura básica del proyecto con Husky + Commitlint

- `1. package.json (fragmento relevante)`
  {
  "scripts": {
  "prepare": "husky install"
  },
  "devDependencies": {
  "@commitlint/cli": "^18.0.0",
  "@commitlint/config-conventional": "^18.0.0",
  "husky": "^9.0.0"
  }
  }

- `2. commitlint.config.cjs`
  module.exports = {
  extends: ['@commitlint/config-conventional'],
  };

- `3. .husky/commit-msg (bash script) #!/bin/sh`
  . "$(dirname "$0")/\_/husky.sh"

npx --no -- commitlint --edit "$1"

# Proyecto Base con Husky + Commitlint

Este repositorio incluye una configuración mínima para aplicar convenciones de commits usando Husky y Commitlint.

## Instalación

```bash
npm install
```

## Activar Husky

```bash
npx husky install
```

(Ya está definido en el script `prepare`, por lo que se ejecutará automáticamente tras `npm install` si clonas el repo correctamente.)

## Crear hook manualmente (si no existe)

```bash
mkdir -p .husky
chmod +x .husky/commit-msg
```

Contenido de `.husky/commit-msg`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx --no -- commitlint --edit "$1"
```

## Ejemplo de commit válido

```bash
git commit -m "feat: agrega validación con commitlint"
```

# 📘 Guía de Convenciones para Mensajes de Commits

Esta guía sigue la convención **Conventional Commits**, con algunos prefijos prácticos adicionales como `wip` para trabajo en progreso.

| Prefijo     | Significado                                   | Cuándo usarlo                                                      | Ejemplo                                             |
| ----------- | --------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------- |
| `feat:`     | **Feature** – Nueva funcionalidad             | Al agregar una nueva funcionalidad al sistema                      | `feat: añade formulario de contacto`                |
| `fix:`      | **Bugfix** – Corrección de errores            | Al corregir un comportamiento que no funcionaba como se esperaba   | `fix: corrige validación de email en login`         |
| `docs:`     | **Documentación**                             | Cambios en README, comentarios, documentación técnica              | `docs: añade guía de instalación en README`         |
| `style:`    | **Estilo** – Sin afectar el comportamiento    | Cambios en espacios, indentación, formato                          | `style: reformatea el archivo App.js`               |
| `refactor:` | **Reestructuración interna**                  | Cambios en código sin alterar comportamiento ni corregir bugs      | `refactor: simplifica la lógica de navegación`      |
| `test:`     | **Pruebas** – Añade o ajusta tests            | Agregar, eliminar o actualizar pruebas automáticas                 | `test: añade pruebas para componente Header`        |
| `ci:`       | **Integración continua**                      | Cambios en archivos o scripts de CI (GitHub Actions, Travis, etc.) | `ci: configura deploy automático en GitHub Actions` |
| `build:`    | **Build system** – Dependencias y empaquetado | Cambios en `package.json`, Webpack, Vite, etc.                     | `build: actualiza versión de Tailwind`              |
| `chore:`    | **Tareas varias** – Mantenimiento             | Tareas que no modifican el código fuente directamente              | `chore: limpia archivos temporales`                 |
|             |

## 🧠 Recomendaciones

- Usa mensajes en **imperativo**: `añade`, `corrige`, `refactoriza`.
- Evita mensajes genéricos como `cambios`, `update`, `avance`.

---

Puedes extender esta configuración con herramientas como lint-staged, prettier, ESLint, etc.

---

## 🔗 Recursos útiles

- [Documentación React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Axios](https://axios-http.com/)
- [Supabase](https://supabase.com/)
- [Quizapi API](https://quizapi.io)
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)

---

## 👨‍💻 Autor

Orlando – [github.com/orpira](https://github.com/orpira)

---
