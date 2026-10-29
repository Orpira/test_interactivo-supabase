import type { ReviewSpec } from "@/features/reviews/types";

/** Convierte un bloque de código en líneas de diff "añadidas", salvo las que empiezan por "~" (contexto). */
const added = (code: string) =>
	code
		.replace(/^\n/, "")
		.split("\n")
		.map((l) => (l.startsWith("~") ? ` ${l.slice(1)}` : `+${l}`))
		.join("\n");

export const REVIEWS: ReviewSpec[] = [
	{
		id: "rev-01",
		type: "review",
		title: "Widget de comentarios con filtro por autor",
		description: "Añade la lista de comentarios del artículo y un selector para filtrar por autor. Probado en local, todo funciona 👍",
		file: "src/comentarios.js",
		language: "javascript",
		difficulty: "semi_senior",
		diff: added(`
~import { api } from "./api.js";
~
const lista = document.querySelector("#comentarios");
const filtro = document.querySelector("#autor");

function pintar(comentarios) {
  lista.innerHTML = comentarios
    .map((c) => \`<li><strong>\${c.autor}</strong> \${c.texto}</li>\`)
    .join("");
}

async function cargar(autor) {
  lista.setAttribute("aria-busy", "true");
  const url = autor ? \`/api/comentarios?autor=\${encodeURIComponent(autor)}\` : "/api/comentarios";
  const res = await api(url);
  const datos = await res.json();
  pintar(datos);
  lista.setAttribute("aria-busy", "false");
}

filtro.addEventListener("change", () => {
  cargar(filtro.value);
});

cargar();

export function contar(comentarios) {
  return comentarios.reduce((n, c) => n + (c.texto.trim() ? 1 : 0), 0);
}

export function resumen(comentarios) {
  const autores = new Set(comentarios.map((c) => c.autor));
  return \`\${contar(comentarios)} comentarios de \${autores.size} autores\`;
}`),
		issues: [
			{
				id: "xss",
				category: "seguridad",
				match: "lista.innerHTML = comentarios",
				span: 3,
				title: "XSS: texto de usuario dentro de innerHTML",
				explanation: "autor y texto los escriben los usuarios. Con innerHTML, un comentario como <img src=x onerror=…> ejecuta código en el navegador de cada lector. Hay que crear los nodos y asignar textContent (o escapar el HTML).",
				concepts: ["xss"],
			},
			{
				id: "race",
				category: "bug",
				match: "const res = await api(url);",
				title: "Condición de carrera al cambiar el filtro",
				explanation: "Si el usuario cambia de autor dos veces seguidas, la respuesta antigua puede llegar después y pintar el filtro equivocado. Hay que cancelar la petición anterior (AbortController) o descartar respuestas que no sean la última.",
				concepts: ["promises", "event-loop"],
			},
			{
				id: "ok",
				category: "bug",
				match: "const datos = await res.json();",
				title: "No se comprueba res.ok",
				explanation: "Un 500 o un 404 también resuelve fetch: res.json() fallará o pintará un objeto de error y aria-busy se quedará en true. Comprueba res.ok y usa try/finally para restaurar el estado.",
				concepts: ["promises"],
			},
		],
	},
	{
		id: "rev-02",
		type: "review",
		title: "Tabla de notas privadas con RLS",
		description: "Crea la tabla notes para que cada usuario guarde sus notas. He activado RLS para que sea segura.",
		file: "supabase/migrations/20261101_notas.sql",
		language: "sql",
		difficulty: "senior",
		diff: added(`
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 120),
  body TEXT NOT NULL DEFAULT '',
  shared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Cada usuario ve sus notas y las compartidas
CREATE POLICY "Ver notas" ON notes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR shared);

-- Crear notas propias
CREATE POLICY "Crear notas" ON notes
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Editar notas
CREATE POLICY "Editar notas" ON notes
  FOR UPDATE TO authenticated
  USING (true);

-- Borrar notas propias
CREATE POLICY "Borrar notas" ON notes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Listado del usuario ordenado por fecha
CREATE VIEW my_notes AS
  SELECT id, title, updated_at FROM notes
  WHERE user_id = auth.uid()
  ORDER BY updated_at DESC;`),
		issues: [
			{
				id: "insert",
				category: "seguridad",
				match: "  WITH CHECK (true);",
				title: "INSERT sin comprobar el dueño",
				explanation: "WITH CHECK (true) permite insertar filas con el user_id de otra persona (notas \"en su nombre\"). Debe ser WITH CHECK (auth.uid() = user_id).",
				concepts: ["rls"],
			},
			{
				id: "update",
				category: "seguridad",
				match: "FOR UPDATE TO authenticated",
				span: 2,
				title: "Cualquiera puede editar cualquier nota",
				explanation: "USING (true) en UPDATE deja modificar notas ajenas, y sin WITH CHECK se puede incluso cambiar el user_id. Usa USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id).",
				concepts: ["rls"],
			},
			{
				id: "index",
				category: "rendimiento",
				match: "  WHERE user_id = auth.uid()",
				span: 2,
				title: "Falta índice por usuario y fecha",
				explanation: "La vista y las políticas filtran por user_id y ordenan por updated_at: sin un índice (user_id, updated_at DESC) cada consulta recorre la tabla entera cuando crece.",
				concepts: ["sql-indices"],
			},
		],
	},
	{
		id: "rev-03",
		type: "review",
		title: "Tarjeta de perfil con avatar y estado en línea",
		description: "Componente ProfileCard: carga el usuario, muestra su avatar y refresca el estado \"en línea\" cada 30 s.",
		file: "src/components/ProfileCard.tsx",
		language: "tsx",
		difficulty: "semi_senior",
		diff: added(`
~import { useEffect, useState } from "react";
~import { getUser, getPresence, type User } from "../api";
~
type Props = { userId: string };

export default function ProfileCard({ userId }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    getUser(userId).then(setUser);
  });

  useEffect(() => {
    const id = setInterval(async () => {
      setOnline(await getPresence(userId));
    }, 30_000);
  }, [userId]);

  if (!user) return <p>Cargando…</p>;

  return (
    <article className="card">
      <img src={user.avatarUrl} width={64} height={64} />
      <h2>{user.name}</h2>
      <p className={online ? "online" : "offline"}>
        {online ? "En línea" : "Desconectado"}
      </p>
      <a href={\`/perfil/\${user.id}\`}>Ver perfil</a>
    </article>
  );
}`),
		issues: [
			{
				id: "deps",
				category: "rendimiento",
				match: "    getUser(userId).then(setUser);",
				span: 2,
				title: "useEffect sin array de dependencias",
				explanation: "Sin dependencias el efecto se ejecuta tras cada render; setUser provoca otro render y otra petición: bucle infinito de peticiones. Debe ser [userId].",
				concepts: ["react-hooks"],
			},
			{
				id: "cleanup",
				category: "bug",
				match: "    const id = setInterval(async () => {",
				span: 4,
				title: "El intervalo nunca se limpia",
				explanation: "El efecto no devuelve () => clearInterval(id). Al cambiar de usuario o desmontar, el intervalo sigue vivo: fugas de memoria y estados de otro usuario.",
				concepts: ["react-hooks"],
			},
			{
				id: "alt",
				category: "accesibilidad",
				match: "<img src={user.avatarUrl}",
				title: "Imagen sin texto alternativo",
				explanation: "Sin alt el lector de pantalla lee la URL. Si el nombre ya aparece al lado, usa alt=\"\" (decorativa); si no, alt={`Avatar de ${user.name}`}.",
				concepts: ["a11y-imagenes"],
			},
		],
	},
	{
		id: "rev-04",
		type: "review",
		title: "Formulario de acceso con \"recordarme\"",
		description: "Nuevo login: email, contraseña, recordar sesión y botón de entrar. Guardamos el token para no pedir login otra vez.",
		file: "src/login.html",
		language: "html",
		difficulty: "junior",
		diff: added(`
<form id="login" novalidate>
  <h1>Iniciar sesión</h1>
  <input id="email" type="email" placeholder="Email" autocomplete="email">
  <input id="password" type="password" placeholder="Contraseña" autocomplete="current-password">
  <label><input id="recordar" type="checkbox"> Recordarme</label>
  <div class="boton" onclick="entrar()">Entrar</div>
  <p id="error" class="error" hidden></p>
</form>

<script>
  async function entrar() {
    const email = document.querySelector("#email").value;
    const password = document.querySelector("#password").value;
    console.log("login", email, password);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const error = document.querySelector("#error");
      error.textContent = "Email o contraseña incorrectos";
      error.hidden = false;
      return;
    }
    const { token } = await res.json();
    if (document.querySelector("#recordar").checked) {
      localStorage.setItem("token", token);
    }
    location.href = "/panel";
  }
</script>`),
		issues: [
			{
				id: "labels",
				category: "accesibilidad",
				match: '<input id="email" type="email" placeholder="Email"',
				span: 2,
				title: "Campos sin etiqueta (solo placeholder)",
				explanation: "El placeholder desaparece al escribir y no siempre se anuncia como nombre. Cada campo necesita un <label for> visible.",
				concepts: ["a11y-formularios"],
			},
			{
				id: "div-button",
				category: "accesibilidad",
				match: '<div class="boton" onclick="entrar()">',
				title: "Botón hecho con un div",
				explanation: "No es enfocable, no responde a Enter/Espacio y no se anuncia como botón. Usa <button type=\"submit\"> y escucha el evento submit del formulario.",
				concepts: ["a11y-formularios"],
			},
			{
				id: "log",
				category: "seguridad",
				match: 'console.log("login", email, password);',
				title: "La contraseña se escribe en la consola",
				explanation: "Los logs acaban en extensiones, herramientas de sesión grabada o capturas de soporte. Nunca registres credenciales.",
				concepts: ["seguridad-credenciales"],
			},
		],
	},
	{
		id: "rev-05",
		type: "review",
		title: "Endpoint de pedidos con sus productos",
		description: "GET /api/pedidos?cliente=… devuelve los pedidos de un cliente con sus líneas de producto.",
		file: "server/routes/pedidos.js",
		language: "javascript",
		difficulty: "senior",
		diff: added(`
~import { Router } from "express";
~import { db } from "../db.js";
~
export const pedidos = Router();

pedidos.get("/api/pedidos", async (req, res) => {
  const cliente = req.query.cliente;
  if (!cliente) return res.status(400).json({ error: "Falta el cliente" });

  const filas = await db.query(
    "SELECT id, fecha, total FROM pedidos WHERE cliente = '" + cliente + "' ORDER BY fecha DESC"
  );

  const resultado = [];
  for (const pedido of filas.rows) {
    const lineas = await db.query(
      "SELECT producto, cantidad, precio FROM lineas WHERE pedido_id = $1",
      [pedido.id]
    );
    resultado.push({ ...pedido, lineas: lineas.rows });
  }

  res.json(resultado);
});

pedidos.delete("/api/pedidos/:id", async (req, res) => {
  const borrado = db.query("DELETE FROM pedidos WHERE id = $1 AND cliente = $2", [
    req.params.id,
    req.user.cliente,
  ]);
  if (borrado.rowCount === 0) return res.status(404).end();
  res.status(204).end();
});`),
		issues: [
			{
				id: "sqli",
				category: "seguridad",
				match: "\"SELECT id, fecha, total FROM pedidos WHERE cliente = '\" + cliente",
				title: "Inyección SQL",
				explanation: "El parámetro de la URL se concatena en la consulta: ?cliente=' OR '1'='1 devuelve todos los pedidos. Usa parámetros ($1) como en la consulta de líneas.",
				concepts: ["sql-inyeccion"],
			},
			{
				id: "n1",
				category: "rendimiento",
				match: "  for (const pedido of filas.rows) {",
				span: 6,
				title: "Consultas N+1",
				explanation: "Una consulta por pedido: con 200 pedidos son 201 viajes a la base de datos. Trae todas las líneas de una vez (WHERE pedido_id = ANY($1)) o con un JOIN y agrúpalas en memoria.",
				concepts: ["sql-rendimiento"],
			},
			{
				id: "await",
				category: "bug",
				match: "  const borrado = db.query(\"DELETE",
				title: "Falta await en el DELETE",
				explanation: "db.query devuelve una promesa: borrado.rowCount es undefined, nunca es 0, y los errores de la consulta quedan sin capturar. Falta await.",
				concepts: ["promises"],
			},
		],
	},
	{
		id: "rev-06",
		type: "review",
		title: "Utilidades de paginación y etiquetas",
		description: "Helpers para paginar la tabla de usuarios y marcar los que tienen etiquetas destacadas.",
		file: "src/utils/tabla.ts",
		language: "typescript",
		difficulty: "semi_senior",
		diff: added(`
export type Usuario = { id: string; nombre: string; etiquetas: string[]; alta: string };

/** Página n (empieza en 1) de tamaño "porPagina". */
export function pagina<T>(items: T[], n: number, porPagina = 20): T[] {
  const inicio = n * porPagina;
  return items.slice(inicio, inicio + porPagina);
}

export function totalPaginas(total: number, porPagina = 20): number {
  return Math.ceil(total / porPagina);
}

/** Marca los usuarios que tienen alguna etiqueta destacada. */
export function destacados(usuarios: Usuario[], etiquetas: string[]): Usuario[] {
  return usuarios.filter((u) => u.etiquetas.some((e) => etiquetas.includes(e)));
}

/** Usuarios dados de alta después de "desde" (YYYY-MM-DD). */
export function altasDesde(usuarios: Usuario[], desde: string): Usuario[] {
  return usuarios.filter((u) => new Date(u.alta) > new Date(desde));
}

/** Ordena por nombre respetando tildes. */
export function ordenar(usuarios: Usuario[]): Usuario[] {
  return usuarios.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

/** Busca por nombre sin distinguir mayúsculas ni tildes. */
export function buscar(usuarios: Usuario[], texto: string): Usuario[] {
  const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const q = norm(texto.trim());
  return q ? usuarios.filter((u) => norm(u.nombre).includes(q)) : usuarios;
}

/** Texto del pie de la tabla: "Mostrando 21-40 de 95". */
export function pie(n: number, total: number, porPagina = 20): string {
  const desde = (n - 1) * porPagina + 1;
  return \`Mostrando \${desde}-\${Math.min(n * porPagina, total)} de \${total}\`;
}`),
		issues: [
			{
				id: "offbyone",
				category: "bug",
				match: "  const inicio = n * porPagina;",
				title: "Error de uno en la paginación",
				explanation: "Si las páginas empiezan en 1, la primera debe empezar en 0: (n - 1) * porPagina. Ahora la página 1 se salta los primeros 20 usuarios.",
				concepts: ["array-methods"],
			},
			{
				id: "set",
				category: "rendimiento",
				match: "u.etiquetas.some((e) => etiquetas.includes(e))",
				title: "Búsqueda cuadrática con includes",
				explanation: "includes recorre el array de etiquetas en cada comprobación: O(usuarios × etiquetas × destacadas). Crea un Set antes del filter y usa set.has(e).",
				concepts: ["array-methods"],
			},
			{
				id: "mutate",
				category: "bug",
				match: "  return usuarios.sort(",
				title: "sort muta el array recibido",
				explanation: "sort ordena en el sitio: el array original del estado cambia sin que nadie lo sepa (en React, render con datos mutados). Usa [...usuarios].sort(...) o toSorted().",
				concepts: ["references"],
			},
		],
	},
	{
		id: "rev-07",
		type: "review",
		title: "Lista de tareas reordenable con modal de borrado",
		description: "Lista de tareas con flechas para reordenar y un modal de confirmación antes de borrar.",
		file: "src/components/Tareas.tsx",
		language: "tsx",
		difficulty: "senior",
		diff: added(`
~import { useState } from "react";
~
type Tarea = { id: string; texto: string; hecha: boolean; prioridad: number };

export function Tareas({ tareas, onCambio }: { tareas: Tarea[]; onCambio: (t: Tarea[]) => void }) {
  const [borrando, setBorrando] = useState<Tarea | null>(null);
  const ordenadas = [...tareas].sort((a, b) => b.prioridad - a.prioridad || a.texto.localeCompare(b.texto));

  const mover = (i: number, delta: number) => {
    const copia = [...ordenadas];
    [copia[i], copia[i + delta]] = [copia[i + delta], copia[i]];
    onCambio(copia.map((t, j) => ({ ...t, prioridad: copia.length - j })));
  };

  return (
    <>
      <ul>
        {ordenadas.map((t, i) => (
          <li key={i}>
            <input type="checkbox" defaultChecked={t.hecha} aria-label={t.texto} />
            {t.texto}
            <button onClick={() => mover(i, -1)} aria-label="Subir">↑</button>
            <button onClick={() => mover(i, 1)} aria-label="Bajar">↓</button>
            <button onClick={() => setBorrando(t)}>Borrar</button>
          </li>
        ))}
      </ul>
      {borrando && (
        <div className="modal">
          <p>¿Borrar «{borrando.texto}»?</p>
          <button onClick={() => onCambio(tareas.filter((t) => t.id !== borrando.id))}>Sí</button>
          <button onClick={() => setBorrando(null)}>No</button>
        </div>
      )}
    </>
  );
}`),
		issues: [
			{
				id: "key",
				category: "bug",
				match: "          <li key={i}>",
				title: "key con el índice en una lista reordenable",
				explanation: "Al mover una tarea, React reutiliza el <li> por posición: el checkbox no controlado (defaultChecked) se queda en su sitio y marca la tarea equivocada. Usa key={t.id}.",
				concepts: ["react-listas"],
			},
			{
				id: "bounds",
				category: "bug",
				match: "    [copia[i], copia[i + delta]] = [copia[i + delta], copia[i]];",
				title: "Sin límites al mover",
				explanation: "Subir la primera o bajar la última intercambia con undefined: la tarea desaparece de la lista. Comprueba que i + delta esté dentro del array (o desactiva el botón).",
				concepts: ["array-methods"],
			},
			{
				id: "modal",
				category: "accesibilidad",
				match: '        <div className="modal">',
				span: 2,
				title: "Modal sin semántica ni foco",
				explanation: "Falta role=\"dialog\" (o <dialog>), aria-modal, un título asociado y mover el foco al abrir; Escape no cierra. Con <dialog> y showModal() lo tienes casi todo.",
				concepts: ["a11y-dialogos"],
			},
		],
	},
	{
		id: "rev-08",
		type: "review",
		title: "Buscador con autocompletado",
		description: "Autocompletado de productos con debounce de 300 ms para no saturar la API.",
		file: "src/buscador.js",
		language: "javascript",
		difficulty: "semi_senior",
		diff: added(`
const input = document.querySelector("#buscar");
const sugerencias = document.querySelector("#sugerencias");

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

async function buscar(q) {
  if (q.length < 2) {
    sugerencias.replaceChildren();
    return;
  }
  const res = await fetch("/api/productos?q=" + encodeURIComponent(q));
  const datos = eval("(" + (await res.text()) + ")");
  sugerencias.replaceChildren(
    ...datos.map((p) => {
      const li = document.createElement("li");
      li.textContent = p.nombre;
      return li;
    })
  );
}

input.addEventListener("input", (e) => {
  debounce(buscar, 300)(e.target.value);
});`),
		issues: [
			{
				id: "eval",
				category: "seguridad",
				match: 'const datos = eval("(" + (await res.text()) + ")");',
				title: "eval sobre la respuesta del servidor",
				explanation: "Cualquier cosa que devuelva la API (o un intermediario) se ejecuta como código. Usa res.json().",
				concepts: ["seguridad-eval"],
			},
			{
				id: "debounce",
				category: "rendimiento",
				match: "  debounce(buscar, 300)(e.target.value);",
				title: "El debounce se crea en cada pulsación",
				explanation: "Cada evento crea un debounce nuevo con su propio temporizador, así que no cancela el anterior: se hace una petición por tecla. Crea la función una vez fuera del listener.",
				concepts: ["closures"],
			},
			{
				id: "race",
				category: "bug",
				match: '  const res = await fetch("/api/productos?q=" + encodeURIComponent(q));',
				title: "Respuestas fuera de orden",
				explanation: "Una búsqueda lenta anterior puede llegar después de la actual y mostrar sugerencias de un texto antiguo. Cancela con AbortController o comprueba que q sigue siendo el valor del input.",
				concepts: ["promises", "event-loop"],
			},
		],
	},
];

export const getReview = (id: string) => REVIEWS.find((r) => r.id === id);
