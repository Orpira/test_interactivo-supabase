# 📄 Explicación del flujo de la aplicación

## 1. Inicio y navegación

- El usuario accede a la página principal (Home).
- Puede elegir entre iniciar un cuestionario, probar el editor de código (requiere login) o ver el ranking.
- El botón de login/logout está siempre visible (Supabase Auth).

## 2. Cuestionarios

- El usuario selecciona una categoría (HTML, CSS, JavaScript, Formularios, Responsive o Linux) y la cantidad de preguntas.
- Las preguntas se obtienen de Supabase.
- El estado del quiz (pregunta actual, score, selección, feedback) se gestiona globalmente con Zustand.

## 3. Proceso de preguntas

- El usuario responde cada pregunta y recibe feedback inmediato (correcta/incorrecta).
- Al finalizar, se calcula el puntaje y se muestra el resultado.
- El resultado se guarda en Supabase si el usuario está autenticado.

## 4. Resultados y ranking

- El usuario ve su resultado y puede acceder al ranking general.
- El ranking se obtiene en tiempo real desde Supabase y se muestra en una tabla ordenada.

## 5. Editor de código

- El usuario puede acceder al editor de código (HTML, CSS, JS) si está autenticado.
- Puede guardar sus envíos, que quedan asociados a su cuenta y pueden verse en el historial.

## 6. Historial y contacto

- El usuario autenticado puede ver su historial de envíos de código.
- Hay un formulario de contacto que usa formsubmit.co para enviar mensajes sin backend propio.

## 7. Seguridad y rutas

- Las rutas sensibles (editor, historial) están protegidas y requieren autenticación (Supabase Auth).
- El resto de la app es accesible sin login.

## 8. Testing y CI

- Pruebas unitarias con Testing Library y Vitest.
- Pruebas E2E con Playwright.
- CI automatizado con GitHub Actions.

## 9. Despliegue

- El proyecto está alojado en GitHub: https://github.com/Orpira/test_interactivo-supabase.git
- Se despliega en **Vercel** con despliegue automático en cada push a `main`.
- Las variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) deben configurarse en Vercel → Settings → Environment Variables.
- En Supabase Dashboard → Authentication → URL Configuration se debe configurar:
  - **Site URL**: la URL del sitio en Vercel (ej: `https://tu-proyecto.vercel.app`)
  - **Redirect URLs**: agregar `https://tu-proyecto.vercel.app/**` para que el login OAuth redirija correctamente.

### Errores comunes en despliegue

| Error                        | Causa                                           | Solución                                                         |
| ---------------------------- | ----------------------------------------------- | ---------------------------------------------------------------- |
| `supabaseUrl is required`    | Variables de entorno no configuradas en hosting | Agregar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Vercel |
| Login redirige a `localhost` | Site URL de Supabase apunta a localhost         | Actualizar Site URL y Redirect URLs en Supabase Auth config      |

---

**Resumen:**
La app es una SPA moderna, segura y profesional, con estado global, consumo de API externa, autenticación, pruebas y despliegue automatizado. El flujo es intuitivo y cubre todas las competencias solicitadas para un entorno profesional de desarrollo FrontEnd.
