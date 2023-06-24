import {stringToSvgStringRuntimeError} from '../Image'

const clearInputSvg = stringToSvgStringRuntimeError(`
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="12" cy="12" r="12" stroke="none" fill="#4C4C4C"/>
<path d="M15.375 8.625L8.625 15.375" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M15.375 15.375L8.625 8.625" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

`)

export default clearInputSvg
