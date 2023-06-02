

let domain256k1 = Domain.instance(curve: .EC256k1)
let domain224r1 = Domain.instance(curve: .EC224r1)

func base64ToPrivateKey(x: String, domain: Domain) throws -> ECPrivateKey? {
    if let data = Data(base64Encoded: x) {
        let bytes = [UInt8](data)
        let bInt = BInt(magnitude: bytes)
        return try ECPrivateKey(domain: domain, s: bInt)
    }

    return nil
}

func base64ToPublicKey(x: String, domain: Domain) throws -> ECPublicKey? {
    if let data = Data(base64Encoded: x) {
        let bytes = [UInt8](data)
        let withoutPrefix = bytes.dropFirst()
        let half = withoutPrefix.count / 2
        let x = [UInt8](withoutPrefix.prefix(half))
        let y = [UInt8](withoutPrefix.suffix(half))

        print("x: " + Data(x).base64EncodedString())
        print("y: " + Data(y).base64EncodedString())

        return try ECPublicKey(domain: domain, w: Point(BInt(magnitude: x), BInt(magnitude: y)))
    }
    return nil
}

func publicKeyToBase64(key: ECPublicKey) -> String {
    let prefix = Data([0x04])
    let x = Data(key.w.x.asMagnitudeBytes())
    let y = Data(key.w.y.asMagnitudeBytes())

    return (prefix + x + y).base64EncodedString()
}

func privateKeyToBase64(key: ECPrivateKey) -> String {
    return Data(key.s.asMagnitudeBytes()).base64EncodedString()
}



@objc(EcdhPlatformNativeUtils)
class EcdhPlatformNativeUtils: NSObject {

    @objc(computeSharedSecret:withPrivateKeyRaw:withCurve:withResolver:withRejecter:)
    func computeSharedSecret(publicKeyToComputeSecretTo: String, privateKeyRaw: String?, curve: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {

        do {
            let domain: Domain
            let sharedSecretLength: Int

            if curve == "secp224r1"{
                domain = domain224r1
                sharedSecretLength = 28

            } else if curve == "secp256k1" {
                domain = domain256k1
                sharedSecretLength = 32
            } else {
                reject("Error", "Unknown curve: " + curve)
                return
            }

            let keyPair: (ECPublicKey, ECPrivateKey)
            if let privateKeyString = privateKeyRaw {
                let privateKey = try base64ToPrivateKey(x: privateKeyString, domain: domain)
                let publicKey = ECPublicKey(privateKey: privateKey)

                keyPair = (publicKey, privateKey)
            } else {
                keyPair = domain.makeKeyPair()
            }

            let publicKey = try base64ToPublicKey(x: publicKeyToComputeSecretTo, domain: domain)
            let sharedSecret = try keyPair.1.keyAgreement(pubKey: publicKey, length: sharedSecretLength)
            let sharedSecretBase64 = Data(sharedSecret).base64EncodedString()

            let publicKeyFromKeyPair = publicKeyToBase64(key: keyPair.0)

            let result: [String: String] = ["sharedSecret": sharedSecretBase64, "publicKey": publicKey]
            resolve(result)
        } catch {
            reject("Error", "Crypto error")
        }
    }


    /*@objc(multiply:withB:withResolver:withRejecter:)
    func multiply(a: Float, b: Float, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
      resolve(a*b)
    }*/

    @objc
    static func requiresMainQueueSetup() -> Bool {
    return false
    }
}
