import type { IncidentSpec } from "@/features/incidents/types";

export const a11yIncidents: IncidentSpec[] = [
	{
		id: "inc-233",
		number: 233,
		type: "incident",
		title: "El menú de usuario no se puede abrir con teclado ni lector de pantalla",
		area: "accesibilidad",
		difficulty: "semi_senior",
		concepts: ["semántica", "aria-expanded", "foco"],
		durationMin: 8,
		ticket: {
			reporter: "Usuario de lector de pantalla",
			priority: "alta",
			device: "escritorio + NVDA",
			steps: ["Navegar con Tab hasta «Mi cuenta»", "Pulsar Enter"],
			expected: "El menú se anuncia como botón, se abre y se anuncia «expandido»",
			actual: "El foco se salta «Mi cuenta» y el lector no lo anuncia",
		},
		viewport: 768,
		files: {
			"index.html": `<header class="barra">
  <span>Panel</span>
  <div class="cuenta" id="cuenta-btn">Mi cuenta ▾</div>
  <ul id="cuenta-menu" class="cuenta-menu" hidden>
    <li><a href="#">Perfil</a></li>
    <li><a href="#">Facturación</a></li>
    <li><a href="#">Cerrar sesión</a></li>
  </ul>
</header>`,
			"styles.css": `body { margin: 0; font-family: system-ui, sans-serif; }
.barra { position: relative; display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; background: #161b22; color: white; }
.cuenta { padding: 8px 12px; border-radius: 8px; background: #30363d; color: white; cursor: pointer; font: inherit; border: 0; }
.cuenta-menu { position: absolute; right: 24px; top: 56px; margin: 0; padding: 8px; list-style: none; background: white; border: 1px solid #d0d7de; border-radius: 8px; }
.cuenta-menu a { display: block; padding: 6px 12px; color: #1f2328; }`,
			"app.js": `const boton = document.getElementById("cuenta-btn");
const menu = document.getElementById("cuenta-menu");

boton.addEventListener("click", () => {
  menu.hidden = !menu.hidden;
});`,
		},
		editable: ["index.html", "app.js", "styles.css"],
		networkLog: [],
		tests: [
			{ name: "«Mi cuenta» es un botón que recibe el foco", type: "dom", code: "const b = $('#cuenta-btn'); if (!b) return 'Falta #cuenta-btn.'; b.focus(); const esBoton = b.tagName === 'BUTTON' || (b.getAttribute('role') === 'button' && b.tabIndex >= 0); return (esBoton && document.activeElement === b) || 'No es un botón enfocable.';" },
			{ name: "Anuncia si está expandido", type: "dom", code: "const b = $('#cuenta-btn'); if (b.getAttribute('aria-expanded') !== 'false') return 'Cerrado debería tener aria-expanded=\"false\".'; click('#cuenta-btn'); await wait(20); const ok = b.getAttribute('aria-expanded') === 'true'; click('#cuenta-btn'); await wait(20); return (ok && b.getAttribute('aria-expanded') === 'false') || 'aria-expanded no refleja el estado.';" },
			{ name: "Indica qué menú controla", type: "dom", code: "return $('#cuenta-btn').getAttribute('aria-controls') === 'cuenta-menu';" },
		],
		regressionTests: [
			{ name: "El clic abre y cierra el menú", type: "dom", code: "click('#cuenta-btn'); await wait(20); const abierto = !$('#cuenta-menu').hidden; click('#cuenta-btn'); await wait(20); return abierto && $('#cuenta-menu').hidden;" },
			{ name: "El menú empieza cerrado", type: "dom", code: "return $('#cuenta-menu').hidden === true;" },
			{ name: "Mantiene sus tres opciones", type: "dom", code: "return $$('#cuenta-menu a').length === 3;" },
			{ name: "El botón sigue mostrando «Mi cuenta»", type: "dom", code: "return /Mi cuenta/.test(text('#cuenta-btn')) && rect('#cuenta-btn').width > 0;" },
		],
		hints: [
			"Un <div> con click no es enfocable ni tiene rol. ¿Qué elemento nativo ya trae foco, Enter/Espacio y rol de botón?",
			"Añade aria-expanded (y actualízalo en el click) y aria-controls=\"cuenta-menu\".",
		],
		solution: {
			"index.html": `<header class="barra">
  <span>Panel</span>
  <button type="button" class="cuenta" id="cuenta-btn" aria-expanded="false" aria-controls="cuenta-menu">Mi cuenta ▾</button>
  <ul id="cuenta-menu" class="cuenta-menu" hidden>
    <li><a href="#">Perfil</a></li>
    <li><a href="#">Facturación</a></li>
    <li><a href="#">Cerrar sesión</a></li>
  </ul>
</header>`,
			"app.js": `const boton = document.getElementById("cuenta-btn");
const menu = document.getElementById("cuenta-menu");

boton.addEventListener("click", () => {
  menu.hidden = !menu.hidden;
  boton.setAttribute("aria-expanded", String(!menu.hidden));
});`,
		},
		rootCause:
			"El disparador es un <div>: no entra en el orden de tabulación, no responde a Enter/Espacio y el lector no lo anuncia como botón. Usar <button type=\"button\"> resuelve foco, teclado y rol de golpe; aria-expanded (sincronizado en el click) y aria-controls comunican el estado del menú.",
		suspects: [],
	},
	{
		id: "inc-356",
		number: 356,
		type: "incident",
		title: "Los errores del formulario de registro no se anuncian",
		area: "accesibilidad",
		difficulty: "semi_senior",
		concepts: ["aria-invalid", "aria-describedby", "regiones vivas"],
		durationMin: 8,
		ticket: {
			reporter: "Auditoría de accesibilidad",
			priority: "media",
			device: "móvil + VoiceOver",
			steps: ["Escribir «ana@» en Email", "Pulsar «Crear cuenta»"],
			expected: "El lector anuncia el error y lo asocia al campo",
			actual: "Solo cambia el color del borde; el lector no dice nada",
		},
		viewport: 390,
		files: {
			"index.html": `<main>
  <h1>Crear cuenta</h1>
  <form id="registro" novalidate>
    <label for="email">Email</label>
    <input id="email" type="email">
    <p id="email-error" class="error" hidden></p>
    <button>Crear cuenta</button>
  </form>
  <p id="ok" hidden>¡Gracias! Revisa tu correo.</p>
</main>`,
			"styles.css": `body { margin: 0; padding: 16px; font-family: system-ui, sans-serif; }
#email { display: block; width: 100%; min-height: 44px; margin-top: 6px; box-sizing: border-box; }
.invalido { border: 2px solid #cf222e; }
.error { color: #cf222e; margin: 6px 0 0; }
button { min-height: 44px; margin-top: 12px; }`,
			"app.js": `const form = document.getElementById("registro");
const email = document.getElementById("email");
const error = document.getElementById("email-error");
const ok = document.getElementById("ok");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const valido = /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email.value);
  email.classList.toggle("invalido", !valido);
  error.hidden = valido;
  error.textContent = valido ? "" : "Introduce un email válido";
  ok.hidden = !valido;
});`,
		},
		editable: ["index.html", "app.js"],
		networkLog: [],
		tests: [
			{ name: "El campo se marca como inválido", type: "dom", code: "type('#email', 'ana@'); $('#registro').requestSubmit(); await wait(20); return $('#email').getAttribute('aria-invalid') === 'true' || 'Falta aria-invalid=\"true\" en el campo.';" },
			{ name: "El error está asociado al campo", type: "dom", code: "return ($('#email').getAttribute('aria-describedby') || '').split(/\\s+/).includes('email-error') || 'El campo no apunta a #email-error con aria-describedby.';" },
			{ name: "El error se anuncia al aparecer", type: "dom", code: "const e = $('#email-error'); const vivo = e.getAttribute('role') === 'alert' || ['assertive', 'polite'].includes(e.getAttribute('aria-live')); return vivo || 'El mensaje no está en una región viva (role=\"alert\").';" },
			{ name: "Al corregirlo deja de ser inválido", type: "dom", code: "type('#email', 'ana@ejemplo.com'); $('#registro').requestSubmit(); await wait(20); return $('#email').getAttribute('aria-invalid') !== 'true';" },
		],
		regressionTests: [
			{ name: "Muestra el texto del error", type: "dom", code: "type('#email', 'ana@'); $('#registro').requestSubmit(); await wait(20); return !$('#email-error').hidden && text('#email-error') === 'Introduce un email válido';" },
			{ name: "Con un email válido se crea la cuenta", type: "dom", code: "type('#email', 'ana@ejemplo.com'); $('#registro').requestSubmit(); await wait(20); return !$('#ok').hidden && $('#email-error').hidden;" },
			{ name: "Mantiene el borde rojo como pista visual", type: "dom", code: "type('#email', 'x'); $('#registro').requestSubmit(); await wait(20); return $('#email').classList.contains('invalido');" },
		],
		hints: [
			"El color no llega al lector de pantalla. ¿Qué atributo marca un campo como inválido?",
			"aria-describedby=\"email-error\" en el input y role=\"alert\" en el mensaje; actualiza aria-invalid al validar.",
		],
		solution: {
			"index.html": `<main>
  <h1>Crear cuenta</h1>
  <form id="registro" novalidate>
    <label for="email">Email</label>
    <input id="email" type="email" aria-describedby="email-error">
    <p id="email-error" class="error" role="alert" hidden></p>
    <button>Crear cuenta</button>
  </form>
  <p id="ok" hidden>¡Gracias! Revisa tu correo.</p>
</main>`,
			"app.js": `const form = document.getElementById("registro");
const email = document.getElementById("email");
const error = document.getElementById("email-error");
const ok = document.getElementById("ok");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const valido = /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email.value);
  email.classList.toggle("invalido", !valido);
  email.setAttribute("aria-invalid", String(!valido));
  error.hidden = valido;
  error.textContent = valido ? "" : "Introduce un email válido";
  ok.hidden = !valido;
});`,
		},
		rootCause:
			"El error solo se comunica con color y con un párrafo que aparece sin anunciarse. Falta marcar el campo con aria-invalid, asociar el mensaje con aria-describedby para que se lea al enfocar el campo y poner el mensaje en una región viva (role=\"alert\") para que se anuncie al aparecer.",
		suspects: [],
	},
];
