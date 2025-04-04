import {stringToSvgStringRuntimeError} from '../../Image'

const cancelSvg =
  stringToSvgStringRuntimeError(`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14.75 14.75L1.25 1.25"  stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M14.75 1.25L1.25 14.75"  stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`)

export default cancelSvg
