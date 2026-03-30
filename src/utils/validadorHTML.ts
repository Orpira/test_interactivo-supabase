// utils/validadorHTML.js

/**
 * Extrae todas las etiquetas completas del expectedOutput (por ejemplo: <header>...</header>)
 */
export interface ExtraerEtiquetasEsperadasOptions {
  expectedOutput: string;
}

export function extraerEtiquetasEsperadas(expectedOutput: string): string[] {
  const regex: RegExp = /<(\w+)>.*?<\/\1>/g;
  const etiquetas: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(expectedOutput)) !== null) {
    etiquetas.push(match[0]);
  }

  return etiquetas;
}

/**
 * Valida si el HTML escrito por el usuario contiene todas las etiquetas esperadas.
 * Ignora DOCTYPE, espacios, mayúsculas y otras etiquetas no requeridas.
 */
export interface ValidarHTMLOptions {
  usuarioHTML: string;
  expectedOutput: string;
}

export function validarHTML(
  usuarioHTML: string,
  expectedOutput: string
): boolean {
  const etiquetasEsperadas: string[] =
    extraerEtiquetasEsperadas(expectedOutput);

  // Normalizar HTML del usuario
  const htmlMinificado: string = usuarioHTML.replace(/\s+/g, "").toLowerCase();

  // Validar que todas las etiquetas esperadas estén presentes
  return etiquetasEsperadas.every((etiqueta: string) => {
    const etiquetaMin: string = etiqueta.replace(/\s+/g, "").toLowerCase();
    return htmlMinificado.includes(etiquetaMin);
  });
}
