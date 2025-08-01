export function replaceNonDecimalCharsInInput(input: string): string {
  const sanitizedInput = input.replace(/,/g, '.')

  if (isNaN(Number(sanitizedInput))) {
    return '0'
  }

  if (
    sanitizedInput.startsWith('0') &&
    sanitizedInput !== '0' &&
    !sanitizedInput.includes('.')
  ) {
    return sanitizedInput.replace(/^0+/, '')
  }

  return sanitizedInput
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

export function convertFiatValueToNumber(fiatValue: string): number {
  try {
    return Number(removeThousandsSeparatorSpacesFromNumberInput(fiatValue))
  } catch (e) {
    return 0
  }
}
