import {
  deleteUser,
  exportData,
  initPhoneVerification,
  verifyChallenge,
  verifyPhoneNumber,
} from "../api/user";
import rl from "../utils/rl";
import { ecdsaSign } from "../crypto";
import { Command } from "commander";
import fs from "node:fs";
import base64toBinary from "../utils/base64toBinary";
import { registerUser } from "../api/contact";
import { setCredentials } from "../api/credentialsSession";
import resolveFilePath from "../utils/resolveFilePath";
import { KeyFormat, PrivateKey } from "../crypto/KeyHolder";

async function user({
  phoneNumber,
  privateKey,
}: {
  phoneNumber: string;
  privateKey: PrivateKey;
}) {
  const {
    data: { verificationId, expirationAt },
  } = await initPhoneVerification({ phoneNumber });
  const code = await rl.question(
    `Enter verification code sent to ${phoneNumber}: `
  );

  const {
    data: { challenge, phoneVerified },
  } = await verifyPhoneNumber({
    id: verificationId,
    code,
    userPublicKey: privateKey.exportPublicKey(),
  });
  console.log("Phone verified. Signing challenge");

  const signature = ecdsaSign({
    challenge,
    privateKey,
  });

  const { data: verificationResult } = await verifyChallenge({
    userPublicKey: privateKey.exportPublicKey(),
    signature: signature,
  });
  console.log("Verified successfully.");
  return verificationResult;
}

export function setupLoginCommands(program: Command) {
  const subcommand = program.command("user").description("User management");

  subcommand
    .command("login")
    .description("Create new vexl account.")
    .argument("<string>", "Phone number in +420XXXXXXXXX format.")
    .option(
      "-k, --privateKey <string>",
      "Pem base64 encoded private key to use. If not set a new keypair will be generated."
    )
    .option(
      "-o, --output <path>",
      "Directory of credentials file. If not exists creates new one",
      "./user.credentials.json"
    )
    .option(
      "--firebase-token <string>",
      "Firebase key to send to contact service. If not set, random one will be generated."
    )
    .action(async (phoneNumber: string, options) => {
      let privateKey: PrivateKey;

      const outputPath = resolveFilePath(options.output);

      if (options.keyPair) {
        console.log(`Using provided private key to generate a keypair`);
        privateKey = PrivateKey.import({
          key: options.KeyPair,
          type: KeyFormat.PEM_BASE64,
        });
      } else {
        console.log("Generating new keypair");
        privateKey = PrivateKey.generate();
      }

      console.log("Logging in to user service");
      const loginResult = await user({ phoneNumber, privateKey: privateKey });
      if (!loginResult.challengeVerified) {
        throw "Server challenge verification failed.";
      }

      const credentials = {
        privateKey,
        hash: loginResult.hash,
        signature: loginResult.signature,
      };
      setCredentials(credentials);

      console.log("Logging in to to contact service");
      const firebaseToken =
        options.firebaseToken || Math.random().toString(36).substring(7);
      await registerUser({ firebaseToken });

      console.log("Saving credentials into", outputPath);

      fs.writeFileSync(
        outputPath,
        JSON.stringify({
          privateKey: privateKey.exportPrivateKey(),
          hash: loginResult.hash,
          signature: loginResult.signature,
        })
      );
    });

  subcommand
    .command("delete")
    .description("Delete user.")
    .option(
      "-c, --credentials <path>",
      "Directory of credentials file.",
      "./user.credentials.json"
    )
    .option(
      "--keep-credentials",
      "If set, credentials file will not be deleted."
    )
    .action(async (options) => {
      const credentialsPath = resolveFilePath(options.credentials);

      console.log("Deleting user");
      await deleteUser();
      console.log("User deleted");

      if (options.keepCredentials) {
        console.log("Credentials file kept.");
      } else {
        console.log("Deleting credentials file", credentialsPath);
        fs.unlinkSync(credentialsPath);
      }
    });

  subcommand
    .command("export")
    .description(
      "Export all collected data about user. Will generate a pdf file"
    )
    .requiredOption("-o, --output <path>", "Output path to save pdf into")
    .option(
      "-c, --credentials <path>",
      "Directory of credentials file.",
      "./user.credentials.json"
    )
    .action(async (options) => {
      const outputPath = resolveFilePath(options.output);

      console.log(`Exporting user.`);
      const {
        data: { pdfFile: base64Pdf },
      } = await exportData();
      const buffer = base64toBinary(base64Pdf);
      fs.writeFileSync(outputPath, buffer, "binary");
      console.log("Pdf file saved into ", outputPath);
    });
}
