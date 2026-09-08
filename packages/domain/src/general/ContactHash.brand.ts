import {Schema} from 'effect'
import {HashedEmail} from './HashedEmail.brand'
import {HashedPhoneNumber} from './HashedPhoneNumber.brand'

/**
 * Client-side hash of a contact as sent to the contact network. The server
 * treats phone number and email hashes alike and cannot tell them apart.
 */
export const ContactHash = Schema.Union(HashedPhoneNumber, HashedEmail)
export type ContactHash = typeof ContactHash.Type
