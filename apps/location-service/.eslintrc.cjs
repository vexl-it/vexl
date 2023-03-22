module.exports = {
  root: true,
  extends: ['@vexl-next/eslint-config'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
}
