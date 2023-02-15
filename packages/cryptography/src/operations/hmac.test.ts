import {hmacSign, hmacVerify} from './hmac'

const password = 'testPass'

it('Should successfully sign and verify', () => {
  const data = 'Some data'
  const signature = hmacSign({data, password})
  const verified = hmacVerify({data, signature, password})
  expect(verified).toEqual(true)
})

it('Should fail when verifying with bad signature', () => {
  const data = 'Some data'
  hmacSign({data, password})
  expect(hmacVerify({data, signature: 'MTs=.bad signature', password})).toEqual(
    false
  )
})

it('Should fail when verifying with bad password', () => {
  const data = 'Some data'
  const signature = hmacSign({data, password})
  expect(hmacVerify({data, signature, password: 'bad password'})).toEqual(false)
})

it('Should produce expected output', () => {
  expect(hmacSign({password: 'something', data: 'something else'})).toEqual(
    'MWrLhqnIDcPLSXzqJUbo0Bm+qL430mUs3ZtptnA+ylw='
  )
})
