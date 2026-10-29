/**
 * Laboratorio SQL (PostgreSQL real en el navegador con PGlite). Cada ejercicio
 * se comprueba comparando el resultado de tu consulta (o de `check`, si el
 * ejercicio modifica datos o esquema) con el de la solución.
 */
export type SqlExercise = {
	id: string;
	title: string;
	difficulty: "junior" | "semi_senior" | "senior";
	concepts: string[];
	instructions: string;
	starter: string;
	solution: string;
	/** El orden de las filas importa */
	ordered: boolean;
	/** Consulta de comprobación tras ejecutar lo tuyo (para UPDATE, CREATE INDEX…) */
	check?: string;
	hints: string[];
};

export const SQL_SETUP = `CREATE TABLE clientes (
  id INT PRIMARY KEY,
  nombre TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  alta DATE NOT NULL
);
CREATE TABLE productos (
  id INT PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,
  precio NUMERIC(8,2) NOT NULL
);
CREATE TABLE pedidos (
  id INT PRIMARY KEY,
  cliente_id INT NOT NULL REFERENCES clientes(id),
  fecha DATE NOT NULL
);
CREATE TABLE lineas (
  pedido_id INT NOT NULL REFERENCES pedidos(id),
  producto_id INT NOT NULL REFERENCES productos(id),
  cantidad INT NOT NULL CHECK (cantidad > 0),
  PRIMARY KEY (pedido_id, producto_id)
);
INSERT INTO clientes VALUES
  (1, 'Ane', 'Bilbao', '2026-01-10'),
  (2, 'Iker', 'Donostia', '2026-02-03'),
  (3, 'Maite', 'Bilbao', '2026-03-21'),
  (4, 'Jon', 'Vitoria', '2026-05-30'),
  (5, 'Leire', 'Bilbao', '2026-09-12'),
  (6, 'Unai', 'Donostia', '2026-10-01');
INSERT INTO productos VALUES
  (1, 'Café de Colombia', 'café', 12.50),
  (2, 'Café de Etiopía', 'café', 14.00),
  (3, 'Taza esmaltada', 'menaje', 9.90),
  (4, 'Molinillo manual', 'menaje', 39.00),
  (5, 'Cafetera italiana', 'menaje', 29.95),
  (6, 'Té verde', 'té', 7.50),
  (7, 'Filtros de papel', 'menaje', 3.20);
INSERT INTO pedidos VALUES
  (1, 1, '2026-09-02'), (2, 1, '2026-10-05'), (3, 2, '2026-10-07'),
  (4, 3, '2026-08-15'), (5, 4, '2026-10-20'), (6, 2, '2026-10-21'),
  (7, 1, '2026-10-28');
INSERT INTO lineas VALUES
  (1, 1, 2), (1, 3, 1), (2, 4, 1), (2, 7, 3), (3, 2, 1),
  (4, 6, 4), (5, 5, 1), (5, 1, 1), (6, 2, 2), (6, 3, 2), (7, 1, 1);`;

