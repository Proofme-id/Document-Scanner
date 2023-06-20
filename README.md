# Proofme SDK Example project

## Install SDK

Before installing the SDK, you need to have access to the [Proofme SDK NPM registry](https://github.com/orgs/Proofme-id/packages/npm/package/sdk) and [create a github Personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token#creating-a-personal-access-token-classic)  
Add the following to ~/.npmrc to be able to download the package:
```
//npm.pkg.github.com/:_authToken=<YOUR PERSONAL ACCESS TOKEN>
@proofme-id:registry=https://npm.pkg.github.com
```
Then install the sdk in your project:
```
npm install
```

## Build for Android

Build the project
```
npm run android-build
```

## Open in Android Studio
```
npx cap open android
```
