import {stringToSvgStringRuntimeError} from '../Image'

const checkIconSvg = stringToSvgStringRuntimeError(`
<svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11 1L4.5 7L1.25 4.00013" stroke="#101010" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
  `)

export default checkIconSvg
