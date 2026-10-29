-- Generado por `npm run db:challenges-seed` (src/features/learning/concepts.ts y
-- src/content/questions/predict.ts). No editar a mano.
-- Ejecutar DESPUÉS de 20261031_fase4_aprendizaje.sql.

-- 1. Slug y área (equivalentes a slugify() y areaFor() del cliente)
CREATE OR REPLACE FUNCTION webwiz_slug(p_text TEXT) RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $fn$
  SELECT trim(both '-' from regexp_replace(
    lower(translate(coalesce(p_text, ''),
      'ÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇáàäâãéèëêíìïîóòöôõúùüûñç',
      'AAAAAEEEEIIIIOOOOOUUUUNCaaaaaeeeeiiiiooooouuuunc')),
    '[^a-z0-9]+', '-', 'g'))
$fn$;

CREATE OR REPLACE FUNCTION webwiz_area(p_text TEXT, p_category TEXT) RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $fn$
  SELECT CASE
    WHEN lower(coalesce(p_text, '')) ~ 'html|semantic|formulario|form|accesib|a11y|seo' THEN 'HTML'
    WHEN lower(coalesce(p_text, '')) ~ 'css|flex|grid|responsive|tailwind|sass|layout|animaci' THEN 'CSS'
    WHEN lower(coalesce(p_text, '')) ~ 'linux|bash|shell|terminal|permisos' THEN 'Linux'
    WHEN lower(coalesce(p_text, '')) ~ 'docker|kubernetes|devops|git|deploy|despliegue|nginx|ci/cd|pipeline' THEN 'DevOps'
    WHEN lower(coalesce(p_text, '')) ~ 'test|jest|vitest|cypress|playwright|e2e|tdd' THEN 'Testing'
    WHEN lower(coalesce(p_text, '')) ~ 'sql|postgres|base de datos|database|backend|express|api|rest|node' THEN 'Backend'
    WHEN lower(coalesce(p_text, '')) ~ 'javascript|typescript|react|dom|js|async|promesa|closure|evento' THEN 'JavaScript'
    WHEN lower(coalesce(p_category, '')) = 'frontend' THEN 'JavaScript'
    WHEN lower(coalesce(p_category, '')) = 'backend' THEN 'Backend'
    WHEN lower(coalesce(p_category, '')) = 'devops' THEN 'DevOps'
    WHEN lower(coalesce(p_category, '')) = 'testing' THEN 'Testing'
    WHEN lower(coalesce(p_category, '')) = 'linux' THEN 'Linux'
    WHEN lower(coalesce(p_category, '')) ~ 'html|semantic|formulario|form|accesib|a11y|seo' THEN 'HTML'
    WHEN lower(coalesce(p_category, '')) ~ 'css|flex|grid|responsive|tailwind|sass|layout|animaci' THEN 'CSS'
    WHEN lower(coalesce(p_category, '')) ~ 'linux|bash|shell|terminal|permisos' THEN 'Linux'
    WHEN lower(coalesce(p_category, '')) ~ 'docker|kubernetes|devops|git|deploy|despliegue|nginx|ci/cd|pipeline' THEN 'DevOps'
    WHEN lower(coalesce(p_category, '')) ~ 'test|jest|vitest|cypress|playwright|e2e|tdd' THEN 'Testing'
    WHEN lower(coalesce(p_category, '')) ~ 'sql|postgres|base de datos|database|backend|express|api|rest|node' THEN 'Backend'
    WHEN lower(coalesce(p_category, '')) ~ 'javascript|typescript|react|dom|js|async|promesa|closure|evento' THEN 'JavaScript'
    ELSE 'JavaScript'
  END
$fn$;

-- 2. Catálogo curado
INSERT INTO concepts (id, name, area) VALUES
  ('closures', 'Closures', 'JavaScript'),
  ('event-loop', 'Event loop', 'JavaScript'),
  ('hoisting', 'Hoisting', 'JavaScript'),
  ('this', 'this', 'JavaScript'),
  ('coercion', 'Coerción de tipos', 'JavaScript'),
  ('promises', 'Promesas', 'JavaScript'),
  ('array-methods', 'Métodos de array', 'JavaScript'),
  ('scope', 'Ámbito (scope)', 'JavaScript'),
  ('references', 'Referencias y copias', 'JavaScript')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, area = EXCLUDED.area;

