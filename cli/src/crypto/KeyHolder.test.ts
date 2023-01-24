import { KeyFormat, PrivateKey, PublicKey } from "./KeyHolder";

describe("Public key", () => {
  describe("should generate a valid public key", () => {
    // Private key rawKey: "z0Rnt3qw5X4SemjiuBf1aPz25GuQGne/YjNF0g==",
    const pubKey = {
      pemKey:
        "-----BEGIN PUBLIC KEY-----\n" +
        "ME4wEAYHKoZIzj0CAQYFK4EEACEDOgAEO8uxByJAyNUrRDXxAu67T0snQZisM+5C\n" +
        "mF3Vi2t/BeP5qy5V/trZqy/CTzAt3BAUx1R1frTolQY=\n" +
        "-----END PUBLIC KEY-----",
      pemBase64:
        "LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUU0d0VBWUhLb1pJemowQ0FRWUZLNEVFQUNFRE9nQUVPOHV4QnlKQXlOVXJSRFh4QXU2N1Qwc25RWmlzTSs1QwptRjNWaTJ0L0JlUDVxeTVWL3RyWnF5L0NUekF0M0JBVXgxUjFmclRvbFFZPQotLS0tLUVORCBQVUJMSUMgS0VZLS0tLS0=",
      rawKey:
        "BDvLsQciQMjVK0Q18QLuu09LJ0GYrDPuQphd1YtrfwXj+asuVf7a2asvwk8wLdwQFMdUdX606JUG",
    };

    it("From Raw key", () => {
      const publicKeyFromRaw = PublicKey.import({
        key: pubKey.rawKey,
        type: KeyFormat.RAW,
      });
      expect(publicKeyFromRaw.exportPublicKey(KeyFormat.PEM)).toEqual(
        pubKey.pemKey
      );
      expect(publicKeyFromRaw.exportPublicKey(KeyFormat.PEM_BASE64)).toEqual(
        pubKey.pemBase64
      );
      expect(publicKeyFromRaw.exportPublicKey(KeyFormat.RAW)).toEqual(
        pubKey.rawKey
      );
    });

    it("From pem key", () => {
      const publicKeyFromPem = PublicKey.import({
        key: pubKey.pemKey,
        type: KeyFormat.PEM,
      });
      expect(publicKeyFromPem.exportPublicKey(KeyFormat.PEM)).toEqual(
        pubKey.pemKey
      );
      expect(publicKeyFromPem.exportPublicKey(KeyFormat.PEM_BASE64)).toEqual(
        pubKey.pemBase64
      );
      expect(publicKeyFromPem.exportPublicKey(KeyFormat.RAW)).toEqual(
        pubKey.rawKey
      );
    });

    it("From pem in base64 key", () => {
      const publicKeyFromPemBase64 = PublicKey.import({
        key: pubKey.pemBase64,
        type: KeyFormat.PEM_BASE64,
      });
      expect(publicKeyFromPemBase64.exportPublicKey(KeyFormat.PEM)).toEqual(
        pubKey.pemKey
      );
      expect(
        publicKeyFromPemBase64.exportPublicKey(KeyFormat.PEM_BASE64)
      ).toEqual(pubKey.pemBase64);
      expect(publicKeyFromPemBase64.exportPublicKey(KeyFormat.RAW)).toEqual(
        pubKey.rawKey
      );
    });
  });
});
describe("Private key", () => {
  const privKey = {
    privateKey: {
      pemKey:
        "-----BEGIN PRIVATE KEY-----\n" +
        "MDoCAQAwEAYHKoZIzj0CAQYFK4EEACEEIzAhAgEBBBxKUdJctrKl4VPB11OBbmlp\n" +
        "C1dAhhW9aWCq3eep\n" +
        "-----END PRIVATE KEY-----",
      pemBase64:
        "LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1Eb0NBUUF3RUFZSEtvWkl6ajBDQVFZRks0RUVBQ0VFSXpBaEFnRUJCQnhLVWRKY3RyS2w0VlBCMTFPQmJtbHAKQzFkQWhoVzlhV0NxM2VlcAotLS0tLUVORCBQUklWQVRFIEtFWS0tLS0t",
      rawKey: "SlHSXLaypeFTwddTgW5paQtXQIYVvWlgqt3nqQ==",
    },
    publicKey: {
      pemKey:
        "-----BEGIN PUBLIC KEY-----\n" +
        "ME4wEAYHKoZIzj0CAQYFK4EEACEDOgAE4Wt1P2CgUs7Db2K+YK5Fupf74jVkJ8in\n" +
        "gHdIRZUYCJd5hVBMrQcGE+grDXCvZLsosfJv3GQu75A=\n" +
        "-----END PUBLIC KEY-----",
      pemBase64:
        "LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUU0d0VBWUhLb1pJemowQ0FRWUZLNEVFQUNFRE9nQUU0V3QxUDJDZ1VzN0RiMksrWUs1RnVwZjc0alZrSjhpbgpnSGRJUlpVWUNKZDVoVkJNclFjR0UrZ3JEWEN2Wkxzb3NmSnYzR1F1NzVBPQotLS0tLUVORCBQVUJMSUMgS0VZLS0tLS0=",
      rawKey:
        "BOFrdT9goFLOw29ivmCuRbqX++I1ZCfIp4B3SEWVGAiXeYVQTK0HBhPoKw1wr2S7KLHyb9xkLu+Q",
    },
  };

  describe("should generate a valid private key", () => {
    it("From Raw key", () => {
      const key = PrivateKey.import({
        key: privKey.privateKey.rawKey,
        type: KeyFormat.RAW,
      });
      expect(key.exportPrivateKey(KeyFormat.PEM)).toEqual(
        privKey.privateKey.pemKey
      );
      expect(key.exportPrivateKey(KeyFormat.PEM_BASE64)).toEqual(
        privKey.privateKey.pemBase64
      );
      expect(key.exportPrivateKey(KeyFormat.RAW)).toEqual(
        privKey.privateKey.rawKey
      );
      expect(key.exportPublicKey(KeyFormat.PEM)).toEqual(
        privKey.publicKey.pemKey
      );
      expect(key.exportPublicKey(KeyFormat.PEM_BASE64)).toEqual(
        privKey.publicKey.pemBase64
      );
      expect(key.exportPublicKey(KeyFormat.RAW)).toEqual(
        privKey.publicKey.rawKey
      );
    });
    it("From pem key", () => {
      const key = PrivateKey.import({
        key: privKey.privateKey.pemKey,
        type: KeyFormat.PEM,
      });
      expect(key.exportPrivateKey(KeyFormat.PEM)).toEqual(
        privKey.privateKey.pemKey
      );
      expect(key.exportPrivateKey(KeyFormat.PEM_BASE64)).toEqual(
        privKey.privateKey.pemBase64
      );
      expect(key.exportPrivateKey(KeyFormat.RAW)).toEqual(
        privKey.privateKey.rawKey
      );
      expect(key.exportPublicKey(KeyFormat.PEM)).toEqual(
        privKey.publicKey.pemKey
      );
      expect(key.exportPublicKey(KeyFormat.PEM_BASE64)).toEqual(
        privKey.publicKey.pemBase64
      );
      expect(key.exportPublicKey(KeyFormat.RAW)).toEqual(
        privKey.publicKey.rawKey
      );
    });
    it("From pem in base64 key", () => {
      const key = PrivateKey.import({
        key: privKey.privateKey.pemBase64,
        type: KeyFormat.PEM_BASE64,
      });
      expect(key.exportPrivateKey(KeyFormat.PEM)).toEqual(
        privKey.privateKey.pemKey
      );
      expect(key.exportPrivateKey(KeyFormat.PEM_BASE64)).toEqual(
        privKey.privateKey.pemBase64
      );
      expect(key.exportPrivateKey(KeyFormat.RAW)).toEqual(
        privKey.privateKey.rawKey
      );
      expect(key.exportPublicKey(KeyFormat.PEM)).toEqual(
        privKey.publicKey.pemKey
      );
      expect(key.exportPublicKey(KeyFormat.PEM_BASE64)).toEqual(
        privKey.publicKey.pemBase64
      );
      expect(key.exportPublicKey(KeyFormat.RAW)).toEqual(
        privKey.publicKey.rawKey
      );
    });
  });
});
