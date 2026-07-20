// Configura la ejecución y cobertura de las pruebas del servidor.

import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: [
        "src/Dominio/**/*.js",
        "src/Utilidades/**/*.js",
        "src/Validadores/**/*.js",
      ],
    },
  },
});