-- 3. Un concepto por subcategoría (o categoría) de las preguntas existentes
INSERT INTO concepts (id, name, area)
SELECT DISTINCT ON (webwiz_slug(base))
  webwiz_slug(base), upper(left(base, 1)) || substr(base, 2), webwiz_area(subcategory, category)
FROM (
  SELECT coalesce(nullif(trim(subcategory), ''), nullif(trim(category), '')) AS base, subcategory, category
  FROM questions
) q
WHERE base IS NOT NULL AND webwiz_slug(base) <> ''
ON CONFLICT (id) DO NOTHING;

UPDATE questions
SET concepts = ARRAY[webwiz_slug(coalesce(nullif(trim(subcategory), ''), nullif(trim(category), '')))]
WHERE (concepts IS NULL OR concepts = '{}')
  AND webwiz_slug(coalesce(nullif(trim(subcategory), ''), nullif(trim(category), ''))) <> '';

-- 4. Preguntas de predicción ("¿Qué imprime este código?")
INSERT INTO questions (id, question, options, "correctAnswer", category, subcategory, difficulty, "shortExplanation", concepts, kind, code, option_meta)
VALUES
  ('6b1f0a10-0000-4000-8000-000000000001'::uuid, '¿Qué imprime este código?', $webwiz$["3, 3, 3","0, 1, 2","undefined, undefined, undefined","2, 2, 2"]$webwiz$::jsonb, $webwiz$3, 3, 3$webwiz$, 'frontend', 'JavaScript', 'semi_senior', $webwiz$var tiene ámbito de función: las tres funciones comparten la misma i. Cuando se ejecutan los setTimeout, el bucle ya terminó e i vale 3. Con let habría una i por iteración.$webwiz$, ARRAY['closures', 'event-loop']::TEXT[], 'predict', $webwiz$for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}$webwiz$, $webwiz${"0, 1, 2":{"misconception":"Cree que cada iteración captura su propia copia de var i","whyTempting":"Es lo que pasaría con let, que crea un enlace nuevo por iteración."},"undefined, undefined, undefined":{"misconception":"Cree que la variable ya no existe cuando corre el callback","whyTempting":"Parece que el bucle «acabó» y la variable desapareció, pero el closure la mantiene viva."},"2, 2, 2":{"misconception":"Confunde el último valor usado dentro del bucle con el valor final de i","whyTempting":"2 es el último índice que entra en el cuerpo, pero i se incrementa una vez más antes de salir."}}$webwiz$::jsonb),
  ('6b1f0a10-0000-4000-8000-000000000002'::uuid, '¿En qué orden se imprimen los mensajes?', $webwiz$["A, D, C, B","A, B, C, D","A, D, B, C","A, C, D, B"]$webwiz$::jsonb, $webwiz$A, D, C, B$webwiz$, 'frontend', 'JavaScript', 'semi_senior', $webwiz$Primero corre todo el código síncrono (A, D). Después se vacía la cola de microtareas (la promesa: C) y solo entonces la de tareas (setTimeout: B).$webwiz$, ARRAY['event-loop', 'promises']::TEXT[], 'predict', $webwiz$console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
console.log("D");$webwiz$, $webwiz${"A, B, C, D":{"misconception":"Cree que el código se ejecuta en el orden en que está escrito","whyTempting":"Un setTimeout de 0 ms parece «inmediato»."},"A, D, B, C":{"misconception":"Cree que setTimeout(0) va antes que las promesas","whyTempting":"Se registró antes y tiene retardo 0, pero las microtareas siempre van primero."},"A, C, D, B":{"misconception":"Cree que .then() se ejecuta de forma síncrona","whyTempting":"La promesa ya está resuelta, pero su callback siempre se encola."}}$webwiz$::jsonb),
  ('6b1f0a10-0000-4000-8000-000000000003'::uuid, '¿Qué imprime este código?', $webwiz$["function, undefined","undefined, undefined","function, function","ReferenceError"]$webwiz$::jsonb, $webwiz$function, undefined$webwiz$, 'frontend', 'JavaScript', 'semi_senior', $webwiz$Las declaraciones de función se elevan completas. De var solo se eleva la declaración (valor undefined), no la asignación de la flecha.$webwiz$, ARRAY['hoisting']::TEXT[], 'predict', $webwiz$console.log(typeof saludo);
console.log(typeof despedida);
function saludo() {}
var despedida = () => {};$webwiz$, $webwiz${"undefined, undefined":{"misconception":"Cree que nada se eleva","whyTempting":"Leer de arriba abajo sugiere que aún no existe nada."},"function, function":{"misconception":"Cree que con var también se eleva el valor asignado","whyTempting":"Ambas son funciones al final del archivo."},"ReferenceError":{"misconception":"Confunde var con let/const (zona muerta temporal)","whyTempting":"Con const despedida sí habría ReferenceError... pero typeof con var no falla."}}$webwiz$::jsonb),
  ('6b1f0a10-0000-4000-8000-000000000004'::uuid, '¿Qué imprime este código?', $webwiz$["Ada, undefined","Ada, object","Ada, Ada","undefined, object"]$webwiz$::jsonb, $webwiz$Ada, undefined$webwiz$, 'frontend', 'JavaScript', 'senior', $webwiz$En un método llamado como persona.hola(), this es persona. Las funciones flecha no tienen this propio: toman el del ámbito exterior (aquí el módulo, donde this es undefined).$webwiz$, ARRAY['this']::TEXT[], 'predict', $webwiz$const persona = {
  nombre: "Ada",
  hola() { return this.nombre; },
  adios: () => typeof this,
};
const f = persona.hola;
console.log(persona.hola());
console.log(persona.adios());$webwiz$, $webwiz${"Ada, object":{"misconception":"Cree que una flecha dentro de un objeto recibe el objeto como this","whyTempting":"Está escrita dentro del literal del objeto."},"Ada, Ada":{"misconception":"Trata adios como si devolviera el nombre","whyTempting":"Parece simétrico con hola."},"undefined, object":{"misconception":"Cree que el método pierde el this al haberse copiado en f","whyTempting":"f sí lo perdería, pero aquí se llama persona.hola()."}}$webwiz$::jsonb),
  ('6b1f0a10-0000-4000-8000-000000000005'::uuid, '¿Qué imprime este código?', $webwiz$["12, 12, (vacío)","3, 12, 0","12, 34, []","3, 7, (vacío)"]$webwiz$::jsonb, $webwiz$12, 12, (vacío)$webwiz$, 'frontend', 'JavaScript', 'junior', $webwiz$+ con un string concatena ("12"). * siempre convierte a número (12). Dos arrays con + se convierten a string vacío y se concatenan: "".$webwiz$, ARRAY['coercion']::TEXT[], 'predict', $webwiz$console.log(1 + "2");
console.log("3" * "4");
console.log([] + []);$webwiz$, $webwiz${"3, 12, 0":{"misconception":"Cree que + convierte los strings a número","whyTempting":"En matemáticas 1 + 2 es 3."},"12, 34, []":{"misconception":"Cree que * concatena como +","whyTempting":"Por simetría con la primera línea."},"3, 7, (vacío)":{"misconception":"Confunde * con + y + con suma numérica","whyTempting":"Se fija en los números y no en los operadores."}}$webwiz$::jsonb),
  ('6b1f0a10-0000-4000-8000-000000000006'::uuid, '¿Qué imprime este código?', $webwiz$["1 10 2 3","1 2 3 10","10 3 2 1","3 1 10 2"]$webwiz$::jsonb, $webwiz$1 10 2 3$webwiz$, 'frontend', 'JavaScript', 'junior', $webwiz$sort() sin comparador ordena como texto: "10" va antes que "2". Para números: a.sort((x, y) => x - y).$webwiz$, ARRAY['array-methods', 'coercion']::TEXT[], 'predict', $webwiz$const a = [3, 1, 10, 2];
a.sort();
console.log(a.join(" "));$webwiz$, $webwiz${"1 2 3 10":{"misconception":"Cree que sort ordena números por valor","whyTempting":"Es lo que uno esperaría con números."},"10 3 2 1":{"misconception":"Cree que sort ordena de mayor a menor","whyTempting":"Alguna librería ordena así por defecto."},"3 1 10 2":{"misconception":"Cree que sort devuelve una copia y no modifica el array","whyTempting":"Como map o filter, que no mutan."}}$webwiz$::jsonb),
  ('6b1f0a10-0000-4000-8000-000000000007'::uuid, '¿Qué imprime este código?', $webwiz$["2","1","undefined","TypeError"]$webwiz$::jsonb, $webwiz$2$webwiz$, 'frontend', 'JavaScript', 'semi_senior', $webwiz$El spread hace una copia superficial: copia.lista apunta al mismo array que original.lista. Para copiar a fondo: structuredClone(original).$webwiz$, ARRAY['references']::TEXT[], 'predict', $webwiz$const original = { lista: [1] };
const copia = { ...original };
copia.lista.push(2);
console.log(original.lista.length);$webwiz$, $webwiz${"1":{"misconception":"Cree que el spread copia en profundidad","whyTempting":"copia es un objeto nuevo, así que parece independiente."},"undefined":{"misconception":"Cree que el spread no copia propiedades anidadas","whyTempting":"Recuerda que la copia «no es profunda» y lo lleva al extremo."},"TypeError":{"misconception":"Cree que no se puede modificar algo declarado con const","whyTempting":"const impide reasignar, no mutar."}}$webwiz$::jsonb),
  ('6b1f0a10-0000-4000-8000-000000000008'::uuid, '¿Qué imprime este código?', $webwiz$["3 1","3 3","1 1","2 1"]$webwiz$::jsonb, $webwiz$3 1$webwiz$, 'frontend', 'JavaScript', 'semi_senior', $webwiz$Cada llamada a contador() crea su propia n. a lleva tres incrementos y b uno. (console.log con dos argumentos los separa con un espacio.)$webwiz$, ARRAY['closures', 'scope']::TEXT[], 'predict', $webwiz$function contador() {
  let n = 0;
  return () => ++n;
}
const a = contador();
const b = contador();
a(); a();
console.log(a(), b());$webwiz$, $webwiz${"3 3":{"misconception":"Cree que todas las funciones creadas comparten la misma n","whyTempting":"Vienen de la misma función contador."},"1 1":{"misconception":"Cree que n se reinicia en cada llamada a a()","whyTempting":"let n = 0 está escrito dentro de la función."},"2 1":{"misconception":"No cuenta la llamada que hay dentro del console.log","whyTempting":"Solo ve dos llamadas «sueltas» a a()."}}$webwiz$::jsonb),
  ('6b1f0a10-0000-4000-8000-000000000009'::uuid, '¿Qué imprime este código?', $webwiz$["1, 2, 3","1, 3, 2","2, 1, 3","1, 2"]$webwiz$::jsonb, $webwiz$1, 2, 3$webwiz$, 'frontend', 'JavaScript', 'semi_senior', $webwiz$Una función async corre de forma síncrona hasta el primer await. El resto se reanuda como microtarea, después del código síncrono que la llamó.$webwiz$, ARRAY['promises', 'event-loop']::TEXT[], 'predict', $webwiz$async function cargar() {
  console.log("1");
  await null;
  console.log("3");
}
cargar();
console.log("2");$webwiz$, $webwiz${"1, 3, 2":{"misconception":"Cree que await de un valor no asíncrono no pausa","whyTempting":"null no es una promesa, así que parece que no hay nada que esperar."},"2, 1, 3":{"misconception":"Cree que una función async no empieza hasta que acaba el código síncrono","whyTempting":"«Async» suena a «más tarde»."},"1, 2":{"misconception":"Cree que sin await en la llamada el resto de la función no se ejecuta","whyTempting":"cargar() no se espera con await."}}$webwiz$::jsonb),
  ('6b1f0a10-0000-4000-8000-000000000010'::uuid, '¿Qué imprime este código?', $webwiz$["1,NaN,NaN","1,2,3","NaN,NaN,NaN","1,2,NaN"]$webwiz$::jsonb, $webwiz$1,NaN,NaN$webwiz$, 'frontend', 'JavaScript', 'senior', $webwiz$map pasa (valor, índice). parseInt recibe el índice como base: parseInt("2", 1) y parseInt("3", 2) son NaN. Usa .map(Number) o .map((x) => parseInt(x, 10)).$webwiz$, ARRAY['array-methods']::TEXT[], 'predict', $webwiz$console.log([1, 2, 3].map(parseInt).join(","));$webwiz$, $webwiz${"1,2,3":{"misconception":"Cree que map solo pasa el valor al callback","whyTempting":"Es como se usa map casi siempre."},"NaN,NaN,NaN":{"misconception":"Cree que parseInt no acepta números","whyTempting":"Su nombre sugiere que solo trabaja con texto."},"1,2,NaN":{"misconception":"Intuye el problema de la base, pero no lo calcula","whyTempting":"Solo el último parece «raro»."}}$webwiz$::jsonb),
  ('6b1f0a10-0000-4000-8000-000000000011'::uuid, '¿Qué imprime este código?', $webwiz$["ReferenceError","number","undefined","1"]$webwiz$::jsonb, $webwiz$ReferenceError$webwiz$, 'frontend', 'JavaScript', 'senior', $webwiz$El let x del bloque oculta la x exterior en todo el bloque, pero no se puede usar antes de su declaración (zona muerta temporal), ni siquiera con typeof.$webwiz$, ARRAY['scope', 'hoisting']::TEXT[], 'predict', $webwiz$let x = 1;
{
  console.log(typeof x);
  let x = 2;
}$webwiz$, $webwiz${"1":{"misconception":"Confunde typeof x con x","whyTempting":"Lee el valor y no el operador."},"number":{"misconception":"Cree que dentro del bloque se usa la x exterior hasta la declaración","whyTempting":"La x de fuera ya vale 1 en esa línea."},"undefined":{"misconception":"Trata let como var (elevación con undefined)","whyTempting":"typeof de algo sin declarar da \"undefined\"."}}$webwiz$::jsonb),
  ('6b1f0a10-0000-4000-8000-000000000012'::uuid, '¿Qué imprime este código?', $webwiz$["a, b, c","a, c, b","a, c","c, a, b"]$webwiz$::jsonb, $webwiz$a, b, c$webwiz$, 'frontend', 'JavaScript', 'semi_senior', $webwiz$El ejecutor de una promesa corre de forma síncrona y resolve() no lo interrumpe. El .then se ejecuta después, como microtarea.$webwiz$, ARRAY['promises']::TEXT[], 'predict', $webwiz$const p = new Promise((resolve) => {
  console.log("a");
  resolve("c");
  console.log("b");
});
p.then(console.log);$webwiz$, $webwiz${"a, c, b":{"misconception":"Cree que resolve() ejecuta los .then inmediatamente","whyTempting":"Llamar a resolve parece «disparar» la promesa en el acto."},"a, c":{"misconception":"Cree que resolve() funciona como un return","whyTempting":"Muchos lo usan como última línea."},"c, a, b":{"misconception":"Cree que el resultado de la promesa sale antes que el código del ejecutor","whyTempting":"El .then «escucha» la promesa desde el principio."}}$webwiz$::jsonb)
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  "correctAnswer" = EXCLUDED."correctAnswer",
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  difficulty = EXCLUDED.difficulty,
  "shortExplanation" = EXCLUDED."shortExplanation",
  concepts = EXCLUDED.concepts,
  kind = EXCLUDED.kind,
  code = EXCLUDED.code,
  option_meta = EXCLUDED.option_meta;
