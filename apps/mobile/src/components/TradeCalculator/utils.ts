export function replaceNonDecimalCharsInInput(input: string): string {
  if (isNaN(Number(input))) {
    return '0'
  }

  return input
}

export function addThousandsSeparatorSpacesToNumberInput(
  input: string
): string {
  try {
    const [integerPart = '0', decimalPart] = input.split('.')
    const formattedIntegerPart = integerPart?.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      ' '
    )
    return decimalPart
      ? `${formattedIntegerPart}.${decimalPart}`
      : formattedIntegerPart
  } catch (e) {
    return input
  }
}

export function removeThousandsSeparatorSpacesFromNumberInput(
  input: string
): string {
  try {
    return input.replace(/ /g, '')
  } catch (e) {
    return input
  }
}
