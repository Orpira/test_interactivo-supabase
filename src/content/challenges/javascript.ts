import type { ChallengeSpec } from "@/features/challenges/engine/types";

const NO_HTML = `<p>Este reto no tiene interfaz: los tests llaman a tus funciones.</p>`;
const BASE_CSS = `body { font-family: system-ui, sans-serif; padding: 1rem; }`;

export const javascriptChallenges: ChallengeSpec[] = [
	{
		id: "js-sumar-array-01",
		title: "Suma de un array",
		category: "javascript",
		difficulty: "junior",
		concepts: ["arrays", "reduce"],
		instructions:
			"Implementa sumar(numeros), que devuelve la suma de todos los números del array. Con un array vacío debe devolver 0.",
		files: {
			"index.html": NO_HTML,
			"styles.css": BASE_CSS,
			"app.js": `function sumar(numeros) {
  // Tu código aquí
}`,
		},
		editable: ["app.js"],
		tests: [
			{ name: "sumar([1, 2, 3]) devuelve 6", type: "js", code: "return eq(sumar([1, 2, 3]), 6);" },
			{ name: "sumar([]) devuelve 0", type: "js", code: "return eq(sumar([]), 0);", message: "Con un array vacío la suma es 0, no undefined." },
			{ name: "Funciona con negativos y decimales", type: "js", code: "return Math.abs(sumar([-1, 2.5, -0.5]) - 1) < 1e-9;" },
		],
		hints: [
			"Recorre el array acumulando el total en una variable que empieza en 0.",
			"reduce((total, n) => total + n, 0): el 0 final es el valor inicial y evita fallar con arrays vacíos.",
		],
		solution: {
			"app.js": `function sumar(numeros) {
  return numeros.reduce((total, n) => total + n, 0);
}`,
		},
	},
	{
		id: "js-contar-vocales-01",
		title: "Contar vocales (con tildes)",
		category: "javascript",
		difficulty: "junior",
		concepts: ["strings", "regex", "unicode"],
		instructions:
			"Implementa contarVocales(texto), que devuelve cuántas vocales tiene el texto. Debe contar mayúsculas y minúsculas, y también las vocales con tilde o diéresis (á, é, í, ó, ú, ü).",
		files: {
			"index.html": NO_HTML,
			"styles.css": BASE_CSS,
			"app.js": `function contarVocales(texto) {
  let total = 0;
  for (const letra of texto) {
    if ("aeiou".includes(letra)) total++;
  }
  return total;
}`,
		},
		editable: ["app.js"],
		tests: [
			{ name: "Cuenta minúsculas", type: "js", code: "return eq(contarVocales('hola mundo'), 4);" },
			{ name: "Cuenta mayúsculas", type: "js", code: "return eq(contarVocales('HOLA'), 2);" },
			{ name: "Cuenta vocales con tilde y diéresis", type: "js", code: "return eq(contarVocales('Murciélago pingüino'), 9);", message: "«Murciélago pingüino» tiene 9 vocales contando é y ü." },
			{ name: "Texto vacío devuelve 0", type: "js", code: "return eq(contarVocales(''), 0);" },
		],
		hints: [
			"Pasa el texto a minúsculas antes de comparar.",
			"Puedes ampliar la lista de vocales («aeiouáéíóúü») o quitar las tildes con normalize('NFD').",
		],
		solution: {
			"app.js": `function contarVocales(texto) {
  let total = 0;
  for (const letra of texto.toLowerCase()) {
    if ("aeiouáéíóúü".includes(letra)) total++;
  }
  return total;
}`,
		},
	},
	{
		id: "js-fizzbuzz-01",
		title: "FizzBuzz en la consola",
		category: "javascript",
		difficulty: "junior",
		concepts: ["bucles", "condicionales", "modulo"],
		instructions:
			"Completa fizzbuzz(n): devuelve «FizzBuzz» si n es múltiplo de 3 y de 5, «Fizz» si solo es múltiplo de 3, «Buzz» si solo es múltiplo de 5 y, si no, el número como texto. El bucle ya imprime del 1 al 15 usando tu función.",
		files: {
			"index.html": NO_HTML,
			"styles.css": BASE_CSS,
			"app.js": `function fizzbuzz(n) {
  if (n % 3 === 0) return "Fizz";
  if (n % 5 === 0) return "Buzz";
  return n;
}

for (let i = 1; i <= 15; i++) {
  console.log(fizzbuzz(i));
}`,
		},
		editable: ["app.js"],
		tests: [
			{ name: "fizzbuzz(15) devuelve «FizzBuzz»", type: "js", code: "return fizzbuzz(15) === 'FizzBuzz' || ('Devuelve ' + JSON.stringify(fizzbuzz(15)));", message: "Revisa el orden: el caso «múltiplo de ambos» debe comprobarse primero." },
			{ name: "Devuelve los números como texto", type: "js", code: "return fizzbuzz(7) === '7';", message: "fizzbuzz(7) debe devolver el texto «7», no el número 7." },
			{ name: "La consola muestra la secuencia del 1 al 15", type: "console", expected: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz" },
		],
		hints: [
			"El 15 es múltiplo de 3, así que entra en la primera condición antes de llegar a la de 5.",
			"Comprueba primero n % 15 === 0 y convierte el número con String(n).",
		],
		solution: {
			"app.js": `function fizzbuzz(n) {
  if (n % 15 === 0) return "FizzBuzz";
  if (n % 3 === 0) return "Fizz";
  if (n % 5 === 0) return "Buzz";
  return String(n);
}

for (let i = 1; i <= 15; i++) {
  console.log(fizzbuzz(i));
}`,
		},
	},
	{
		id: "js-contador-dom-01",
		title: "Contador con botones",
		category: "javascript",
		difficulty: "junior",
		concepts: ["dom", "eventos"],
		instructions:
			"Haz funcionar el contador: «+» suma 1 y «−» resta 1 al número de #valor, pero nunca debe bajar de 0.",
		files: {
			"index.html": `<p>Valor: <output id="valor">0</output></p>
<button id="restar" aria-label="Restar">−</button>
<button id="sumar" aria-label="Sumar">+</button>`,
			"styles.css": BASE_CSS + "\nbutton { min-width: 44px; min-height: 44px; font-size: 1.25rem; }",
			"app.js": `const valor = document.getElementById("valor");
let cuenta = 0;

document.getElementById("sumar").addEventListener("click", () => {
  cuenta++;
});
`,
		},
		editable: ["app.js"],
		tests: [
			{ name: "«+» incrementa el valor mostrado", type: "dom", code: "click('#sumar'); click('#sumar'); click('#sumar'); return text('#valor') === '3' || ('Muestra ' + text('#valor') + ', esperaba 3.');" },
			{ name: "«−» decrementa", type: "dom", code: "click('#restar'); return text('#valor') === '2';" },
			{ name: "Nunca baja de 0", type: "dom", code: "for (let i = 0; i < 5; i++) click('#restar'); return text('#valor') === '0';" },
		],
		hints: [
			"Cambiar la variable no cambia la pantalla: actualiza también valor.textContent.",
			"Math.max(0, cuenta - 1) evita los negativos.",
		],
		solution: {
			"app.js": `const valor = document.getElementById("valor");
let cuenta = 0;

const pintar = () => (valor.textContent = String(cuenta));

document.getElementById("sumar").addEventListener("click", () => {
  cuenta++;
  pintar();
});
document.getElementById("restar").addEventListener("click", () => {
  cuenta = Math.max(0, cuenta - 1);
  pintar();
});
`,
		},
	},
	{
		id: "js-filtrar-usuarios-01",
		title: "Filtrar y ordenar usuarios",
		category: "javascript",
		difficulty: "semi_senior",
		concepts: ["filter", "map", "sort", "inmutabilidad"],
		instructions:
			"Implementa nombresActivosAdultos(usuarios): devuelve los nombres de los usuarios activos con 18 años o más, ordenados alfabéticamente (según el español: «Álvaro» va antes que «Beatriz»). No debe modificar el array original.",
		files: {
			"index.html": NO_HTML,
			"styles.css": BASE_CSS,
			"app.js": `function nombresActivosAdultos(usuarios) {
  return usuarios
    .filter((u) => u.edad > 18)
    .sort((a, b) => a.nombre > b.nombre ? 1 : -1)
    .map((u) => u.nombre);
}`,
		},
		editable: ["app.js"],
		tests: [
			{ name: "Filtra activos de 18 o más", type: "js", code: "const r = nombresActivosAdultos([{ nombre: 'Ana', edad: 18, activo: true }, { nombre: 'Luis', edad: 30, activo: false }, { nombre: 'Eva', edad: 17, activo: true }]); return eq(r, ['Ana']);" },
			{ name: "Orden alfabético en español", type: "js", code: "const r = nombresActivosAdultos([{ nombre: 'Beatriz', edad: 20, activo: true }, { nombre: 'Álvaro', edad: 40, activo: true }, { nombre: 'carla', edad: 33, activo: true }]); return eq(r, ['Álvaro', 'Beatriz', 'carla']) || ('Obtenido: ' + JSON.stringify(r));" },
			{ name: "No modifica el array original", type: "js", code: "const lista = [{ nombre: 'Zoe', edad: 20, activo: true }, { nombre: 'Ana', edad: 20, activo: true }]; nombresActivosAdultos(lista); return lista[0].nombre === 'Zoe';", message: "sort() ordena el array sobre sí mismo: haz una copia antes." },
		],
		hints: [
			"Hay dos condiciones: activo y edad >= 18 (ojo con > frente a >=).",
			"a.localeCompare(b, 'es') compara textos con tildes y mayúsculas correctamente.",
		],
		solution: {
			"app.js": `function nombresActivosAdultos(usuarios) {
  return usuarios
    .filter((u) => u.activo && u.edad >= 18)
    .map((u) => u.nombre)
    .sort((a, b) => a.localeCompare(b, "es"));
}`,
		},
	},
	{
		id: "js-agrupar-por-01",
		title: "Agrupar elementos por una propiedad",
		category: "javascript",
		difficulty: "semi_senior",
		concepts: ["reduce", "objetos"],
		instructions:
			"Implementa agruparPor(lista, clave), que devuelve un objeto cuyas propiedades son los valores de esa clave y cuyos valores son arrays con los elementos correspondientes, en su orden original.",
		files: {
			"index.html": NO_HTML,
			"styles.css": BASE_CSS,
			"app.js": `function agruparPor(lista, clave) {
  // Tu código aquí
}`,
		},
		editable: ["app.js"],
		tests: [
			{ name: "Agrupa por la clave indicada", type: "js", code: "const r = agruparPor([{ t: 'a', n: 1 }, { t: 'b', n: 2 }, { t: 'a', n: 3 }], 't'); return eq(r, { a: [{ t: 'a', n: 1 }, { t: 'a', n: 3 }], b: [{ t: 'b', n: 2 }] });" },
			{ name: "Lista vacía devuelve {}", type: "js", code: "return eq(agruparPor([], 'x'), {});" },
			{ name: "No mezcla grupos entre llamadas", type: "js", code: "agruparPor([{ k: 1 }], 'k'); return eq(agruparPor([{ k: 2 }], 'k'), { 2: [{ k: 2 }] });", message: "El objeto resultado debe crearse nuevo en cada llamada." },
		],
		hints: [
			"Empieza con un objeto vacío y, para cada elemento, añádelo al array de su grupo.",
			"Si el grupo aún no existe, créalo: (grupos[valor] ??= []).push(elemento).",
		],
		solution: {
			"app.js": `function agruparPor(lista, clave) {
  return lista.reduce((grupos, elemento) => {
    (grupos[elemento[clave]] ??= []).push(elemento);
    return grupos;
  }, {});
}`,
		},
	},
	{
		id: "js-debounce-01",
		title: "Debounce para el buscador",
		category: "javascript",
		difficulty: "semi_senior",
		concepts: ["closures", "timers", "rendimiento"],
		instructions:
			"Implementa debounce(fn, ms): devuelve una función que, al llamarse varias veces seguidas, solo ejecuta fn una vez, ms milisegundos después de la última llamada y con los argumentos de esa última llamada.",
		files: {
			"index.html": NO_HTML,
			"styles.css": BASE_CSS,
			"app.js": `function debounce(fn, ms) {
  return function (...args) {
    setTimeout(() => fn(...args), ms);
  };
}`,
		},
		editable: ["app.js"],
		tests: [
			{ name: "Varias llamadas seguidas ejecutan fn una sola vez", type: "js", code: "let n = 0; const d = debounce(() => n++, 50); d(); d(); d(); await new Promise(r => setTimeout(r, 120)); return n === 1 || ('fn se ejecutó ' + n + ' veces.');" },
			{ name: "Usa los argumentos de la última llamada", type: "js", code: "let ultimo; const d = debounce(v => (ultimo = v), 30); d('a'); d('b'); d('c'); await new Promise(r => setTimeout(r, 80)); return ultimo === 'c';" },
			{ name: "Espera ms desde la última llamada", type: "js", code: "let n = 0; const d = debounce(() => n++, 60); d(); await new Promise(r => setTimeout(r, 40)); d(); await new Promise(r => setTimeout(r, 40)); const antes = n; await new Promise(r => setTimeout(r, 60)); return antes === 0 && n === 1;" },
		],
		hints: [
			"Cada nueva llamada debe cancelar el temporizador anterior.",
			"Guarda el id que devuelve setTimeout en una variable del closure y usa clearTimeout.",
		],
		solution: {
			"app.js": `function debounce(fn, ms) {
  let temporizador;
  return function (...args) {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => fn.apply(this, args), ms);
  };
}`,
		},
	},
	{
		id: "js-memoizar-01",
		title: "Memoizar una función costosa",
		category: "javascript",
		difficulty: "senior",
		concepts: ["closures", "cache", "map"],
		instructions:
			"Implementa memoizar(fn): devuelve una versión de fn que guarda los resultados por argumentos. Si se llama otra vez con los mismos argumentos, devuelve el resultado guardado sin volver a ejecutar fn. Debe distinguir bien argumentos como 1 y \"1\", y funcionar con varios argumentos.",
		files: {
			"index.html": NO_HTML,
			"styles.css": BASE_CSS,
			"app.js": `function memoizar(fn) {
  const cache = {};
  return function (...args) {
    const clave = args.join(",");
    if (cache[clave]) return cache[clave];
    return (cache[clave] = fn(...args));
  };
}`,
		},
		editable: ["app.js"],
		tests: [
			{ name: "No repite el cálculo con los mismos argumentos", type: "js", code: "let n = 0; const f = memoizar((a, b) => { n++; return a + b; }); f(2, 3); f(2, 3); return f(2, 3) === 5 && n === 1;" },
			{ name: "Distingue 1 de \"1\"", type: "js", code: "const f = memoizar(x => typeof x); return f(1) === 'number' && f('1') === 'string';", message: "args.join(',') convierte 1 y '1' en la misma clave." },
			{ name: "Guarda resultados «falsy» (0, false, '')", type: "js", code: "let n = 0; const f = memoizar(() => { n++; return 0; }); f(); f(); return n === 1;", message: "if (cache[clave]) falla cuando el resultado guardado es 0: comprueba si la clave existe." },
		],
		hints: [
			"Usa una clave que conserve el tipo: JSON.stringify(args).",
			"Comprueba si la clave existe (Map.has o 'clave in cache'), no si el valor es «verdadero».",
		],
		solution: {
			"app.js": `function memoizar(fn) {
  const cache = new Map();
  return function (...args) {
    const clave = JSON.stringify(args);
    if (cache.has(clave)) return cache.get(clave);
    const resultado = fn.apply(this, args);
    cache.set(clave, resultado);
    return resultado;
  };
}`,
		},
	},
	{
		id: "js-reintentar-01",
		title: "Reintentar una petición que falla",
		category: "javascript",
		difficulty: "senior",
		concepts: ["promesas", "async-await", "errores"],
		instructions:
			"Implementa reintentar(fn, intentos): llama a la función asíncrona fn y, si su promesa se rechaza, vuelve a intentarlo hasta un total de «intentos» veces. Devuelve el primer resultado correcto; si todos fallan, rechaza con el error del último intento.",
		files: {
			"index.html": NO_HTML,
			"styles.css": BASE_CSS,
			"app.js": `async function reintentar(fn, intentos) {
  for (let i = 0; i < intentos; i++) {
    try {
      return fn();
    } catch (error) {
      console.log("Fallo", i + 1);
    }
  }
}`,
		},
		editable: ["app.js"],
		tests: [
			{ name: "Devuelve el resultado si acaba funcionando", type: "js", code: "let n = 0; const fn = async () => { n++; if (n < 3) throw new Error('fallo ' + n); return 'ok'; }; const r = await reintentar(fn, 5); return r === 'ok' && n === 3;" },
			{ name: "No supera el número de intentos", type: "js", code: "let n = 0; try { await reintentar(async () => { n++; throw new Error('x'); }, 3); } catch (e) {} return n === 3 || ('Se llamó ' + n + ' veces.');" },
			{ name: "Rechaza con el error del último intento", type: "js", code: "let n = 0; try { await reintentar(async () => { n++; throw new Error('fallo ' + n); }, 2); return 'Debería haber rechazado.'; } catch (e) { return e.message === 'fallo 2'; }" },
		],
		hints: [
			"return fn() devuelve la promesa sin esperarla: el try/catch no ve el rechazo. Usa return await fn().",
			"Guarda el último error en una variable y lánzalo (throw) al terminar el bucle.",
		],
		solution: {
			"app.js": `async function reintentar(fn, intentos) {
  let ultimoError;
  for (let i = 0; i < intentos; i++) {
    try {
      return await fn();
    } catch (error) {
      ultimoError = error;
    }
  }
  throw ultimoError;
}`,
		},
	},
	{
		id: "js-lista-tareas-01",
		title: "Lista de tareas segura con delegación de eventos",
		category: "javascript",
		difficulty: "senior",
		concepts: ["dom", "delegacion-de-eventos", "xss"],
		instructions:
			"Completa la lista de tareas: al enviar el formulario se añade un <li> con el texto escrito y un botón «Borrar» (clase «borrar»), y el campo se vacía; los textos vacíos no se añaden. Borrar debe funcionar también en las tareas nuevas con un único listener en la lista (delegación). El texto del usuario nunca debe interpretarse como HTML.",
		files: {
			"index.html": `<form id="form-tarea">
  <label for="nueva">Nueva tarea</label>
  <input id="nueva" autocomplete="off">
  <button>Añadir</button>
</form>
<ul id="tareas"></ul>`,
			"styles.css": BASE_CSS + "\nli { display: flex; gap: .5rem; align-items: center; margin: .25rem 0; }",
			"app.js": `const form = document.getElementById("form-tarea");
const input = document.getElementById("nueva");
const lista = document.getElementById("tareas");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  lista.innerHTML += "<li>" + input.value + " <button class='borrar'>Borrar</button></li>";
});
`,
		},
		editable: ["app.js"],
		tests: [
			{ name: "Añade tareas y vacía el campo", type: "dom", code: "const i = $('#nueva'); i.value = 'Comprar pan'; $('#form-tarea').requestSubmit(); if (i.value !== '') return 'El campo no se vacía tras añadir.'; i.value = '   '; $('#form-tarea').requestSubmit(); const items = $$('#tareas li'); if (items.length !== 1) return 'Hay ' + items.length + ' tareas: ¿se añadió la vacía?'; return /Comprar pan/.test(items[0].textContent);" },
			{ name: "Borrar funciona en tareas nuevas", type: "dom", code: "const i = $('#nueva'); for (const t of ['A', 'B']) { i.value = t; $('#form-tarea').requestSubmit(); } const antes = $$('#tareas li').length; $$('#tareas li .borrar')[0].click(); return $$('#tareas li').length === antes - 1;" },
			{ name: "El texto no se interpreta como HTML (XSS)", type: "dom", code: "const i = $('#nueva'); i.value = '<img src=x onerror=\"window.hackeado=1\">'; $('#form-tarea').requestSubmit(); await wait(50); const li = $$('#tareas li').pop(); return !window.hackeado && !$('#tareas img') && li.textContent.includes('<img');", message: "Con innerHTML el texto del usuario se ejecuta como HTML: crea los nodos y usa textContent." },
		],
		hints: [
			"Crea el <li> con document.createElement y asigna el texto con textContent: así nunca se interpreta como HTML.",
			"Un solo listener en la <ul> sirve para todos los botones: comprueba si event.target.closest('.borrar') existe.",
		],
		solution: {
			"app.js": `const form = document.getElementById("form-tarea");
const input = document.getElementById("nueva");
const lista = document.getElementById("tareas");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const texto = input.value.trim();
  if (!texto) return;

  const li = document.createElement("li");
  const span = document.createElement("span");
  span.textContent = texto;
  const borrar = document.createElement("button");
  borrar.type = "button";
  borrar.className = "borrar";
  borrar.textContent = "Borrar";
  li.append(span, borrar);
  lista.append(li);
  input.value = "";
});

// Delegación: un único listener para todos los botones, presentes y futuros
lista.addEventListener("click", (e) => {
  const boton = e.target.closest(".borrar");
  if (boton) boton.closest("li").remove();
});
`,
		},
	},
];
