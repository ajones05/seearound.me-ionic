# README #

This README would normally document whatever steps are necessary to get your application up and running.


### Plugins ###

TDB

### Build Projects Manually ###

To build project, first add a platform:

```
$ionic platform add ios/android

$ ionic build ios
$ ionic build android
```

To deploy on device:
```
$ ionic run ios
$ ionic run android

```

### Android Deployment Instructions ###


Android APK build:

Remove debug level plugins:

```
$ cordova plugin rm org.apache.cordova.console
$ cordova build --release android
```
Follow Ant docs regarding keystore and passwords to sign and release the production apk

### How to build apps for Google Play ###

* cd /Users/davidv/Projects/libertyionic/platforms/android/ant-build/
* cordova build --release android
* keytool -genkey -v -keystore my-release-key.keystore -alias alias_name -keyalg RSA -keysize 2048 -validity 10000
* jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore CordovaApp-release-unsigned.apk alias_name
* /Users/davidv/Projects/android-sdk/build-tools/19.1.0/zipalign -v 4 CordovaApp-release-unsigned.apk Brisk.apk


### iOS Build ###

Remove debug level plugins:
```
$ cordova plugin rm org.apache.cordova.console
$ cordova build --release ios
```

You may now use Xcode or CLI tools to sign the app. Use appropriate distribution profile.


### DEBUG ANDROID ###

Install logcat:
easy_install logcat-color

Run:
logcat-color
