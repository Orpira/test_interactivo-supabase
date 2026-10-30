import type { IncidentSpec } from "@/features/incidents/types";

export const cssIncidents: IncidentSpec[] = [
	{
		id: "inc-482",
		number: 482,
		type: "incident",
		title: "El botón Pagar no responde en el móvil y el menú tapa el formulario",
		area: "css",
		difficulty: "semi_senior",
		concepts: ["z-index", "opacity vs visibility", "selectores"],
		durationMin: 10,
		ticket: {
			reporter: "Usuaria de la tienda",
			priority: "alta",
			device: "móvil, 390px",
			steps: ["Abrir la tienda en el móvil", "Abrir y cerrar el menú", "Pulsar «Pagar 49,90 €»"],
			expected: "Se envía el pago y aparece «Pago completado»",
			actual: "No pasa nada al pulsar el botón",
		},
		viewport: 390,
		files: {
			"index.html": `<header class="topbar">
  <span class="logo">Tienda Norte</span>
  <button id="menu-toggle" aria-expanded="false" aria-controls="menu">Menú</button>
</header>
<nav id="menu" class="menu closed">
  <a href="#">Ofertas</a>
  <a href="#">Pedidos</a>
  <a href="#">Ayuda</a>
</nav>
<main>
  <h1>Pago</h1>
  <form id="pago">
    <label for="tarjeta">Tarjeta</label>
    <input id="tarjeta" value="4242 4242 4242 4242">
    <button type="button" id="payBtn">Pagar 49,90 €</button>
  </form>
  <p id="estado" role="status"></p>
</main>`,
			"styles.css": `body { margin: 0; font-family: system-ui, sans-serif; }
.topbar {
  display: flex; justify-content: space-between; align-items: center;
  height: 52px; padding: 0 16px; background: #161b22; color: white;
}
.menu {
  position: fixed; top: 52px; left: 0; right: 0; bottom: 0; z-index: 1000;
  display: flex; flex-direction: column; gap: 16px; padding: 24px;
  background: rgba(13, 17, 23, 0.96); transition: opacity 0.2s;
}
.menu a { color: white; font-size: 1.25rem; }
.menu.closed { opacity: 0; }
main { padding: 16px; }
#payBtn { display: block; width: 100%; min-height: 48px; margin-top: 12px; }`,
			"app.js": `const toggle = document.getElementById("menu-toggle");
const menu = document.getElementById("menu");

toggle.addEventListener("click", () => {
  const abierto = !menu.classList.toggle("closed");
  toggle.setAttribute("aria-expanded", String(abierto));
});

const pagar = document.querySelector("#pay-btn");
pagar.addEventListener("click", async () => {
  const estado = document.getElementById("estado");
  estado.textContent = "Procesando…";
  const res = await fetch("/api/pay", { method: "POST", body: JSON.stringify({ importe: 49.9 }) });
  estado.textContent = res.ok ? "Pago completado" : "No se pudo completar el pago";
});`,
		},
		editable: ["styles.css", "app.js"],
		networkLog: [{ method: "POST", url: "/api/pay", status: 200, body: { ok: true }, delayMs: 60 }],
		tests: [
			{ name: "El botón Pagar recibe el toque (nada lo tapa)", type: "dom", code: "return hits('#payBtn') || 'Hay un elemento invisible encima del botón Pagar.';" },
			{ name: "Pagar envía la petición al servidor", type: "dom", code: "click('#payBtn'); await wait(120); return requests().some(r => r.method === 'POST' && r.url === '/api/pay') || 'Ninguna petición a /api/pay.';" },
			{ name: "Se confirma el pago a la usuaria", type: "dom", code: "await wait(100); return text('#estado') === 'Pago completado' || ('Estado: «' + text('#estado') + '»');" },
		],
		regressionTests: [
			{ name: "El menú se abre y se cierra", type: "dom", code: "const hasta = async (ok) => { for (let i = 0; i < 30 && !ok(); i++) await wait(50); return ok(); }; click('#menu-toggle'); const abierto = $('#menu-toggle').getAttribute('aria-expanded') === 'true' && (await hasta(() => style('#menu', 'opacity') === '1')) && hits('#menu a'); click('#menu-toggle'); return abierto && $('#menu-toggle').getAttribute('aria-expanded') === 'false';" },
			{ name: "El menú conserva sus tres enlaces", type: "dom", code: "return $$('#menu a').length === 3;" },
			{ name: "La cabecera y el formulario siguen en su sitio", type: "dom", code: "return !!$('.topbar .logo') && !!$('#tarjeta') && rect('#payBtn').width > 300;" },
		],
		hints: [
			"Abre la consola: hay un error nada más cargar la página. Compara el selector con el id real del botón.",
			"Con el menú «cerrado», inspecciona el elemento que hay encima del botón: opacity: 0 lo hace invisible, pero sigue recibiendo los toques.",
		],
		solution: {
			"styles.css": `body { margin: 0; font-family: system-ui, sans-serif; }
.topbar {
  display: flex; justify-content: space-between; align-items: center;
  height: 52px; padding: 0 16px; background: #161b22; color: white;
}
.menu {
  position: fixed; top: 52px; left: 0; right: 0; bottom: 0; z-index: 1000;
  display: flex; flex-direction: column; gap: 16px; padding: 24px;
  background: rgba(13, 17, 23, 0.96); transition: opacity 0.2s;
}
.menu a { color: white; font-size: 1.25rem; }
.menu.closed { opacity: 0; visibility: hidden; }
main { padding: 16px; }
#payBtn { display: block; width: 100%; min-height: 48px; margin-top: 12px; }`,
			"app.js": `const toggle = document.getElementById("menu-toggle");
const menu = document.getElementById("menu");

toggle.addEventListener("click", () => {
  const abierto = !menu.classList.toggle("closed");
  toggle.setAttribute("aria-expanded", String(abierto));
});

const pagar = document.querySelector("#payBtn");
pagar.addEventListener("click", async () => {
  const estado = document.getElementById("estado");
  estado.textContent = "Procesando…";
  const res = await fetch("/api/pay", { method: "POST", body: JSON.stringify({ importe: 49.9 }) });
  estado.textContent = res.ok ? "Pago completado" : "No se pudo completar el pago";
});`,
		},
		rootCause:
			"Dos causas combinadas. En app.js, querySelector('#pay-btn') devuelve null porque el id real es payBtn: el listener nunca se registra y la consola muestra un TypeError. Además, en styles.css .menu.closed solo pone opacity: 0, así que el menú fijo con z-index: 1000 sigue encima del formulario capturando los toques aunque no se vea. El arreglo mínimo son 2 líneas: corregir el selector y añadir visibility: hidden (o pointer-events: none) a .menu.closed.",
		suspects: ["opacity", "visibility", "pointer-events", "z-index", "position"],
	},
	{
		id: "inc-317",
		number: 317,
		type: "incident",
		title: "La ficha de producto se sale de la pantalla en el móvil",
		area: "css",
		difficulty: "junior",
		concepts: ["responsive", "width vs max-width"],
		durationMin: 5,
		ticket: {
			reporter: "Equipo de ventas",
			priority: "media",
			device: "móvil, 390px",
			steps: ["Abrir la ficha de las zapatillas en un móvil", "Intentar ver el botón completo"],
			expected: "La ficha cabe en la pantalla, sin scroll lateral",
			actual: "Hay que desplazarse a la derecha y el botón queda cortado",
		},
		viewport: 390,
		files: {
			"index.html": `<main class="tienda">
  <article class="producto">
    <div class="foto" role="img" aria-label="Zapatillas Trail X"></div>
    <h1>Zapatillas Trail X</h1>
    <p class="precio">89,90 €</p>
    <button class="comprar">Añadir al carrito</button>
  </article>
</main>`,
			"styles.css": `* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; background: #f6f8fa; }
.tienda { padding: 16px; }
.producto {
  width: 420px;
  padding: 20px;
  background: white;
  border: 1px solid #d0d7de;
  border-radius: 16px;
}
.foto { height: 180px; border-radius: 12px; background: linear-gradient(135deg, #7aa2ff, #ffa657); }
.precio { font-size: 1.5rem; font-weight: 700; }
.comprar { width: 100%; min-height: 48px; border: 0; border-radius: 10px; background: #2f5bd3; color: white; font-size: 1rem; }`,
			"app.js": "",
		},
		editable: ["styles.css"],
		networkLog: [],
		tests: [
			{ name: "Sin scroll horizontal en el móvil", type: "dom", code: "const d = document.documentElement; return d.scrollWidth <= d.clientWidth || ('La página mide ' + d.scrollWidth + 'px en una pantalla de ' + d.clientWidth + 'px.');" },
			{ name: "La ficha cabe y aprovecha el ancho", type: "dom", code: "const r = rect('.producto'), w = document.documentElement.clientWidth; return r.right <= w && r.width >= w - 34;" },
		],
		regressionTests: [
			{ name: "El botón ocupa todo el ancho de la ficha", type: "dom", code: "return near(rect('.comprar').width, rect('.producto').width - 42, 2);" },
			{ name: "La foto mantiene su alto", type: "dom", code: "return near(rect('.foto').height, 180, 1);" },
			{ name: "La ficha conserva su padding", type: "dom", code: "return style('.producto', 'padding-left') === '20px';" },
		],
		hints: [
			"Un ancho fijo en píxeles no se adapta a pantallas más estrechas.",
			"max-width limita el tamaño sin impedir que encoja: prueba width: 100% con max-width: 420px.",
		],
		solution: {
			"styles.css": `* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; background: #f6f8fa; }
.tienda { padding: 16px; }
.producto {
  width: min(420px, 100%);
  padding: 20px;
  background: white;
  border: 1px solid #d0d7de;
  border-radius: 16px;
}
.foto { height: 180px; border-radius: 12px; background: linear-gradient(135deg, #7aa2ff, #ffa657); }
.precio { font-size: 1.5rem; font-weight: 700; }
.comprar { width: 100%; min-height: 48px; border: 0; border-radius: 10px; background: #2f5bd3; color: white; font-size: 1rem; }`,
		},
		rootCause:
			"La ficha tiene width: 420px fijo. En una pantalla de 390px (menos 32px de padding) no cabe, así que desborda y aparece scroll horizontal. Con width: min(420px, 100%) (o width: 100% y max-width: 420px) conserva su tamaño en escritorio y se adapta en móvil.",
		suspects: ["width", "max-width", "box-sizing"],
	},
	{
		id: "inc-205",
		number: 205,
		type: "incident",
		title: "El aviso de cookies queda detrás de la cabecera y no se puede aceptar",
		area: "css",
		difficulty: "senior",
		concepts: ["z-index", "contexto de apilamiento"],
		durationMin: 12,
		ticket: {
			reporter: "Lector del periódico",
			priority: "alta",
			device: "escritorio, 1280px",
			steps: ["Entrar en la portada", "Intentar pulsar «Aceptar» en el aviso de cookies"],
			expected: "El aviso se ve completo y el botón se puede pulsar",
			actual: "La cabecera tapa el botón aunque el aviso tiene z-index: 9999",
		},
		viewport: 1280,
		files: {
			"index.html": `<header class="cabecera">Noticias Bilbao</header>
<div class="contenido">
  <article>
    <h1>Abre el nuevo puente sobre la ría</h1>
    <p>Más de 3.000 personas cruzaron el puente durante la primera mañana…</p>
  </article>
  <div class="cookies" role="dialog" aria-labelledby="cookies-titulo">
    <h2 id="cookies-titulo">Usamos cookies</h2>
    <button id="aceptar">Aceptar</button>
  </div>
</div>`,
			"styles.css": `body { margin: 0; font-family: system-ui, sans-serif; }
.cabecera {
  position: sticky; top: 0; z-index: 10; height: 72px;
  display: flex; align-items: center; padding: 0 24px;
  background: #161b22; color: white; font-weight: 700;
}
.contenido { position: relative; z-index: 1; padding: 24px; }
.contenido article { height: 1500px; }
.cookies {
  position: fixed; top: 8px; right: 24px; z-index: 9999; width: 320px;
  padding: 12px 16px; background: white; border: 1px solid #d0d7de; border-radius: 12px;
}
.cookies h2 { margin: 0 0 8px; font-size: 1rem; }
#aceptar { min-height: 36px; padding: 0 16px; }`,
			"app.js": `document.getElementById("aceptar").addEventListener("click", () => {
  document.querySelector(".cookies").hidden = true;
});`,
		},
		editable: ["styles.css"],
		networkLog: [],
		tests: [
			{ name: "El botón Aceptar recibe el clic", type: "dom", code: "return hits('#aceptar') || 'La cabecera está encima del botón Aceptar.';" },
			{ name: "El aviso queda por encima de la cabecera", type: "dom", code: "const c = rect('.cookies'); const el = document.elementFromPoint(c.left + 20, c.top + 10); return !!el && !!el.closest('.cookies');" },
		],
		regressionTests: [
			{ name: "La cabecera sigue fija al hacer scroll", type: "dom", code: "window.scrollTo(0, 500); await wait(30); const top = rect('.cabecera').top; window.scrollTo(0, 0); return near(top, 0, 1);" },
			{ name: "La cabecera tapa el artículo al hacer scroll", type: "dom", code: "window.scrollTo(0, 300); await wait(30); const el = document.elementFromPoint(400, 36); window.scrollTo(0, 0); return !!el && !!el.closest('.cabecera');" },
			{ name: "«Aceptar» cierra el aviso", type: "dom", code: "click('#aceptar'); await wait(20); return $('.cookies').hidden === true;" },
		],
		hints: [
			"Un z-index solo compite con los elementos de su mismo contexto de apilamiento. ¿Qué padre crea uno?",
			"position: relative + z-index: 1 en .contenido encierra al aviso en el nivel 1, por debajo de la cabecera (10).",
		],
		solution: {
			"styles.css": `body { margin: 0; font-family: system-ui, sans-serif; }
.cabecera {
  position: sticky; top: 0; z-index: 10; height: 72px;
  display: flex; align-items: center; padding: 0 24px;
  background: #161b22; color: white; font-weight: 700;
}
.contenido { position: relative; padding: 24px; }
.contenido article { height: 1500px; }
.cookies {
  position: fixed; top: 8px; right: 24px; z-index: 9999; width: 320px;
  padding: 12px 16px; background: white; border: 1px solid #d0d7de; border-radius: 12px;
}
.cookies h2 { margin: 0 0 8px; font-size: 1rem; }
#aceptar { min-height: 36px; padding: 0 16px; }`,
		},
		rootCause:
			".contenido tiene position: relative y z-index: 1, lo que crea un contexto de apilamiento. Todo lo que hay dentro (incluido el aviso con z-index: 9999) se apila como si fuera nivel 1, y la cabecera sticky (nivel 10) queda encima. Quitar el z-index de .contenido libera al aviso; subir el 9999 no sirve de nada.",
		suspects: ["z-index", "position", "isolation", "transform"],
	},
	{
		id: "inc-128",
		number: 128,
		type: "incident",
		title: "La tercera métrica del panel aparece debajo en vez de al lado",
		area: "css",
		difficulty: "junior",
		concepts: ["box-sizing", "flexbox"],
		durationMin: 5,
		ticket: {
			reporter: "Responsable de producto",
			priority: "baja",
			device: "escritorio, 1280px",
			steps: ["Abrir el panel de métricas"],
			expected: "Las tres tarjetas en una fila, del mismo ancho",
			actual: "«Ingresos» salta a una segunda fila",
		},
		viewport: 1280,
		files: {
			"index.html": `<section class="metricas">
  <div class="metrica">Usuarios <strong>1.204</strong></div>
  <div class="metrica">Retos superados <strong>8.391</strong></div>
  <div class="metrica">Ingresos <strong>12.480 €</strong></div>
</section>`,
			"styles.css": `body { margin: 0; padding: 24px; font-family: system-ui, sans-serif; }
.metricas { display: flex; flex-wrap: wrap; }
.metrica {
  width: 33.333%;
  padding: 24px;
  border: 1px solid #d0d7de;
  border-radius: 12px;
}
.metrica strong { display: block; font-size: 2rem; }`,
			"app.js": "",
		},
		editable: ["styles.css"],
		networkLog: [],
		tests: [
			{ name: "Las tres métricas en una fila", type: "dom", code: "const t = $$('.metrica').map(m => Math.round(m.getBoundingClientRect().top)); return t.every(x => x === t[0]);" },
			{ name: "Ninguna se sale del panel", type: "dom", code: "const p = rect('.metricas'); return $$('.metrica').every(m => m.getBoundingClientRect().right <= p.right + 1);" },
		],
		regressionTests: [
			{ name: "Las tres miden lo mismo", type: "dom", code: "const w = $$('.metrica').map(m => m.getBoundingClientRect().width); return w.every(x => near(x, w[0], 1));" },
			{ name: "Conservan el padding de 24px", type: "dom", code: "return style('.metrica', 'padding-left') === '24px';" },
			{ name: "Ocupan todo el ancho del panel", type: "dom", code: "const p = rect('.metricas'); const total = $$('.metrica').reduce((s, m) => s + m.getBoundingClientRect().width, 0); return total >= p.width - 2;" },
		],
		hints: [
			"Inspecciona una tarjeta: ¿su ancho real coincide con el 33,333% del panel?",
			"Por defecto el padding y el borde se suman al width (content-box).",
		],
		solution: {
			"styles.css": `body { margin: 0; padding: 24px; font-family: system-ui, sans-serif; }
.metricas { display: flex; flex-wrap: wrap; }
.metrica {
  box-sizing: border-box;
  width: 33.333%;
  padding: 24px;
  border: 1px solid #d0d7de;
  border-radius: 12px;
}
.metrica strong { display: block; font-size: 2rem; }`,
		},
		rootCause:
			"Con el box-sizing por defecto (content-box), cada tarjeta mide 33,333% más 48px de padding y 2px de borde. Las tres juntas superan el 100% del panel y, con flex-wrap: wrap, la tercera baja de fila. box-sizing: border-box hace que el width incluya padding y borde.",
		suspects: ["box-sizing", "width", "padding", "flex-wrap"],
	},
];
