import crypto from "node:crypto";
import ecKeyUtils from "eckey-utils";
import { CURVE } from "./constants";

export enum KeyFormat {
  PEM = "pem",
  RAW = "raw",
  PEM_BASE64 = "pemBase64",
}

export class PublicKey {
  protected constructor(
    readonly publicKeyPem: Buffer,
    readonly publicKeyRaw: Buffer
  ) {}

  exportPublicKey(format: KeyFormat = KeyFormat.PEM_BASE64): string {
    if (format === KeyFormat.PEM) return this.publicKeyPem.toString();
    if (format === KeyFormat.RAW) return this.publicKeyRaw.toString("base64");
    return this.publicKeyPem.toString("base64");
  }

  equals(other: PublicKey): boolean {
    return (
      other instanceof PublicKey &&
      Buffer.compare(this.publicKeyRaw, other.publicKeyRaw) === 0 &&
      Buffer.compare(this.publicKeyPem, other.publicKeyPem) === 0
    );
  }

  toLog() {
    const pemKey = this.exportPublicKey(KeyFormat.PEM);
    const pemBase64 = this.exportPublicKey(KeyFormat.PEM_BASE64);
    const rawKey = this.exportPublicKey(KeyFormat.RAW);

    return { publicKey: { pemKey, pemBase64, rawKey } };
  }

  static import({ key, type }: { key: string; type: KeyFormat }): PublicKey {
    if (type === KeyFormat.PEM || type === KeyFormat.PEM_BASE64) {
      const publicKeyPem = Buffer.from(
        key.trim(),
        type === KeyFormat.PEM_BASE64 ? "base64" : "utf-8"
      );
      const publicKeyRaw = publicPemToRaw(publicKeyPem);

      return new PublicKey(publicKeyPem, publicKeyRaw);
    } else if (type === KeyFormat.RAW) {
      const publicKeyRaw = Buffer.from(key.trim(), "base64");
      const publicKeyPem = publicRawToPem(publicKeyRaw);

      return new PublicKey(publicKeyPem, publicKeyRaw);
    }
  }
}

export class PrivateKey extends PublicKey {
  private constructor(
    readonly privateKeyPem: Buffer,
    readonly privateKeyRaw: Buffer,
    publicKeyPem: Buffer,
    publicKeyRaw: Buffer
  ) {
    super(publicKeyPem, publicKeyRaw);
  }

  exportPrivateKey(format: KeyFormat = KeyFormat.PEM_BASE64): string {
    if (format === "pem") return this.privateKeyPem.toString();
    if (format === "raw") return this.privateKeyRaw.toString("base64");
    return this.privateKeyPem.toString("base64");
  }

  equals(other: PublicKey): boolean {
    return (
      other instanceof PrivateKey &&
      Buffer.compare(this.privateKeyRaw, other.privateKeyRaw) === 0 &&
      Buffer.compare(this.privateKeyPem, other.privateKeyPem) === 0 &&
      Buffer.compare(this.publicKeyRaw, other.publicKeyRaw) === 0 &&
      Buffer.compare(this.publicKeyPem, other.publicKeyPem) === 0
    );
  }

  toLog() {
    const pemKey = this.exportPrivateKey(KeyFormat.PEM);
    const pemBase64 = this.exportPrivateKey(KeyFormat.PEM_BASE64);
    const rawKey = this.exportPrivateKey(KeyFormat.RAW);

    return { privateKey: { pemKey, pemBase64, rawKey }, ...super.toLog() };
  }

  static import({
    key,
    type = KeyFormat.PEM_BASE64,
  }: {
    key: string;
    type: KeyFormat;
  }): PrivateKey {
    if (type === KeyFormat.PEM || type === KeyFormat.PEM_BASE64) {
      const privateKeyPem = Buffer.from(
        key,
        type === KeyFormat.PEM_BASE64 ? "base64" : "utf-8"
      );

      const { privateKey: privateKeyRaw } = privatePemToRaw(privateKeyPem);

      const publicKeyPem = publicPemFromPrivatePem(privateKeyPem);
      const publicKeyRaw = publicPemToRaw(publicKeyPem);
      return new PrivateKey(
        privateKeyPem,
        privateKeyRaw,
        publicKeyPem,
        publicKeyRaw
      );
    }
    if (type === KeyFormat.RAW) {
      const privateKeyRaw = Buffer.from(key, "base64");
      const privateKeyPem = privateRawToPem(privateKeyRaw);

      const publicKeyPem = publicPemFromPrivatePem(privateKeyPem);
      const publicKeyRaw = publicPemToRaw(publicKeyPem);
      return new PrivateKey(
        privateKeyPem,
        privateKeyRaw,
        publicKeyPem,
        publicKeyRaw
      );
    }
  }

  static generate(): PrivateKey {
    const ecdh = crypto.createECDH(CURVE);
    ecdh.generateKeys();

    return PrivateKey.import({
      key: ecdh.getPrivateKey("base64"),
      type: KeyFormat.RAW,
    });
  }
}

// ----------- utility methods -------------

function privateRawToPem(rawPriv: Buffer): Buffer {
  const privSec1 = ecKeyUtils.generatePem({
    curve: CURVE,
    privateKey: rawPriv,
  }).privateKey;

  return Buffer.from(
    (
      crypto
        .createPrivateKey({
          key: privSec1,
          format: "pem",
          type: "sec1",
        })
        .export({
          type: "pkcs8",
          format: "pem",
        }) as String
    ).trim()
  );
}

function privatePemToRaw(privPemPKC8: Buffer): {
  privateKey: Buffer;
  publicKey: Buffer;
} {
  const sec1 = crypto
    .createPrivateKey({ key: privPemPKC8, format: "pem", type: "pkcs8" })
    .export({
      type: "sec1",
      format: "pem",
    })
    .toString()
    .trim();

  return ecKeyUtils.parsePem(sec1);
}

function publicPemFromPrivatePem(privatePem: Buffer): Buffer {
  return Buffer.from(
    (
      crypto
        .createPublicKey({
          key: privatePem,
          format: "pem",
        })
        .export({
          type: "spki",
          format: "pem",
        }) as string
    ).trim()
  );
}

function publicRawToPem(publicKeyRaw: Buffer): Buffer {
  return Buffer.from(
    ecKeyUtils.generatePem({
      curve: CURVE,
      publicKey: publicKeyRaw,
    }).publicKey
  );
}

function publicPemToRaw(publicKeyPem: Buffer): Buffer {
  return ecKeyUtils.parsePem(publicKeyPem).publicKey;
}
