export function validateCode(
  userCode: string,
  rules: string[] = [],
  expectedCode?: string
): boolean {
  const normalizedUserCode = normalize(userCode);

  // Si hay reglas, verifica que todas estén presentes en el código del usuario
  if (rules.length > 0) {
    return rules.every((rule) => normalizedUserCode.includes(normalize(rule)));
  }

  // Si hay un código esperado, verifica que coincida exactamente
  if (expectedCode) {
    const normalizedExpectedCode = normalize(expectedCode);
    return normalizedUserCode === normalizedExpectedCode;
  }

  // Si no hay reglas ni código esperado, devuelve false
  return false;
}

export type ValidationRule =
  | { type: "equals" } // === expected
  | { type: "contains"; value: string } // incluye texto
  | { type: "regex"; pattern: RegExp }; // pasa RegExp

function normalize(user: string): string {
  if (typeof user !== "string") {
    throw new TypeError(`Expected a string, but received ${typeof user}`);
  }
  return user.replace(/\s+/g, "").toLowerCase().trim();
}
