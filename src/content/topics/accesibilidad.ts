import type { ChallengeSpec } from "@/features/challenges/engine/types";

/** Mensaje de un test de auditoría: lista las reglas que fallan. */
const audit = (rules: string[]) =>
	`const v = await audit(${JSON.stringify(rules)}); return v.length === 0 || ('La auditoría falla: ' + v.map((x) => x.help + ' (' + x.nodes + ')').join('; '));`;

const base = { category: "accesibilidad" as const, run: { axe: true }, editable: ["index.html" as const] };

export const a11yChallenges: ChallengeSpec[] = [
	{
		...base,
		id: "a11y-formulario-etiquetas-01",
		title: "Formulario de contacto sin etiquetas",
		difficulty: "junior",
		concepts: ["a11y-formularios"],
		instructions:
			"La auditoría marca los campos sin nombre accesible. Asocia una <label> visible a cada campo (for + id), incluido el <select>. Mantén los tres campos y el botón.",
		files: {
			"index.html": `<main>
  <h1>Contacto</h1>
  <form>
    <input id="nombre" type="text" placeholder="Nombre">
    <input id="email" type="email" placeholder="Email">
    <select id="motivo">
      <option>Soporte</option>
      <option>Ventas</option>
    </select>
    <button type="submit">Enviar</button>
  </form>
</main>`,
			"styles.css": "body { font-family: system-ui, sans-serif; padding: 16px; }\nlabel { display: block; margin-top: 8px; }",
			"app.js": "",
		},
		tests: [
			{ name: "Todos los campos tienen nombre accesible", type: "dom", code: audit(["label", "select-name"]) },
			{ name: "Las etiquetas son visibles (no solo aria-label)", type: "dom", code: "return ['nombre', 'email', 'motivo'].every((id) => { const l = $('label[for=' + id + ']'); return l && l.textContent.trim().length > 1 && rect(l).height > 0; }) || 'Cada campo necesita <label for> visible.';" },
			{ name: "El formulario conserva sus campos", type: "dom", code: "return $$('form input').length === 2 && !!$('form select') && !!$('form button');" },
		],
		hints: ["<label for=\"email\">Email</label> se asocia al input con id=\"email\".", "El <select> también necesita su etiqueta."],
		solution: {
			"index.html": `<main>
  <h1>Contacto</h1>
  <form>
    <label for="nombre">Nombre</label>
    <input id="nombre" type="text" placeholder="Nombre">
    <label for="email">Email</label>
    <input id="email" type="email" placeholder="Email">
    <label for="motivo">Motivo</label>
    <select id="motivo">
      <option>Soporte</option>
      <option>Ventas</option>
    </select>
    <button type="submit">Enviar</button>
  </form>
</main>`,
		},
	},
	{
		...base,
		id: "a11y-imagenes-alt-01",
		title: "Galería con imágenes sin texto alternativo",
		difficulty: "junior",
		concepts: ["a11y-imagenes"],
		instructions:
			"Añade alt a todas las imágenes. El logo y las fotos informativas necesitan una descripción; el separador decorativo debe llevar alt vacío (alt=\"\") para que el lector lo ignore.",
		files: {
			"index.html": `<header><img id="logo" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width="40" height="40"> Viajes Norte</header>
<main>
  <h1>Destinos</h1>
  <figure><img class="foto" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width="200" height="120"><figcaption>Bilbao</figcaption></figure>
  <img id="separador" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width="300" height="4">
  <figure><img class="foto" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width="200" height="120"><figcaption>San Sebastián</figcaption></figure>
</main>`,
			"styles.css": "body { font-family: system-ui, sans-serif; }",
			"app.js": "",
		},
		tests: [
			{ name: "Ninguna imagen sin alt", type: "dom", code: audit(["image-alt"]) },
			{ name: "El logo y las fotos se describen", type: "dom", code: "return [$('#logo'), ...$$('.foto')].every((i) => (i.getAttribute('alt') || '').trim().length >= 3) || 'Describe el logo y cada foto.';" },
			{ name: "El separador es decorativo", type: "dom", code: "return $('#separador').getAttribute('alt') === '' || 'El separador debe tener alt=\"\".';" },
		],
		hints: ["alt describe lo que aporta la imagen, no «imagen de…».", "Una imagen decorativa lleva alt=\"\" (vacío), no se quita el atributo."],
		solution: {
			"index.html": `<header><img id="logo" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width="40" height="40" alt="Viajes Norte, inicio"> Viajes Norte</header>
<main>
  <h1>Destinos</h1>
  <figure><img class="foto" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width="200" height="120" alt="Ría de Bilbao con el Guggenheim al fondo"><figcaption>Bilbao</figcaption></figure>
  <img id="separador" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width="300" height="4" alt="">
  <figure><img class="foto" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width="200" height="120" alt="Playa de La Concha al atardecer"><figcaption>San Sebastián</figcaption></figure>
</main>`,
		},
	},
	{
		...base,
		id: "a11y-botones-icono-01",
		title: "Botones de icono sin nombre",
		difficulty: "junior",
		concepts: ["a11y-semantica"],
		instructions:
			"Los botones del reproductor solo tienen un icono SVG y el lector anuncia «botón». Dales un nombre accesible (aria-label o texto oculto) y marca los SVG como decorativos (aria-hidden=\"true\").",
		files: {
			"index.html": `<main>
  <h1>Podcast</h1>
  <div class="controles">
    <button id="anterior"><svg viewBox="0 0 24 24" width="24" height="24"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg></button>
    <button id="play"><svg viewBox="0 0 24 24" width="24" height="24"><path d="M8 5v14l11-7z"/></svg></button>
    <button id="siguiente"><svg viewBox="0 0 24 24" width="24" height="24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>
  </div>
</main>`,
			"styles.css": "body { font-family: system-ui, sans-serif; }\nbutton { width: 44px; height: 44px; }",
			"app.js": "",
		},
		tests: [
			{ name: "Todos los botones tienen nombre", type: "dom", code: audit(["button-name"]) },
			{ name: "Los nombres describen la acción", type: "dom", code: "const n = (b) => (b.getAttribute('aria-label') || b.textContent || '').trim().toLowerCase(); return /anterior/.test(n($('#anterior'))) && /(reproducir|play)/.test(n($('#play'))) && /siguiente/.test(n($('#siguiente'))) || 'Usa nombres como «Anterior», «Reproducir», «Siguiente».';" },
			{ name: "Los iconos son decorativos", type: "dom", code: "return $$('button svg').every((s) => s.getAttribute('aria-hidden') === 'true');" },
		],
		hints: ["<button aria-label=\"Reproducir\">…</button>", "Añade aria-hidden=\"true\" a cada <svg>."],
		solution: {
			"index.html": `<main>
  <h1>Podcast</h1>
  <div class="controles">
    <button id="anterior" aria-label="Anterior"><svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg></button>
    <button id="play" aria-label="Reproducir"><svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24"><path d="M8 5v14l11-7z"/></svg></button>
    <button id="siguiente" aria-label="Siguiente"><svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>
  </div>
</main>`,
		},
	},
	{
		...base,
		id: "a11y-contraste-01",
		title: "Texto gris que no se lee",
		difficulty: "semi_senior",
		concepts: ["a11y-contraste"],
		editable: ["styles.css"],
		instructions:
			"La auditoría de contraste falla en la tarjeta de precios: el texto secundario y el botón no llegan a 4,5:1. Cambia solo los colores en styles.css hasta que pase, sin tocar los tamaños.",
		files: {
			"index.html": `<main>
  <h1>Plan Pro</h1>
  <article class="tarjeta">
    <p class="precio">9 € / mes</p>
    <p class="nota">Cancela cuando quieras. IVA incluido.</p>
    <a class="boton" href="#">Suscribirme</a>
  </article>
</main>`,
			"styles.css": `body { font-family: system-ui, sans-serif; background: #ffffff; color: #1f2328; }
.tarjeta { padding: 16px; border: 1px solid #d0d7de; border-radius: 12px; max-width: 320px; }
.precio { font-size: 1.5rem; font-weight: 700; }
.nota { color: #a0a7b0; font-size: 0.9rem; }
.boton { display: inline-block; padding: 10px 16px; border-radius: 8px; background: #7aa2ff; color: #ffffff; text-decoration: none; }`,
			"app.js": "",
		},
		tests: [
			{ name: "Contraste AA en toda la página", type: "dom", code: audit(["color-contrast"]) },
			{ name: "Los tamaños no cambian", type: "dom", code: "return style('.nota', 'font-size') === '14.4px' && style('.precio', 'font-size') === '24px';" },
		],
		hints: ["El gris #a0a7b0 sobre blanco da ~2,5:1; prueba algo como #57606a.", "El botón: oscurece el fondo azul (p. ej. #2f5bd3) manteniendo el texto blanco."],
		solution: {
			"styles.css": `body { font-family: system-ui, sans-serif; background: #ffffff; color: #1f2328; }
.tarjeta { padding: 16px; border: 1px solid #d0d7de; border-radius: 12px; max-width: 320px; }
.precio { font-size: 1.5rem; font-weight: 700; }
.nota { color: #57606a; font-size: 0.9rem; }
.boton { display: inline-block; padding: 10px 16px; border-radius: 8px; background: #2f5bd3; color: #ffffff; text-decoration: none; }`,
		},
	},
	{
		...base,
		id: "a11y-enlaces-nombre-01",
		title: "Enlaces que no dicen adónde van",
		difficulty: "junior",
		concepts: ["a11y-semantica"],
		instructions:
			"Hay un enlace que solo contiene una imagen sin alt y un enlace-icono vacío. Haz que todos los enlaces tengan un nombre que indique su destino, y cambia el «aquí» por un texto descriptivo.",
		files: {
			"index.html": `<main>
  <h1>Ayuda</h1>
  <p>Para descargar la factura pulsa <a id="aqui" href="/facturas">aquí</a>.</p>
  <a id="perfil" href="/perfil"><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width="32" height="32"></a>
  <a id="twitter" href="https://x.com/webwiz" class="icono"><span class="ico"></span></a>
</main>`,
			"styles.css": "body { font-family: system-ui, sans-serif; }\n.ico { display: inline-block; width: 24px; height: 24px; background: #1f2328; border-radius: 50%; }",
			"app.js": "",
		},
		tests: [
			{ name: "Todos los enlaces tienen nombre", type: "dom", code: audit(["link-name"]) },
			{ name: "El enlace de facturas es descriptivo", type: "dom", code: "const t = $('#aqui').textContent.trim().toLowerCase(); return (t !== 'aquí' && /factura/.test(t)) || 'Cambia «aquí» por, por ejemplo, «descargar la factura».';" },
			{ name: "Los destinos no cambian", type: "dom", code: "return $('#aqui').getAttribute('href') === '/facturas' && $('#perfil').getAttribute('href') === '/perfil' && $('#twitter').getAttribute('href').includes('x.com');" },
		],
		hints: ["Una imagen dentro de un enlace necesita alt con el destino: alt=\"Mi perfil\".", "Para el icono vacío, aria-label en el <a>."],
		solution: {
			"index.html": `<main>
  <h1>Ayuda</h1>
  <p>Puedes <a id="aqui" href="/facturas">descargar la factura</a> desde tu cuenta.</p>
  <a id="perfil" href="/perfil"><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width="32" height="32" alt="Mi perfil"></a>
  <a id="twitter" href="https://x.com/webwiz" class="icono" aria-label="WebWiz en X"><span class="ico" aria-hidden="true"></span></a>
</main>`,
		},
	},
	{
		...base,
		id: "a11y-estructura-01",
		title: "Página sin estructura: encabezados y regiones",
		difficulty: "semi_senior",
		concepts: ["a11y-semantica"],
		instructions:
			"La página salta de <h1> a <h4> y no tiene región principal, así que el contenido queda fuera de cualquier landmark. Añade <main> (y <header>/<footer> si quieres) y corrige el orden de los encabezados sin cambiar los textos.",
		files: {
			"index.html": `<div class="cabecera"><h1>Recetas</h1></div>
<div class="contenido">
  <h4>Tortilla de patatas</h4>
  <p>Huevos, patatas y paciencia.</p>
  <h4>Marmitako</h4>
  <p>Bonito, patata y pimiento choricero.</p>
</div>
<div class="pie">© Recetas del norte</div>`,
			"styles.css": "body { font-family: system-ui, sans-serif; }\nh4 { font-size: 1.25rem; }",
			"app.js": "",
		},
		tests: [
			{ name: "Hay una región principal y todo está en regiones", type: "dom", code: audit(["landmark-one-main", "region"]) },
			{ name: "Los encabezados no se saltan niveles", type: "dom", code: audit(["heading-order"]) },
			{ name: "Se conservan las dos recetas", type: "dom", code: "return /Tortilla/.test(document.body.textContent) && /Marmitako/.test(document.body.textContent) && $$('h1').length === 1;" },
		],
		hints: ["Tras un h1 vienen h2: cambia los h4 por h2 (el tamaño se ajusta con CSS).", "Envuelve las recetas en <main>, la cabecera en <header> y el pie en <footer>."],
		solution: {
			"index.html": `<header class="cabecera"><h1>Recetas</h1></header>
<main class="contenido">
  <h2>Tortilla de patatas</h2>
  <p>Huevos, patatas y paciencia.</p>
  <h2>Marmitako</h2>
  <p>Bonito, patata y pimiento choricero.</p>
</main>
<footer class="pie">© Recetas del norte</footer>`,
		},
	},
	{
		...base,
		id: "a11y-foco-01",
		title: "El orden del tabulador está roto",
		difficulty: "semi_senior",
		concepts: ["a11y-semantica"],
		instructions:
			"Alguien puso tabindex positivos para «ordenar» el foco y un aria-hidden en un bloque que contiene un enlace enfocable. Elimina los tabindex positivos y evita que haya elementos ocultos al lector que reciban el foco.",
		files: {
			"index.html": `<main>
  <h1>Pedido</h1>
  <label for="cp">Código postal</label>
  <input id="cp" tabindex="3">
  <label for="ciudad">Ciudad</label>
  <input id="ciudad" tabindex="1">
  <button tabindex="2">Calcular envío</button>
  <div class="promo" aria-hidden="true">
    <p>¡Envío gratis desde 50 €!</p>
    <a href="/condiciones">Condiciones</a>
  </div>
</main>`,
			"styles.css": "body { font-family: system-ui, sans-serif; }",
			"app.js": "",
		},
		tests: [
			{ name: "Sin tabindex positivos", type: "dom", code: audit(["tabindex"]) },
			{ name: "Nada oculto al lector recibe el foco", type: "dom", code: audit(["aria-hidden-focus"]) },
			{ name: "Los campos y el enlace siguen ahí", type: "dom", code: "return !!$('#cp') && !!$('#ciudad') && !!$('a[href=\"/condiciones\"]');" },
		],
		hints: ["El orden del foco debe seguir el del DOM: quita los tabindex (o pon 0).", "Si la promo es útil, no la ocultes con aria-hidden; si es decorativa, saca el enlace."],
		solution: {
			"index.html": `<main>
  <h1>Pedido</h1>
  <label for="cp">Código postal</label>
  <input id="cp">
  <label for="ciudad">Ciudad</label>
  <input id="ciudad">
  <button>Calcular envío</button>
  <div class="promo">
    <p>¡Envío gratis desde 50 €!</p>
    <a href="/condiciones">Condiciones</a>
  </div>
</main>`,
		},
	},
	{
		...base,
		id: "a11y-aria-valida-01",
		title: "Pestañas con ARIA mal escrito",
		difficulty: "senior",
		concepts: ["a11y-semantica"],
		instructions:
			"El componente de pestañas usa role=\"tab\" sin un contenedor role=\"tablist\" y valores ARIA inválidos (aria-selected=\"si\"). Corrige el marcado ARIA para que la auditoría pase.",
		files: {
			"index.html": `<main>
  <h1>Ajustes</h1>
  <div class="pestanas">
    <button role="tab" id="t1" aria-selected="si" aria-controls="p1">Perfil</button>
    <button role="tab" id="t2" aria-selected="no" aria-controls="p2">Seguridad</button>
  </div>
  <section id="p1" role="tabpanel" aria-labelledby="t1">Datos del perfil</section>
  <section id="p2" role="tabpanel" aria-labelledby="t2" hidden>Contraseña y 2FA</section>
</main>`,
			"styles.css": "body { font-family: system-ui, sans-serif; }",
			"app.js": "",
		},
		tests: [
			{ name: "Valores ARIA válidos", type: "dom", code: audit(["aria-valid-attr-value"]) },
			{ name: "Las pestañas están dentro de un tablist", type: "dom", code: audit(["aria-required-parent", "aria-required-children"]) },
			{ name: "La primera pestaña sigue seleccionada", type: "dom", code: "return $('#t1').getAttribute('aria-selected') === 'true' && $('#t2').getAttribute('aria-selected') === 'false';" },
		],
		hints: ["aria-selected solo admite \"true\" o \"false\".", "El contenedor de las pestañas necesita role=\"tablist\" (y un aria-label)."],
		solution: {
			"index.html": `<main>
  <h1>Ajustes</h1>
  <div class="pestanas" role="tablist" aria-label="Ajustes">
    <button role="tab" id="t1" aria-selected="true" aria-controls="p1">Perfil</button>
    <button role="tab" id="t2" aria-selected="false" aria-controls="p2">Seguridad</button>
  </div>
  <section id="p1" role="tabpanel" aria-labelledby="t1">Datos del perfil</section>
  <section id="p2" role="tabpanel" aria-labelledby="t2" hidden>Contraseña y 2FA</section>
</main>`,
		},
	},
	{
		...base,
		id: "a11y-listas-01",
		title: "Listas que no son listas",
		difficulty: "junior",
		concepts: ["a11y-semantica"],
		instructions:
			"El menú tiene <div> directamente dentro de <ul> y unos <li> sueltos fuera de cualquier lista. Corrige la estructura para que el lector anuncie «lista, 3 elementos».",
		files: {
			"index.html": `<main>
  <h1>Menú del día</h1>
  <ul class="platos">
    <div>Ensalada</div>
    <div>Lentejas</div>
    <div>Flan</div>
  </ul>
  <h2>Alérgenos</h2>
  <li>Gluten</li>
  <li>Huevo</li>
</main>`,
			"styles.css": "body { font-family: system-ui, sans-serif; }",
			"app.js": "",
		},
		tests: [
			{ name: "Las listas solo contienen <li>", type: "dom", code: audit(["list"]) },
			{ name: "Ningún <li> fuera de una lista", type: "dom", code: audit(["listitem"]) },
			{ name: "Los platos y alérgenos siguen", type: "dom", code: "return $$('.platos > li').length === 3 && $$('li').length === 5;" },
		],
		hints: ["Cambia los <div> del menú por <li>.", "Envuelve los alérgenos en un <ul>."],
		solution: {
			"index.html": `<main>
  <h1>Menú del día</h1>
  <ul class="platos">
    <li>Ensalada</li>
    <li>Lentejas</li>
    <li>Flan</li>
  </ul>
  <h2>Alérgenos</h2>
  <ul>
    <li>Gluten</li>
    <li>Huevo</li>
  </ul>
</main>`,
		},
	},
	{
		...base,
		id: "a11y-formulario-avanzado-01",
		title: "Auditoría completa del formulario de registro",
		difficulty: "senior",
		concepts: ["a11y-formularios"],
		instructions:
			"Haz que el formulario de registro pase la auditoría WCAG A/AA completa: hay un enlace dentro de un botón, ids duplicados referenciados por ARIA y un autocomplete inválido. Mantén los campos y el botón de enviar.",
		files: {
			"index.html": `<main>
  <h1>Crea tu cuenta</h1>
  <form>
    <label for="correo">Email</label>
    <input id="correo" type="email" autocomplete="correo-electronico" aria-describedby="ayuda">
    <p id="ayuda">Te enviaremos un enlace de confirmación.</p>
    <label for="clave">Contraseña</label>
    <input id="clave" type="password" autocomplete="new-password" aria-describedby="ayuda">
    <p id="ayuda">Mínimo 12 caracteres.</p>
    <button type="submit">Crear cuenta <a href="/terminos">y aceptar términos</a></button>
  </form>
</main>`,
			"styles.css": "body { font-family: system-ui, sans-serif; color: #1f2328; }\nlabel, input { display: block; }",
			"app.js": "",
		},
		tests: [
			{ name: "Auditoría WCAG A/AA sin errores", type: "dom", code: "const v = await audit(); return v.length === 0 || ('La auditoría falla: ' + v.map((x) => x.help + ' (' + x.nodes + ')').join('; '));" },
			{ name: "Los campos conservan su ayuda", type: "dom", code: "const a = $('#correo').getAttribute('aria-describedby'), b = $('#clave').getAttribute('aria-describedby'); return !!a && !!b && a !== b && !!document.getElementById(a) && !!document.getElementById(b);" },
			{ name: "El enlace de términos sigue en la página", type: "dom", code: "return !!$('a[href=\"/terminos\"]') && !$('button a') && !!$('button[type=submit]');" },
		],
		hints: ["Cada ayuda necesita su propio id (ayuda-email, ayuda-clave).", "autocomplete=\"email\" es el valor válido; saca el enlace del botón."],
		solution: {
			"index.html": `<main>
  <h1>Crea tu cuenta</h1>
  <form>
    <label for="correo">Email</label>
    <input id="correo" type="email" autocomplete="email" aria-describedby="ayuda-email">
    <p id="ayuda-email">Te enviaremos un enlace de confirmación.</p>
    <label for="clave">Contraseña</label>
    <input id="clave" type="password" autocomplete="new-password" aria-describedby="ayuda-clave">
    <p id="ayuda-clave">Mínimo 12 caracteres.</p>
    <p>Al crear la cuenta aceptas los <a href="/terminos">términos</a>.</p>
    <button type="submit">Crear cuenta</button>
  </form>
</main>`,
		},
	},
];
