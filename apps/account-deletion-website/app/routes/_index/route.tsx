import { Link } from "@remix-run/react";
import classes from "./route.module.css";

export default function index(): React.ReactElement {
  return (
    <div>
      <p>
        If you have lost your phone or uninstalled the app you can use this page
        to remove and delete your account. If you want to continue, click the
        link below and follow the steps to delete your account.
      </p>
      <p>
        You can also delete your account in the app by clicking on the delete
        account button in the app:
      </p>
      <img className={classes.image} alt="" src="/assets/delete.jpeg"></img>
      <p>
        If you choose to delete your account through this website, the following
        data will be immediately removed:
      </p>
      <p>
        <ul>
          <li>Hashes of your phone number used to log into Vexl.</li>
          <li>Your inbox associated with your account. </li>
          <li>
            All information regarding contacts you&apos;ve added to your Vexl
            network (note: we only store hashed versions of this data).
          </li>
        </ul>
      </p>
      <p>After 30 days, the following will be deleted:</p>
      <p>
        <ul>
          <li>Any posts you&apos;ve created.</li>
        </ul>
      </p>
      <p>
        To expedite this process, you can delete your account directly in the
        app (refer to the image above). The delay in removing posts is because
        they are not linked to your phone number. Instead, your device generates
        and maintains a secret passkey for each of your posts. The app
        automatically updates these posts, which will be removed if not
        refreshed within 30 days.
      </p>
      <Link className="button" to="/deleteAccount1">
        I understand, I want to delete my account
      </Link>
    </div>
  );
}
