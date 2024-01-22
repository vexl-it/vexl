import {stringToSvgStringRuntimeError} from '../../Image'

const radiusRingSvg = stringToSvgStringRuntimeError(`
  <svg  viewBox="0 0 343 343" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="171.5" cy="171.5" r="170.5" stroke="#FCCD6C" stroke-width="2"/>
  <path d="M343 171.5C343 266.217 266.217 343 171.5 343C76.7832 343 0 266.217 0 171.5C0 76.7832 76.7832 0 171.5 0C266.217 0 343 76.7832 343 171.5Z" fill="url(#paint0_radial_9421_38350)"/>
  <defs>
  <radialGradient id="paint0_radial_9421_38350" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(171.5 171.5) rotate(90) scale(171.5)">
  <stop stop-color="#FCCD6C" stop-opacity="0"/>
  <stop offset="0.932292" stop-color="#FCCD6C" stop-opacity="0.15"/>
  <stop offset="1" stop-color="#FCCD6C" stop-opacity="0.33"/>
  </radialGradient>
  </defs>
  </svg>
`)

export default radiusRingSvg
