// Supabase Edge Function: corrige "Explícalo tú" con Claude.
// La clave ANTHROPIC_API_KEY solo existe aquí (secretos de la función):
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//   supabase functions deploy explain-review
// Opcionales: CLAUDE_MODEL (por defecto claude-sonnet-5-5) y EXPLAIN_DAILY_LIMIT.
import { createClient } from "npm:@supabase/supabase-js@2";
import { DAILY_LIMIT, MIN_ANSWER_CHARS, MAX_ANSWER_CHARS, answerHash, buildPrompt, parseReview, type Rubric } from "./review.ts";

const cors = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
};

const reply = (status: number, body: unknown) =>
	new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
	if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
	if (req.method !== "POST") return reply(405, { error: "Método no permitido" });

	const url = Deno.env.get("SUPABASE_URL")!;
	const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
	const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
	const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
	if (!apiKey) return reply(503, { error: "La corrección automática no está configurada todavía." });

	// Usuario que llama (su JWT); las escrituras se hacen con la service role
	const auth = req.headers.get("Authorization") ?? "";
	const asUser = createClient(url, anon, { global: { headers: { Authorization: auth } } });
	const { data: who } = await asUser.auth.getUser();
	if (!who?.user) return reply(401, { error: "Inicia sesión para que Claude corrija tu respuesta." });
	const admin = createClient(url, service);

	let body: { questionId?: string; answer?: string };
	try {
		body = await req.json();
	} catch {
		return reply(400, { error: "Petición no válida." });
	}
	const answer = String(body.answer ?? "").trim();
	if (!body.questionId) return reply(400, { error: "Falta la pregunta." });
	if (answer.length < MIN_ANSWER_CHARS) return reply(400, { error: `Escribe al menos ${MIN_ANSWER_CHARS} caracteres.` });
	if (answer.length > MAX_ANSWER_CHARS) return reply(400, { error: `Máximo ${MAX_ANSWER_CHARS} caracteres.` });

	const { data: q } = await admin
		.from("questions")
		.select("id, question, code, option_meta, kind")
		.eq("id", body.questionId)
		.maybeSingle();
	if (!q || q.kind !== "explain") return reply(404, { error: "Pregunta no encontrada." });
	const rubric = q.option_meta as Rubric;

	// Caché: la misma respuesta (normalizada) a la misma pregunta no se vuelve a corregir
	const hash = await answerHash(q.id, answer);
	const { data: cached } = await admin
		.from("explain_reviews")
		.select("review")
		.eq("question_id", q.id)
		.eq("answer_hash", hash)
		.limit(1)
		.maybeSingle();
	if (cached) {
		await admin.from("explain_reviews").insert({ user_id: who.user.id, question_id: q.id, answer, answer_hash: hash, review: cached.review, cached: true });
		return reply(200, { review: cached.review, cached: true });
	}

	// Límite diario por usuario (las respuestas cacheadas no cuentan)
	const limit = Number(Deno.env.get("EXPLAIN_DAILY_LIMIT") ?? DAILY_LIMIT);
	const since = new Date();
	since.setUTCHours(0, 0, 0, 0);
	const { count } = await admin
		.from("explain_reviews")
		.select("id", { count: "exact", head: true })
		.eq("user_id", who.user.id)
		.eq("cached", false)
		.gte("created_at", since.toISOString());
	if ((count ?? 0) >= limit) return reply(429, { error: `Has usado tus ${limit} correcciones de hoy. Vuelve mañana.` });

	const prompt = buildPrompt(q, rubric, answer);
	let review = null;
	for (let attempt = 0; attempt < 2 && !review; attempt++) {
		const res = await fetch("https://api.anthropic.com/v1/messages", {
			method: "POST",
			headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
			body: JSON.stringify({
				model: Deno.env.get("CLAUDE_MODEL") ?? "claude-sonnet-5-5",
				max_tokens: 600,
				temperature: 0,
				system: prompt.system,
				messages: [{ role: "user", content: prompt.user }],
			}),
		});
		if (!res.ok) {
			console.error("Claude API", res.status, await res.text());
			continue;
		}
		const data = await res.json();
		review = parseReview(data?.content?.[0]?.text ?? "", rubric);
	}
	if (!review) return reply(502, { error: "No se pudo corregir ahora mismo. Inténtalo de nuevo en un momento." });

	await admin.from("explain_reviews").insert({ user_id: who.user.id, question_id: q.id, answer, answer_hash: hash, review, cached: false });
	return reply(200, { review, cached: false });
});
