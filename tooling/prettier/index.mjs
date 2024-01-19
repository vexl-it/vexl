/** @typedef  {import("prettier").Config} PrettierConfig */

/** @type { PrettierConfig } */
const config = {
  trailingComma: 'es5',
  singleQuote: true,
  bracketSpacing: false,
  quoteProps: 'preserve',
  semi: false,
  plugins: ['prettier-plugin-organize-imports'],
}

export default config
