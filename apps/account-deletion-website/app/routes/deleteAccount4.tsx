import {useNavigate} from '@remix-run/react'
import {useEffect} from 'react'

export default function deleteAccount4(): JSX.Element {
  const navigate = useNavigate()
  useEffect(() => {
    sessionStorage.removeItem('keypair')

    const timeoutId = setTimeout(() => {
      navigate('/')
    }, 5000)
    return () => {
      clearTimeout(timeoutId)
    }
  }, [navigate])

  return <p>Account deleted. We are sorry to see you go 😥.</p>
}
