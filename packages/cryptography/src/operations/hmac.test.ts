import {hmacSign, hmacVerify} from './hmac'
import crypto from 'node:crypto'

const password = crypto
  .pbkdf2Sync('testPass', 'vexlvexl', 2000, 108, 'sha256')
  .subarray(44, 44 + 64)
  .toString('base64')

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
  const password = crypto
    .pbkdf2Sync('something', 'vexlvexl', 2000, 108, 'sha256')
    .subarray(44, 44 + 64)
    .toString('base64')

  expect(hmacSign({password, data: 'something else'})).toEqual(
    'MWrLhqnIDcPLSXzqJUbo0Bm+qL430mUs3ZtptnA+ylw='
  )
})
