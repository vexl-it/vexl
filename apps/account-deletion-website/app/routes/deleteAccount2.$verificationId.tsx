import { redirect, type ActionFunction } from "@remix-run/node";
import { Form, Link, useActionData, useParams } from "@remix-run/react";
import { effectToTaskEither } from "@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter";
import { Schema } from "effect";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import LoadingAwareSubmitButton from "../LoadingAwareSubmitButton";
import {
  createContactsPublicApi,
  createUserPublicApi,
  parseFormData,
} from "../utils";
import { EraseUserVerificationId } from "@vexl-next/rest-api/src/services/user/contracts";
import React from "react";

export default function DeleteAccount2(): React.ReactElement {
  const params = useParams();
  const actionData = useActionData<typeof action>();

  return (
    <div>
      {!!actionData?.error && <p className="error">{actionData.error}</p>}

      <Form id="input-number" method="post">
        <label>
          <div className="label">Code from message</div>
          <input
            className="input-field"
            name="code"
            required
            aria-label="Your phone number with prefix"
            type="tel"
            placeholder="code from message"
          />
        </label>
        <Link className="block-align-end" to="/deleteAccount1">
          Resent
        </Link>
        <input
          type="hidden"
          name="debugData"
          // @ts-expect-error for debug only
          value={(window.debugData as boolean) ? "true" : "false"}
        />
        <input
          type="hidden"
          name="verificationId"
          value={decodeURIComponent(params.verificationId ?? "")}
        />
        <p>
          You are about to delete your account. This action is irreversible. Do
          really you want to delete your account?
        </p>
        <LoadingAwareSubmitButton
          formAction="/deleteAccount2"
          label="Yes delete"
        />
      </Form>
    </div>
  );
}

export const action: ActionFunction = async ({ request }) => {
  return await pipe(
    TE.Do,
    TE.chainW(() =>
      effectToTaskEither(
        parseFormData(
          Schema.Struct({
            code: Schema.String,
            verificationId: EraseUserVerificationId,
            debugData: Schema.optionalWith(Schema.BooleanFromString, {
              default: () => false,
            }),
          }),
        )(request),
      ),
    ),
    TE.bindTo("data"),
    TE.bindW("result", ({ data: { verificationId, code } }) =>
      effectToTaskEither(
        createUserPublicApi().verifyAndEraseUser({
          verificationId,
          code,
        }),
      ),
    ),
    TE.bindW(
      "contactResult",
      ({ result: { shortLivedTokenForErasingUserOnContactService } }) =>
        effectToTaskEither(
          createContactsPublicApi().eraseUserFromNetwork({
            token: shortLivedTokenForErasingUserOnContactService,
          }),
        ),
    ),
    TE.matchW(
      (left) => {
        if (left._tag === "ErrorParsingFormData") {
          return Response.json({ error: "Fill in the code, please." });
        }
        if (
          left._tag === "VerificationNotFoundError" ||
          left._tag === "InvalidVerificationIdError"
        ) {
          return Response.json({ error: "Bad verification code." });
        }
        return Response.json({
          error: "Unexpected error. Try to resend the code and try again.",
        });
      },
      ({ result, data }) => {
        return data.debugData
          ? redirect(
              `/printSession/${result.shortLivedTokenForErasingUserOnContactService}`,
            )
          : redirect(`/deleteAccount4`);
      },
    ),
  )();
};
