import type { IncidentSpec } from "@/features/incidents/types";

export const securityIncidents: IncidentSpec[] = [
	{
		id: "inc-901",
		number: 901,
		type: "incident",
		title: "Un comentario ejecuta código en el navegador de los lectores",
		area: "seguridad",
		difficulty: "senior",
		concepts: ["XSS", "innerHTML vs textContent"],
		durationMin: 10,
		ticket: {
			reporter: "Equipo de seguridad",
			priority: "alta",
			device: "todos",
			steps: ["Abrir la entrada del blog", "Cargar los comentarios"],
			expected: "Los comentarios se muestran como texto",
			actual: "Un comentario con HTML se interpreta y ejecuta JavaScript (onerror)",
		},
		viewport: 768,
		files: {
			"index.html": `<main>
  <h1>Comentarios</h1>
  <ul id="comentarios"></ul>
</main>`,
			"styles.css": `body { margin: 0; padding: 24px; font-family: system-ui, sans-serif; }
#comentarios { list-style: none; padding: 0; }
#comentarios li { padding: 12px; border: 1px solid #d0d7de; border-radius: 8px; margin-bottom: 8px; }
#comentarios p { margin: 4px 0 0; }`,
			"app.js": `const lista = document.getElementById("comentarios");

async function cargar() {
  const res = await fetch("/api/comentarios");
  const comentarios = await res.json();
  lista.innerHTML = comentarios
    .map((c) => \`<li><strong>\${c.autor}</strong><p>\${c.texto}</p></li>\`)
    .join("");
}

cargar();`,
		},
		editable: ["app.js"],
		networkLog: [
			{
				method: "GET",
				url: "/api/comentarios",
				status: 200,
				body: [
					{ autor: "Ana", texto: "¡Qué buen artículo!" },
					{ autor: "Mallory", texto: '<img src="x" onerror="window.__xss = 1">Mira esto' },
				],
				delayMs: 40,
			},
		],
		tests: [
			{ name: "No se ejecuta el código del comentario", type: "dom", code: "await wait(200); return window.__xss !== 1 || 'Se ejecutó el onerror inyectado.';" },
			{ name: "El HTML del comentario no se interpreta", type: "dom", code: "return !$('#comentarios img') || 'Hay un <img> inyectado en la lista.';" },
			{ name: "El texto se muestra tal cual", type: "dom", code: "return ($$('#comentarios li')[1] || { textContent: '' }).textContent.includes('<img src=\"x\"');" },
		],
		regressionTests: [
			{ name: "Se cargan los dos comentarios", type: "dom", code: "await wait(150); return $$('#comentarios li').length === 2;" },
			{ name: "El autor va en negrita y el texto en un párrafo", type: "dom", code: "const li = $$('#comentarios li')[0]; return !!li && li.querySelector('strong')?.textContent === 'Ana' && li.querySelector('p')?.textContent === '¡Qué buen artículo!';" },
			{ name: "Se piden al servidor", type: "dom", code: "return requests().some(r => r.url === '/api/comentarios');" },
		],
		hints: [
			"innerHTML interpreta cualquier etiqueta que venga en los datos del usuario.",
			"Crea los elementos con createElement y asigna los datos con textContent.",
		],
		solution: {
			"app.js": `const lista = document.getElementById("comentarios");

async function cargar() {
  const res = await fetch("/api/comentarios");
  const comentarios = await res.json();
  lista.replaceChildren(
    ...comentarios.map((c) => {
      const li = document.createElement("li");
      const autor = document.createElement("strong");
      autor.textContent = c.autor;
      const texto = document.createElement("p");
      texto.textContent = c.texto;
      li.append(autor, texto);
      return li;
    }),
  );
}

cargar();`,
		},
		rootCause:
			"Los comentarios llegan del servidor con texto escrito por usuarios y se insertan con innerHTML, que interpreta las etiquetas. Un <img> con onerror ejecuta JavaScript ajeno en la página (XSS almacenado). Hay que tratar los datos como texto: createElement + textContent (o escapar el HTML).",
		suspects: [],
	},
];
