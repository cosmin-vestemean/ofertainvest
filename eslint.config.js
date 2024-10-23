import globals from "globals";
import pluginJs from "@eslint/js";
import pluginImport from "eslint-plugin-import";


export default [
  {languageOptions: { globals: {...globals.browser, ...globals.node} }},
  pluginJs.configs.recommended,
  {
    plugins: {
      import: pluginImport,
    },
    rules: {
      "import/no-cycle": [2, { maxDepth: 1 }],
    },
  },
];