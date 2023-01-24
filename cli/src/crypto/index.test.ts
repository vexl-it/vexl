import {
  aesDecrypt,
  aesEncrypt,
  ecdsaSign,
  ecdsaVerify,
  eciesDecrypt,
  eciesEncrypt,
  hmacSign,
  hmacVerify,
} from "./index";
import crypto from "node:crypto";
import stripVersion from "../utils/stripVersion";
import { KeyFormat, PrivateKey, PublicKey } from "./KeyHolder";
describe("ecdsa", () => {
  const privateKey = PrivateKey.generate();
  it("Should successfully sign message and verify the message is signed", () => {
    const challenge = "Random String";
    const signature = ecdsaSign({
      challenge,
      privateKey,
    });

    expect(signature).toBeTruthy();

    const verified = ecdsaVerify({
      challenge,
      signature: stripVersion(signature),
      pubKey: privateKey,
    });
    expect(verified).toBe(true);
  });

  it("Should successfully verify message that was signed using openssl command", () => {
    const publicKey = PublicKey.import({
      key: "LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUU0d0VBWUhLb1pJemowQ0FRWUZLNEVFQUNFRE9nQUVSZGtIN1hHM1VRaGZIR1RzQmJ5alVXRmU2SFNycmxZWQpYcm95b0cvdGszMDlxaEprbGtCcGN0eWV2OUJIQUE0VlVPWi9GSytpNzZFPQotLS0tLUVORCBQVUJMSUMgS0VZLS0tLS0=",
      type: KeyFormat.PEM_BASE64,
    });

    //    char privateKey[] = "LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1IZ0NBUUF3RUFZSEtvWkl6ajBDQVFZRks0RUVBQ0VFWVRCZkFnRUJCQndsOUhvMDd0VTZaUW1kSGhRV01OUUUKR1N3Tm9McldmMVVvaFhkY29Ud0RPZ0FFU0RGWnFSRzBRb291TFpsV09KTFBSVlJqYUxLQXJZdldDRG94ZnRyUAppSVdQNGh6RlRNVDlhZHg5R24vcWpsNlNXWlVFVXp0REdEZz0KLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLQo=";
    const challenge = "ftaafxneekyrmnfzwyxmathnbvbxjdjt";
    /*
            generated with:
            openssl dgst -sha256 -sign <(base64 -d -i <(echo $PRIVATE_KEY)) <( echo -n "$CHALLENGE" ) | openssl base64 -A
        */
    const generatedSignature =
      "MD0CHHRSQVISVq0Ji5wsX4rfas/3dOe9NRcxzsz80c0CHQDtbejFi31EjorwY8ReHgprkhSdKVJfHZbzx7NC";
    const verified = ecdsaVerify({
      challenge,
      signature: generatedSignature,
      pubKey: publicKey,
    });

    expect(verified).toEqual(true);
  });

  it("Should not verify signature signed with different public key", () => {
    const privateKey = PrivateKey.generate();
    const privateKey2 = PrivateKey.generate();
    const challenge = "Some message";
    const signature = ecdsaSign({
      challenge,
      privateKey,
    });

    const verified = ecdsaVerify({
      challenge,
      signature: stripVersion(signature),
      pubKey: privateKey2,
    });
    expect(verified).toEqual(false);
  });
});

describe("aes", () => {
  const password = "testPass";

  it("Should successfully encrypt and decrypt", () => {
    const data = "Some data";
    const encrypted = aesEncrypt({
      data,
      password: password,
    });
    const decrypted = aesDecrypt({ data: encrypted, password: password });
    expect(decrypted).toEqual(data);
  });

  it("Should decrypt static message", () => {
    const data = "Some message that is really secret";
    const encrypted =
      "000.4KloZOAJ5r39EXD/s9wlnJTAiT4JJx208G479U8nVZ2wdw==.1UnVyWaQtUYA4foWM92PdQ==";
    const staticPass = "some pass that is even more secret than message";
    const decrypted = aesDecrypt({ data: encrypted, password: staticPass });
    expect(decrypted).toEqual(data);
  });

  it("Should output data as expected", () => {
    const data = "Another some messag";
    const staticPass = "This is something";
    const encrypt = aesEncrypt({ data, password: staticPass });

    expect(encrypt).toEqual(
      "000.AEW+Xc++na8J9NdjRYP4lSA7Tg==.CDQUB6lB7S9XWKirY5DbVg=="
    );
  });

  it("Should fail when decrypting with bad security tag", () => {
    const data = "some data";
    const encrypted = aesEncrypt({ data, password: password });
    const [version, payload, tag] = encrypted.split(".");
    expect(() => {
      aesDecrypt({
        data: `${version}.${payload}.${crypto
          .randomBytes(16)
          .toString("base64")}`,
        password: password,
      });
    }).toThrow("Unsupported state or unable to authenticate data");
  });

  it("Should fail when decrypting with bad password", () => {
    const data = "some data";
    const encrypted = aesEncrypt({ data, password: password });
    expect(() => {
      aesDecrypt({ data: encrypted, password: "bad password" });
    }).toThrow("Unsupported state or unable to authenticate data");
  });
});

