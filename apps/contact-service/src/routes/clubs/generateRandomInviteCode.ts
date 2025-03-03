import {Effect} from 'effect'

const INVITE_CODE_LENGTH = 6

const CHARACTERS = '0123456789'
const CHARACTERS_LENGTH = CHARACTERS.length

export const generateRandomInviteCode = Effect.sync(() => {
  let result = ''
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    result += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS_LENGTH))
  }
  return result
})
