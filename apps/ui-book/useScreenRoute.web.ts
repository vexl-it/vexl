import {useEffect, useState} from 'react'

function readLabelFromHash(): string | null {
  const label = decodeURIComponent(window.location.hash.slice(1))
  return label === '' ? null : label
}

function navigate(label: string | null): void {
  window.location.hash = label === null ? '' : encodeURIComponent(label)
}

// The hash keeps the open screen in the URL, so browser back/forward and
// reloads work without a router.
export function useScreenRoute(): readonly [
  string | null,
  (label: string | null) => void,
] {
  const [label, setLabel] = useState(readLabelFromHash)

  useEffect(() => {
    const onHashChange = (): void => {
      setLabel(readLabelFromHash())
    }
    window.addEventListener('hashchange', onHashChange)
    return () => {
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [])

  return [label, navigate]
}
