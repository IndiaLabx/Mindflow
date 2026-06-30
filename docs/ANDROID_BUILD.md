# Android App Development Guide (MindFlow)

Welcome to the Android Development Guide! The easiest and most efficient way to maintain parity between our React web application and an Android mobile application without duplicating effort is to use **Capacitor**.

We have fully automated and set up the repository for you.

## How It Works

Capacitor acts as a wrapper around our Vite/React web build. It generates a native Android shell (WebView) that runs our existing codebase identically. It also exposes native device APIs (like Haptics and Splash Screens) that our React code can tap into natively.

## Automated CI/CD (The Magic)

We have created a **GitHub Actions Workflow** (`android-build.yml`). You don't even have to build the app on your computer!

1. Every time a PR is merged into the `main` branch, the GitHub Action automatically runs.
2. It builds the Vite project.
3. It syncs the output to the Android Native wrapper.
4. It compiles the Android code using Gradle.
5. It uploads an `app-debug.apk` file to the GitHub Actions Artifacts section.

**To get the latest Android APK, simply go to your GitHub Actions tab, select the latest "Android APK Build" run, and download the `.apk` file.**

## Local Development (For Testing)

If you want to run the Android version locally on an emulator or Android device:

1. Install Android Studio (with the necessary SDKs).
2. Install the project dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Build the web project:
   ```bash
   npm run build
   ```
4. Sync the web build with the Android native project:
   ```bash
   npx cap sync android
   ```
5. Open the project in Android Studio:
   ```bash
   npx cap open android
   ```
6. From Android Studio, you can hit the **"Play/Run"** button to deploy it to your attached emulator or physical Android phone.

## The "Wow" Factor: Native Feel

To make this feel like a native app and not just a wrapped website:

1. **Native Splash Screen:** We implemented a smooth black native splash screen inside `capacitor.config.ts`.
2. **Native Haptics:** We replaced standard web `navigator.vibrate` calls with Capacitor's Native `@capacitor/haptics` module in interactive paths like Swiping Flashcards (`OWSSession` & `IdiomSession`). This provides high-quality iOS/Android native vibrations (Impact styles) instead of clunky web vibrations.

## Need to Make Android-Specific Changes?

All native Android configuration (Icons, App Name, Package Info) happens inside the `android/` directory and `capacitor.config.ts`.

- **Package Name:** `com.aklabxmindflow.app`
- **Native Project:** `android/`

If you change core plugins, always run:
```bash
npx cap sync android
```

## Google Play Console Deployment (AAB format)

Google Play **no longer accepts `.apk` files** for new apps. You must submit an Android App Bundle (`.aab`).

To generate the AAB file for production upload:
1. Ensure your web build is fresh:
   ```bash
   npm run build
   npx cap sync android
   ```
2. Navigate to the android directory and build the bundle:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
3. The final `.aab` file will be located at:
   `android/app/build/outputs/bundle/release/app-release.aab`

You will also find placeholder graphic assets for the Play Store (App Icon, Feature Graphic) and your store metadata (Title, Description) in the `google-play-assets/` folder.
