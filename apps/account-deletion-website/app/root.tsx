import { type LinksFunction } from "@remix-run/node";
import { Links, Meta, Outlet, Scripts } from "@remix-run/react";
import rootCss from "./root.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: rootCss },
];

export default function App(): React.ReactElement {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/x-icon;base64,AA" />
        <Meta />

        <Links />
      </head>
      <body>
        <div id="root">
          <section id="main">
            <h1>Vexl acount deletion</h1>

            <Outlet />
          </section>
          <footer id="footer">
            <a href="https://vexl.it/download">Download Vexl</a>
            <div>All rights reserved. Vexl (c) {new Date().getFullYear()}</div>
          </footer>
        </div>
        <Scripts />
      </body>
    </html>
  );
}
