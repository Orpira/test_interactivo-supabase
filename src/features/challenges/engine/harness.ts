import { TEST_TIMEOUT_MS } from "./types";

/**
 * Arnés que corre dentro del iframe aislado. Recibe los tests "dom" por
 * postMessage, los ejecuta tras la carga y devuelve { name, passed, message }.
 * Los tests disponen de utilidades: $, $$, style, rect, text, click, wait,
 * near, requests (peticiones de la red simulada), hits (¿el elemento recibe
 * el clic o lo tapa otro?), type (escribe en un campo y lanza input/change) y
 * audit (auditoría axe-core con las reglas indicadas; retos de accesibilidad).
 */
export const DOM_HARNESS = `
(function () {
  var TIMEOUT = ${TEST_TIMEOUT_MS};
  var helpers = {
    $: function (s) { return document.querySelector(s); },
    $$: function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); },
    style: function (s, prop) { var el = typeof s === "string" ? document.querySelector(s) : s; if (!el) throw new Error("No existe el elemento " + s); var v = getComputedStyle(el); return prop ? v.getPropertyValue(prop) : v; },
    rect: function (s) { var el = typeof s === "string" ? document.querySelector(s) : s; if (!el) throw new Error("No existe el elemento " + s); return el.getBoundingClientRect(); },
    text: function (s) { var el = document.querySelector(s); return el ? el.textContent.trim() : null; },
    click: function (s) { var el = typeof s === "string" ? document.querySelector(s) : s; if (!el) throw new Error("No existe el elemento " + s); el.click(); },
    wait: function (ms) { return new Promise(function (r) { setTimeout(r, ms || 0); }); },
    near: function (a, b, tol) { return Math.abs(a - b) <= (tol == null ? 2 : tol); },
    requests: function () { return (window.__wwRequests || []).slice(); },
    hits: function (sel) { var el = document.querySelector(sel); if (!el) throw new Error("No existe el elemento " + sel); var r = el.getBoundingClientRect(); var top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!top && (top === el || el.contains(top)); },
    audit: async function (rules) {
      if (!window.axe) throw new Error("La auditoría no está disponible en este reto.");
      // Sin reglas: WCAG 2.1 A/AA completo, salvo título y lang del documento (no los controla el reto)
      var opts = rules && rules.length
        ? { runOnly: { type: "rule", values: rules } }
        : { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] }, rules: { "document-title": { enabled: false }, "html-has-lang": { enabled: false } } };
      var r = await window.axe.run(document, opts);
      return r.violations.map(function (v) { return { id: v.id, help: v.help, nodes: v.nodes.length, target: v.nodes[0] && v.nodes[0].target.join(" ") }; });
    },
    type: function (sel, value) { var el = document.querySelector(sel); if (!el) throw new Error("No existe el elemento " + sel); el.value = value; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); }
  };
  var AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

  function runOne(test) {
    return new Promise(function (resolve) {
      var done = false;
      var timer = setTimeout(function () {
        if (!done) { done = true; resolve({ name: test.name, passed: false, message: "Tiempo agotado (" + TIMEOUT / 1000 + " s)." }); }
      }, TIMEOUT);
      var finish = function (passed, message) {
        if (done) return; done = true; clearTimeout(timer);
        resolve({ name: test.name, passed: passed, message: message });
      };
      try {
        var fn = new AsyncFunction("$", "$$", "style", "rect", "text", "click", "wait", "near", "requests", "hits", "type", "audit", test.code);
        fn(helpers.$, helpers.$$, helpers.style, helpers.rect, helpers.text, helpers.click, helpers.wait, helpers.near, helpers.requests, helpers.hits, helpers.type, helpers.audit)
          .then(function (out) {
            if (out === true) return finish(true, "Correcto");
            if (out && typeof out === "object" && "pass" in out) return finish(!!out.pass, out.message || (out.pass ? "Correcto" : test.message || "No se cumple"));
            finish(false, typeof out === "string" ? out : test.message || "No se cumple");
          })
          .catch(function (e) { finish(false, (e && e.message) || String(e)); });
      } catch (e) {
        finish(false, (e && e.message) || String(e));
      }
    });
  }

  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || data.__webwiz !== "run-dom-tests") return;
    var start = function () {
      // Pausa breve para que se apliquen estilos y scripts del usuario
      setTimeout(async function () {
        void document.body && document.body.getBoundingClientRect();
        var results = [];
        for (var i = 0; i < data.tests.length; i++) results.push(await runOne(data.tests[i]));
        parent.postMessage({ __webwiz: "dom-results", runId: data.runId, results: results }, "*");
      }, 50);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start);
  });
  parent.postMessage({ __webwiz: "harness-ready" }, "*");
})();
`;
