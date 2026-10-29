type Row = Record<string, unknown>;

function toCell(value: unknown): string {
	if (value === null || value === undefined) return "";
	const text =
		typeof value === "object" ? JSON.stringify(value) : String(value);
	// Escapar según RFC 4180: comillas dobles y celdas con , " o saltos de línea
	return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCSV(data: Row[], columns?: string[]): string {
	if (!data.length) return "";
	const headers = columns ?? Object.keys(data[0]);
	return [
		headers.map(toCell).join(","),
		...data.map((row) => headers.map((h) => toCell(row[h])).join(",")),
	].join("\r\n");
}

export function exportToCSV(data: Row[], filename: string, columns?: string[]) {
	if (!data.length) return;

	// BOM para que Excel abra bien tildes y eñes
	const blob = new Blob(["﻿" + toCSV(data, columns)], {
		type: "text/csv;charset=utf-8;",
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `${filename}.csv`;
	link.style.visibility = "hidden";
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
