/**
 * Preguntas de predicción ("¿Qué imprime este código?") con conceptos y la
 * confusión que representa cada opción incorrecta. La salida correcta se
 * comprueba ejecutando el código en test/unit/predict.test.ts.
 * Formato de la respuesta: cada console.log es un elemento, unidos por ", ".
 */
export type OptionMeta = { misconception: string; whyTempting: string };

export type PredictQuestion = {
	id: string;
	question: string;
	code: string;
	options: string[];
	correctAnswer: string;
	concepts: string[];
	difficulty: "junior" | "semi_senior" | "senior";
	shortExplanation: string;
	optionMeta: Record<string, OptionMeta>;
};

export const PREDICT_QUESTIONS: PredictQuestion[] = [
	{
		id: "6b1f0a10-0000-4000-8000-000000000001",
		question: "¿Qué imprime este código?",
		code: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}`,
		options: ["3, 3, 3", "0, 1, 2", "undefined, undefined, undefined", "2, 2, 2"],
		correctAnswer: "3, 3, 3",
		concepts: ["closures", "event-loop"],
		difficulty: "semi_senior",
		shortExplanation:
			"var tiene ámbito de función: las tres funciones comparten la misma i. Cuando se ejecutan los setTimeout, el bucle ya terminó e i vale 3. Con let habría una i por iteración.",
		optionMeta: {
			"0, 1, 2": { misconception: "Cree que cada iteración captura su propia copia de var i", whyTempting: "Es lo que pasaría con let, que crea un enlace nuevo por iteración." },
			"undefined, undefined, undefined": { misconception: "Cree que la variable ya no existe cuando corre el callback", whyTempting: "Parece que el bucle «acabó» y la variable desapareció, pero el closure la mantiene viva." },
			"2, 2, 2": { misconception: "Confunde el último valor usado dentro del bucle con el valor final de i", whyTempting: "2 es el último índice que entra en el cuerpo, pero i se incrementa una vez más antes de salir." },
		},
	},
	{
		id: "6b1f0a10-0000-4000-8000-000000000002",
		question: "¿En qué orden se imprimen los mensajes?",
		code: `console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
console.log("D");`,
		options: ["A, D, C, B", "A, B, C, D", "A, D, B, C", "A, C, D, B"],
		correctAnswer: "A, D, C, B",
		concepts: ["event-loop", "promises"],
		difficulty: "semi_senior",
		shortExplanation:
			"Primero corre todo el código síncrono (A, D). Después se vacía la cola de microtareas (la promesa: C) y solo entonces la de tareas (setTimeout: B).",
		optionMeta: {
			"A, B, C, D": { misconception: "Cree que el código se ejecuta en el orden en que está escrito", whyTempting: "Un setTimeout de 0 ms parece «inmediato»." },
			"A, D, B, C": { misconception: "Cree que setTimeout(0) va antes que las promesas", whyTempting: "Se registró antes y tiene retardo 0, pero las microtareas siempre van primero." },
			"A, C, D, B": { misconception: "Cree que .then() se ejecuta de forma síncrona", whyTempting: "La promesa ya está resuelta, pero su callback siempre se encola." },
		},
	},
	{
		id: "6b1f0a10-0000-4000-8000-000000000003",
		question: "¿Qué imprime este código?",
		code: `console.log(typeof saludo);
console.log(typeof despedida);
function saludo() {}
var despedida = () => {};`,
		options: ["function, undefined", "undefined, undefined", "function, function", "ReferenceError"],
		correctAnswer: "function, undefined",
		concepts: ["hoisting"],
		difficulty: "semi_senior",
		shortExplanation:
			"Las declaraciones de función se elevan completas. De var solo se eleva la declaración (valor undefined), no la asignación de la flecha.",
		optionMeta: {
			"undefined, undefined": { misconception: "Cree que nada se eleva", whyTempting: "Leer de arriba abajo sugiere que aún no existe nada." },
			"function, function": { misconception: "Cree que con var también se eleva el valor asignado", whyTempting: "Ambas son funciones al final del archivo." },
			ReferenceError: { misconception: "Confunde var con let/const (zona muerta temporal)", whyTempting: "Con const despedida sí habría ReferenceError... pero typeof con var no falla." },
		},
	},
	{
		id: "6b1f0a10-0000-4000-8000-000000000004",
		question: "¿Qué imprime este código?",
		code: `const persona = {
  nombre: "Ada",
  hola() { return this.nombre; },
  adios: () => typeof this,
};
const f = persona.hola;
console.log(persona.hola());
console.log(persona.adios());`,
		options: ["Ada, undefined", "Ada, object", "Ada, Ada", "undefined, object"],
		correctAnswer: "Ada, undefined",
		concepts: ["this"],
		difficulty: "senior",
		shortExplanation:
			"En un método llamado como persona.hola(), this es persona. Las funciones flecha no tienen this propio: toman el del ámbito exterior (aquí el módulo, donde this es undefined).",
		optionMeta: {
			"Ada, object": { misconception: "Cree que una flecha dentro de un objeto recibe el objeto como this", whyTempting: "Está escrita dentro del literal del objeto." },
			"Ada, Ada": { misconception: "Trata adios como si devolviera el nombre", whyTempting: "Parece simétrico con hola." },
			"undefined, object": { misconception: "Cree que el método pierde el this al haberse copiado en f", whyTempting: "f sí lo perdería, pero aquí se llama persona.hola()." },
		},
	},
	{
		id: "6b1f0a10-0000-4000-8000-000000000005",
		question: "¿Qué imprime este código?",
		code: `console.log(1 + "2");
console.log("3" * "4");
console.log([] + []);`,
		options: ["12, 12, (vacío)", "3, 12, 0", "12, 34, []", "3, 7, (vacío)"],
		correctAnswer: "12, 12, (vacío)",
		concepts: ["coercion"],
		difficulty: "junior",
		shortExplanation:
			"+ con un string concatena (\"12\"). * siempre convierte a número (12). Dos arrays con + se convierten a string vacío y se concatenan: \"\".",
		optionMeta: {
			"3, 12, 0": { misconception: "Cree que + convierte los strings a número", whyTempting: "En matemáticas 1 + 2 es 3." },
			"12, 34, []": { misconception: "Cree que * concatena como +", whyTempting: "Por simetría con la primera línea." },
			"3, 7, (vacío)": { misconception: "Confunde * con + y + con suma numérica", whyTempting: "Se fija en los números y no en los operadores." },
		},
	},
	{
		id: "6b1f0a10-0000-4000-8000-000000000006",
		question: "¿Qué imprime este código?",
		code: `const a = [3, 1, 10, 2];
a.sort();
console.log(a.join(" "));`,
		options: ["1 10 2 3", "1 2 3 10", "10 3 2 1", "3 1 10 2"],
		correctAnswer: "1 10 2 3",
		concepts: ["array-methods", "coercion"],
		difficulty: "junior",
		shortExplanation: "sort() sin comparador ordena como texto: \"10\" va antes que \"2\". Para números: a.sort((x, y) => x - y).",
		optionMeta: {
			"1 2 3 10": { misconception: "Cree que sort ordena números por valor", whyTempting: "Es lo que uno esperaría con números." },
			"10 3 2 1": { misconception: "Cree que sort ordena de mayor a menor", whyTempting: "Alguna librería ordena así por defecto." },
			"3 1 10 2": { misconception: "Cree que sort devuelve una copia y no modifica el array", whyTempting: "Como map o filter, que no mutan." },
		},
	},
	{
		id: "6b1f0a10-0000-4000-8000-000000000007",
		question: "¿Qué imprime este código?",
		code: `const original = { lista: [1] };
const copia = { ...original };
copia.lista.push(2);
console.log(original.lista.length);`,
		options: ["2", "1", "undefined", "TypeError"],
		correctAnswer: "2",
		concepts: ["references"],
		difficulty: "semi_senior",
		shortExplanation: "El spread hace una copia superficial: copia.lista apunta al mismo array que original.lista. Para copiar a fondo: structuredClone(original).",
		optionMeta: {
			"1": { misconception: "Cree que el spread copia en profundidad", whyTempting: "copia es un objeto nuevo, así que parece independiente." },
			undefined: { misconception: "Cree que el spread no copia propiedades anidadas", whyTempting: "Recuerda que la copia «no es profunda» y lo lleva al extremo." },
			TypeError: { misconception: "Cree que no se puede modificar algo declarado con const", whyTempting: "const impide reasignar, no mutar." },
		},
	},
	{
		id: "6b1f0a10-0000-4000-8000-000000000008",
		question: "¿Qué imprime este código?",
		code: `function contador() {
  let n = 0;
  return () => ++n;
}
const a = contador();
const b = contador();
a(); a();
console.log(a(), b());`,
		options: ["3 1", "3 3", "1 1", "2 1"],
		correctAnswer: "3 1",
		concepts: ["closures", "scope"],
		difficulty: "semi_senior",
		shortExplanation: "Cada llamada a contador() crea su propia n. a lleva tres incrementos y b uno. (console.log con dos argumentos los separa con un espacio.)",
		optionMeta: {
			"3 3": { misconception: "Cree que todas las funciones creadas comparten la misma n", whyTempting: "Vienen de la misma función contador." },
			"1 1": { misconception: "Cree que n se reinicia en cada llamada a a()", whyTempting: "let n = 0 está escrito dentro de la función." },
			"2 1": { misconception: "No cuenta la llamada que hay dentro del console.log", whyTempting: "Solo ve dos llamadas «sueltas» a a()." },
		},
	},
	{
		id: "6b1f0a10-0000-4000-8000-000000000009",
		question: "¿Qué imprime este código?",
		code: `async function cargar() {
  console.log("1");
  await null;
  console.log("3");
}
cargar();
console.log("2");`,
		options: ["1, 2, 3", "1, 3, 2", "2, 1, 3", "1, 2"],
		correctAnswer: "1, 2, 3",
		concepts: ["promises", "event-loop"],
		difficulty: "semi_senior",
		shortExplanation: "Una función async corre de forma síncrona hasta el primer await. El resto se reanuda como microtarea, después del código síncrono que la llamó.",
		optionMeta: {
			"1, 3, 2": { misconception: "Cree que await de un valor no asíncrono no pausa", whyTempting: "null no es una promesa, así que parece que no hay nada que esperar." },
			"2, 1, 3": { misconception: "Cree que una función async no empieza hasta que acaba el código síncrono", whyTempting: "«Async» suena a «más tarde»." },
			"1, 2": { misconception: "Cree que sin await en la llamada el resto de la función no se ejecuta", whyTempting: "cargar() no se espera con await." },
		},
	},
	{
		id: "6b1f0a10-0000-4000-8000-000000000010",
		question: "¿Qué imprime este código?",
		code: `console.log([1, 2, 3].map(parseInt).join(","));`,
		options: ["1,NaN,NaN", "1,2,3", "NaN,NaN,NaN", "1,2,NaN"],
		correctAnswer: "1,NaN,NaN",
		concepts: ["array-methods"],
		difficulty: "senior",
		shortExplanation: "map pasa (valor, índice). parseInt recibe el índice como base: parseInt(\"2\", 1) y parseInt(\"3\", 2) son NaN. Usa .map(Number) o .map((x) => parseInt(x, 10)).",
		optionMeta: {
			"1,2,3": { misconception: "Cree que map solo pasa el valor al callback", whyTempting: "Es como se usa map casi siempre." },
			"NaN,NaN,NaN": { misconception: "Cree que parseInt no acepta números", whyTempting: "Su nombre sugiere que solo trabaja con texto." },
			"1,2,NaN": { misconception: "Intuye el problema de la base, pero no lo calcula", whyTempting: "Solo el último parece «raro»." },
		},
	},
	{
		id: "6b1f0a10-0000-4000-8000-000000000011",
		question: "¿Qué imprime este código?",
		code: `let x = 1;
{
  console.log(typeof x);
  let x = 2;
}`,
		options: ["ReferenceError", "number", "undefined", "1"],
		correctAnswer: "ReferenceError",
		concepts: ["scope", "hoisting"],
		difficulty: "senior",
		shortExplanation:
			"El let x del bloque oculta la x exterior en todo el bloque, pero no se puede usar antes de su declaración (zona muerta temporal), ni siquiera con typeof.",
		optionMeta: {
			number: { misconception: "Cree que dentro del bloque se usa la x exterior hasta la declaración", whyTempting: "La x de fuera ya vale 1 en esa línea." },
			undefined: { misconception: "Trata let como var (elevación con undefined)", whyTempting: "typeof de algo sin declarar da \"undefined\"." },
			"1": { misconception: "Confunde typeof x con x", whyTempting: "Lee el valor y no el operador." },
		},
	},
	{
		id: "6b1f0a10-0000-4000-8000-000000000012",
		question: "¿Qué imprime este código?",
		code: `const p = new Promise((resolve) => {
  console.log("a");
  resolve("c");
  console.log("b");
});
p.then(console.log);`,
		options: ["a, b, c", "a, c, b", "a, c", "c, a, b"],
		correctAnswer: "a, b, c",
		concepts: ["promises"],
		difficulty: "semi_senior",
		shortExplanation: "El ejecutor de una promesa corre de forma síncrona y resolve() no lo interrumpe. El .then se ejecuta después, como microtarea.",
		optionMeta: {
			"a, c, b": { misconception: "Cree que resolve() ejecuta los .then inmediatamente", whyTempting: "Llamar a resolve parece «disparar» la promesa en el acto." },
			"a, c": { misconception: "Cree que resolve() funciona como un return", whyTempting: "Muchos lo usan como última línea." },
			"c, a, b": { misconception: "Cree que el resultado de la promesa sale antes que el código del ejecutor", whyTempting: "El .then «escucha» la promesa desde el principio." },
		},
	},
];
