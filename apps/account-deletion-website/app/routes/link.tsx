import { useNavigate } from "@remix-run/react";
import { useEffect } from "react";

export default function Link(): React.ReactElement {
  const navigate = useNavigate();
  useEffect(() => {
    // @ts-expect-error browser shit
    window.location = "https://vexl.it/download";
  }, [navigate]);

  return <p>Redirecting</p>;
}
