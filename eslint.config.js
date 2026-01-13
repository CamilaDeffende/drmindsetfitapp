import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

/**
 * ESLint v9+ (Flat Config) — configuração mínima e estável
 * Objetivo: não quebrar o build e manter regras essenciais.
 */
export default [
  {
    ignores: [
      "dist/**",
      ".scan/**",
      "Drmindsetfitpro/**",
      "scripts/_archive/**",
      "node_modules/**",
      "tailwind.config.js",
      "**/*.min.js",
      "**/*.bundle.js",
      "**/_broken/**",
      "**/_broken/**/*",
      "src/**/_broken/**",
      "src/**/_broken/**/*"
    ],
  },
js.configs.recommended,

  // TypeScript (sem type-aware pesado)
  ...tseslint.configs.recommended,

  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // React Hooks (essencial)
      ...reactHooks.configs.recommended.rules,

      // Fast refresh (aviso apenas)
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // Alívio controlado (seu código já tinha vários casos)
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },

  {
    files: ["scripts/**/*.mjs", "scripts/**/*.js"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
      },
    },
  },

];
