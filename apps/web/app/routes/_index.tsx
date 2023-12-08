import type {MetaFunction} from '@remix-run/node'
import {publicApi} from '@vexl-next/rest-api/dist/services/user/index.js'
import {ServiceUrl} from '@vexl-next/rest-api/dist/ServiceUrl.brand.js'
import {PlatformName} from '@vexl-next/rest-api'
import {type E164PhoneNumber} from '@vexl-next/domain/dist/general/E164PhoneNumber.brand.js'
import {KeyHolder} from '@vexl-next/cryptography'
import {curves} from '@vexl-next/cryptography/dist/KeyHolder/Curve.brand.js'
import {useMemo} from 'react'

export const meta: MetaFunction = () => {
  return [
    {title: 'New Remix App'},
    {name: 'description', content: 'Welcome to Remix!'},
  ]
}

function initPhoneVerification(phoneNumber: E164PhoneNumber) {
  const userPublicApi = publicApi({
    clientVersion: 0,
    url: ServiceUrl.parse('https://stage-user.vexl.it'),
    platform: PlatformName.parse('WEB'),
  })

  userPublicApi.initPhoneVerification({phoneNumber})
}

function generateKeys() {
  return KeyHolder.generatePrivateKey(curves.secp256k1)
}

export default function Index(): JSX.Element {
  const keys = useMemo(() => {
    return generateKeys()
  }, [])

  return (
    <div>
      <div>
        <h1>keys</h1>
        <code>{JSON.stringify(keys, null, 2)}</code>
      </div>
    </div>
  )
}
