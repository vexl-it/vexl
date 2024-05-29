module.exports = {
  root: true,
  extends: ['@vexl-next/eslint-config'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: [
      './tsconfig.json',
      './client/tsconfig.json',
      './server/tsconfig.json',
      './common/tsconfig.json',
      'vite.tsconfig.json',
    ],
  },
}
