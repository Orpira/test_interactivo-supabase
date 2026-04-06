# 🧠 WebWiz Quiz – Plataforma de Cuestionarios Interactivos

**Repositorio:** https://github.com/Orpira/test_interactivo-supabase.git

Este proyecto es una plataforma interactiva de retos y quizzes de programación orientada a HTML, CSS y JavaScript. Permite a los usuarios practicar, validar y compartir soluciones en tiempo real, así como realizar quizzes para medir su progreso. El enfoque es educativo y está pensado para bootcamps y autoaprendizaje.

Desarrollada con tecnologías: React, Vite, Tailwind, Zustand, Supabase y más.

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
```

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
