/** Plantillas de partida para /crear. */
export const CHALLENGE_TEMPLATE = JSON.stringify(
	{
		id: "mi-reto-01",
		title: "Centra la tarjeta",
		category: "css",
		difficulty: "junior",
		concepts: ["flexbox"],
		instructions: "Centra .tarjeta horizontal y verticalmente dentro de .zona.",
		files: {
			"index.html": '<div class="zona"><div class="tarjeta">Hola</div></div>',
			"styles.css": ".zona { height: 300px; }\n.tarjeta { width: 100px; }",
			"app.js": "",
		},
		editable: ["styles.css"],
		tests: [
			{
				name: "La tarjeta está centrada",
				type: "dom",
				code: "const z = rect('.zona'), t = rect('.tarjeta'); return near(t.left - z.left, z.right - t.right) && near(t.top - z.top, z.bottom - t.bottom);",
			},
		],
		hints: ["display: flex con justify-content y align-items."],
		solution: { "styles.css": ".zona { height: 300px; display: flex; justify-content: center; align-items: center; }\n.tarjeta { width: 100px; }" },
	},
	null,
	2,
);

export const INCIDENT_TEMPLATE = JSON.stringify(
	{
		id: "inc-mi-incidencia",
		number: 1001,
		type: "incident",
		title: "El botón Guardar no hace nada",
		area: "javascript",
		difficulty: "junior",
		concepts: ["evento"],
		durationMin: 5,
		ticket: {
			reporter: "Usuario",
			priority: "media",
			device: "escritorio",
			steps: ["Pulsar Guardar"],
			expected: "Aparece «Guardado»",
			actual: "No pasa nada",
		},
		viewport: 768,
		files: {
			"index.html": '<button id="guardar">Guardar</button><p id="estado"></p>',
			"styles.css": "",
			"app.js": 'document.getElementById("guardr").addEventListener("click", () => {\n  document.getElementById("estado").textContent = "Guardado";\n});',
		},
		editable: ["app.js"],
		networkLog: [],
		tests: [{ name: "Guardar muestra «Guardado»", type: "dom", code: "click('#guardar'); return text('#estado') === 'Guardado';" }],
		regressionTests: [{ name: "El botón sigue existiendo", type: "dom", code: "return !!$('#guardar');" }],
		hints: ["Mira la consola: hay un error al cargar."],
		solution: {
			"app.js": 'document.getElementById("guardar").addEventListener("click", () => {\n  document.getElementById("estado").textContent = "Guardado";\n});',
		},
		rootCause: "El id del selector tiene una errata (guardr): getElementById devuelve null y addEventListener lanza un TypeError, así que el botón nunca tiene listener.",
		suspects: [],
	},
	null,
	2,
);
