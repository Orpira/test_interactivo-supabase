import { formatClock } from "./timeline";

export type ShareCardData = {
	number: number;
	title: string;
	score: number;
	durationMs: number;
	submits: number;
	linesChanged: number;
	referenceLines: number;
};

/** Ajusta un texto a varias líneas dentro de `maxWidth`. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
	const words = text.split(/\s+/);
	const lines: string[] = [];
	let line = "";
	for (const w of words) {
		const test = line ? `${line} ${w}` : w;
		if (ctx.measureText(test).width > maxWidth && line) {
			lines.push(line);
			line = w;
		} else line = test;
	}
	if (line) lines.push(line);
	if (lines.length > maxLines) {
		const cut = lines.slice(0, maxLines);
		cut[maxLines - 1] = `${cut[maxLines - 1].replace(/\s+\S*$/, "")}…`;
		return cut;
	}
	return lines;
}

/** Dibuja la tarjeta 1200×630 (formato de vista previa en redes). */
export function drawShareCard(canvas: HTMLCanvasElement, d: ShareCardData) {
	canvas.width = 1200;
	canvas.height = 630;
	const ctx = canvas.getContext("2d");
	if (!ctx) return;
	const mono = '"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace';
	const display = '"Space Grotesk Variable", "Space Grotesk", system-ui, sans-serif';

	ctx.fillStyle = "#0D1117";
	ctx.fillRect(0, 0, 1200, 630);
	// Rejilla sutil
	ctx.strokeStyle = "rgba(122,162,255,0.07)";
	ctx.lineWidth = 1;
	for (let x = 0; x <= 1200; x += 40) {
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, 630);
		ctx.stroke();
	}
	for (let y = 0; y <= 630; y += 40) {
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(1200, y);
		ctx.stroke();
	}
	ctx.fillStyle = "#7AA2FF";
	ctx.fillRect(0, 0, 12, 630);

	ctx.font = `600 30px ${mono}`;
	ctx.fillStyle = "#7AA2FF";
	ctx.fillText(`TICKET #${d.number} CERRADO`, 72, 104);

	ctx.font = `700 54px ${display}`;
	ctx.fillStyle = "#E6EDF3";
	wrap(ctx, d.title, 1050, 3).forEach((l, i) => ctx.fillText(l, 72, 190 + i * 66));

	const stats = [
		["PUNTOS", String(d.score)],
		["TIEMPO", formatClock(d.durationMs)],
		["ENVÍOS", String(d.submits)],
		["LÍNEAS", `${d.linesChanged} / ${d.referenceLines} ref.`],
	];
	stats.forEach(([k, v], i) => {
		const x = 72 + i * 270;
		ctx.font = `600 22px ${mono}`;
		ctx.fillStyle = "#8B949E";
		ctx.fillText(k, x, 470);
		ctx.font = `700 46px ${mono}`;
		ctx.fillStyle = i === 0 ? "#FFA657" : "#E6EDF3";
		ctx.fillText(v, x, 528);
	});

	ctx.font = `500 24px ${mono}`;
	ctx.fillStyle = "#8B949E";
	ctx.fillText("WebWiz · Modo Incidencia", 72, 594);
}

/**
 * Comparte la tarjeta como PNG (hoja de compartir del móvil) o, si el
 * navegador no lo permite, la descarga.
 */
export async function shareCard(d: ShareCardData): Promise<"shared" | "downloaded" | "cancelled"> {
	const canvas = document.createElement("canvas");
	drawShareCard(canvas, d);
	const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
	if (!blob) throw new Error("No se pudo generar la imagen");
	const file = new File([blob], `ticket-${d.number}.png`, { type: "image/png" });
	const text = `He cerrado el ticket #${d.number} en WebWiz con ${d.score} puntos.`;
	// La hoja de compartir solo en móvil; en escritorio se descarga el PNG
	const touch = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
	if (touch && navigator.canShare?.({ files: [file] })) {
		try {
			await navigator.share({ files: [file], title: `Ticket #${d.number} cerrado`, text });
			return "shared";
		} catch (e) {
			if ((e as DOMException)?.name === "AbortError") return "cancelled";
		}
	}
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = file.name;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
	return "downloaded";
}
