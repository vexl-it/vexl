import {Link} from '@remix-run/react'
import classes from './route.module.css'

export default function index(): JSX.Element {
  return (
    <div>
      <p className="text-container">
        If you have lost your phone or uninstalled the app you can use this page
        to remove and delete your account. If you want to continue, click the
        link below and follow the steps to delete your account.
      </p>
      <p>
        You can also delete your account in the app by clicking on the{' '}
        <i>delete account</i> button in the app:
      </p>
      <img className={classes.image} src="/assets/delete.jpeg"></img>
      <Link className="button" to="/deleteAccount1">
        I understand, I want to delete my account here, on the website
      </Link>
    </div>
  )
}