describe("ecies", () => {
  const privateKey = PrivateKey.generate();

  it("Should successfully encrypt and decrypt", () => {
    const data = "Some data";
    const encrypted = eciesEncrypt({
      data,
      publicKey: privateKey,
    });
    const decrypted = eciesDecrypt({
      data: encrypted,
      privateKey: privateKey,
    });
    expect(decrypted).toEqual(data);
  });

  it("Should decrypt a static message as expected", () => {
    const privateKey2 = PrivateKey.import({
      key: "6HizupRO2bZAhj4UHOB3uQsatrDJll8t1LSnxg==",
      type: KeyFormat.RAW,
    });

    const decrypted = eciesDecrypt({
      privateKey: privateKey2,
      data: "000.EO6P607oYKTZoOeADy8j5Pan5pI=.y+3Vw0lSibr9Z1Ian4UZpzM5Ugzzwotv4l1+spJDPFc=.A5PrXbHvS1hLwfmmspTz3yC2T87f2CIGfWwSVSI=.9LqmTKZm9TCLGvz7dV2Nzg==",
    });

    expect(decrypted).toEqual("Some another message");
  });

  it("Should fail when decrypting with bad key, epk, mac or security tag", () => {
    const data = "Some message";
    const encrypted = eciesEncrypt({
      publicKey: privateKey,
      data,
    });

    const [version, epk, mac, tag, payload] = encrypted.split(".");
    const badTag = crypto.randomBytes(tag.length).toString("base64");
    const badEpk = crypto.randomBytes(epk.length).toString("base64");
    const badMac = crypto.randomBytes(mac.length).toString("base64");

    expect(() => {
      eciesDecrypt({
        privateKey,
        data: [version, badEpk, mac, tag, payload].join("."),
      });
    }).toThrow();

    expect(() => {
      eciesDecrypt({
        privateKey,
        data: [version, epk, badMac, tag, payload].join("."),
      });
    }).toThrow();

    expect(() => {
      eciesDecrypt({
        privateKey,
        data: [version, epk, mac, badTag, payload].join("."),
      });
    }).toThrow();

    // Check if it does not fail when decrypting with correct data
    expect(
      eciesDecrypt({
        privateKey,
        data: [version, epk, mac, tag, payload].join("."),
      })
    ).toEqual(data);
  });
});

describe("hmac", () => {
  const password = "testPass";

  it("Should successfully sign and verify", () => {
    const data = "Some data";
    const signature = hmacSign({ data, password });
    const verified = hmacVerify({ data, signature, password });
    expect(verified).toEqual(true);
  });

  it("Should fail when verifying with bad signature", () => {
    const data = "Some data";
    const signature = hmacSign({ data, password });
    expect(
      hmacVerify({ data, signature: "MTs=.bad signature", password })
    ).toEqual(false);
  });

  it("Should fail when verifying with bad password", () => {
    const data = "Some data";
    const signature = hmacSign({ data, password });
    expect(hmacVerify({ data, signature, password: "bad password" })).toEqual(
      false
    );
  });

  it("Should produce expected output", () => {
    expect(hmacSign({ password: "something", data: "something else" })).toEqual(
      "MWrLhqnIDcPLSXzqJUbo0Bm+qL430mUs3ZtptnA+ylw="
    );
  });
});
