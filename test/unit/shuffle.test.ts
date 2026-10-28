import { describe, it, expect } from "vitest";
import { shuffleArray } from "../../src/utils/shuffle";

describe("shuffleArray", () => {
	it("conserva los elementos y no muta el original", () => {
		const original = [1, 2, 3, 4, 5];
		const result = shuffleArray(original);
		expect(original).toEqual([1, 2, 3, 4, 5]);
		expect([...result].sort()).toEqual(original);
	});
});
