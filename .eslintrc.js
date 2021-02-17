module.exports = {
  plugins: ["prettier"],
  env: {
    es6: true,
    browser: true,
    node: true,
  },
  parserOptions: {
    sourceType: "module",
    allowImportExportEverywhere: true,
    ecmaVersion: 2017,
  },
  extends: ["eslint:recommended", "plugin:prettier/recommended"],
  rules: {
    "no-unused-vars": 1,
    "eslint linebreak-style": [0, "error", "windows"],
    "no-debugger": 0,
  },
};
