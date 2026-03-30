# 🧠 WebWiz Quiz – Plataforma de Cuestionarios Interactivos

**Repositorio:** https://github.com/Orpira/test_interactivo-supabase.git

Este proyecto es una plataforma interactiva de retos y quizzes de programación orientada a HTML, CSS y JavaScript. Permite a los usuarios practicar, validar y compartir soluciones en tiempo real, así como realizar quizzes para medir su progreso. El enfoque es educativo y está pensado para bootcamps y autoaprendizaje.

Desarrollada con tecnologías: React, Vite, Tailwind, Zustand, Supabase y más.

---

## 🚀 Funcionalidades principales

- ✅ Realización de cuestionarios por categoría (HTML, CSS, JavaScript, Formularios, Responsive, Linux)
- ✅ Acceso con o sin autenticación (Supabase Auth)
- ✅ Resultados con puntuación y ranking en tiempo real
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

## 🚀 Despliegue

### Opción 1: Vercel (recomendado)

1. Importa el repositorio en [Vercel](https://vercel.com)
2. Configura las variables de entorno en **Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. En Supabase Dashboard → **Authentication → URL Configuration**:
   - Cambia **Site URL** a la URL de tu proyecto en Vercel (ej: `https://tu-proyecto.vercel.app`)
   - Agrega la URL de Vercel en **Redirect URLs**: `https://tu-proyecto.vercel.app/**`
4. Vercel despliega automáticamente con cada push a `main`

### Opción 2: Manual

1. Configura tu proyecto en [Supabase](https://supabase.com)
2. Ejecuta el schema SQL en el SQL Editor de Supabase
3. Configura las variables de entorno
4. Haz build y despliega:

```bash
npm run build
```

> **Importante:** Si al desplegar ves el error `supabaseUrl is required`, significa que las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` no están configuradas en el entorno de hosting. Agrégalas en el panel de tu proveedor.

> **Importante:** Si al iniciar sesión redirige a `localhost`, ve a Supabase Dashboard → Authentication → URL Configuration y actualiza la **Site URL** y las **Redirect URLs** con la URL de producción.

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