export const SQL_EXERCISES: SqlExercise[] = [
	{
		id: "sql-01",
		title: "Clientes de Bilbao",
		difficulty: "junior",
		concepts: ["sql-consultas"],
		instructions: "Devuelve el nombre de los clientes de Bilbao ordenados alfabéticamente.",
		starter: "SELECT nombre\nFROM clientes;",
		solution: "SELECT nombre FROM clientes WHERE ciudad = 'Bilbao' ORDER BY nombre;",
		ordered: true,
		hints: ["Filtra con WHERE ciudad = 'Bilbao'.", "ORDER BY nombre al final."],
	},
	{
		id: "sql-02",
		title: "Los 3 productos más caros",
		difficulty: "junior",
		concepts: ["sql-consultas"],
		instructions: "Nombre y precio de los 3 productos más caros, del más caro al más barato.",
		starter: "SELECT nombre, precio\nFROM productos;",
		solution: "SELECT nombre, precio FROM productos ORDER BY precio DESC LIMIT 3;",
		ordered: true,
		hints: ["ORDER BY precio DESC", "LIMIT 3"],
	},
	{
		id: "sql-03",
		title: "Clientes por ciudad",
		difficulty: "junior",
		concepts: ["sql-agregados"],
		instructions: "Cuántos clientes hay en cada ciudad: columnas ciudad y total.",
		starter: "SELECT ciudad\nFROM clientes;",
		solution: "SELECT ciudad, count(*) AS total FROM clientes GROUP BY ciudad;",
		ordered: false,
		hints: ["count(*) con GROUP BY ciudad."],
	},
	{
		id: "sql-04",
		title: "Pedidos con el nombre del cliente",
		difficulty: "semi_senior",
		concepts: ["sql-joins"],
		instructions: "Para cada pedido: su id, la fecha y el nombre del cliente.",
		starter: "SELECT id, fecha, cliente_id\nFROM pedidos;",
		solution: "SELECT p.id, p.fecha, c.nombre FROM pedidos p JOIN clientes c ON c.id = p.cliente_id;",
		ordered: false,
		hints: ["JOIN clientes c ON c.id = p.cliente_id"],
	},
	{
		id: "sql-05",
		title: "Clientes que nunca han comprado",
		difficulty: "semi_senior",
		concepts: ["sql-joins"],
		instructions: "Nombre de los clientes sin ningún pedido.",
		starter: "SELECT c.nombre\nFROM clientes c\nJOIN pedidos p ON p.cliente_id = c.id;",
		solution: "SELECT c.nombre FROM clientes c LEFT JOIN pedidos p ON p.cliente_id = c.id WHERE p.id IS NULL;",
		ordered: false,
		hints: ["Un LEFT JOIN conserva los clientes sin pedidos (con columnas del pedido a NULL).", "Quédate con los que tienen p.id IS NULL (o usa NOT EXISTS)."],
	},
	{
		id: "sql-06",
		title: "Clientes que han gastado más de 40 €",
		difficulty: "semi_senior",
		concepts: ["sql-agregados", "sql-joins"],
		instructions: "Nombre y gasto total (cantidad × precio) de los clientes que han gastado más de 40 €.",
		starter: "SELECT c.nombre\nFROM clientes c;",
		solution: `SELECT c.nombre, sum(l.cantidad * pr.precio) AS gasto
FROM clientes c
JOIN pedidos p ON p.cliente_id = c.id
JOIN lineas l ON l.pedido_id = p.id
JOIN productos pr ON pr.id = l.producto_id
GROUP BY c.id, c.nombre
HAVING sum(l.cantidad * pr.precio) > 40;`,
		ordered: false,
		hints: ["Une clientes → pedidos → lineas → productos.", "Las condiciones sobre agregados van en HAVING, no en WHERE."],
	},
	{
		id: "sql-07",
		title: "Productos por encima de la media",
		difficulty: "semi_senior",
		concepts: ["sql-subconsultas"],
		instructions: "Nombre de los productos cuyo precio supera el precio medio de todos los productos.",
		starter: "SELECT nombre\nFROM productos\nWHERE precio > 10;",
		solution: "SELECT nombre FROM productos WHERE precio > (SELECT avg(precio) FROM productos);",
		ordered: false,
		hints: ["Una subconsulta escalar: (SELECT avg(precio) FROM productos)."],
	},
	{
		id: "sql-08",
		title: "Último pedido de cada cliente",
		difficulty: "senior",
		concepts: ["sql-subconsultas"],
		instructions: "Para cada cliente con pedidos: su nombre y la fecha de su pedido más reciente, ordenado por esa fecha (más reciente primero).",
		starter: "SELECT c.nombre, p.fecha\nFROM clientes c\nJOIN pedidos p ON p.cliente_id = c.id;",
		solution: `WITH ultimos AS (
  SELECT cliente_id, max(fecha) AS fecha FROM pedidos GROUP BY cliente_id
)
SELECT c.nombre, u.fecha FROM ultimos u JOIN clientes c ON c.id = u.cliente_id
ORDER BY u.fecha DESC;`,
		ordered: true,
		hints: ["Agrupa los pedidos por cliente con max(fecha).", "Puedes ponerlo en un WITH (CTE) y unirlo con clientes."],
	},
	{
		id: "sql-09",
		title: "Subida de precio del café",
		difficulty: "semi_senior",
		concepts: ["sql-consultas"],
		instructions: "Sube un 10 % el precio de los productos de la categoría «café» (redondeado a 2 decimales). No toques los demás.",
		starter: "UPDATE productos\nSET precio = precio * 1.10;",
		solution: "UPDATE productos SET precio = round(precio * 1.10, 2) WHERE categoria = 'café';",
		check: "SELECT id, precio FROM productos ORDER BY id;",
		ordered: true,
		hints: ["Sin WHERE, el UPDATE afecta a toda la tabla.", "round(precio * 1.10, 2)"],
	},
	{
		id: "sql-10",
		title: "Índice para el historial de pedidos",
		difficulty: "senior",
		concepts: ["sql-indices", "sql-rendimiento"],
		instructions:
			"La pantalla de historial hace SELECT … FROM pedidos WHERE cliente_id = $1 ORDER BY fecha DESC. Crea el índice que sirve a la vez para el filtro y el orden.",
		starter: "CREATE INDEX idx_pedidos_fecha ON pedidos (fecha);",
		solution: "CREATE INDEX idx_pedidos_cliente_fecha ON pedidos (cliente_id, fecha DESC);",
		check: "SELECT count(*)::int AS indices FROM pg_indexes WHERE tablename = 'pedidos' AND indexdef ~* '\\(cliente_id, fecha( desc)?\\)';",
		ordered: true,
		hints: ["Un índice compuesto: primero la columna del WHERE, luego la del ORDER BY."],
	},
];
