import type { ChallengeSpec } from "@/features/challenges/engine/types";

/**
 * Rendimiento web: cada reto mide algo antes y después (desplazamiento del
 * contenido, nº de peticiones, mutaciones del DOM, cálculos repetidos…).
 */
const base = { category: "rendimiento" as const };
const css = "body { font-family: system-ui, sans-serif; margin: 0; padding: 16px; }";
const PIXEL = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";

export const performanceChallenges: ChallengeSpec[] = [
	{
		...base,
		id: "perf-cls-imagen-01",
		title: "El texto salta cuando carga la foto",
		difficulty: "junior",
		concepts: ["web-vitals"],
		editable: ["index.html", "styles.css"],
		instructions:
			"La foto de portada no tiene dimensiones: cuando llega (simulado a los 300 ms) empuja el artículo hacia abajo y dispara el CLS. Reserva su espacio (width/height o aspect-ratio) para que el artículo no se mueva. La foto debe medir 600×300 en escritorio y adaptarse en móvil.",
		files: {
			"index.html": `<main>
  <img id="portada" alt="Puerto de Bermeo" style="max-width: 100%">
  <article id="articulo"><h1>Una mañana en Bermeo</h1><p>El puerto despierta antes que el sol…</p></article>
</main>`,
			"styles.css": css + "\nimg { display: block; }",
			"app.js": `setTimeout(() => {
  const img = document.getElementById("portada");
  img.style.width = "600px";
  img.style.height = "300px";
  img.src = "${PIXEL}";
}, 300);`,
		},
		tests: [
			{ name: "El artículo no se desplaza al cargar la foto", type: "dom", code: "const antes = rect('#articulo').top; await wait(400); const despues = rect('#articulo').top; return near(antes, despues, 1) || ('El artículo se desplazó ' + Math.round(despues - antes) + ' px');" },
			{ name: "La foto mide 600×300", type: "dom", code: "await wait(350); const r = rect('#portada'); return near(r.width, 600, 1) && near(r.height, 300, 1);" },
		],
		hints: ["Añade width=\"600\" height=\"300\" a la etiqueta: el navegador reserva el hueco antes de que llegue la imagen.", "Con height: auto en CSS se mantiene la proporción en móvil."],
		solution: {
			"index.html": `<main>
  <img id="portada" alt="Puerto de Bermeo" width="600" height="300" style="max-width: 100%">
  <article id="articulo"><h1>Una mañana en Bermeo</h1><p>El puerto despierta antes que el sol…</p></article>
</main>`,
		},
	},
	{
		...base,
		id: "perf-cls-banner-01",
		title: "El banner de cookies empuja la página",
		difficulty: "junior",
		concepts: ["web-vitals"],
		editable: ["styles.css"],
		instructions:
			"El aviso de cookies se inserta al principio del body a los 250 ms y desplaza todo el contenido. Sin tocar el JavaScript, haz que aparezca superpuesto (fijo abajo) para que no mueva nada.",
		files: {
			"index.html": `<main id="contenido"><h1>Noticias</h1><p>Última hora desde Bilbao…</p></main>`,
			"styles.css": css + "\n.cookies { padding: 16px; background: #161b22; color: white; }",
			"app.js": `setTimeout(() => {
  const aviso = document.createElement("div");
  aviso.className = "cookies";
  aviso.textContent = "Usamos cookies técnicas.";
  document.body.prepend(aviso);
}, 250);`,
		},
		tests: [
			{ name: "El contenido no se mueve", type: "dom", code: "const a = rect('#contenido').top; await wait(350); const b = rect('#contenido').top; return near(a, b, 1) || ('El contenido bajó ' + Math.round(b - a) + ' px');" },
			{ name: "El aviso se ve abajo", type: "dom", code: "await wait(300); const r = rect('.cookies'); return r.height > 0 && near(r.bottom, window.innerHeight, 2);" },
		],
		hints: [".cookies { position: fixed; left: 0; right: 0; bottom: 0; }"],
		solution: {
			"styles.css": css + "\n.cookies { position: fixed; left: 0; right: 0; bottom: 0; padding: 16px; background: #161b22; color: white; }",
		},
	},
	{
		...base,
		id: "perf-dom-lote-01",
		title: "1000 filas insertadas una a una",
		difficulty: "semi_senior",
		concepts: ["render-bloqueo"],
		editable: ["app.js"],
		instructions:
			"pintar() añade 1000 filas haciendo innerHTML += en cada vuelta: el navegador reconstruye la lista 1000 veces. Reescríbelo para insertar todas las filas de una vez (DocumentFragment o replaceChildren). Se mide cuántas mutaciones recibe la lista.",
		files: {
			"index.html": `<main><h1>Inventario</h1><ul id="lista"></ul></main>`,
			"styles.css": css,
			"app.js": `const items = Array.from({ length: 1000 }, (_, i) => "Producto " + (i + 1));
const lista = document.getElementById("lista");

function pintar() {
  lista.innerHTML = "";
  for (const item of items) {
    lista.innerHTML += "<li>" + item + "</li>";
  }
}

window.pintar = pintar;
pintar();`,
		},
		tests: [
			{ name: "Pinta las 1000 filas", type: "dom", code: "return $$('#lista li').length === 1000 && text('#lista li:last-child') === 'Producto 1000';" },
			{ name: "Como mucho 2 mutaciones por repintado", type: "dom", code: "let n = 0; const mo = new MutationObserver((rs) => (n += rs.length)); mo.observe($('#lista'), { childList: true }); window.pintar(); await wait(0); mo.disconnect(); return n <= 2 || ('La lista recibió ' + n + ' mutaciones');" },
		],
		hints: ["Construye los <li> en un DocumentFragment y añádelo una sola vez.", "lista.replaceChildren(...nodos) vacía y rellena en una única operación."],
		solution: {
			"app.js": `const items = Array.from({ length: 1000 }, (_, i) => "Producto " + (i + 1));
const lista = document.getElementById("lista");

function pintar() {
  const nodos = items.map((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    return li;
  });
  lista.replaceChildren(...nodos);
}

window.pintar = pintar;
pintar();`,
		},
	},
	{
		...base,
		id: "perf-debounce-01",
		title: "Una petición por cada tecla",
		difficulty: "semi_senior",
		concepts: ["carga-recursos", "closures"],
		editable: ["app.js"],
		instructions:
			"El buscador llama a la API en cada pulsación: escribir «bilbao» son 6 peticiones. Añade un debounce de 300 ms para que solo se busque cuando el usuario deja de escribir.",
		run: { network: [{ method: "GET", url: "/api/buscar", status: 200, body: { resultados: ["Bilbao", "Bilbao La Vieja"] }, delayMs: 20 }] },
		files: {
			"index.html": `<main><h1>Buscar</h1><label for="q">Ciudad</label><input id="q"><ul id="res"></ul></main>`,
			"styles.css": css,
			"app.js": `const q = document.getElementById("q");
const res = document.getElementById("res");

async function buscar(texto) {
  const r = await fetch("/api/buscar?q=" + encodeURIComponent(texto));
  const { resultados } = await r.json();
  res.replaceChildren(...resultados.map((t) => Object.assign(document.createElement("li"), { textContent: t })));
}

q.addEventListener("input", () => buscar(q.value));`,
		},
		tests: [
			{ name: "Escribir una palabra hace una sola petición", type: "dom", code: "for (const t of ['b', 'bi', 'bil', 'bilb', 'bilba', 'bilbao']) { type('#q', t); await wait(30); } await wait(450); const n = requests().length; return n === 1 || ('Se hicieron ' + n + ' peticiones');" },
			{ name: "Busca el texto completo", type: "dom", code: "return requests().at(-1)?.url === '/api/buscar?q=bilbao' && $$('#res li').length === 2;" },
		],
		hints: ["Guarda el temporizador fuera del listener: clearTimeout(t); t = setTimeout(…, 300)."],
		solution: {
			"app.js": `const q = document.getElementById("q");
const res = document.getElementById("res");

async function buscar(texto) {
  const r = await fetch("/api/buscar?q=" + encodeURIComponent(texto));
  const { resultados } = await r.json();
  res.replaceChildren(...resultados.map((t) => Object.assign(document.createElement("li"), { textContent: t })));
}

let t;
q.addEventListener("input", () => {
  clearTimeout(t);
  t = setTimeout(() => buscar(q.value), 300);
});`,
		},
	},
	{
		...base,
		id: "perf-memo-01",
		title: "El cálculo caro se repite en cada clic",
		difficulty: "semi_senior",
		concepts: ["closures"],
		editable: ["app.js"],
		instructions:
			"Cada clic en «Mostrar total» recalcula las estadísticas de 200 000 ventas aunque los datos no cambien. Guarda el resultado (memoización) y recalcula solo cuando se añade una venta. window.__calculos cuenta las veces que se calcula.",
		files: {
			"index.html": `<main><h1>Ventas</h1><button id="mostrar">Mostrar total</button><button id="nueva">Añadir venta</button><p id="total"></p></main>`,
			"styles.css": css,
			"app.js": `const ventas = Array.from({ length: 200000 }, (_, i) => (i % 100) + 1);
window.__calculos = 0;

function estadisticas() {
  window.__calculos++;
  const total = ventas.reduce((a, b) => a + b, 0);
  return { total, media: total / ventas.length };
}

document.getElementById("mostrar").addEventListener("click", () => {
  document.getElementById("total").textContent = "Total: " + estadisticas().total;
});
document.getElementById("nueva").addEventListener("click", () => {
  ventas.push(50);
});`,
		},
		tests: [
			{ name: "Cinco clics, un solo cálculo", type: "dom", code: "for (let i = 0; i < 5; i++) click('#mostrar'); return window.__calculos === 1 || ('Se calculó ' + window.__calculos + ' veces');" },
			{ name: "Una venta nueva actualiza el total", type: "dom", code: "click('#mostrar'); const antes = text('#total'); click('#nueva'); click('#mostrar'); return text('#total') !== antes && text('#total') === 'Total: ' + (10100000 + 50);" },
		],
		hints: ["Guarda el resultado en una variable (cache = null) y devuélvelo si existe.", "Al añadir una venta, invalida la caché (cache = null)."],
		solution: {
			"app.js": `const ventas = Array.from({ length: 200000 }, (_, i) => (i % 100) + 1);
window.__calculos = 0;
let cache = null;

function estadisticas() {
  if (cache) return cache;
  window.__calculos++;
  const total = ventas.reduce((a, b) => a + b, 0);
  cache = { total, media: total / ventas.length };
  return cache;
}

document.getElementById("mostrar").addEventListener("click", () => {
  document.getElementById("total").textContent = "Total: " + estadisticas().total;
});
document.getElementById("nueva").addEventListener("click", () => {
  ventas.push(50);
  cache = null;
});`,
		},
	},
	{
		...base,
		id: "perf-lazy-01",
		title: "Todas las imágenes se descargan a la vez",
		difficulty: "junior",
		concepts: ["carga-recursos", "web-vitals"],
		editable: ["index.html"],
		instructions:
			"La galería tiene 8 fotos y todas compiten con la portada (el elemento LCP). Marca la portada con fetchpriority=\"high\" y difiere las demás con loading=\"lazy\". Todas deben tener width y height.",
		files: {
			"index.html": `<main>
  <img id="portada" src="${PIXEL}" alt="Portada" width="800" height="400">
  <div class="galeria">
    ${Array.from({ length: 8 }, (_, i) => `<img class="foto" src="${PIXEL}" alt="Foto ${i + 1}">`).join("\n    ")}
  </div>
</main>`,
			"styles.css": css + "\nimg { max-width: 100%; height: auto; }\n.foto { width: 200px; }",
			"app.js": "",
		},
		tests: [
			{ name: "La portada tiene prioridad alta y no es lazy", type: "dom", code: "const p = $('#portada'); return p.getAttribute('fetchpriority') === 'high' && p.getAttribute('loading') !== 'lazy';" },
			{ name: "Las 8 fotos de la galería son lazy", type: "dom", code: "return $$('.foto').length === 8 && $$('.foto').every((i) => i.getAttribute('loading') === 'lazy');" },
			{ name: "Todas tienen dimensiones", type: "dom", code: "return $$('img').every((i) => i.getAttribute('width') && i.getAttribute('height'));" },
		],
		hints: ["<img loading=\"lazy\" width=\"200\" height=\"150\" …>", "No pongas lazy en la imagen más grande que se ve al cargar."],
		solution: {
			"index.html": `<main>
  <img id="portada" src="${PIXEL}" alt="Portada" width="800" height="400" fetchpriority="high">
  <div class="galeria">
    ${Array.from({ length: 8 }, (_, i) => `<img class="foto" src="${PIXEL}" alt="Foto ${i + 1}" width="200" height="150" loading="lazy">`).join("\n    ")}
  </div>
</main>`,
		},
	},
	{
		...base,
		id: "perf-script-bloqueante-01",
		title: "Scripts que bloquean el primer pintado",
		difficulty: "junior",
		concepts: ["render-bloqueo"],
		editable: ["index.html"],
		instructions:
			"Dos scripts externos están en el <head> sin defer ni async: el navegador deja de pintar hasta descargarlos. Haz que el de analítica sea async (no depende de nada) y el del widget defer (necesita el DOM), sin moverlos del head.",
		files: {
			"index.html": `<head>
  <script src="/vendor/analitica.js"></script>
  <script src="/vendor/widget-chat.js"></script>
</head>
<body>
  <main><h1>Tienda</h1><p>Bienvenida.</p></main>
</body>`,
			"styles.css": css,
			"app.js": "",
		},
		tests: [
			{ name: "La analítica es async", type: "dom", code: "const s = $('script[src$=\"analitica.js\"]'); return !!s && s.async && s.parentElement === document.head;" },
			{ name: "El widget es defer", type: "dom", code: "const s = $('script[src$=\"widget-chat.js\"]'); return !!s && s.defer && !s.async && s.parentElement === document.head;" },
		],
		hints: ["async: se ejecuta en cuanto llega, en cualquier orden.", "defer: espera a que el HTML esté analizado y respeta el orden."],
		solution: {
			"index.html": `<head>
  <script src="/vendor/analitica.js" async></script>
  <script src="/vendor/widget-chat.js" defer></script>
</head>
<body>
  <main><h1>Tienda</h1><p>Bienvenida.</p></main>
</body>`,
		},
	},
	{
		...base,
		id: "perf-animacion-transform-01",
		title: "Animación que recalcula el layout",
		difficulty: "semi_senior",
		concepts: ["render-bloqueo"],
		editable: ["styles.css"],
		instructions:
			"El menú lateral se anima cambiando left, lo que obliga a recalcular el layout en cada fotograma. Anímalo con transform (translateX), que se resuelve en la GPU, manteniendo la misma posición abierta y cerrada.",
		files: {
			"index.html": `<nav id="menu" class="menu">Menú</nav><button id="toggle">Abrir</button>`,
			"styles.css": `body { margin: 0; font-family: system-ui, sans-serif; }
.menu { position: fixed; top: 0; bottom: 0; left: -260px; width: 260px; background: #161b22; color: white; transition: left 0.01s; }
.menu.abierto { left: 0; }`,
			"app.js": `document.getElementById("toggle").addEventListener("click", () => {
  document.getElementById("menu").classList.toggle("abierto");
});`,
		},
		tests: [
			{ name: "Solo se anima transform", type: "dom", code: "const t = style('#menu', 'transition-property'); return (/transform/.test(t) && !/left|all/.test(t)) || ('Se anima: ' + t);" },
			{ name: "Cerrado queda fuera de la pantalla", type: "dom", code: "await wait(50); return near(rect('#menu').right, 0, 1);" },
			{ name: "Abierto ocupa sus 260 px", type: "dom", code: "click('#toggle'); await wait(80); const r = rect('#menu'); click('#toggle'); return near(r.left, 0, 1) && near(r.width, 260, 1);" },
		],
		hints: [".menu { left: 0; transform: translateX(-100%); transition: transform 0.2s; } .menu.abierto { transform: none; }"],
		solution: {
			"styles.css": `body { margin: 0; font-family: system-ui, sans-serif; }
.menu { position: fixed; top: 0; bottom: 0; left: 0; width: 260px; background: #161b22; color: white; transform: translateX(-100%); transition: transform 0.01s; }
.menu.abierto { transform: none; }`,
		},
	},
	{
		...base,
		id: "perf-imagen-responsive-01",
		title: "Una imagen de 2400 px para un hueco de 300",
		difficulty: "semi_senior",
		concepts: ["carga-recursos"],
		editable: ["index.html"],
		instructions:
			"La ficha descarga siempre foto-2400.jpg aunque se muestra a 300 px. Ofrece las variantes 300w, 600w y 1200w con srcset y declara sizes=\"300px\" para que el navegador elija la más pequeña suficiente.",
		files: {
			"index.html": `<main>
  <h1>Zapatillas Trail X</h1>
  <img id="foto" src="/img/foto-2400.jpg" alt="Zapatillas Trail X" width="300" height="300">
</main>`,
			"styles.css": css,
			"app.js": "",
		},
		tests: [
			{ name: "srcset con las tres variantes", type: "dom", code: "const s = $('#foto').getAttribute('srcset') || ''; return ['foto-300.jpg 300w', 'foto-600.jpg 600w', 'foto-1200.jpg 1200w'].every((v) => s.includes(v)) || 'Falta alguna variante en srcset';" },
			{ name: "sizes indica el ancho mostrado", type: "dom", code: "return ($('#foto').getAttribute('sizes') || '').trim() === '300px';" },
			{ name: "Conserva alt y dimensiones", type: "dom", code: "const i = $('#foto'); return i.alt === 'Zapatillas Trail X' && i.getAttribute('width') === '300';" },
		],
		hints: ["srcset=\"/img/foto-300.jpg 300w, /img/foto-600.jpg 600w, /img/foto-1200.jpg 1200w\""],
		solution: {
			"index.html": `<main>
  <h1>Zapatillas Trail X</h1>
  <img id="foto" src="/img/foto-600.jpg" srcset="/img/foto-300.jpg 300w, /img/foto-600.jpg 600w, /img/foto-1200.jpg 1200w" sizes="300px" alt="Zapatillas Trail X" width="300" height="300">
</main>`,
		},
	},
	{
		...base,
		id: "perf-scroll-listener-01",
		title: "El scroll ejecuta trabajo pesado en cada evento",
		difficulty: "senior",
		concepts: ["render-bloqueo"],
		editable: ["app.js"],
		instructions:
			"actualizarBarra() lee y escribe el layout en cada evento scroll (pueden ser decenas por fotograma). Agrupa el trabajo con requestAnimationFrame para que se ejecute como mucho una vez por fotograma y registra el listener como pasivo. window.__actualizaciones cuenta las ejecuciones.",
		files: {
			"index.html": `<div id="barra"></div><main style="height: 3000px"><h1>Artículo largo</h1></main>`,
			"styles.css": "body { margin: 0; font-family: system-ui, sans-serif; }\n#barra { position: fixed; top: 0; left: 0; height: 4px; background: #2f5bd3; width: 0; }",
			"app.js": `window.__actualizaciones = 0;
function actualizarBarra() {
  window.__actualizaciones++;
  const max = document.documentElement.scrollHeight - innerHeight;
  document.getElementById("barra").style.width = (scrollY / max) * 100 + "%";
}
window.addEventListener("scroll", actualizarBarra);`,
		},
		tests: [
			{ name: "20 eventos seguidos, una actualización", type: "dom", code: "window.__actualizaciones = 0; for (let i = 0; i < 20; i++) window.dispatchEvent(new Event('scroll')); await wait(100); return window.__actualizaciones === 1 || ('Se actualizó ' + window.__actualizaciones + ' veces');" },
			{ name: "La barra sigue el scroll", type: "dom", code: "window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) / 2); window.dispatchEvent(new Event('scroll')); await wait(100); const w = parseFloat($('#barra').style.width); window.scrollTo(0, 0); return near(w, 50, 2) || ('Ancho: ' + w + '%');" },
		],
		hints: ["let pendiente = false; en el listener: if (!pendiente) { pendiente = true; requestAnimationFrame(() => { pendiente = false; actualizarBarra(); }); }", "addEventListener('scroll', fn, { passive: true })"],
		solution: {
			"app.js": `window.__actualizaciones = 0;
function actualizarBarra() {
  window.__actualizaciones++;
  const max = document.documentElement.scrollHeight - innerHeight;
  document.getElementById("barra").style.width = (scrollY / max) * 100 + "%";
}
let pendiente = false;
window.addEventListener(
  "scroll",
  () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => {
      pendiente = false;
      actualizarBarra();
    });
  },
  { passive: true }
);`,
		},
	},
];
