#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(EcdhPlatformNativeUtils, NSObject)

RCT_EXTERN_METHOD(computeSharedSecret:(NSString *)publicKeyToComputeSecretTo
                  withPrivateKeyRaw:(NSString * _Nullable)privateKeyRaw
                  withCurve:(NSString *)curve
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
