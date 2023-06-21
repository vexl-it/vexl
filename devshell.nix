{ pkgs }:

with pkgs;

devshell.mkShell {
  name = "vexl";
  motd = "Welcome to Vexl";
  env = [
    {
      name = "ANDROID_HOME";
      value = "${android-sdk}/share/android-sdk";
    }
    {
      name = "ANDROID_SDK_ROOT";
      value = "${android-sdk}/share/android-sdk";
    }
    {
      name = "JAVA_HOME";
      value = jdk17.home;
    }
  ];
  packages = [
    android-sdk
    gradle
    jdk17
    yarn
  ];
}
