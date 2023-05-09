package com.quickcryptoexample

import android.os.Build
import android.util.Base64
import androidx.annotation.RequiresApi
import org.bouncycastle.crypto.ec.CustomNamedCurves
import org.bouncycastle.jce.ECPointUtil
import org.bouncycastle.jce.interfaces.ECPrivateKey
import org.bouncycastle.jce.interfaces.ECPublicKey
import org.bouncycastle.jce.provider.BouncyCastleProvider
import org.bouncycastle.jce.spec.ECNamedCurveSpec
import java.math.BigInteger
import java.security.*
import java.security.spec.ECGenParameterSpec
import java.security.spec.ECPrivateKeySpec
import java.security.spec.ECPublicKeySpec
import javax.crypto.KeyAgreement

data class ECDHResult(
    val sharedSecret: String,
    val publicKey: String
)

object ECDH {
    val keyFactory = KeyFactory.getInstance("EC", BouncyCastleProvider.PROVIDER_NAME)

    private fun decodeRawPublicBase64(curveName: String, rawPublicKey: String): PublicKey {
        val parameterSpec = org.bouncycastle.jce.ECNamedCurveTable.getParameterSpec(curveName)
        val namedCurveSpec =
            ECNamedCurveSpec(curveName, parameterSpec.curve, parameterSpec.g, parameterSpec.n)
        val point =
            ECPointUtil.decodePoint(namedCurveSpec.curve, rawPublicKey.decodeBase64ToByteArray())
        val keySpec = ECPublicKeySpec(point, namedCurveSpec)

        return keyFactory.generatePublic(keySpec)
    }


    private fun privateToPublic(privateKey: ECPrivateKey): PublicKey {
        val ecSpec: org.bouncycastle.jce.spec.ECParameterSpec = privateKey.parameters
        val q: org.bouncycastle.math.ec.ECPoint = ecSpec.g.multiply(privateKey.d)

        val pubKeySpec = org.bouncycastle.jce.spec.ECPublicKeySpec(q, ecSpec)
        return keyFactory.generatePublic(pubKeySpec)
    }

    private fun computeSharedSecret(otherPublicKey: PublicKey, myPrivateKey: PrivateKey): ByteArray {
        val keyAgreement = KeyAgreement.getInstance("ECDH")
        keyAgreement.init(myPrivateKey)
        keyAgreement.doPhase(otherPublicKey, true)
        return keyAgreement.generateSecret()
    }

    private fun parseRawPrivateKey(privateKeyBase64: String, curveName: String): ECPrivateKey {
        val curve = CustomNamedCurves.getByName(curveName)
        val curveSpec = ECNamedCurveSpec(curveName, curve.curve, curve.g, curve.n, curve.h, curve.seed)

        // handle curve nul
        if (curve === null) throw Error("Curve with name ${curveName} does not exist")

        val privateKeyBigInt = BigInteger(1, privateKeyBase64.decodeBase64ToByteArray())
        val keySpec = ECPrivateKeySpec(privateKeyBigInt, curveSpec)
        return keyFactory.generatePrivate(keySpec) as ECPrivateKey
    }

    private fun generateKeyPairForCurve(curveName: String): KeyPair {
        val ecGenSpec = ECGenParameterSpec(curveName)
        val keyPairGenerator = KeyPairGenerator.getInstance("EC", BouncyCastleProvider.PROVIDER_NAME)
        keyPairGenerator.initialize(ecGenSpec)

        return keyPairGenerator.generateKeyPair()
    }

    fun computeSharedSecret(publicKeyRaw: String, privateKeyOrNullIfOneShouldBeGenerated: String?, curve: String): ECDHResult {
        val myKeyPair = privateKeyOrNullIfOneShouldBeGenerated?.let{
            val privateKey = parseRawPrivateKey(it, curve)
            val publicKey = privateToPublic(privateKey)
            KeyPair(publicKey, privateKey)
        } ?: generateKeyPairForCurve(curve)

        val publicKey = decodeRawPublicBase64(curve, publicKeyRaw)
        val sharedSecret = computeSharedSecret(publicKey, myKeyPair.private)

        return ECDHResult(
            sharedSecret.toBase64String(),
            (myKeyPair.public as ECPublicKey).toRawByteArray().toBase64String()
        )
    }

    private fun ECPublicKey.toRawByteArray(): ByteArray = q.getEncoded(false)
    private fun String.decodeBase64ToByteArray() = Base64.decode(this, Base64.DEFAULT)
    private fun ByteArray.toBase64String() = Base64.encodeToString(this, Base64.DEFAULT)
}

