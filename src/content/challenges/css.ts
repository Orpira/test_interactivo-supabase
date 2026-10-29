import type { ChallengeSpec } from "@/features/challenges/engine/types";

export const cssChallenges: ChallengeSpec[] = [
	{
		id: "css-centrar-01",
		title: "Centra la tarjeta",
		category: "css",
		difficulty: "junior",
		concepts: ["flexbox", "grid", "alineacion"],
		instructions:
			"Centra .card vertical y horizontalmente dentro de .stage. Puedes usar flexbox o grid: cualquier solución correcta vale.",
		files: {
			"index.html": `<div class="stage">
  <div class="card">Hola 👋</div>
</div>`,
			"styles.css": `body { margin: 0; font-family: system-ui, sans-serif; }
.stage {
  height: 100vh;
  background: #eef2ff;
}
.card {
  width: 200px;
  padding: 2rem;
  background: white;
  border-radius: 12px;
}`,
			"app.js": "",
		},
		editable: ["styles.css"],
		tests: [
			{ name: ".card centrada en horizontal", type: "dom", code: "const s = rect('.stage'), c = rect('.card'); return near(s.left + s.width / 2, c.left + c.width / 2);" },
			{ name: ".card centrada en vertical", type: "dom", code: "const s = rect('.stage'), c = rect('.card'); return near(s.top + s.height / 2, c.top + c.height / 2);" },
			{ name: ".card conserva su ancho de 200px", type: "dom", code: "return near(rect('.card').width, 200 + 64, 1);", message: "No cambies el tamaño de la tarjeta: centra desde el contenedor." },
		],
		hints: [
			"Piensa en el contenedor, no en la tarjeta.",
			"Con flexbox necesitas dos propiedades de alineación; con grid basta place-items.",
		],
		solution: {
			"styles.css": `body { margin: 0; font-family: system-ui, sans-serif; }
.stage {
  height: 100vh;
  background: #eef2ff;
  display: flex;
  justify-content: center;
  align-items: center;
}
.card {
  width: 200px;
  padding: 2rem;
  background: white;
  border-radius: 12px;
}`,
		},
	},
	{
		id: "css-boton-tactil-01",
		title: "Botón cómodo para el dedo",
		category: "css",
		difficulty: "junior",
		concepts: ["box-model", "accesibilidad", "pseudo-clases"],
		instructions:
			"Haz que .btn sea fácil de pulsar: altura mínima de 44px, padding horizontal de al menos 16px, esquinas redondeadas (border-radius ≥ 8px) y cursor de mano. Además, cuando reciba el foco con teclado (:focus-visible) debe mostrar un contorno (outline) visible.",
		files: {
			"index.html": `<button class="btn">Guardar cambios</button>`,
			"styles.css": `body { font-family: system-ui, sans-serif; padding: 2rem; }
.btn {
  background: #2f5bd3;
  color: white;
  border: none;
  font-size: 14px;
}`,
			"app.js": "",
		},
		editable: ["styles.css"],
		tests: [
			{ name: "Altura mínima de 44px", type: "dom", code: "return rect('.btn').height >= 44;" },
			{ name: "Padding horizontal ≥ 16px y bordes redondeados", type: "dom", code: "const s = style('.btn'); return parseFloat(s.paddingLeft) >= 16 && parseFloat(s.paddingRight) >= 16 && parseFloat(s.borderTopLeftRadius) >= 8;" },
			{ name: "Cursor de mano", type: "dom", code: "return style('.btn', 'cursor') === 'pointer';" },
			{ name: "Contorno visible con :focus-visible", type: "dom", code: "for (const sheet of document.styleSheets) for (const r of sheet.cssRules) if (r.selectorText && r.selectorText.includes('.btn:focus-visible') && r.style.outlineStyle && r.style.outlineStyle !== 'none') return true; return 'Añade una regla .btn:focus-visible con outline.';" },
		],
		hints: [
			"44px es el tamaño mínimo de zona táctil que recomiendan las pautas de accesibilidad.",
			"outline: 3px solid ... junto con outline-offset queda mejor que un borde.",
		],
		solution: {
			"styles.css": `body { font-family: system-ui, sans-serif; padding: 2rem; }
.btn {
  background: #2f5bd3;
  color: white;
  border: none;
  font-size: 14px;
  min-height: 44px;
  padding: 0 20px;
  border-radius: 10px;
  cursor: pointer;
}
.btn:focus-visible {
  outline: 3px solid #ffa657;
  outline-offset: 2px;
}`,
		},
	},
	{
		id: "css-lectura-01",
		title: "Texto cómodo de leer",
		category: "css",
		difficulty: "junior",
		concepts: ["tipografia", "box-model"],
		instructions:
			"El artículo ocupa toda la pantalla y las líneas están muy pegadas. Limita .articulo a un ancho máximo de 65ch, céntralo horizontalmente con márgenes automáticos y dale a sus párrafos un interlineado (line-height) de al menos 1.5.",
		files: {
			"index.html": `<article class="articulo">
  <h1>Por qué importa la longitud de línea</h1>
  <p>Las líneas muy largas cansan la vista: al saltar a la línea siguiente cuesta encontrar dónde empieza. Entre 45 y 75 caracteres por línea es lo más cómodo para leer en pantalla.</p>
  <p>El interlineado también ayuda: con un poco más de aire entre líneas, el ojo no se pierde.</p>
</article>`,
			"styles.css": `body { font-family: Georgia, serif; font-size: 18px; margin: 0; padding: 1rem; }
.articulo p { line-height: 1.1; }`,
			"app.js": "",
		},
		editable: ["styles.css"],
		tests: [
			{ name: "Ancho máximo de 65ch", type: "dom", code: "const regla = [...document.styleSheets].some(sh => [...sh.cssRules].some(r => r.selectorText === '.articulo' && r.style.maxWidth === '65ch')); return regla && rect('.articulo').width < 900;", message: "Usa max-width: 65ch en .articulo." },
			{ name: "Centrado horizontalmente", type: "dom", code: "const a = rect('.articulo'); const izq = a.left, der = document.documentElement.clientWidth - a.right; return near(izq, der, 2);" },
			{ name: "Interlineado de los párrafos ≥ 1.5", type: "dom", code: "const s = style('.articulo p'); return parseFloat(s.lineHeight) / parseFloat(s.fontSize) >= 1.5;" },
		],
		hints: [
			"La unidad ch equivale al ancho del carácter «0» de la fuente.",
			"margin-inline: auto (o margin: 0 auto) centra un bloque con ancho limitado.",
		],
		solution: {
			"styles.css": `body { font-family: Georgia, serif; font-size: 18px; margin: 0; padding: 1rem; }
.articulo { max-width: 65ch; margin-inline: auto; }
.articulo p { line-height: 1.6; }`,
		},
	},
	{
		id: "css-columnas-flex-01",
		title: "Tres columnas iguales con flexbox",
		category: "css",
		difficulty: "junior",
		concepts: ["flexbox", "gap"],
		instructions:
			"Coloca las tres .col de .fila una al lado de la otra, con el mismo ancho y una separación (gap) de 24px entre ellas.",
		files: {
			"index.html": `<section class="fila">
  <div class="col">Diseño</div>
  <div class="col">Código</div>
  <div class="col">Despliegue</div>
</section>`,
			"styles.css": `body { font-family: system-ui, sans-serif; padding: 1rem; }
.col { background: #eef2ff; padding: 1rem; border-radius: 8px; }`,
			"app.js": "",
		},
		editable: ["styles.css"],
		tests: [
			{ name: "Las columnas están en la misma fila", type: "dom", code: "const t = $$('.col').map(c => Math.round(c.getBoundingClientRect().top)); return t.every(x => x === t[0]);" },
			{ name: "Las tres miden lo mismo", type: "dom", code: "const w = $$('.col').map(c => c.getBoundingClientRect().width); return w.every(x => near(x, w[0], 1)) && w[0] > 100;" },
			{ name: "Separación de 24px", type: "dom", code: "const c = $$('.col').map(x => x.getBoundingClientRect()); return near(c[1].left - c[0].right, 24, 1) && near(c[2].left - c[1].right, 24, 1);" },
		],
		hints: [
			"display: flex en el contenedor coloca a los hijos en fila.",
			"flex: 1 en los hijos reparte el espacio libre a partes iguales.",
		],
		solution: {
			"styles.css": `body { font-family: system-ui, sans-serif; padding: 1rem; }
.fila { display: flex; gap: 24px; }
.col { flex: 1; background: #eef2ff; padding: 1rem; border-radius: 8px; }`,
		},
	},
	{
		id: "css-galeria-grid-01",
		title: "Galería con CSS Grid",
		category: "css",
		difficulty: "semi_senior",
		concepts: ["grid", "gap"],
		instructions:
			"Organiza las 6 .foto de .galeria en una cuadrícula de 3 columnas iguales con 16px de separación en ambos sentidos. Las fotos deben ocupar todo el ancho de su celda.",
		files: {
			"index.html": `<div class="galeria">
  <div class="foto">1</div><div class="foto">2</div><div class="foto">3</div>
  <div class="foto">4</div><div class="foto">5</div><div class="foto">6</div>
</div>`,
			"styles.css": `body { margin: 0; padding: 20px; font-family: system-ui, sans-serif; }
.foto { height: 120px; background: #7aa2ff; border-radius: 10px; display: grid; place-items: center; }`,
			"app.js": "",
		},
		editable: ["styles.css"],
		tests: [
			{ name: "Tres fotos por fila (2 filas)", type: "dom", code: "const tops = new Set($$('.foto').map(f => Math.round(f.getBoundingClientRect().top))); return tops.size === 2;" },
			{ name: "Columnas del mismo ancho", type: "dom", code: "const w = $$('.foto').map(f => f.getBoundingClientRect().width); return w.every(x => near(x, w[0], 1)) && w[0] > 200;" },
			{ name: "Separación de 16px en filas y columnas", type: "dom", code: "const f = $$('.foto').map(x => x.getBoundingClientRect()); return near(f[1].left - f[0].right, 16, 1) && near(f[3].top - f[0].bottom, 16, 1);" },
		],
		hints: [
			"grid-template-columns: repeat(3, 1fr) crea tres columnas iguales.",
			"gap afecta a filas y columnas a la vez.",
		],
		solution: {
			"styles.css": `body { margin: 0; padding: 20px; font-family: system-ui, sans-serif; }
.galeria { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.foto { height: 120px; background: #7aa2ff; border-radius: 10px; display: grid; place-items: center; }`,
		},
	},
	{
		id: "css-responsive-01",
		title: "Tarjetas responsive con media queries",
		category: "css",
		difficulty: "semi_senior",
		concepts: ["responsive", "media-queries", "grid"],
		instructions:
			"Las tarjetas ya forman 3 columnas en escritorio. Añade una media query para que en pantallas de 600px o menos (max-width: 600px) .tarjetas pase a una sola columna (grid-template-columns: 1fr). No cambies la versión de escritorio.",
		files: {
			"index.html": `<div class="tarjetas">
  <article>Plan Básico</article>
  <article>Plan Pro</article>
  <article>Plan Equipo</article>
</div>`,
			"styles.css": `body { font-family: system-ui, sans-serif; padding: 1rem; }
.tarjetas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
article { padding: 1.5rem; border: 1px solid #ccc; border-radius: 12px; }`,
			"app.js": "",
		},
		editable: ["styles.css"],
		tests: [
			{ name: "En escritorio siguen siendo 3 columnas", type: "dom", code: "const t = new Set($$('article').map(a => Math.round(a.getBoundingClientRect().top))); return t.size === 1;" },
			{ name: "Hay una media query de max-width ≤ 600px", type: "dom", code: "const mq = [...document.styleSheets].flatMap(s => [...s.cssRules]).filter(r => r.media); return mq.some(r => { const m = r.conditionText.match(/max-width:\\s*(\\d+)px/); return m && +m[1] <= 600 && +m[1] >= 480; });", message: "Añade @media (max-width: 600px) { ... }." },
			{ name: "En móvil .tarjetas tiene una columna", type: "dom", code: "const mq = [...document.styleSheets].flatMap(s => [...s.cssRules]).filter(r => r.media && /max-width/.test(r.conditionText)); return mq.some(m => [...m.cssRules].some(r => /\\.tarjetas/.test(r.selectorText) && /^(1fr|minmax\\(0(px)?, 1fr\\))$/.test(r.style.gridTemplateColumns.trim())));", message: "Dentro de la media query, pon grid-template-columns: 1fr en .tarjetas." },
		],
		hints: [
			"Las media queries van después de la regla general para poder sobrescribirla.",
			"Dentro de la media query solo cambia lo que es distinto en móvil.",
		],
		solution: {
			"styles.css": `body { font-family: system-ui, sans-serif; padding: 1rem; }
.tarjetas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
article { padding: 1.5rem; border: 1px solid #ccc; border-radius: 12px; }

@media (max-width: 600px) {
  .tarjetas { grid-template-columns: 1fr; }
}`,
		},
	},
	{
		id: "css-variables-tema-01",
		title: "Tema con variables CSS",
		category: "css",
		difficulty: "semi_senior",
		concepts: ["custom-properties", "temas"],
		instructions:
			"El color de marca está repetido. Define en :root la variable --color-marca con el valor #2f5bd3 y úsala (con var()) en el fondo de .boton y en el color de .titulo, de forma que al cambiar la variable cambien ambos.",
		files: {
			"index.html": `<h1 class="titulo">WebWiz</h1>
<button class="boton">Empezar</button>`,
			"styles.css": `body { font-family: system-ui, sans-serif; padding: 2rem; }
.titulo { color: #2f5bd3; }
.boton { background: #2f5bd3; color: white; border: 0; padding: .75rem 1.25rem; border-radius: 10px; }`,
			"app.js": "",
		},
		editable: ["styles.css"],
		tests: [
			{ name: "Existe --color-marca en :root", type: "dom", code: "return getComputedStyle(document.documentElement).getPropertyValue('--color-marca').trim().toLowerCase() === '#2f5bd3';" },
			{ name: "El botón usa la variable", type: "dom", code: "document.documentElement.style.setProperty('--color-marca', 'rgb(1, 2, 3)'); const ok = style('.boton', 'background-color') === 'rgb(1, 2, 3)'; document.documentElement.style.removeProperty('--color-marca'); return ok;" },
			{ name: "El título usa la variable", type: "dom", code: "document.documentElement.style.setProperty('--color-marca', 'rgb(4, 5, 6)'); const ok = style('.titulo', 'color') === 'rgb(4, 5, 6)'; document.documentElement.style.removeProperty('--color-marca'); return ok;" },
		],
		hints: [
			"Las variables se declaran con dos guiones: --nombre: valor;",
			"Se leen con var(--nombre).",
		],
		solution: {
			"styles.css": `:root { --color-marca: #2f5bd3; }
body { font-family: system-ui, sans-serif; padding: 2rem; }
.titulo { color: var(--color-marca); }
.boton { background: var(--color-marca); color: white; border: 0; padding: .75rem 1.25rem; border-radius: 10px; }`,
		},
	},
	{
		id: "css-sticky-header-01",
		title: "Cabecera fija al hacer scroll",
		category: "css",
		difficulty: "senior",
		concepts: ["position", "sticky", "z-index"],
		instructions:
			"Haz que la cabecera se quede pegada arriba al hacer scroll (sin sacarla del flujo: nada de position: fixed) y que quede por encima del contenido, que tiene elementos posicionados con z-index: 1.",
		files: {
			"index.html": `<header class="cabecera">WebWiz</header>
<main>
  <div class="tarjeta">Tarjeta destacada</div>
  <p style="height: 2000px">Contenido muy largo…</p>
</main>`,
			"styles.css": `body { margin: 0; font-family: system-ui, sans-serif; }
.cabecera { background: #161b22; color: white; padding: 1rem; }
.tarjeta { position: relative; z-index: 1; background: #ffa657; padding: 2rem; }`,
			"app.js": "",
		},
		editable: ["styles.css"],
		tests: [
			{ name: "La cabecera es sticky y no fixed", type: "dom", code: "return style('.cabecera', 'position') === 'sticky';" },
			{ name: "Sigue arriba tras hacer scroll", type: "dom", code: "window.scrollTo(0, 600); await wait(30); const top = rect('.cabecera').top; window.scrollTo(0, 0); return near(top, 0, 1);" },
			{ name: "Queda por encima del contenido", type: "dom", code: "window.scrollTo(0, 60); await wait(30); const h = rect('.cabecera'); const el = document.elementFromPoint(h.left + 10, h.top + h.height / 2); window.scrollTo(0, 0); return !!el && !!el.closest('.cabecera');", message: "Al hacer scroll la tarjeta tapa la cabecera: revisa el z-index." },
		],
		hints: [
			"position: sticky necesita un valor de top para saber dónde pegarse.",
			"La tarjeta tiene z-index: 1; la cabecera necesita uno mayor.",
		],
		solution: {
			"styles.css": `body { margin: 0; font-family: system-ui, sans-serif; }
.cabecera { background: #161b22; color: white; padding: 1rem; position: sticky; top: 0; z-index: 10; }
.tarjeta { position: relative; z-index: 1; background: #ffa657; padding: 2rem; }`,
		},
	},
	{
		id: "css-grid-areas-01",
		title: "Maquetación con grid-template-areas",
		category: "css",
		difficulty: "senior",
		concepts: ["grid", "grid-areas", "layout"],
		instructions:
			"Maqueta .pagina con grid-template-areas: la cabecera ocupa todo el ancho arriba; debajo, una barra lateral de 240px a la izquierda y el contenido principal ocupando el resto; el pie ocupa todo el ancho abajo. La página debe medir al menos el alto de la ventana.",
		files: {
			"index.html": `<div class="pagina">
  <header>Cabecera</header>
  <aside>Lateral</aside>
  <main>Contenido</main>
  <footer>Pie</footer>
</div>`,
			"styles.css": `body { margin: 0; font-family: system-ui, sans-serif; }
header, aside, main, footer { padding: 1rem; border: 1px solid #ccc; }`,
			"app.js": "",
		},
		editable: ["styles.css"],
		tests: [
			{ name: "Usa grid-template-areas", type: "dom", code: "const s = style('.pagina'); return s.display === 'grid' && s.gridTemplateAreas !== 'none';" },
			{ name: "Lateral de 240px a la izquierda del contenido", type: "dom", code: "const a = rect('aside'), m = rect('main'); return near(a.width, 240, 1) && a.right <= m.left + 1 && near(a.top, m.top, 1);" },
			{ name: "Cabecera y pie a todo el ancho", type: "dom", code: "const p = rect('.pagina'), h = rect('header'), f = rect('footer'), m = rect('main'); return near(h.width, p.width, 1) && near(f.width, p.width, 1) && h.bottom <= m.top + 1 && f.top >= m.bottom - 1;" },
			{ name: "Ocupa al menos el alto de la ventana", type: "dom", code: "return rect('.pagina').height >= window.innerHeight - 1;" },
		],
		hints: [
			"Asigna un nombre a cada parte con grid-area y dibuja el mapa en grid-template-areas.",
			"grid-template-columns: 240px 1fr; grid-template-rows: auto 1fr auto; min-height: 100vh.",
		],
		solution: {
			"styles.css": `body { margin: 0; font-family: system-ui, sans-serif; }
header, aside, main, footer { padding: 1rem; border: 1px solid #ccc; }
.pagina {
  display: grid;
  min-height: 100vh;
  grid-template-columns: 240px 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "cabecera cabecera"
    "lateral contenido"
    "pie pie";
}
header { grid-area: cabecera; }
aside { grid-area: lateral; }
main { grid-area: contenido; }
footer { grid-area: pie; }`,
		},
	},
	{
		id: "css-aspect-ratio-01",
		title: "Miniaturas 16:9 sin deformar",
		category: "css",
		difficulty: "senior",
		concepts: ["aspect-ratio", "object-fit", "imagenes"],
		instructions:
			"Las miniaturas de vídeo tienen tamaños distintos y se deforman. Haz que cada .miniatura img ocupe todo el ancho de su tarjeta (300px), tenga proporción 16:9 (aspect-ratio) y recorte la imagen sin deformarla (object-fit: cover).",
		files: {
			"index.html": `<div class="lista">
  <div class="miniatura"><img src="https://picsum.photos/seed/a/400/400" alt="Vídeo 1"></div>
  <div class="miniatura"><img src="https://picsum.photos/seed/b/800/300" alt="Vídeo 2"></div>
</div>`,
			"styles.css": `body { font-family: system-ui, sans-serif; padding: 1rem; }
.lista { display: flex; gap: 1rem; }
.miniatura { width: 300px; }
.miniatura img { width: 120px; height: 200px; }`,
			"app.js": "",
		},
		editable: ["styles.css"],
		tests: [
			{ name: "Ocupan todo el ancho de la tarjeta", type: "dom", code: "return $$('.miniatura img').every(i => near(i.getBoundingClientRect().width, 300, 1));" },
			{ name: "Proporción 16:9", type: "dom", code: "return $$('.miniatura img').every(i => { const r = i.getBoundingClientRect(); return near(r.width / r.height, 16 / 9, 0.02); });" },
			{ name: "Recortan sin deformar", type: "dom", code: "return $$('.miniatura img').every(i => getComputedStyle(i).objectFit === 'cover');" },
		],
		hints: [
			"aspect-ratio: 16 / 9 calcula el alto a partir del ancho, pero solo si el alto es automático.",
			"object-fit: cover rellena la caja recortando lo que sobra.",
		],
		solution: {
			"styles.css": `body { font-family: system-ui, sans-serif; padding: 1rem; }
.lista { display: flex; gap: 1rem; }
.miniatura { width: 300px; }
.miniatura img { width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: cover; display: block; }`,
		},
	},
];
