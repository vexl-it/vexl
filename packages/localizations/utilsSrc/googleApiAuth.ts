import {google} from 'googleapis'
import {type GoogleAuth} from 'google-auth-library'

// The scopes for your requests
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

export async function authorize(): Promise<GoogleAuth> {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(String(process.env.SERVICE_ACCOUNT)),
    scopes: SCOPES,
  })
  return auth
}
