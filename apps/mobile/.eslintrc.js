module.exports = {
  root: true,
  extends: ['@vexl-next/eslint-config/react.js'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
}
