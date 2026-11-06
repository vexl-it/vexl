const isDev = process.env.NODE_ENV === 'development'

/**
 * The site only talks to our own origins. Next finds the nonce in the
 * request's policy and puts it on its inline scripts.
 */
export function contentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    // React uses eval in dev to rebuild server error stacks
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ''}`,
    // The global-styles embed, React style props and the CMS's figure widths
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://resources.vexl.it",
    // webflow.css inlines its icon font (the mobile menu icon) as a data URL
    "font-src 'self' data:",
    'frame-src https://www.youtube-nocookie.com',
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ')
}
