import type { ChallengeSpec } from "@/features/challenges/engine/types";

/**
 * Seguridad web: primero se explota el fallo en la vista previa (el enunciado
 * da el ataque) y después se parchea. Los tests lanzan el ataque y comprueban
 * que la funcionalidad sigue intacta.
 */
const base = { category: "seguridad" as const, editable: ["app.js" as const] };
const css = "body { font-family: system-ui, sans-serif; padding: 16px; }\n.alerta { color: #a84b00; }";
const pwned = "window.__pwned !== true || 'El ataque se ejecutó (window.__pwned = true).'";

export const securityChallenges: ChallengeSpec[] = [
	{
		...base,
		id: "seg-xss-comentarios-01",
		title: "Comentarios que ejecutan código",
		difficulty: "junior",
		concepts: ["xss"],
		instructions:
			"1) Explota: publica el comentario <img src=x onerror=\"window.__pwned=true;document.body.style.background='red'\"> en la vista previa. 2) Parchea app.js para que los comentarios se muestren siempre como texto.",
		files: {
			"index.html": `<main>
  <h1>Comentarios</h1>
  <form id="f"><label for="txt">Comentario</label><input id="txt"><button>Publicar</button></form>
  <ul id="lista"></ul>
</main>`,
			"styles.css": css,
			"app.js": `const f = document.getElementById("f");
const lista = document.getElementById("lista");

f.addEventListener("submit", (e) => {
  e.preventDefault();
  const txt = document.getElementById("txt");
  lista.innerHTML += "<li>" + txt.value + "</li>";
  txt.value = "";
});`,
		},
		tests: [
			{ name: "El ataque no se ejecuta", type: "dom", code: `type('#txt', '<img src=x onerror="window.__pwned=true">'); $('#f').requestSubmit(); await wait(150); return ${pwned};` },
			{ name: "El comentario se ve como texto", type: "dom", code: "return !$('#lista img') && $('#lista li:last-child').textContent.includes('<img');" },
			{ name: "Se siguen publicando comentarios normales", type: "dom", code: "type('#txt', 'Hola'); $('#f').requestSubmit(); await wait(20); return $('#lista li:last-child').textContent === 'Hola' && $('#txt').value === '';" },
		],
		hints: ["Crea el <li> con createElement y asigna textContent."],
		solution: {
			"app.js": `const f = document.getElementById("f");
const lista = document.getElementById("lista");

f.addEventListener("submit", (e) => {
  e.preventDefault();
  const txt = document.getElementById("txt");
  const li = document.createElement("li");
  li.textContent = txt.value;
  lista.append(li);
  txt.value = "";
});`,
		},
	},
	{
		...base,
		id: "seg-href-javascript-01",
		title: "Web personal con enlaces javascript:",
		difficulty: "semi_senior",
		concepts: ["xss"],
		instructions:
			"El perfil enlaza a la web que escribe el usuario. 1) Explota: guarda la web javascript:window.__pwned=true y pulsa el enlace. 2) Parchea: solo se aceptan URLs http(s); con otra cosa se muestra «Web no válida» y no se crea el enlace.",
		files: {
			"index.html": `<main>
  <h1>Tu perfil</h1>
  <form id="f"><label for="web">Tu web</label><input id="web"><button>Guardar</button></form>
  <p id="salida"></p>
</main>`,
			"styles.css": css,
			"app.js": `document.getElementById("f").addEventListener("submit", (e) => {
  e.preventDefault();
  const url = document.getElementById("web").value.trim();
  const salida = document.getElementById("salida");
  salida.textContent = "";
  const a = document.createElement("a");
  a.href = url;
  a.textContent = "Visitar mi web";
  salida.append(a);
});`,
		},
		tests: [
			{ name: "javascript: no crea enlace", type: "dom", code: "type('#web', 'javascript:window.__pwned=true'); $('#f').requestSubmit(); await wait(20); const a = $('#salida a'); if (a) a.click(); await wait(20); return (!a && " + pwned + ") === true || 'Se creó un enlace con javascript:';" },
			{ name: "Variantes con mayúsculas y espacios también se bloquean", type: "dom", code: "type('#web', '  JaVaScRiPt:alert(1)'); $('#f').requestSubmit(); await wait(20); return !$('#salida a') && /no válida/i.test(text('#salida'));" },
			{ name: "Una web https se enlaza", type: "dom", code: "type('#web', 'https://orpira.es'); $('#f').requestSubmit(); await wait(20); return $('#salida a')?.href === 'https://orpira.es/';" },
		],
		hints: ["new URL(url).protocol te dice el esquema real (y lanza error si no es una URL).", "Acepta solo \"http:\" y \"https:\"."],
		solution: {
			"app.js": `document.getElementById("f").addEventListener("submit", (e) => {
  e.preventDefault();
  const url = document.getElementById("web").value.trim();
  const salida = document.getElementById("salida");
  salida.textContent = "";
  let segura = null;
  try {
    const u = new URL(url);
    if (u.protocol === "http:" || u.protocol === "https:") segura = u.href;
  } catch {}
  if (!segura) {
    salida.textContent = "Web no válida";
    return;
  }
  const a = document.createElement("a");
  a.href = segura;
  a.textContent = "Visitar mi web";
  salida.append(a);
});`,
		},
	},
	{
		...base,
		id: "seg-atributo-01",
		title: "Inyección en un atributo",
		difficulty: "semi_senior",
		concepts: ["xss"],
		instructions:
			"Las tarjetas se construyen concatenando HTML con el nombre del usuario en un atributo alt. 1) Explota con el nombre: x\" onerror=\"window.__pwned=true. 2) Parchea construyendo los elementos con la API del DOM.",
		files: {
			"index.html": `<main>
  <h1>Equipo</h1>
  <form id="f"><label for="nombre">Nombre</label><input id="nombre"><button>Añadir</button></form>
  <div id="equipo"></div>
</main>`,
			"styles.css": css,
			"app.js": `const AVATAR = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";
document.getElementById("f").addEventListener("submit", (e) => {
  e.preventDefault();
  const nombre = document.getElementById("nombre").value;
  document.getElementById("equipo").insertAdjacentHTML(
    "beforeend",
    '<figure><img src="' + AVATAR + '" alt="' + nombre + '"><figcaption>' + nombre + "</figcaption></figure>"
  );
});`,
		},
		tests: [
			{ name: "El ataque no se ejecuta", type: "dom", code: `type('#nombre', 'x" src="nada" onerror="window.__pwned=true'); $('#f').requestSubmit(); await wait(200); return ${pwned};` },
			{ name: "No se cuelan atributos", type: "dom", code: "return $$('#equipo img').every((i) => !i.hasAttribute('onerror'));" },
			{ name: "Una persona normal se añade con su nombre", type: "dom", code: "type('#nombre', 'Ane'); $('#f').requestSubmit(); await wait(20); const f = $$('#equipo figure').at(-1); return f.querySelector('img').alt === 'Ane' && f.querySelector('figcaption').textContent === 'Ane';" },
		],
		hints: ["createElement('img') y luego img.alt = nombre: el navegador lo escapa por ti."],
		solution: {
			"app.js": `const AVATAR = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";
document.getElementById("f").addEventListener("submit", (e) => {
  e.preventDefault();
  const nombre = document.getElementById("nombre").value;
  const figure = document.createElement("figure");
  const img = document.createElement("img");
  img.src = AVATAR;
  img.alt = nombre;
  const cap = document.createElement("figcaption");
  cap.textContent = nombre;
  figure.append(img, cap);
  document.getElementById("equipo").append(figure);
});`,
		},
	},
	{
		...base,
		id: "seg-eval-json-01",
		title: "eval para leer la respuesta del servidor",
		difficulty: "junior",
		concepts: ["seguridad-eval"],
		instructions:
			"La app lee la configuración del servidor con eval. El servidor (simulado) ha sido comprometido y devuelve código. Parchea app.js para leer JSON de forma segura; si la respuesta no es JSON válido, muestra «Configuración no válida».",
		run: { network: [{ method: "GET", url: "/api/config", status: 200, body: "({ tema: (window.__pwned = true, 'oscuro') })" }] },
		files: {
			"index.html": `<main><h1>Panel</h1><p id="estado">Cargando…</p></main>`,
			"styles.css": css,
			"app.js": `async function cargar() {
  const res = await fetch("/api/config");
  const config = eval("(" + (await res.text()) + ")");
  document.getElementById("estado").textContent = "Tema: " + config.tema;
}
cargar();`,
		},
		tests: [
			{ name: "La respuesta maliciosa no se ejecuta", type: "dom", code: `await wait(150); return ${pwned};` },
			{ name: "Avisa de configuración no válida", type: "dom", code: "return /no válida/i.test(text('#estado')) || ('Estado: ' + text('#estado'));" },
		],
		hints: ["res.json() o JSON.parse(texto) solo aceptan datos, nunca ejecutan código.", "Envuélvelo en try/catch para mostrar el aviso."],
		solution: {
			"app.js": `async function cargar() {
  const estado = document.getElementById("estado");
  try {
    const res = await fetch("/api/config");
    const config = await res.json();
    estado.textContent = "Tema: " + config.tema;
  } catch {
    estado.textContent = "Configuración no válida";
  }
}
cargar();`,
		},
	},
	{
		...base,
		id: "seg-postmessage-01",
		title: "postMessage sin comprobar el origen",
		difficulty: "senior",
		concepts: ["xss"],
		instructions:
			"El widget recibe el nombre del usuario por postMessage desde https://webwiz.app y lo pinta con innerHTML. Cualquier web que lo incruste puede enviarle mensajes. Parchea: ignora mensajes de otros orígenes y pinta el nombre como texto.",
		files: {
			"index.html": `<main><h1>Widget</h1><p>Hola, <span id="nombre">invitado</span></p></main>`,
			"styles.css": css,
			"app.js": `window.addEventListener("message", (e) => {
  if (e.data && e.data.tipo === "usuario") {
    document.getElementById("nombre").innerHTML = e.data.nombre;
  }
});`,
		},
		tests: [
			{ name: "Ignora mensajes de otros orígenes", type: "dom", code: "window.dispatchEvent(new MessageEvent('message', { data: { tipo: 'usuario', nombre: 'Mallory' }, origin: 'https://malo.example' })); await wait(10); return text('#nombre') === 'invitado' || 'Se aceptó un mensaje de https://malo.example';" },
			{ name: "El nombre se pinta como texto", type: "dom", code: `window.dispatchEvent(new MessageEvent('message', { data: { tipo: 'usuario', nombre: '<img src=x onerror="window.__pwned=true">' }, origin: 'https://webwiz.app' })); await wait(150); return (${pwned}) === true && !$('#nombre img');` },
			{ name: "Acepta mensajes del origen de confianza", type: "dom", code: "window.dispatchEvent(new MessageEvent('message', { data: { tipo: 'usuario', nombre: 'Ane' }, origin: 'https://webwiz.app' })); await wait(10); return text('#nombre') === 'Ane';" },
		],
		hints: ["Comprueba e.origin === \"https://webwiz.app\" antes de nada.", "textContent en lugar de innerHTML."],
		solution: {
			"app.js": `const ORIGEN = "https://webwiz.app";
window.addEventListener("message", (e) => {
  if (e.origin !== ORIGEN) return;
  if (e.data && e.data.tipo === "usuario") {
    document.getElementById("nombre").textContent = String(e.data.nombre);
  }
});`,
		},
	},
	{
		...base,
		id: "seg-settimeout-string-01",
		title: "setTimeout con texto: eval disfrazado",
		difficulty: "semi_senior",
		concepts: ["seguridad-eval"],
		instructions:
			"El recordatorio programa el aviso con setTimeout(\"mostrar('\" + texto + \"')\"), que evalúa el texto como código. 1) Explota con el texto: ');window.__pwned=true;(' 2) Parchea pasando una función.",
		files: {
			"index.html": `<main>
  <h1>Recordatorio</h1>
  <form id="f"><label for="txt">Texto</label><input id="txt"><button>Programar</button></form>
  <p id="aviso" role="status"></p>
</main>`,
			"styles.css": css,
			"app.js": `function mostrar(texto) {
  document.getElementById("aviso").textContent = "⏰ " + texto;
}
document.getElementById("f").addEventListener("submit", (e) => {
  e.preventDefault();
  const texto = document.getElementById("txt").value;
  setTimeout("mostrar('" + texto + "')", 50);
});`,
		},
		tests: [
			{ name: "El texto no se ejecuta como código", type: "dom", code: `type('#txt', "');window.__pwned=true;('"); $('#f').requestSubmit(); await wait(150); return ${pwned};` },
			{ name: "Textos con comillas se muestran bien", type: "dom", code: "type('#txt', \"Llamar a O'Neill\"); $('#f').requestSubmit(); await wait(150); return text('#aviso') === \"⏰ Llamar a O'Neill\";" },
		],
		hints: ["setTimeout(() => mostrar(texto), 50)"],
		solution: {
			"app.js": `function mostrar(texto) {
  document.getElementById("aviso").textContent = "⏰ " + texto;
}
document.getElementById("f").addEventListener("submit", (e) => {
  e.preventDefault();
  const texto = document.getElementById("txt").value;
  setTimeout(() => mostrar(texto), 50);
});`,
		},
	},
	{
		...base,
		id: "seg-open-redirect-01",
		title: "Redirección abierta tras el login",
		difficulty: "semi_senior",
		concepts: ["seguridad-credenciales"],
		instructions:
			"Tras iniciar sesión, la app redirige al valor de ?next= sin comprobarlo: un enlace de phishing puede llevar a otra web. Implementa destinoSeguro(next): solo rutas internas que empiezan por una sola «/»; cualquier otra cosa → «/panel».",
		files: {
			"index.html": `<main><h1>Acceso</h1><p>Abre la consola: las pruebas llaman a destinoSeguro().</p></main>`,
			"styles.css": css,
			"app.js": `function destinoSeguro(next) {
  return next || "/panel";
}`,
		},
		tests: [
			{ name: "Rutas internas permitidas", type: "js", code: "return destinoSeguro('/facturas?mes=10') === '/facturas?mes=10' && destinoSeguro('/') === '/';" },
			{ name: "Webs externas bloqueadas", type: "js", code: "return ['https://malo.example', 'http://malo.example/panel', 'javascript:alert(1)'].every((u) => destinoSeguro(u) === '/panel');" },
			{ name: "Trucos con // y barras invertidas bloqueados", type: "js", code: "return ['//malo.example', '/\\\\malo.example', '\\\\\\\\malo.example', ' /x'].every((u) => destinoSeguro(u) === '/panel');" },
			{ name: "Sin next va al panel", type: "js", code: "return destinoSeguro(null) === '/panel' && destinoSeguro('') === '/panel';" },
		],
		hints: ["//dominio es una URL a otro sitio (protocolo relativo).", "Exige que empiece por \"/\" y que el segundo carácter no sea \"/\" ni \"\\\\\"."],
		solution: {
			"app.js": `function destinoSeguro(next) {
  if (typeof next !== "string") return "/panel";
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\\\")) return "/panel";
  return next;
}`,
		},
	},
	{
		...base,
		id: "seg-proto-pollution-01",
		title: "Contaminación del prototipo al fusionar ajustes",
		difficulty: "senior",
		concepts: ["seguridad-eval"],
		instructions:
			"fusionar(destino, origen) copia en profundidad los ajustes que llegan en JSON. Un JSON con \"__proto__\" contamina Object.prototype y todos los objetos heredan la propiedad. Parchea fusionar para ignorar __proto__, constructor y prototype.",
		files: {
			"index.html": `<main><h1>Ajustes</h1></main>`,
			"styles.css": css,
			"app.js": `function fusionar(destino, origen) {
  for (const clave in origen) {
    const valor = origen[clave];
    if (valor && typeof valor === "object") {
      if (!destino[clave] || typeof destino[clave] !== "object") destino[clave] = {};
      fusionar(destino[clave], valor);
    } else {
      destino[clave] = valor;
    }
  }
  return destino;
}`,
		},
		tests: [
			{ name: "__proto__ no contamina los objetos", type: "js", code: "fusionar({}, JSON.parse('{\"__proto__\": {\"admin\": true}}')); return ({}).admin === undefined || 'Object.prototype quedó contaminado';" },
			{ name: "constructor.prototype tampoco", type: "js", code: "fusionar({}, JSON.parse('{\"constructor\": {\"prototype\": {\"rol\": \"root\"}}}')); return ({}).rol === undefined;" },
			{ name: "Fusiona ajustes anidados normales", type: "js", code: "const r = fusionar({ tema: { color: 'azul', tam: 14 } }, { tema: { color: 'rojo' }, idioma: 'es' }); return eq(r, { tema: { color: 'rojo', tam: 14 }, idioma: 'es' });" },
		],
		hints: ["Salta las claves \"__proto__\", \"constructor\" y \"prototype\".", "Usa Object.keys(origen) en lugar de for…in para no recorrer heredadas."],
		solution: {
			"app.js": `const PROHIBIDAS = new Set(["__proto__", "constructor", "prototype"]);
function fusionar(destino, origen) {
  for (const clave of Object.keys(origen)) {
    if (PROHIBIDAS.has(clave)) continue;
    const valor = origen[clave];
    if (valor && typeof valor === "object") {
      if (!Object.prototype.hasOwnProperty.call(destino, clave) || typeof destino[clave] !== "object") destino[clave] = {};
      fusionar(destino[clave], valor);
    } else {
      destino[clave] = valor;
    }
  }
  return destino;
}`,
		},
	},
	{
		...base,
		id: "seg-calculadora-eval-01",
		title: "Calculadora que evalúa cualquier cosa",
		difficulty: "senior",
		concepts: ["seguridad-eval"],
		instructions:
			"calcular(expr) usa new Function para operar. 1) Explota: calcular(\"(window.__pwned = true)\") en la consola. 2) Parchea: acepta solo números, + - * /, paréntesis y espacios; si hay otra cosa, lanza un Error(\"Expresión no válida\").",
		files: {
			"index.html": `<main><h1>Calculadora</h1></main>`,
			"styles.css": css,
			"app.js": `function calcular(expr) {
  return new Function("return (" + expr + ")")();
}`,
		},
		tests: [
			{ name: "Opera bien", type: "js", code: "return calcular('2 + 3 * 4') === 14 && calcular('(10 - 4) / 3') === 2 && calcular('1.5*2') === 3;" },
			{ name: "Rechaza código", type: "js", code: "const malos = ['alert(1)', 'self.x=1', 'constructor', '2;fetch(1)', '`1`']; return malos.every((m) => { try { calcular(m); return false; } catch (e) { return /no válida/i.test(e.message); } });" },
			{ name: "No ejecuta asignaciones", type: "js", code: "try { calcular('(self.__pwned = true)'); } catch {} return self.__pwned !== true;" },
		],
		hints: ["Valida la expresión con una expresión regular antes de evaluarla: /^[\\d+\\-*/().\\s]+$/", "Con la lista blanca, ya no hay letras ni = que permitan acceder a nada."],
		solution: {
			"app.js": `function calcular(expr) {
  if (typeof expr !== "string" || !/^[\\d+\\-*/().\\s]+$/.test(expr)) throw new Error("Expresión no válida");
  return new Function("return (" + expr + ")")();
}`,
		},
	},
	{
		...base,
		id: "seg-token-url-01",
		title: "El token de sesión se filtra en la URL",
		difficulty: "semi_senior",
		concepts: ["seguridad-credenciales"],
		instructions:
			"Para compartir un informe, la app genera un enlace que incluye el token de sesión en la query (?token=…). Cualquiera con el enlace (o los logs del servidor) puede suplantar al usuario. Parchea enlaceCompartir(informeId) para que no incluya el token: el enlace solo lleva el id del informe.",
		files: {
			"index.html": `<main><h1>Informes</h1></main>`,
			"styles.css": css,
			"app.js": `const sesion = { token: "eyJhbGciOi.secreto.firma" };

function enlaceCompartir(informeId) {
  return "https://app.webwiz.dev/informes/" + informeId + "?token=" + sesion.token;
}`,
		},
		tests: [
			{ name: "El enlace no contiene el token", type: "js", code: "return !enlaceCompartir(7).includes(sesion.token) || 'El enlace incluye el token de sesión';" },
			{ name: "El enlace apunta al informe", type: "js", code: "return enlaceCompartir(7) === 'https://app.webwiz.dev/informes/7';" },
			{ name: "El id se codifica", type: "js", code: "return enlaceCompartir('a b') === 'https://app.webwiz.dev/informes/a%20b';" },
		],
		hints: ["El servidor debe comprobar el acceso con la sesión de quien abre el enlace, no con un token pegado en la URL.", "encodeURIComponent(informeId)."],
		solution: {
			"app.js": `const sesion = { token: "eyJhbGciOi.secreto.firma" };

function enlaceCompartir(informeId) {
  return "https://app.webwiz.dev/informes/" + encodeURIComponent(informeId);
}`,
		},
	},
];
