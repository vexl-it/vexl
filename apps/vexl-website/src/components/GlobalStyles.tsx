import React from 'react'

// Webflow's "global-styles" embed, inlined like on Webflow: only some pages
// have it, and a CSS import would leak into the others.
const css = `
body {
  min-height: 0vw;
  font-size: calc(0.6806930693069307vw + 0.359220297029703em);
}
/* Max Font Size */
@media screen and (min-width: 1800px) {
  body {
    font-size: 1.125em;
  }
}
/* Min Font Size */
@media screen and (max-width: 991px) {
  body {
    font-size: calc(0.6054490413723511vw + 0.375em);
  }
}
.container {
  max-width: 100em;
}

html {
  background-image: url('/wf/62fdf272e0d4c0047648504c_pattern.webp');
  background-position: 0px 0px;
  background-size: 180px 100px;
  background-repeat: repeat;
  background-color: black;
}

body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

.cursor-wrapper {
  pointer-events: none;
}

@media screen and (min-width: 992px) {
  .accordion-headline {
    writing-mode: vertical-rl;
  }
}

a {
  color: inherit;
  text-decoration: none;
}

.splide__pagination > li {
  width: 100%;
  list-style-type: none;
}
`

export function GlobalStyles(): React.JSX.Element {
  return (
    <div className="global-styles w-embed">
      <style>{css}</style>
    </div>
  )
}
