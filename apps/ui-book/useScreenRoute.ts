import {useState} from 'react'

export function useScreenRoute(): readonly [
  string | null,
  (label: string | null) => void,
] {
  return useState<string | null>(null)
}
