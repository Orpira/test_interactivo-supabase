import { describe, it, expect } from "vitest";
import { validateCode } from "../../src/utils/validateCode";

describe("validateCode()", () => {
  it("devuelve true cuando coincide exactamente", () => {
    const userCode = "HOLA";
    const expectedCode = "HOLA";
    expect(validateCode(userCode, [], expectedCode)).toBe(true);
  });

  it("falla cuando no coincide exactamente", () => {
    const userCode = "HOLA";
    const expectedCode = "ADIOS";
    expect(validateCode(userCode, [], expectedCode)).toBe(false);
  });

  it("aprueba si contiene el texto requerido", () => {
    const userCode = "HOLA";
    const rules = ["HOLA"];
    expect(validateCode(userCode, rules)).toBe(true);
  });

  it("falla si el regex no hace match", () => {
    const userCode = "HOLA";
    const rules = ["ADIOS"];
    expect(validateCode(userCode, rules)).toBe(false);
  });

  it("permite combinar varias reglas", () => {
    const userCode = "function test() { return true; }";
    const rules = ["function test", "return true"];
    expect(validateCode(userCode, rules)).toBe(true);
  });
});
