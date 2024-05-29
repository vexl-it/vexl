export const formatNumber = (number: number): string =>
  Intl.NumberFormat().format(number)
