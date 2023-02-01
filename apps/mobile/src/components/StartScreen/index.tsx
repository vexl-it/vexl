import styled from '@emotion/native'
import Text from '../Text'
import React, {useEffect} from 'react'
import * as VCrypto from '@vexl-next/cryptography'
import {KeyFormat} from '@vexl-next/cryptography/dist/KeyHolder'
import crypto from 'crypto'
import {type PrivateKey} from '@vexl-next/cryptography'

const RootContainer = styled.SafeAreaView`
  flex: 1;
  align-items: center;
  justify-content: center;
`

// const WhiteArea = styled.View`
//   background-color: ${(p) => p.theme.colors.backgroundWhite};
//   flex: 1;
//   border-radius: 13px;
// `

// const TermsOfUseContainer = styled.View``
//
// const ContinueButton = styled(Button)``
//
// const LottieViewStyled = styled(LottieView)``
//
// const Name = styled.View``
//
// const LogoImage = styled(SvgUri)``
//
// const Title = styled(Text)``
//
// const TermsOfUseIcon = styled(SvgUri)``
//
// const TermsOfUseText = styled(Text)``

const ToBeDoneText = styled(Text)`
  font-family: '${(p) => p.theme.fonts.ttSatoshi600}';
  font-size: 40px;
`

function ecdsa(key: PrivateKey): boolean {
  const textToSign = 'This text should be signed'

  const signature = VCrypto.ecdsaSign({
    challenge: textToSign,
    privateKey: key,
  })

  const match = VCrypto.ecdsaVerify({
    challenge: textToSign,
    signature,
    pubKey: key,
  })

  if (!match) console.log('error', match, signature)
  return match
}

async function ecies(key: PrivateKey): Promise<boolean> {
  const textToEncrypt = crypto.randomBytes(1111).toString('hex')

  console.log('here')
  const encrypted = await VCrypto.eciesCTREncrypt({
    publicKey: key,
    data: 'some random message',
  })

  // const decrypted = VCrypto.eciesCTRDecrypt({
  //   data: encrypted,
  //   privateKey: key,
  // })
  //
  // if (decrypted !== textToEncrypt) console.log('error', decrypted)
  // return decrypted === textToEncrypt
  return true
}

function aes(key: PrivateKey): boolean {
  const textToEncrypt = crypto.randomBytes(1100).toString('hex')
  const pass = crypto.randomBytes(32).toString('hex')

  const encrypted = VCrypto.aesCTREncrypt({data: textToEncrypt, password: pass})
  const decrypted = VCrypto.aesCTRDecrypt({data: encrypted, password: pass})

  const success = textToEncrypt === decrypted
  if (!success) console.log('error', decrypted)
  return success
}

function hmac(): boolean {
  const textToEncrypt = crypto.randomBytes(1100).toString('hex')
  const pass = crypto.randomBytes(32).toString('hex')

  const signature = VCrypto.hmacSign({password: pass, data: textToEncrypt})
  const success = VCrypto.hmacVerify({
    password: pass,
    data: textToEncrypt,
    signature,
  })

  if (!success) console.log('error', signature)
  return success
}

export default function StartScreen(): JSX.Element {
  useEffect(() => {
    const key = VCrypto.PrivateKey.import({
      key: '4y6hUGdwwsdOPkAU3gRZiTmjrc+glpYl345KmQ==',
      type: KeyFormat.RAW,
    })
    ;(async () => {
      try {
        let i = 1000

        const start = Date.now()
        while (i > 0) {
          // console.log('i', i)
          // if (!ecdsa(key)) {
          //   console.log('Ecies error')
          //   break
          // }
          const start2 = Date.now()
          console.log('herer')
          if (!(await ecies(key))) {
            console.log('Ecies error')
            break
          }
          console.log('total: ', Date.now() - start2)
          //
          // if (!aes(key)) {
          //   console.log('aes error')
          //   break
          // }

          // if (!hmac()) {
          //   console.log('hmac error')
          //   break
          // }
          // console.log('done')

          i = i - 1
        }
        console.log('Ellapsed time', Date.now() - start)

        console.log('done')
      } catch (e) {
        console.error(e)
      }
    })()
  }, [])
  return (
    <RootContainer>
      <ToBeDoneText colorStyle={'white'}>To be done</ToBeDoneText>
    </RootContainer>
  )
}
