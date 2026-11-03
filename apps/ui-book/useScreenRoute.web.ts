import {useEffect, useState} from 'react'

function readLabelFromHash(): string | null {
  const label = decodeURIComponent(window.location.hash.slice(1))
  return label === '' ? null : label
}

// The hash keeps the open screen in the URL, so browser back/forward and
// reloads work without a router.
export function useScreenRoute(): readonly [
  string | null,
  (label: string | null) => void,
] {
  const [label, setLabel] = useState(readLabelFromHash)

  useEffect(() => {
    const onPopState = (): void => {
      setLabel(readLabelFromHash())
    }
    window.addEventListener('popstate', onPopState)
    return () => {
      window.removeEventListener('popstate', onPopState)
    }
  }, [])

  const navigate = (next: string | null): void => {
    const {pathname, search} = window.location
    const hash = next === null ? '' : `#${encodeURIComponent(next)}`
    window.history.pushState(null, '', `${pathname}${search}${hash}`)
    setLabel(next)
  }

  return [label, navigate]
}
