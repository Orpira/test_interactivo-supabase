import type { ChallengeSpec } from "@/features/challenges/engine/types";

const BASE_CSS = `body { font-family: system-ui, sans-serif; margin: 0; padding: 1rem; }`;

export const htmlChallenges: ChallengeSpec[] = [
	{
		id: "html-estructura-semantica-01",
		title: "Estructura semántica de una página",
		category: "html",
		difficulty: "junior",
		concepts: ["html-semantico", "landmarks"],
		instructions:
			"Esta página está hecha solo con <div>. Cámbiala por etiquetas semánticas: una cabecera (<header>) que contenga la navegación (<nav>), un único contenido principal (<main>) y un pie de página (<footer>) después del contenido principal. Mantén los textos.",
		files: {
			"index.html": `<div class="cabecera">
  <div class="menu">
    <a href="#">Inicio</a>
    <a href="#">Blog</a>
  </div>
</div>
<div class="contenido">
  <h1>Mi blog</h1>
  <p>Bienvenido a mi blog sobre desarrollo web.</p>
</div>
<div class="pie">© 2026 Mi blog</div>`,
			"styles.css": BASE_CSS,
			"app.js": "",
		},
		editable: ["index.html"],
		tests: [
			{ name: "Hay una <nav> dentro de <header>", type: "dom", code: "return !!$('header nav');", message: "La navegación debe ir dentro de un <header>." },
			{ name: "Hay exactamente un <main> con el título", type: "dom", code: "return $$('main').length === 1 && !!$('main h1');", message: "Usa un único <main> que contenga el <h1>." },
			{ name: "El <footer> va después del <main>", type: "dom", code: "const m = $('main'), f = $('footer'); if (!m || !f) return 'Falta <main> o <footer>.'; return !!(m.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING);" },
			{ name: "Se mantienen los enlaces del menú", type: "dom", code: "return $$('nav a').length >= 2;", message: "Conserva los dos enlaces dentro de la navegación." },
		],
		hints: [
			"Cada <div> tiene una etiqueta semántica equivalente: cabecera → header, menú → nav, contenido → main, pie → footer.",
			"La <nav> no sustituye al <header>: va dentro de él.",
		],
		solution: {
			"index.html": `<header>
  <nav>
    <a href="#">Inicio</a>
    <a href="#">Blog</a>
  </nav>
</header>
<main>
  <h1>Mi blog</h1>
  <p>Bienvenido a mi blog sobre desarrollo web.</p>
</main>
<footer>© 2026 Mi blog</footer>`,
		},
	},
	{
		id: "html-imagen-accesible-01",
		title: "Imagen con texto alternativo y pie de foto",
		category: "html",
		difficulty: "junior",
		concepts: ["accesibilidad", "imagenes"],
		instructions:
			"La imagen no tiene texto alternativo, así que un lector de pantalla no puede describirla. Añade un atributo alt descriptivo (al menos 10 caracteres) y envuelve la imagen en un <figure> con un <figcaption> que diga «Atardecer en Bilbao».",
		files: {
			"index.html": `<h1>Galería</h1>
<img src="https://picsum.photos/seed/bilbao/400/250" width="400" height="250">`,
			"styles.css": BASE_CSS,
			"app.js": "",
		},
		editable: ["index.html"],
		tests: [
			{ name: "La imagen tiene un alt descriptivo", type: "dom", code: "const img = $('img'); return !!img && (img.getAttribute('alt') || '').trim().length >= 10;", message: "Añade un alt de al menos 10 caracteres que describa la imagen." },
			{ name: "La imagen está dentro de un <figure>", type: "dom", code: "return !!$('figure img');" },
			{ name: "El <figcaption> tiene el texto pedido", type: "dom", code: "const c = $('figure figcaption'); return !!c && /atardecer en bilbao/i.test(c.textContent);", message: "Añade <figcaption>Atardecer en Bilbao</figcaption> dentro del <figure>." },
		],
		hints: [
			"El alt describe lo que se ve, como se lo contarías a alguien por teléfono.",
			"Estructura: <figure><img ...><figcaption>...</figcaption></figure>.",
		],
		solution: {
			"index.html": `<h1>Galería</h1>
<figure>
  <img src="https://picsum.photos/seed/bilbao/400/250" width="400" height="250" alt="Puesta de sol sobre la ría de Bilbao">
  <figcaption>Atardecer en Bilbao</figcaption>
</figure>`,
		},
	},
	{
		id: "html-enlaces-01",
		title: "Enlaces internos, externos y de correo",
		category: "html",
		difficulty: "junior",
		concepts: ["enlaces", "seguridad"],
		instructions:
			"Completa los tres enlaces: «Documentación» debe abrir https://developer.mozilla.org en una pestaña nueva de forma segura (target=\"_blank\" con rel=\"noopener\"), «Escríbeme» debe abrir el correo hola@ejemplo.com (mailto:) y «Ir a contacto» debe saltar a la sección con id «contacto».",
		files: {
			"index.html": `<nav>
  <a>Documentación</a>
  <a>Escríbeme</a>
  <a>Ir a contacto</a>
</nav>
<main>
  <section style="min-height: 120vh">Contenido</section>
  <section>
    <h2>Contacto</h2>
  </section>
</main>`,
			"styles.css": BASE_CSS,
			"app.js": "",
		},
		editable: ["index.html"],
		tests: [
			{ name: "Enlace externo en pestaña nueva y seguro", type: "dom", code: "const a = $$('a').find(x => /documentaci/i.test(x.textContent)); if (!a) return 'No encuentro el enlace Documentación.'; return a.getAttribute('href') === 'https://developer.mozilla.org' && a.target === '_blank' && /noopener/.test(a.rel);", message: "Necesita href, target=\"_blank\" y rel=\"noopener\"." },
			{ name: "Enlace de correo con mailto:", type: "dom", code: "const a = $$('a').find(x => /escr/i.test(x.textContent)); return !!a && a.getAttribute('href') === 'mailto:hola@ejemplo.com';" },
			{ name: "Enlace interno a #contacto", type: "dom", code: "const a = $$('a').find(x => /contacto/i.test(x.textContent)); return !!a && a.getAttribute('href') === '#contacto';" },
			{ name: "Existe la sección con id contacto", type: "dom", code: "const s = document.getElementById('contacto'); return !!s && /contacto/i.test(s.textContent);", message: "Pon id=\"contacto\" en la sección de contacto." },
		],
		hints: [
			"Un enlace a una parte de la misma página usa # seguido del id del elemento.",
			"Sin rel=\"noopener\", la página abierta podría controlar la tuya mediante window.opener.",
		],
		solution: {
			"index.html": `<nav>
  <a href="https://developer.mozilla.org" target="_blank" rel="noopener noreferrer">Documentación</a>
  <a href="mailto:hola@ejemplo.com">Escríbeme</a>
  <a href="#contacto">Ir a contacto</a>
</nav>
<main>
  <section style="min-height: 120vh">Contenido</section>
  <section id="contacto">
    <h2>Contacto</h2>
  </section>
</main>`,
		},
	},
	{
		id: "html-listas-anidadas-01",
		title: "Menú con submenú usando listas",
		category: "html",
		difficulty: "junior",
		concepts: ["listas", "html-semantico"],
		instructions:
			"Convierte el menú en una lista no ordenada (<ul>) dentro de la <nav> con tres elementos: Inicio, Cursos y Contacto. «Cursos» debe tener una sublista anidada (dentro de su <li>) con «HTML» y «CSS».",
		files: {
			"index.html": `<nav>
  Inicio
  Cursos: HTML, CSS
  Contacto
</nav>`,
			"styles.css": BASE_CSS,
			"app.js": "",
		},
		editable: ["index.html"],
		tests: [
			{ name: "La nav contiene una <ul> con 3 elementos", type: "dom", code: "const ul = $('nav > ul'); return !!ul && ul.querySelectorAll(':scope > li').length === 3;", message: "Usa <ul> con tres <li> directos dentro de la <nav>." },
			{ name: "La sublista está dentro del <li> de Cursos", type: "dom", code: "const li = $$('nav > ul > li').find(l => /cursos/i.test(l.firstChild && l.firstChild.textContent || l.textContent)); return !!li && !!li.querySelector(':scope > ul');", message: "La <ul> anidada va dentro del <li> de Cursos, no después." },
			{ name: "El submenú tiene HTML y CSS", type: "dom", code: "const items = $$('nav > ul > li > ul > li').map(l => l.textContent.trim()); return items.length === 2 && items.includes('HTML') && items.includes('CSS');" },
		],
		hints: [
			"Una lista anidada es una <ul> completa colocada dentro de un <li>.",
			"Estructura: <li>Cursos <ul><li>HTML</li><li>CSS</li></ul></li>.",
		],
		solution: {
			"index.html": `<nav>
  <ul>
    <li>Inicio</li>
    <li>Cursos
      <ul>
        <li>HTML</li>
        <li>CSS</li>
      </ul>
    </li>
    <li>Contacto</li>
  </ul>
</nav>`,
		},
	},
	{
		id: "html-formulario-labels-01",
		title: "Formulario de contacto accesible",
		category: "html",
		difficulty: "semi_senior",
		concepts: ["formularios", "accesibilidad"],
		instructions:
			"Haz accesible el formulario: cada campo debe tener un <label> asociado (con for e id), el email debe ser de tipo email y obligatorio, el mensaje debe ser un <textarea> y el botón debe ser de tipo submit con el texto «Enviar».",
		files: {
			"index.html": `<form>
  Nombre <input name="nombre">
  Email <input name="email">
  Mensaje <input name="mensaje">
  <div class="boton">Enviar</div>
</form>`,
			"styles.css": BASE_CSS + "\nlabel { display: block; margin-top: .75rem; }",
			"app.js": "",
		},
		editable: ["index.html"],
		tests: [
			{ name: "Cada campo tiene un <label> asociado", type: "dom", code: "const campos = $$('input, textarea'); if (campos.length < 3) return 'Faltan campos.'; const sin = campos.filter(c => !c.labels || c.labels.length === 0); return sin.length === 0 || ('Sin etiqueta: ' + sin.map(c => c.name).join(', '));" },
			{ name: "El email es type=email y obligatorio", type: "dom", code: "const e = $('[name=email]'); return !!e && e.type === 'email' && e.required;" },
			{ name: "El mensaje es un <textarea>", type: "dom", code: "return !!$('textarea[name=mensaje]');" },
			{ name: "Hay un botón submit «Enviar»", type: "dom", code: "const b = $('form button'); return !!b && b.type === 'submit' && /enviar/i.test(b.textContent);" },
		],
		hints: [
			"<label for=\"email\"> se asocia al campo que tiene id=\"email\".",
			"Un <div> no es un botón: usa <button type=\"submit\">.",
		],
		solution: {
			"index.html": `<form>
  <label for="nombre">Nombre</label>
  <input id="nombre" name="nombre">
  <label for="email">Email</label>
  <input id="email" name="email" type="email" required>
  <label for="mensaje">Mensaje</label>
  <textarea id="mensaje" name="mensaje"></textarea>
  <button type="submit">Enviar</button>
</form>`,
		},
	},
	{
		id: "html-tabla-accesible-01",
		title: "Tabla de datos accesible",
		category: "html",
		difficulty: "semi_senior",
		concepts: ["tablas", "accesibilidad"],
		instructions:
			"Convierte la lista de precios en una tabla de datos: con un <caption> «Planes y precios», una cabecera (<thead>) con celdas <th scope=\"col\"> para «Plan» y «Precio», y un <tbody> con una fila por plan (Básico 5 €, Pro 12 €, Equipo 30 €).",
		files: {
			"index.html": `<div>Planes y precios</div>
<div>Básico - 5 €</div>
<div>Pro - 12 €</div>
<div>Equipo - 30 €</div>`,
			"styles.css": BASE_CSS + "\ntable { border-collapse: collapse; } th, td { border: 1px solid #ccc; padding: .5rem; }",
			"app.js": "",
		},
		editable: ["index.html"],
		tests: [
			{ name: "La tabla tiene <caption>", type: "dom", code: "const c = $('table caption'); return !!c && /planes y precios/i.test(c.textContent);" },
			{ name: "Cabecera con <th scope=\"col\">", type: "dom", code: "const ths = $$('table thead th'); return ths.length === 2 && ths.every(t => t.getAttribute('scope') === 'col');", message: "Usa dos <th scope=\"col\"> dentro de <thead>." },
			{ name: "Tres filas de datos en <tbody>", type: "dom", code: "const rows = $$('table tbody tr'); return rows.length === 3 && rows.every(r => r.children.length === 2);" },
			{ name: "Los datos son correctos", type: "dom", code: "const t = $('table tbody').textContent.replace(/\\s+/g, ' '); return /Básico/.test(t) && /Pro/.test(t) && /Equipo/.test(t) && /30/.test(t);" },
		],
		hints: [
			"El <caption> va justo después de abrir <table>.",
			"scope=\"col\" indica que la cabecera describe toda la columna.",
		],
		solution: {
			"index.html": `<table>
  <caption>Planes y precios</caption>
  <thead>
    <tr><th scope="col">Plan</th><th scope="col">Precio</th></tr>
  </thead>
  <tbody>
    <tr><td>Básico</td><td>5 €</td></tr>
    <tr><td>Pro</td><td>12 €</td></tr>
    <tr><td>Equipo</td><td>30 €</td></tr>
  </tbody>
</table>`,
		},
	},
	{
		id: "html-encabezados-01",
		title: "Jerarquía de encabezados",
		category: "html",
		difficulty: "semi_senior",
		concepts: ["html-semantico", "accesibilidad", "seo"],
		instructions:
			"Los encabezados están desordenados: hay dos <h1> y se salta niveles (de h1 a h3). Corrígelos para que haya un único <h1> («Guía de CSS»), las secciones sean <h2> y las subsecciones <h3>, sin saltar ningún nivel. No cambies los textos.",
		files: {
			"index.html": `<h1>Guía de CSS</h1>
<h1>Selectores</h1>
<h4>Selectores de clase</h4>
<h4>Selectores de id</h4>
<h3>Flexbox</h3>
<h5>Alinear elementos</h5>`,
			"styles.css": BASE_CSS,
			"app.js": "",
		},
		editable: ["index.html"],
		tests: [
			{ name: "Hay un único <h1> con el título", type: "dom", code: "const h = $$('h1'); return h.length === 1 && /guía de css/i.test(h[0].textContent);" },
			{ name: "No se salta ningún nivel", type: "dom", code: "let prev = 0; for (const h of $$('h1,h2,h3,h4,h5,h6')) { const n = +h.tagName[1]; if (n > prev + 1) return 'Salto de h' + prev + ' a h' + n + ' en «' + h.textContent + '».'; prev = n; } return true;" },
			{ name: "Selectores y Flexbox son secciones (<h2>)", type: "dom", code: "const t = $$('h2').map(h => h.textContent.trim()); return t.includes('Selectores') && t.includes('Flexbox');" },
			{ name: "Se conservan los 6 encabezados", type: "dom", code: "return $$('h1,h2,h3,h4,h5,h6').length === 6;" },
		],
		hints: [
			"Piensa en un índice: título (h1) → capítulos (h2) → apartados (h3).",
			"El tamaño visual se cambia con CSS, nunca eligiendo otro nivel de encabezado.",
		],
		solution: {
			"index.html": `<h1>Guía de CSS</h1>
<h2>Selectores</h2>
<h3>Selectores de clase</h3>
<h3>Selectores de id</h3>
<h2>Flexbox</h2>
<h3>Alinear elementos</h3>`,
		},
	},
	{
		id: "html-validacion-nativa-01",
		title: "Validación nativa de formularios",
		category: "html",
		difficulty: "senior",
		concepts: ["formularios", "validacion", "accesibilidad"],
		instructions:
			"Usa la validación nativa del navegador, sin JavaScript: la contraseña debe exigir al menos 8 caracteres (minlength) y estar asociada con aria-describedby al texto de ayuda (id «ayuda-pass»). Las opciones de plan deben ser radios del mismo grupo (name=\"plan\"), agrupadas en un <fieldset> con <legend> «Plan», y una de ellas obligatoria.",
		files: {
			"index.html": `<form>
  <label for="pass">Contraseña</label>
  <input id="pass" type="password">
  <p>Mínimo 8 caracteres.</p>

  <p>Plan</p>
  <label><input type="radio" name="plan-gratis" value="gratis"> Gratis</label>
  <label><input type="radio" name="plan-pro" value="pro"> Pro</label>

  <button>Crear cuenta</button>
</form>`,
			"styles.css": BASE_CSS,
			"app.js": "",
		},
		editable: ["index.html"],
		tests: [
			{ name: "La contraseña exige 8 caracteres y es obligatoria", type: "dom", code: "const p = $('#pass'); if (!p) return 'Falta #pass.'; return p.type === 'password' && p.minLength === 8 && p.required;", message: "Usa minlength=\"8\" y required en la contraseña." },
			{ name: "La ayuda está asociada con aria-describedby", type: "dom", code: "const p = $('#pass'); const id = p && p.getAttribute('aria-describedby'); const ayuda = id && document.getElementById(id); return !!ayuda && ayuda.id === 'ayuda-pass' && /8/.test(ayuda.textContent);" },
			{ name: "Radios en un fieldset con legend", type: "dom", code: "const f = $('fieldset'); return !!f && /plan/i.test((f.querySelector('legend') || {}).textContent || '') && f.querySelectorAll('input[type=radio]').length === 2;" },
			{ name: "Los radios son un único grupo obligatorio", type: "dom", code: "const r = $$('input[type=radio]'); if (r.length !== 2) return false; const mismo = r.every(x => x.name === 'plan'); return mismo && r.some(x => x.required) && !$('form').checkValidity();", message: "Mismo name=\"plan\" en ambos y required en al menos uno." },
		],
		hints: [
			"Los radios solo son excluyentes entre sí si comparten el mismo name.",
			"aria-describedby recibe el id del elemento que describe al campo.",
		],
		solution: {
			"index.html": `<form>
  <label for="pass">Contraseña</label>
  <input id="pass" type="password" minlength="8" required aria-describedby="ayuda-pass">
  <p id="ayuda-pass">Mínimo 8 caracteres.</p>

  <fieldset>
    <legend>Plan</legend>
    <label><input type="radio" name="plan" value="gratis" required> Gratis</label>
    <label><input type="radio" name="plan" value="pro"> Pro</label>
  </fieldset>

  <button>Crear cuenta</button>
</form>`,
		},
	},
	{
		id: "html-dialog-01",
		title: "Ventana modal con <dialog>",
		category: "html",
		difficulty: "senior",
		concepts: ["dialog", "accesibilidad"],
		instructions:
			"El JavaScript (solo lectura) abre el elemento con id «modal» llamando a showModal() al pulsar «Abrir». Escribe el HTML de la modal con un <dialog id=\"modal\"> etiquetado por su título (aria-labelledby apuntando a un <h2 id=\"modal-titulo\">) y un botón «Cerrar» dentro de un <form method=\"dialog\">, que cierra la modal sin JavaScript.",
		files: {
			"index.html": `<button id="abrir">Abrir</button>

<!-- Escribe aquí la modal -->
`,
			"styles.css": BASE_CSS,
			"app.js": `document.getElementById("abrir").addEventListener("click", () => {
  document.getElementById("modal").showModal();
});`,
		},
		editable: ["index.html"],
		tests: [
			{ name: "Existe un <dialog id=\"modal\">", type: "dom", code: "const d = $('#modal'); return !!d && d.tagName === 'DIALOG';" },
			{ name: "La modal se nombra con su título", type: "dom", code: "const d = $('#modal'); const t = d && document.getElementById(d.getAttribute('aria-labelledby')); return !!t && t.id === 'modal-titulo' && t.tagName === 'H2';" },
			{ name: "«Abrir» muestra la modal", type: "dom", code: "click('#abrir'); await wait(20); return $('#modal').open === true;" },
			{ name: "«Cerrar» la cierra sin JavaScript", type: "dom", code: "const d = $('#modal'); if (!d.open) d.showModal(); const b = d.querySelector('form[method=dialog] button'); if (!b) return 'Falta el botón dentro de <form method=\"dialog\">.'; b.click(); await wait(20); return d.open === false;" },
		],
		hints: [
			"Un <form method=\"dialog\"> dentro de un <dialog> lo cierra al enviarse.",
			"aria-labelledby recibe el id del título de la modal.",
		],
		solution: {
			"index.html": `<button id="abrir">Abrir</button>

<dialog id="modal" aria-labelledby="modal-titulo">
  <h2 id="modal-titulo">Suscríbete</h2>
  <p>Recibe un reto nuevo cada semana.</p>
  <form method="dialog">
    <button>Cerrar</button>
  </form>
</dialog>
`,
		},
	},
	{
		id: "html-skip-link-01",
		title: "Enlace para saltar al contenido",
		category: "html",
		difficulty: "senior",
		concepts: ["accesibilidad", "landmarks", "teclado"],
		instructions:
			"Quien navega con teclado tiene que atravesar todo el menú en cada página. Añade como primer elemento enfocable un enlace «Saltar al contenido» (clase «saltar») que lleve al <main> (id «contenido»). Además, da a la <nav> un nombre accesible con aria-label=\"Principal\".",
		files: {
			"index.html": `<header>
  <nav>
    <a href="#">Inicio</a>
    <a href="#">Cursos</a>
    <a href="#">Retos</a>
    <a href="#">Ranking</a>
  </nav>
</header>
<main>
  <h1>Bienvenido</h1>
</main>`,
			"styles.css": BASE_CSS + `
.saltar { position: absolute; left: -9999px; }
.saltar:focus { left: 1rem; top: 1rem; }`,
			"app.js": "",
		},
		editable: ["index.html"],
		tests: [
			{ name: "El primer enlace enfocable es «Saltar al contenido»", type: "dom", code: "const f = $$('a[href], button, input, select, textarea')[0]; return !!f && f.classList.contains('saltar') && /saltar al contenido/i.test(f.textContent);" },
			{ name: "Apunta al <main id=\"contenido\">", type: "dom", code: "const a = $('.saltar'); const m = $('main'); return !!a && !!m && m.id === 'contenido' && a.getAttribute('href') === '#contenido';" },
			{ name: "La navegación tiene nombre accesible", type: "dom", code: "return $('nav') && $('nav').getAttribute('aria-label') === 'Principal';" },
		],
		hints: [
			"El enlace debe ir antes que el <header> en el HTML para ser el primero al pulsar Tab.",
			"href=\"#contenido\" salta al elemento con id=\"contenido\".",
		],
		solution: {
			"index.html": `<a class="saltar" href="#contenido">Saltar al contenido</a>
<header>
  <nav aria-label="Principal">
    <a href="#">Inicio</a>
    <a href="#">Cursos</a>
    <a href="#">Retos</a>
    <a href="#">Ranking</a>
  </nav>
</header>
<main id="contenido">
  <h1>Bienvenido</h1>
</main>`,
		},
	},
];
