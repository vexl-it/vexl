import { useNavigation } from "@remix-run/react";
import React from "react";

export default function LoadingAwareSubmitButton({
  formAction,
  label,
}: {
  formAction: string;
  label: string;
}): React.ReactElement {
  const navigation = useNavigation();
  const isLoading = navigation.formAction?.startsWith(formAction);

  return (
    <input
      className="button"
      type="submit"
      value={isLoading ? "Loading..." : label}
      disabled={isLoading}
    />
  );
}
