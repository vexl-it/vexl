import {useNavigate} from '@remix-run/react'
import {useEffect} from 'react'

export default function link(): JSX.Element {
  const navigate = useNavigate()
  useEffect(() => {
    // @ts-expect-error browser shit
    window.location = 'https://vexl.it/download'
  }, [navigate])

  return <p>Redirecting</p>
}
