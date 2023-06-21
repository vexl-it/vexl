{
  description = "vexl";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.05";
    flake-utils.url = "github:numtide/flake-utils";
    devshell.url = "github:numtide/devshell";
    android-nixpkgs.url = "github:tadfisher/android-nixpkgs/stable";
  };

  outputs = { self, nixpkgs, android-nixpkgs, devshell, flake-utils }:
    {
      overlay = final: prev: {
        inherit (self.packages.${final.system}) android-sdk;
      };
    }
    //
    flake-utils.lib.eachSystem [ "x86_64-linux" "aarch64-darwin" ] (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
          overlays = [
            devshell.overlays.default
            self.overlay
          ];
        };
      in
      {
        packages = {
          android-sdk = android-nixpkgs.sdk.${system} (sdkPkgs: with sdkPkgs; [
            # use the same versions as defined in apps/mobile/android/build.gradle
            build-tools-33-0-0
            cmake-3-22-1
            cmdline-tools-latest
            emulator
            ndk-23-1-7779620
            patcher-v4
            platform-tools
            platforms-android-33
            tools
            # lottie-react-native requires this
            build-tools-30-0-3
          ]);
        };

        devShell = import ./devshell.nix { inherit pkgs; };
      }
    );
}
