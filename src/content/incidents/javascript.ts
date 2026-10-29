import type { IncidentSpec } from "@/features/incidents/types";

const SEARCH_HTML = `<main>
  <label for="q">Buscar cursos</label>
  <input id="q" type="search" autocomplete="off">
  <ul id="resultados" aria-live="polite"></ul>
</main>`;

const SEARCH_CSS = `body { margin: 0; padding: 24px; font-family: system-ui, sans-serif; }
#q { display: block; width: 100%; max-width: 420px; min-height: 40px; margin-top: 6px; }
#resultados { padding-left: 18px; }`;

const SEARCH_RENDER = `function pintar(lista) {
  resultados.replaceChildren(...lista.map((nombre) => {
    const li = document.createElement("li");
    li.textContent = nombre;
    return li;
  }));
}`;

const CART_HTML = `<main class="carrito">
  <h1>Carrito</h1>
  <p>Unidades: <output id="total">0</output></p>
  <button id="sumar">Añadir una unidad</button>
  <button id="vaciar">Vaciar</button>
</main>`;

export const jsIncidents: IncidentSpec[] = [
	{
		id: "inc-611",
		number: 611,
		type: "incident",
		title: "El buscador muestra resultados de una búsqueda anterior",
		area: "javascript",
		difficulty: "senior",
		concepts: ["async/await", "condiciones de carrera", "AbortController"],
		durationMin: 12,
		ticket: {
			reporter: "Alumno de la academia",
			priority: "media",
			device: "escritorio, 1280px",
			steps: ["Escribir «ja» en el buscador", "Seguir escribiendo hasta «java» rápidamente"],
			expected: "Se ven los cursos que coinciden con «java»",
			actual: "Al cabo de un momento aparecen los resultados de «ja» (Jamón, Japón…)",
		},
		viewport: 1280,
		files: {
			"index.html": SEARCH_HTML,
			"styles.css": SEARCH_CSS,
			"app.js": `const q = document.getElementById("q");
const resultados = document.getElementById("resultados");

${SEARCH_RENDER}

q.addEventListener("input", async () => {
  const termino = q.value.trim();
  if (!termino) return pintar([]);
  const res = await fetch("/api/buscar?q=" + encodeURIComponent(termino));
  const datos = await res.json();
  pintar(datos.resultados);
});`,
		},
		editable: ["app.js"],
		networkLog: [
			{ method: "GET", url: "/api/buscar?q=ja", status: 200, body: { resultados: ["Jamón ibérico", "JavaScript", "Japonés básico"] }, delayMs: 320 },
			{ method: "GET", url: "/api/buscar?q=java", status: 200, body: { resultados: ["Java", "JavaScript"] }, delayMs: 60 },
		],
		tests: [
			{ name: "Se muestran los resultados de la última búsqueda", type: "dom", code: "type('#q', 'ja'); await wait(10); type('#q', 'java'); await wait(480); const t = $$('#resultados li').map(li => li.textContent); return (t.join('|') === 'Java|JavaScript') || ('La lista muestra: ' + (t.join(', ') || 'nada'));" },
			{ name: "Una respuesta lenta no pisa a la más reciente", type: "dom", code: "type('#q', ''); await wait(20); type('#q', 'ja'); await wait(5); type('#q', 'java'); await wait(150); const pronto = $$('#resultados li').map(li => li.textContent).join('|'); await wait(330); const despues = $$('#resultados li').map(li => li.textContent).join('|'); return pronto === 'Java|JavaScript' && despues === 'Java|JavaScript';" },
		],
		regressionTests: [
			{ name: "Una búsqueda simple sigue funcionando", type: "dom", code: "type('#q', 'java'); await wait(150); return $$('#resultados li').length === 2;" },
			{ name: "Borrar el texto vacía la lista", type: "dom", code: "type('#q', ''); await wait(30); return $$('#resultados li').length === 0;" },
			{ name: "Se consulta al servidor con el término escrito", type: "dom", code: "return requests().some(r => r.url === '/api/buscar?q=java');" },
		],
		hints: [
			"Abre la pestaña Red: la petición de «ja» tarda mucho más que la de «java» y termina después.",
			"Descarta respuestas antiguas: guarda un contador de la última búsqueda o cancela la anterior con AbortController.",
		],
		solution: {
			"app.js": `const q = document.getElementById("q");
const resultados = document.getElementById("resultados");

${SEARCH_RENDER}

let ultima = 0;
q.addEventListener("input", async () => {
  const id = ++ultima;
  const termino = q.value.trim();
  if (!termino) return pintar([]);
  const res = await fetch("/api/buscar?q=" + encodeURIComponent(termino));
  const datos = await res.json();
  if (id !== ultima) return;
  pintar(datos.resultados);
});`,
		},
		rootCause:
			"Cada pulsación lanza una petición, pero las respuestas no llegan en orden: la de «ja» tarda 320 ms y la de «java» 60 ms. Cuando por fin llega la de «ja», pinta encima de la buena. Hay que ignorar respuestas que no correspondan a la última búsqueda (contador o comparar el término) o cancelar la anterior con AbortController.",
		suspects: [],
	},
	{
		id: "inc-702",
		number: 702,
		type: "incident",
		title: "Cada clic en «Añadir» suma dos unidades al carrito",
		area: "javascript",
		difficulty: "junior",
		concepts: ["addEventListener", "ciclo de carga del DOM"],
		durationMin: 6,
		ticket: {
			reporter: "Atención al cliente",
			priority: "alta",
			device: "todos",
			steps: ["Abrir el carrito", "Pulsar una vez «Añadir una unidad»"],
			expected: "Unidades: 1",
			actual: "Unidades: 2",
		},
		viewport: 768,
		files: {
			"index.html": CART_HTML,
			"styles.css": `body { margin: 0; padding: 24px; font-family: system-ui, sans-serif; }
button { min-height: 40px; margin-right: 8px; }
#total { font-weight: 700; }`,
			"app.js": `let total = 0;
const salida = document.getElementById("total");

function pintar() {
  salida.textContent = String(total);
}

function iniciar() {
  document.getElementById("sumar").addEventListener("click", () => {
    total += 1;
    pintar();
  });
  document.getElementById("vaciar").addEventListener("click", () => {
    total = 0;
    pintar();
  });
  pintar();
}

iniciar();
document.addEventListener("DOMContentLoaded", iniciar);`,
		},
		editable: ["app.js"],
		networkLog: [],
		tests: [
			{ name: "Un clic suma exactamente una unidad", type: "dom", code: "click('#vaciar'); click('#sumar'); return text('#total') === '1' || ('Unidades: ' + text('#total'));" },
			{ name: "Tres clics suman tres unidades", type: "dom", code: "click('#vaciar'); click('#sumar'); click('#sumar'); click('#sumar'); return text('#total') === '3' || ('Unidades: ' + text('#total'));" },
		],
		regressionTests: [
			{ name: "El carrito empieza en 0", type: "dom", code: "return text('#total') === '0';" },
			{ name: "«Vaciar» deja el carrito a 0", type: "dom", code: "click('#sumar'); click('#vaciar'); return text('#total') === '0';" },
			{ name: "Siguen existiendo los dos botones", type: "dom", code: "return !!$('#sumar') && !!$('#vaciar');" },
		],
		hints: [
			"Pon un console.log dentro de iniciar(): ¿cuántas veces aparece?",
			"El script ya se ejecuta con el DOM listo; la llamada extra desde DOMContentLoaded registra los listeners por segunda vez.",
		],
		solution: {
			"app.js": `let total = 0;
const salida = document.getElementById("total");

function pintar() {
  salida.textContent = String(total);
}

function iniciar() {
  document.getElementById("sumar").addEventListener("click", () => {
    total += 1;
    pintar();
  });
  document.getElementById("vaciar").addEventListener("click", () => {
    total = 0;
    pintar();
  });
  pintar();
}

iniciar();`,
		},
		rootCause:
			"iniciar() se ejecuta dos veces: una directamente (el script va al final del body, el DOM ya existe) y otra en DOMContentLoaded. Cada ejecución añade un listener más al botón, así que un clic suma dos veces. Basta con inicializar una sola vez.",
		suspects: [],
	},
	{
		id: "inc-415",
		number: 415,
		type: "incident",
		title: "La newsletter confirma la suscripción aunque el servidor la rechaza",
		area: "javascript",
		difficulty: "semi_senior",
		concepts: ["fetch", "res.ok", "manejo de errores"],
		durationMin: 8,
		ticket: {
			reporter: "Equipo de marketing",
			priority: "media",
			device: "todos",
			steps: ["Introducir un email ya suscrito", "Pulsar «Suscribirme»"],
			expected: "Aparece el motivo del rechazo: «El email ya está suscrito»",
			actual: "Aparece «¡Suscripción confirmada!» y el usuario no recibe nada",
		},
		viewport: 768,
		files: {
			"index.html": `<main>
  <h1>Newsletter</h1>
  <form id="alta">
    <label for="email">Email</label>
    <input id="email" type="email" value="ana@ejemplo.com" required>
    <button>Suscribirme</button>
  </form>
  <p id="mensaje" role="status"></p>
</main>`,
			"styles.css": `body { margin: 0; padding: 24px; font-family: system-ui, sans-serif; }
#email { display: block; min-height: 40px; margin: 6px 0 12px; width: 100%; max-width: 360px; }
button { min-height: 40px; }`,
			"app.js": `const form = document.getElementById("alta");
const mensaje = document.getElementById("mensaje");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  fetch("/api/suscribir", { method: "POST", body: JSON.stringify({ email }) });
  mensaje.textContent = "¡Suscripción confirmada!";
});`,
		},
		editable: ["app.js"],
		networkLog: [{ method: "POST", url: "/api/suscribir", status: 422, body: { error: "El email ya está suscrito" }, delayMs: 80 }],
		tests: [
			{ name: "No se confirma una suscripción rechazada", type: "dom", code: "$('#alta').requestSubmit(); await wait(200); return !/confirmada/i.test(text('#mensaje')) || 'Se muestra «confirmada» con un 422 del servidor.';" },
			{ name: "Se muestra el motivo que envía el servidor", type: "dom", code: "return text('#mensaje').includes('El email ya está suscrito') || ('Mensaje: «' + text('#mensaje') + '»');" },
		],
		regressionTests: [
			{ name: "Se envía el email al servidor", type: "dom", code: "$('#alta').requestSubmit(); await wait(150); return requests().some(r => r.method === 'POST' && r.url === '/api/suscribir' && (r.body || '').includes('ana@ejemplo.com'));" },
			{ name: "El formulario no recarga la página", type: "dom", code: "return !!$('#alta') && !!$('#mensaje');" },
		],
		hints: [
			"En la pestaña Red la petición responde 422, pero el mensaje se escribe antes de que llegue la respuesta.",
			"Espera la respuesta con await y comprueba res.ok; si no es correcta, lee el JSON y muestra su campo error.",
		],
		solution: {
			"app.js": `const form = document.getElementById("alta");
const mensaje = document.getElementById("mensaje");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const res = await fetch("/api/suscribir", { method: "POST", body: JSON.stringify({ email }) });
  const datos = await res.json();
  mensaje.textContent = res.ok ? "¡Suscripción confirmada!" : datos.error;
});`,
		},
		rootCause:
			"El código no espera a la respuesta de fetch: escribe «confirmada» justo después de lanzar la petición. Además fetch solo rechaza con errores de red; un 422 resuelve normalmente, así que hay que esperar con await y comprobar res.ok antes de dar el alta por buena.",
		suspects: [],
	},
];
