/**
 * "Explícalo tú": preguntas abiertas corregidas por Claude con una rúbrica.
 * Se guardan en `questions` (kind = 'explain'); la rúbrica va en option_meta
 * y solo la lee la Edge Function, así que el cliente no puede alterarla.
 */
export type ExplainMisconception = { id: string; description: string };

export type ExplainPrompt = {
	id: string;
	concept: string;
	question: string;
	code?: string;
	keyPoints: string[];
	misconceptions: ExplainMisconception[];
	modelAnswer: string;
	difficulty: "junior" | "semi_senior" | "senior";
};

export const EXPLAIN_PROMPTS: ExplainPrompt[] = [
	{
		id: "7c2e0b20-0000-4000-8000-000000000001",
		concept: "closures",
		question: "Explica por qué este bucle imprime 3, 3, 3 y cómo harías que imprima 0, 1, 2.",
		code: `for (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 0);\n}`,
		keyPoints: [
			"var tiene ámbito de función: las tres funciones comparten la misma variable i",
			"los callbacks de setTimeout se ejecutan después de que el bucle termine, cuando i ya vale 3",
			"con let se crea una variable nueva por iteración (o se captura el valor con una función/IIFE)",
		],
		misconceptions: [
			{ id: "timeout-cero", description: "Cree que setTimeout(…, 0) se ejecuta inmediatamente, dentro de la iteración" },
			{ id: "copia-valor", description: "Cree que el closure guarda una copia del valor y no una referencia a la variable" },
		],
		modelAnswer:
			"Las tres flechas cierran sobre la misma i porque var tiene ámbito de función. Los setTimeout se ejecutan cuando el bucle ya acabó y i vale 3. Con let cada iteración tiene su propia i y se imprime 0, 1, 2.",
		difficulty: "semi_senior",
	},
	{
		id: "7c2e0b20-0000-4000-8000-000000000002",
		concept: "event-loop",
		question: "Explica en qué orden se imprimen A, B, C y D y por qué.",
		code: `console.log("A");\nsetTimeout(() => console.log("B"), 0);\nPromise.resolve().then(() => console.log("C"));\nconsole.log("D");`,
		keyPoints: [
			"primero se ejecuta todo el código síncrono: A y D",
			"los callbacks de promesas son microtareas y se ejecutan al vaciarse la pila, antes que las tareas",
			"setTimeout encola una tarea (macrotarea) que va después de las microtareas: B al final",
		],
		misconceptions: [
			{ id: "orden-escrito", description: "Cree que el código asíncrono se ejecuta en el orden en que está escrito" },
			{ id: "timeout-antes", description: "Cree que setTimeout(0) va antes que una promesa ya resuelta" },
		],
		modelAnswer: "A, D, C, B. Lo síncrono va primero (A, D); luego se vacía la cola de microtareas (C, la promesa) y después se toma la siguiente tarea (B, el setTimeout).",
		difficulty: "semi_senior",
	},
	{
		id: "7c2e0b20-0000-4000-8000-000000000003",
		concept: "this",
		question: "Explica por qué `boton.addEventListener('click', contador.sumar)` falla con «Cannot read properties of undefined» y cómo arreglarlo.",
		code: `const contador = {\n  n: 0,\n  sumar() { this.n++; },\n};\nboton.addEventListener("click", contador.sumar);`,
		keyPoints: [
			"this depende de cómo se llama la función, no de dónde se definió",
			"al pasar contador.sumar como callback se pierde el objeto: this es el botón (o undefined en modo estricto)",
			"se arregla con bind, una función flecha que llame a contador.sumar() o un método definido con flecha",
		],
		misconceptions: [
			{ id: "this-lexico", description: "Cree que this queda fijado al objeto donde se escribió el método" },
			{ id: "flecha-objeto", description: "Cree que poner sumar: () => this.n++ dentro del objeto lo arregla" },
		],
		modelAnswer:
			"El listener llama a la función sin el objeto delante, así que this ya no es contador sino el botón. Hay que pasar () => contador.sumar() o contador.sumar.bind(contador).",
		difficulty: "senior",
	},
	{
		id: "7c2e0b20-0000-4000-8000-000000000004",
		concept: "xss",
		question: "Explica por qué mostrar comentarios con `innerHTML` es peligroso y cuál es la alternativa segura.",
		code: "lista.innerHTML += `<li>${comentario.texto}</li>`;",
		keyPoints: [
			"innerHTML interpreta el texto como HTML: un comentario puede incluir etiquetas o atributos con JavaScript",
			"el código inyectado se ejecuta en el navegador de otros usuarios con sus permisos y sesión (XSS)",
			"hay que tratar los datos como texto: createElement + textContent (o escapar el HTML / sanitizar)",
		],
		misconceptions: [
			{ id: "solo-script", description: "Cree que basta con bloquear la etiqueta <script>" },
			{ id: "servidor-valida", description: "Cree que si el servidor valida el formulario ya no hay riesgo en el cliente" },
		],
		modelAnswer:
			"innerHTML convierte el texto en HTML, así que un comentario con <img src=x onerror=…> ejecuta código en el navegador de quien lo lee. Hay que crear el <li> y asignar textContent.",
		difficulty: "junior",
	},
	{
		id: "7c2e0b20-0000-4000-8000-000000000005",
		concept: "rls",
		question: "Explica qué está mal en esta política RLS y cómo la escribirías.",
		code: `CREATE POLICY "Editar perfil" ON perfiles\n  FOR UPDATE TO authenticated\n  USING (true);`,
		keyPoints: [
			"USING (true) permite a cualquier usuario autenticado modificar cualquier fila",
			"hay que limitar las filas al dueño: USING (auth.uid() = user_id)",
			"sin WITH CHECK se podría cambiar el user_id a otra persona; también hay que comprobarlo",
		],
		misconceptions: [
			{ id: "authenticated-basta", description: "Cree que «TO authenticated» ya limita a las filas propias" },
			{ id: "rls-activa-basta", description: "Cree que activar RLS protege aunque las políticas sean abiertas" },
		],
		modelAnswer:
			"TO authenticated solo exige sesión; USING (true) deja editar cualquier perfil. Debe ser USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id).",
		difficulty: "senior",
	},
	{
		id: "7c2e0b20-0000-4000-8000-000000000006",
		concept: "promises",
		question: "Explica por qué este código muestra «Guardado» aunque el servidor responda con un error 500.",
		code: `async function guardar(datos) {\n  try {\n    await fetch("/api/guardar", { method: "POST", body: JSON.stringify(datos) });\n    aviso("Guardado");\n  } catch {\n    aviso("Error");\n  }\n}`,
		keyPoints: [
			"fetch solo rechaza la promesa con errores de red, no con códigos HTTP de error",
			"un 500 resuelve normalmente: hay que comprobar res.ok (o res.status)",
			"si !res.ok se debe lanzar un error o mostrar el aviso de error",
		],
		misconceptions: [
			{ id: "fetch-rechaza", description: "Cree que fetch lanza una excepción con cualquier respuesta de error" },
			{ id: "await-falta", description: "Atribuye el problema a que falta un await" },
		],
		modelAnswer: "fetch no rechaza con un 500, solo con fallos de red. Hay que guardar la respuesta y comprobar res.ok; si es false, lanzar un error para que el catch muestre «Error».",
		difficulty: "semi_senior",
	},
	{
		id: "7c2e0b20-0000-4000-8000-000000000007",
		concept: "a11y-formularios",
		question: "Explica por qué un campo con solo `placeholder` y sin `<label>` es un problema de accesibilidad.",
		code: `<input type="email" placeholder="Email">`,
		keyPoints: [
			"el placeholder desaparece al escribir y la persona pierde la referencia de qué campo es",
			"no siempre se anuncia como nombre accesible y su contraste suele ser bajo",
			"cada campo necesita un <label for> (visible) asociado a su id",
		],
		misconceptions: [
			{ id: "placeholder-label", description: "Cree que el placeholder cumple la misma función que una etiqueta" },
			{ id: "aria-label-siempre", description: "Cree que lo correcto es añadir aria-label en lugar de una etiqueta visible" },
		],
		modelAnswer:
			"El placeholder no es una etiqueta: desaparece al escribir, tiene poco contraste y no siempre lo anuncia el lector. Hay que añadir <label for=\"email\">Email</label> y un id en el input.",
		difficulty: "junior",
	},
	{
		id: "7c2e0b20-0000-4000-8000-000000000008",
		concept: "sql-indices",
		question: "Explica cuándo un índice acelera una consulta y por qué no conviene indexar todas las columnas.",
		code: `SELECT * FROM pedidos WHERE cliente_id = 42 ORDER BY fecha DESC LIMIT 20;`,
		keyPoints: [
			"un índice evita recorrer toda la tabla al filtrar u ordenar por sus columnas (aquí cliente_id y fecha)",
			"un índice compuesto (cliente_id, fecha DESC) sirve a la vez para el filtro y el orden",
			"cada índice ocupa espacio y ralentiza INSERT/UPDATE, por eso solo se crean los que usan las consultas",
		],
		misconceptions: [
			{ id: "indices-gratis", description: "Cree que los índices no tienen coste y conviene ponerlos en todas las columnas" },
			{ id: "indice-pk", description: "Cree que la clave primaria ya acelera cualquier consulta" },
		],
		modelAnswer:
			"Un índice en (cliente_id, fecha DESC) deja a Postgres ir directo a los pedidos del cliente ya ordenados. No se indexa todo porque cada índice ocupa espacio y hay que actualizarlo en cada escritura.",
		difficulty: "semi_senior",
	},
	{
		id: "7c2e0b20-0000-4000-8000-000000000009",
		concept: "git-deshacer",
		question: "Hiciste un commit en main por error (aún sin push). Explica cómo moverlo a una rama nueva y dejar main como estaba.",
		keyPoints: [
			"crear una rama en el commit actual para no perderlo (git branch nueva-rama)",
			"mover main un commit atrás (git reset --hard HEAD~1 o --keep si hay cambios)",
			"cambiar a la rama nueva para seguir trabajando (git switch nueva-rama)",
		],
		misconceptions: [
			{ id: "revert", description: "Propone git revert, que añade otro commit en main en lugar de quitarlo" },
			{ id: "reset-pierde", description: "Cree que reset borra el commit para siempre aunque otra rama lo apunte" },
		],
		modelAnswer: "git branch arreglo (la rama apunta al commit), git reset --hard HEAD~1 (main vuelve atrás) y git switch arreglo. Como no hubo push, no hay que reescribir nada remoto.",
		difficulty: "semi_senior",
	},
	{
		id: "7c2e0b20-0000-4000-8000-000000000010",
		concept: "web-vitals",
		question: "Explica qué mide el CLS y dos formas de reducirlo en una página con imágenes y anuncios.",
		keyPoints: [
			"CLS mide cuánto se desplaza el contenido visible de forma inesperada mientras carga la página",
			"reservar espacio: width/height o aspect-ratio en imágenes, iframes y anuncios",
			"no insertar contenido encima del existente (banners, fuentes que cambian el tamaño: font-display / size-adjust)",
		],
		misconceptions: [
			{ id: "cls-velocidad", description: "Confunde el CLS con la velocidad de carga" },
			{ id: "lazy-cls", description: "Cree que loading=\"lazy\" por sí solo evita los saltos" },
		],
		modelAnswer:
			"CLS suma los saltos inesperados de diseño. Se reduce reservando el hueco de imágenes y anuncios (width/height o aspect-ratio) y evitando insertar contenido encima del que ya se ve.",
		difficulty: "semi_senior",
	},
];
