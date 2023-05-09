package com.ecdhplatformnativeutils

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableNativeMap
import com.quickcryptoexample.ECDH
import org.bouncycastle.jce.provider.BouncyCastleProvider
import java.security.Security

class EcdhPlatformNativeUtilsModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String {
    return NAME
  }

  @ReactMethod
  fun computeSharedSecret(publicKeyToComputeSecretTo: String, privateKeyRaw: String?, curve: String, resultPromise: Promise) {
    try {
      val result = ECDH.computeSharedSecret(publicKeyToComputeSecretTo, privateKeyRaw, curve)
      val resultMap = WritableNativeMap()
      resultMap.putString("publicKey", result.publicKey)
      resultMap.putString("sharedSecret", result.sharedSecret)
      resultPromise.resolve(resultMap)
    } catch (e: Error) {
      resultPromise.reject("ERRORNARIVE", e)
    }
  }

  companion object {
    const val NAME = "EcdhPlatformNativeUtils"
    init {
      Security.removeProvider(BouncyCastleProvider.PROVIDER_NAME);
      Security.addProvider(BouncyCastleProvider());
    }
  }
}
