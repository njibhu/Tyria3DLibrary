module.exports = {
  extends: ["standard", "prettier"],
  rules: {
    quotes: ["error", "double"],
    semi: ["error", "always"],
    "space-before-function-paren": ["error", "never"],
    "no-var": "error"
  },
  env: { browser: true },
  globals: {
    T3D: true,
    DataStream: true,
    THREE: true
  }
};
