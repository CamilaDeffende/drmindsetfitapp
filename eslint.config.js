import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

/**
 * ESLint v9+ (Flat Config) — configuração estável (BUILD VERDE)
 * Objetivo: não quebrar build e manter regras essenciais.
 */
export default [
  {
    ignores: [ "dist/**",
      ".scan/**",
      ".backups/**",
      "Drmindsetfitpro/**",
      "scripts/_archive/**",
      "node_modules/**",
      "tailwind.config.js",
      "**/*.min.js",
      "**/*.bundle.js",
      "**/_broken/**",
      "src/**/_broken/**",
      ".bak.*/**", "dist/assets/**" ],
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

      // Alívio controlado
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },

  // scripts
  {
    files: ["scripts/**/*.{mjs,js,ts,tsx}"],
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
