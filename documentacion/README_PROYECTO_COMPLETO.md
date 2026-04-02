# Documentación Técnica Completa

## Descripción General

Este proyecto es una plataforma interactiva de retos y tests de programación orientada a HTML, CSS y JavaScript. Permite a los usuarios practicar, validar y compartir soluciones en tiempo real, así como realizar tests para medir su progreso. El enfoque es educativo y está pensado para bootcamps y autoaprendizaje.

---

## Tecnologías y Herramientas Empleadas

- **React**: Librería principal para la construcción de interfaces de usuario.
- **TypeScript**: Tipado estático para mayor robustez y mantenibilidad.
- **Vite**: Bundler ultrarrápido para desarrollo y build.
- **Tailwind CSS**: Framework de utilidades CSS para estilos rápidos y responsivos.
- **Framer Motion**: Animaciones fluidas y declarativas en React.
- **Zustand**: Store global para gestión de estado simple y eficiente.
- **Supabase**: Backend para autenticación, base de datos PostgreSQL y almacenamiento de retos.
- **Supabase Auth**: Proveedor de autenticación seguro y escalable.
- **React Router**: Navegación SPA y rutas protegidas.
- **React Icons**: Iconografía moderna y personalizable.
- **Playwright**: Testing end-to-end automatizado.

---

## Dependencias Principales

- `react`, `react-dom`, `react-router-dom`
- `typescript`, `vite`, `@vitejs/plugin-react`
- `tailwindcss`, `postcss`, `autoprefixer`
- `framer-motion`
- `zustand`
- `@supabase/supabase-js`
- `@supabase/auth-ui-react`
- `react-icons`
- `playwright`

---

## Estructura de Carpetas y Componentes Clave

```
src/
  components/
    Navbar.tsx         // Barra de navegación responsive y protegida
    Footer.tsx         // Pie de página con redes sociales
    UserButton.tsx     // Menú de usuario y logout
    ...
  features/
    home/Home.tsx      // Landing page, animaciones y acceso a retos/tests
    challenges/
      pages/
        ChallengeCategories.tsx   // Selección de categoría de retos
        ChallengeEditorPage.tsx   // Editor de retos por categoría e id
      ...
    quiz/
      QuizRunner.tsx   // Ejecución de tests interactivos
      Result.tsx       // Resultados de tests
      ...
    editor/Editor.tsx  // Editor de código con Monaco
    dashboard/         // Panel de usuario y estadísticas
    ...
  pages/
    Quiz.tsx           // Página principal de tests
    Historial.tsx      // Historial de tests y envíos de código
    ...
  store/
    challengeStore.ts  // Store Zustand para retos
    ...
  services/
    supabase.ts        // Configuración de Supabase
    auth.tsx           // Configuración de Supabase Auth
    ...
public/
  languajes.png        // Imagen animada en home
  logo.png             // Logo principal
  challenges.json      // Retos de ejemplo
```

---

## Explicación del Flujo de Ejecución

1. **Inicio y Autenticación**
   - El usuario accede a la landing (`Home.tsx`), donde ve animaciones, botón de inicio y cards de categorías.
   - Si no está autenticado, se le invita a iniciar sesión para acceder a retos exclusivos y seguimiento de progreso.
   - El Navbar muestra opciones según el estado de autenticación (solo Test si no está logueado, todo el menú si sí).

2. **Navegación y Acceso a Retos**
   - Al hacer clic en una categoría, se navega a `/editor/:categoria/:id` usando el id real del primer reto de la categoría.
   - El componente `ChallengeEditorPage` obtiene el reto desde el store global y lo muestra en el editor interactivo.
   - Si el usuario no está autenticado, se muestra un modal informativo y no se permite el acceso.

3. **Tests y Resultados**

- El usuario inicia el flujo de quiz desde el `Navbar`, seleccionando primero una categoría principal.
- La aplicación consulta Supabase por `category` y abre una modal con subcategorías disponibles y cantidad de preguntas.
- El usuario elige subcategoría y número de preguntas antes de comenzar.
- El runner del quiz filtra preguntas por `category` y `subcategory`.
- Los resultados se almacenan con categoría, subcategoría y resumen, y pueden consultarse en el historial, dashboard y ranking.

4. **Gestión de Estado y Datos**
   - Zustand gestiona el estado global de retos, tests y resultados.
   - Supabase almacena los retos y resultados, y Supabase Auth gestiona la autenticación.

