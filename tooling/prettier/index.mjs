/** @typedef  {import("prettier").Config} PrettierConfig */

/** @type {import('prettier-plugin-embed').PrettierPluginEmbedOptions} */
const prettierPluginEmbedConfig = {}

/** @type {import('prettier-plugin-sql').SqlBaseOptions} */
const prettierPluginSqlConfig = {
  language: 'postgresql',
  keywordCase: 'upper',
}

/** @type { PrettierConfig } */
const config = {
  trailingComma: 'es5',
  singleQuote: true,
  bracketSpacing: false,
  quoteProps: 'preserve',
  semi: false,
  plugins: [
    'prettier-plugin-embed',
    'prettier-plugin-sql',
    'prettier-plugin-organize-imports',
  ],
  ...prettierPluginEmbedConfig,
  ...prettierPluginSqlConfig,
}

export default config
