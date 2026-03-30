# Documento Técnico de Pruebas

## Proyecto: WebWiz Quiz

**Última revisión:** 16 jun 2025

---

## 1 · Objetivo de las pruebas

Garantizar que las piezas críticas del frontend:

- Se renderizan de forma correcta y accesible, independientemente del contexto (usuario invitado / autenticado, viewport desktop / mobile).
- Responden a la interacción del usuario (cambios de estado, navegación, validaciones).
- Mantienen una lógica determinista (funciones puras) para que futuros refactorings no rompan funcionalidad existente.

---

## 2 · Alcance y cobertura

| Tipo         | Pieza cubierta                          | Motivo de selección                                        | Cobertura conseguida                       |
| ------------ | --------------------------------------- | ---------------------------------------------------------- | ------------------------------------------ |
| Componente   | Navbar (hamburguesa + panel móvil)      | - Render condicional (login ↔ usuario)                     | · Accesibilidad (roles y aria-label)       |
|              |                                         | - Interacción (abrir / cerrar, navegación)                 | · Cambio de estado UI                      |
|              |                                         | - Diferencias entre desktop y mobile                       | · Visibilidad de enlaces / botones         |
| Función pura | validateCode() (antigua handleValidate) | - Determinística y fácil de aislar                         | · 100 % ramas (true / false)               |
|              |                                         | - Núcleo de la lógica de retos (comparación de soluciones) | · Espacios, tabulaciones y saltos de línea |

---

## 3 · Herramientas utilizadas

| Propósito          | Librería / tool                    | Instalación (-D)                               |
| ------------------ | ---------------------------------- | ---------------------------------------------- |
| Runner             | vitest                             | vitest                                         |
| Render React       | @testing-library/react             | @testing-library/react                         |
| Asserts DOM        | @testing-library/jest-dom          | @testing-library/jest-dom (auto-extend Vitest) |
| Eventos de usuario | @testing-library/user-event        | @testing-library/user-event                    |
| Mock Auth          | Contexto simulado vía AuthProvider | sin deps extra                                 |

Para proyectos con Jest basta cambiar el runner y los imports (import { describe, it } from "jest" etc.).

---

## 4 · Diseño de los tests

### 4.1 Componente <Navbar />

| Caso                                  | Pasos clave                                                                                                                                                         | Expectativas                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Render invitado                       | Renderizar con isAuthenticated=false.                                                                                                                               | Botón “Iniciar sesión” visible.              |
| Render autenticado                    | Renderizar con isAuthenticated=true.                                                                                                                                | Botón de login no existe.                    |
| Hamburguesa abre / cierra panel móvil | 1 · Hacer click en el botón Abrir menú. 2 · Comprobar que el <aside>/panel (role=navigation) es visible. 3 · Click en la “X”. 4 · Confirmar desaparición del panel. | Visibilidad cambia acorde al estado interno. |

**Puntos de interés**

- Accesibilidad: todos los botones llevan aria-label (“Abrir menú”, “Cerrar menú”).
- El panel móvil recibe role="navigation", lo que permite getByRole('navigation', { hidden: true }).

### 4.2 Función pura validateCode()

| Caso                                  | Entrada                                                 | Salida esperada   |
| ------------------------------------- | ------------------------------------------------------- | ----------------- |
| Coincidencia exacta (ignora espacios) | "<h1>Hola Mundo</h1>" vs. "<h1>Hola Mundo</h1>"         | true              |
| Diferencia de contenido               | "<p>Hola</p>" vs. "<h1>Hola</h1>"                       | false             |
| Manejo de saltos y tabs               | Código con \n, \t                                       | true              |
| Extra (combinado)                     | Reglas contains + regex (si se añaden más validaciones) | Conforme a reglas |

---

## 5 · Implementación

### 5.1 Estructura de carpetas

```
src/
  components/
    Navbar.tsx
  utils/
    validateCode.ts          ← función pura
tests/
  unit/
    validateCode.test.ts
  components/
    Navbar.test.tsx
```

### 5.2 Fragmento clave de cada test

```ts
// Navbar.test.tsx
const burger = screen.getByLabelText(/abrir menú/i);
await user.click(burger);
expect(screen.getByRole("navigation", { hidden: true })).toBeVisible();

const close = screen.getByLabelText(/cerrar menú/i);
await user.click(close);
expect(
	screen.queryByRole("navigation", { hidden: true }),
).not.toBeInTheDocument();

// validateCode.test.ts
expect(validateCode(userHtml, expectedHtml)).toBe(true);
```

---

## 6 · Ejecución y reporte

Añadir en package.json:

```json
"scripts": {
  "test":      "vitest run",
  "test:watch":"vitest",
  "test:ui":   "vitest --ui"
}
```

- `npm run test` → modo headless (CI).
- `npm run test:ui` → interfaz interactiva con filtros y vista de snapshots.
- Integración CI (GitHub Actions) ~ añadir un job que ejecute npm ci y luego npm run test.

---

## 7 · Resultados y métricas

| Métrica              | Valor                                   |
| -------------------- | --------------------------------------- |
| Tests totales        | 7                                       |
| Función validateCode | 100 % branches cubiertas                |
| Componente Navbar    | Render cond. + interacción mobile       |
|                      | Accesibility queries (role, aria-label) |
| Tiempo medio         | ≤ 1 s en M1                             |

La cobertura global es baja porque sólo apuntamos a la lógica crítica, pero cada módulo elegido queda completamente protegido.

---

## 8 · Próximos pasos

- Añadir coverage HTML (`vitest --coverage`) para visualizar líneas no cubiertas.
- Incluir tests de integración End-to-End (Playwright) para flujos “inicio → quiz → validar respuesta”.
- Mockear llamadas a Supabase para aislar side-effects.
- Ejecutar tests en pull-requests mediante GitHub Actions.

---

## 9 · Conclusiones

Los tests definidos:

- Aíslan la lógica pura (`validateCode`) de la UI.
- Verifican que el componente de navegación reacciona a cambios de estado y mantiene accesibilidad.
- Sirven de red flag inmediato cuando un refactor rompe funcionalidad esencial (validación de retos o navegación móvil).