5. **Responsive y Accesibilidad**
   - Todo el diseño es responsive (Navbar, Home, categorías, modales).
   - Se usan colores, sombras y animaciones para mejorar la experiencia visual.

---

## Componentes y Funcionalidades Destacadas

- **Navbar**: Responsive, con entrada al flujo de quizzes por categoría principal y apertura de modal de subcategorías dinámica.
- **Home**: Animaciones con Framer Motion, imagen giratoria, cards de categorías con sombra y botón destacado.
- **Modales**: Mensajes claros para acceso restringido, login y selección de subcategoría con imágenes y número de preguntas.
- **Editor**: Integración con Monaco Editor para retos de código.
- **Dashboard**: Estadísticas, logros y visualización de rendimiento por categoría y subcategoría.
- **Historial**: Visualización de tests y envíos de código previos.
- **Ranking**: Tabla general y recientes con columna de subcategoría y filtros por categoría/subcategoría.
- **Footer**: Fondo degradado, iconos de redes sociales y enlaces externos.

---

## Buenas Prácticas y Consejos para Bootcamp

- **Componentización**: Divide la UI en componentes reutilizables y enfocados.
- **Estado global**: Usa Zustand para evitar prop drilling y facilitar la gestión de datos.
- **Protección de rutas**: Usa rutas privadas para restringir acceso a usuarios autenticados.
- **Animaciones**: Usa Framer Motion para mejorar la experiencia sin sacrificar rendimiento.
- **Responsive**: Aplica utilidades Tailwind para asegurar que todo se vea bien en cualquier dispositivo.
- **Accesibilidad**: Usa roles, aria-labels y colores con buen contraste.
- **Testing**: Implementa pruebas E2E con Playwright para asegurar la calidad.

---

## Repositorio y Despliegue

- **Repositorio:** https://github.com/Orpira/test_interactivo-supabase.git
- **Despliegue:** Vercel (despliegue automático con cada push a `main`)
- **Variables de entorno en Vercel:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Configuración de Supabase Auth:** En Supabase Dashboard → Authentication → URL Configuration, configurar Site URL y Redirect URLs con la URL de producción en Vercel.

### Errores comunes en despliegue

- **`supabaseUrl is required`**: Las variables de entorno no están configuradas en el hosting. Agregar en Vercel → Settings → Environment Variables.
- **Login redirige a `localhost`**: La Site URL en Supabase Auth sigue apuntando a `http://localhost:5173`. Actualizarla a la URL de producción y agregar la URL en Redirect URLs.

### Ajuste requerido de esquema para resultados por subcategoría

- La tabla `resultados` debe incorporar la columna `subcategory` para persistir correctamente los quizzes realizados por subcategoría.
- SQL recomendado:

```sql
ALTER TABLE resultados
ADD COLUMN IF NOT EXISTS subcategory TEXT;
```

---

## Conclusión

Este proyecto es un ejemplo profesional de una plataforma educativa moderna, escalable y mantenible. Aplica los principios de desarrollo frontend actuales y es ideal para aprender buenas prácticas en un bootcamp. Explora el código, experimenta con los retos y ¡adapta la plataforma a tus necesidades!

---

## Bitácora Operativa Git

### Registro: 2026-04-02

Objetivo ejecutado: mover el trabajo local no versionado a una rama dedicada llamada `desarrollos`, partiendo del último commit remoto.

Pasos realizados:

1. Validación de estado local y remoto

- Rama base detectada: `main` sincronizada con `origin/main`.
- Se verificó que existían cambios locales (modificados y nuevos sin commit).

2. Sincronización de referencias remotas

- Se ejecutó actualización de referencias para trabajar con la base remota más reciente.

3. Creación/uso de rama objetivo

- Se confirmó la existencia de la rama `desarrollos`.
- Se cambió el trabajo activo a `desarrollos`.

4. Verificación de traspaso de cambios

- Los cambios locales quedaron disponibles en la rama `desarrollos`.

5. Documentación del proceso

- Se añadió este registro para dejar trazabilidad del flujo aplicado.

Nota:

- Este registro documenta el proceso operativo realizado en Git para separar el desarrollo local en una rama específica.

---

¿Dudas o sugerencias? ¡Consulta con tu tutor o revisa la documentación de cada tecnología empleada!
