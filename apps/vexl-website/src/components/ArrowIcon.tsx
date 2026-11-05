import React from 'react'

/** Webflow's `arrow-icon` embed: a top-right arrow in the current color. */
export function ArrowIcon({
  className,
}: {
  readonly className: string
}): React.JSX.Element {
  return (
    <div className={`arrow-icon ${className} w-embed`}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M19.5089 5.88694C19.5089 5.62173 19.4035 5.36737 19.216 5.17984C19.0284 4.9923 18.7741 4.88694 18.5089 4.88694L6.97552 4.88694C6.42323 4.88694 5.97552 5.33465 5.97552 5.88694C5.97552 6.43922 6.42323 6.88694 6.97552 6.88694L16.0965 6.88694L5.6061 17.3773C5.21557 17.7678 5.21557 18.401 5.6061 18.7915C5.99662 19.182 6.62979 19.182 7.02031 18.7915L17.5089 8.30297L17.5088 17.2804C17.5088 17.8326 17.9566 18.2804 18.5088 18.2804C19.0611 18.2804 19.5088 17.8326 19.5088 17.2804L19.5089 5.88694Z"
          fill="currentColor"
        />
      </svg>
    </div>
  )
}
