import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Los tests viven en tests/ (fuera de src/) para que Next no los recorra
// al construir el app router. El alias replica el "@/*" de tsconfig.json.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
