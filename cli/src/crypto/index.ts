import crypto from "node:crypto";
import { appendVersion, parseStringWithVersion } from "./versionWrapper";
import { PrivateKey, PublicKey } from "./KeyHolder";
import {
  CURVE,
  CYPHER_ALGORITHM,
  HMAC_ALGORITHM,
  PBKDF2ITER,
  SALT,
} from "./constants";

export interface KeyPair {
  raw: {
    publicKey: string;
    privateKey: string;
  };
  pem: {
    publicKey: string;
    privateKey: string;
  };
}

export function ecdsaSign({
  challenge,
  privateKey,
}: {
  challenge: string;
  privateKey: PrivateKey;
}): string {
  const sign = crypto.createSign("sha256");
  sign.write(challenge);
  sign.end();

  return sign.sign(privateKey.privateKeyPem).toString("base64");
}

export function ecdsaVerify({
  challenge,
  signature,
  pubKey,
}: {
  challenge: string;
  signature: string;
  pubKey: PublicKey;
}): boolean {
  const verify = crypto.createVerify("sha256");
  verify.write(challenge);
  verify.end();

  return verify.verify(pubKey.publicKeyPem, signature, "base64");
}

export function aesEncrypt({
  data,
  password,
}: {
  data: string;
  password: string;
}): string {
  const stretchedPass = crypto.pbkdf2Sync(
    password,
    SALT,
    PBKDF2ITER,
    32 + 12,
    // TODO sha1 or sha256?
    "sha1"
  );

  const cipherKey = stretchedPass.subarray(0, 32);
  const iv = stretchedPass.subarray(32, 32 + 12);

  const cipher = crypto.createCipheriv(CYPHER_ALGORITHM, cipherKey, iv);

  const encrypted = Buffer.concat([
    cipher.update(data, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return appendVersion(
    `${encrypted.toString("base64")}.${authTag.toString("base64")}`,
    1
  );
}

export function aesCTREncrypt({
  data,
  password,
}: {
  data: string;
  password: string;
}): string {
  const stretchedPass = crypto.pbkdf2Sync(
    password,
    SALT,
    PBKDF2ITER,
    32 + 12,
    // TODO sha1 or sha256?
    "sha1"
  );

  const cipherKey = stretchedPass.subarray(0, 32);
  const iv = Buffer.concat([
    stretchedPass.subarray(32, 32 + 12),
    Buffer.from([0, 0, 0, 1]),
  ]);

  const cipher = crypto.createCipheriv("aes-256-ctr", cipherKey, iv);
  cipher.setAutoPadding(false);

  const encrypted = Buffer.concat([
    cipher.update(data, "utf8"),
    cipher.final(),
  ]);
  // const authTag = cipher.getAuthTag();

  return appendVersion(`${encrypted.toString("base64")}`, 1);
}

export function aesDecrypt({
  data: dataWithVersion,
  password,
}: {
  data: string;
  password: string;
}): string {
  const { data } = parseStringWithVersion(dataWithVersion);
  const stretchedPass = crypto.pbkdf2Sync(
    password,
    SALT,
    PBKDF2ITER,
    32 + 12,
    // TODO sha1 or sha256?
    "sha1"
  );
  const cipherKey = stretchedPass.subarray(0, 32);
  const iv = stretchedPass.subarray(32, 32 + 12);

  const decipher = crypto.createDecipheriv(CYPHER_ALGORITHM, cipherKey, iv);

  const [encrypted, authTag] = data.split(".");
  decipher.setAuthTag(Buffer.from(authTag, "base64"));

  return `${decipher.update(encrypted, "base64", "utf8")}${decipher.final(
    "utf8"
  )}`;
}

export function aesCTRDecrypt({
  data: dataWithVersion,
  password,
}: {
  data: string;
  password: string;
}): string {
  const data = dataWithVersion;
  const stretchedPass = crypto.pbkdf2Sync(
    password,
    SALT,
    PBKDF2ITER,
    32 + 12,
    // TODO sha1 or sha256?
    "sha1"
  );
  const cipherKey = stretchedPass.subarray(0, 32);

  const iv = Buffer.concat([
    stretchedPass.subarray(32, 32 + 12),
    Buffer.from([0, 0, 0, 2]),
  ]);

  const decipher = crypto.createDecipheriv("aes-256-ctr", cipherKey, iv);

  const [encrypted] = data.split(".");

  return `${decipher.update(encrypted, "base64", "utf8")}${decipher.final(
    "utf8"
  )}`;
}

export function eciesEncrypt({
  publicKey,
  data,
}: {
  publicKey: PublicKey;
  data: string;
}) {
  const ecdh = crypto.createECDH(CURVE);
  ecdh.generateKeys();

  const epk = ecdh.getPublicKey();

  const sharedSecret = ecdh.computeSecret(publicKey.publicKeyRaw);

  const stretchedPass = crypto.pbkdf2Sync(
    sharedSecret,
    SALT,
    PBKDF2ITER,
    32 + 12,
    "sha1"
  );
  const cipherKey = stretchedPass.subarray(0, 32);
  const iv = stretchedPass.subarray(32, 32 + 12);

  const cipher = crypto.createCipheriv(CYPHER_ALGORITHM, cipherKey, iv);
  const cipherText = Buffer.concat([
    cipher.update(data, "utf8"),
    cipher.final(),
  ]);
  const securityTag = cipher.getAuthTag();

  const mac = crypto
    .createHmac(
      HMAC_ALGORITHM,
      crypto
        .pbkdf2Sync(sharedSecret, SALT, PBKDF2ITER, 108, "sha256")
        .subarray(44, 44 + 64)
    )
    .update(cipherText.toString("base64"))
    .digest();

  return appendVersion(
    [
      cipherText.toString("base64"),
      mac.toString("base64"),
      epk.toString("base64"),
      securityTag.toString("base64"),
    ].join("."),
    1
  );
}

export function eciesDecrypt({
  privateKey,
  data: dataBase64,
}: {
  privateKey: PrivateKey;
  data: string;
}) {
  const { data } = parseStringWithVersion(dataBase64);
  const [cipherText, mac, epk, securityTag] = data.split(".");

  const ecdh = crypto.createECDH(CURVE);
  ecdh.setPrivateKey(privateKey.privateKeyRaw);

  const sharedSecret = ecdh.computeSecret(epk, "base64");

  const computedMac = crypto
    .createHmac(
      HMAC_ALGORITHM,
      crypto
        .pbkdf2Sync(sharedSecret, SALT, PBKDF2ITER, 108, "sha256")
        .subarray(44, 44 + 64)
    )
    .update(cipherText)
    .digest("base64");

  if (computedMac !== mac) {
    throw new Error("MAC mismatch");
  }

  const stretchedPass = crypto.pbkdf2Sync(
    ecdh.computeSecret(Buffer.from(epk, "base64")),
    SALT,
    PBKDF2ITER,
    32 + 12,
    "sha1"
  );
  const cipherKey = stretchedPass.subarray(0, 32);
  const iv = stretchedPass.subarray(32, 32 + 12);

  const decipher = crypto.createDecipheriv(CYPHER_ALGORITHM, cipherKey, iv);
  decipher.setAuthTag(Buffer.from(securityTag, "base64"));

  return `${decipher.update(cipherText, "base64", "utf8")}${decipher.final(
    "utf8"
  )}`;
}

export function hmacSign({
  password,
  data,
}: {
  password: string;
  data: string;
}) {
  const stretched = crypto
    .pbkdf2Sync(password, SALT, PBKDF2ITER, 108, "sha256")
    .subarray(44, 44 + 64);

  const result = crypto
    .createHmac(HMAC_ALGORITHM, stretched)
    .update(data)
    .digest("base64");
  return result;
}

export function hmacVerify({
  password,
  data,
  signature,
}: {
  password: string;
  data: string;
  signature: string;
}) {
  const stretched = crypto
    .pbkdf2Sync(password, SALT, PBKDF2ITER, 108, "sha256")
    .subarray(44, 44 + 64);

  const hmac = crypto.createHmac(HMAC_ALGORITHM, stretched);
  const hash = hmac.update(data).digest("base64");
  return hash === signature;
}
