import {Link} from '@remix-run/react'
import classes from './route.module.css'

export default function index(): JSX.Element {
  return (
    <div>
      <p className="text-container">
        This is a website for deleting your account. Please click the link below
        to delete your account.
      </p>

      <p>
        The best way to delete your account is to click on the{' '}
        <i>delete account</i> button in the app:
      </p>

      <img className={classes.image} src="/assets/delete.jpeg"></img>

      <p>
        If you lost your phone or uninstalled the app you can remove your
        account using this page.
      </p>

      <Link className="button" to="/deleteAccount1">
        I understand, I want to delete my account here, on the website
      </Link>
    </div>
  )
}
