import {connection} from 'next/server'
import DeleteAccount1Form from './DeleteAccount1Form'

export default async function DeleteAccount1Page() {
  await connection()

  const turnstileSiteKey =
    process.env.TURNSTILE_SITE_KEY ?? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  return (
    <div>
      <p>
        To delete your account, login with the phone number you used in the Vexl
        app.
      </p>
      <DeleteAccount1Form turnstileSiteKey={turnstileSiteKey} />
    </div>
  )
}
