import { type ActionFunction } from "@remix-run/node";
import { Form, redirect, useActionData } from "@remix-run/react";
import { E164PhoneNumberE } from "@vexl-next/domain/src/general/E164PhoneNumber.brand";
import { effectToTaskEither } from "@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter";
import { Schema } from "effect";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import LoadingAwareSubmitButton from "../LoadingAwareSubmitButton";
import { createUserPublicApi, parseFormData } from "../utils";

export default function DeleteAccount1(): JSX.Element {
  const actionData = useActionData<typeof action>();

  return (
    <div>
      <p>
        To delete your account, login with the phone number you used in the Vexl
        app.
      </p>
      {!!actionData?.error && <p className="error">{actionData.error}</p>}
      <Form id="input-number" method="post">
        <label>
          <div className="label">Phone number</div>
          <input
            className="input-field"
            name="phoneNumber"
            aria-label="Your phone number with prefix"
            type="text"
            placeholder="+420 123 123 123"
          />
        </label>
        <LoadingAwareSubmitButton formAction="/deleteAccount1" label="Next" />
      </Form>
    </div>
  );
}

export const action: ActionFunction = async ({ request }) => {
  return await pipe(
    TE.Do,
    TE.chainW(() =>
      effectToTaskEither(
        parseFormData(Schema.Struct({ phoneNumber: E164PhoneNumberE }))(request)
      )
    ),
    TE.chainW(({ phoneNumber }) =>
      effectToTaskEither(createUserPublicApi().initEraseUser({ phoneNumber }))
    ),
    TE.matchW(
      (e) => {
        if (e._tag === "ErrorParsingFormData") {
          return Response.json({ error: "Invalid phone number." });
        }

        return Response.json({ error: "Unknown error." });
      },
      (result) => {
        return redirect(
          `/deleteAccount2/${encodeURIComponent(String(result.verificationId))}`
        );
      }
    )
  )();
};
