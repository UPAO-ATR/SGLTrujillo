import { describe, expect, it } from "vitest";
import { Api } from "./ClienteApi.js";

describe("cliente API", () => {
  it("expone las operaciones necesarias", () => {
    expect(typeof Api.Get).toBe("function");
    expect(typeof Api.Post).toBe("function");
    expect(typeof Api.Put).toBe("function");
    expect(typeof Api.Delete).toBe("function");
  });
});
