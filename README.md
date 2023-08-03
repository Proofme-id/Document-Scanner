# Proofme SDK Example project

## Prerequisites
Before you can build this application, you need to have the following access tokens.
- Java 17 (android build)
- Node 18
- Xcode 14.3
- Android Studio Flamingo 2022.2.1 Patch 1
- Organisation token for package registry
- Organisation JWT License (Test or Production)

## Install SDK

Before installing the SDK, you need to have access to the `Proofme package registry`. 
Add the following to ~/.npmrc to be able to download the package:
```
@proofme-id:registry=https://packages.didux.network/
//packages.didux.network/:_authToken="YOUR_ORGANISATION_TOKEN"
```

Then install the NPM packages
```
npm install
```

## Add the License key

The license key should be installed in the environment file:
`src/environments/environment.ts`

```
export const environment = {
    license: "YOUR_JWT_LICENSE"
};
```

## Build for Android

Build the project
```
# Build the project
npm run build:android

# Open android studio
npx cap open android

# Connect your phone/simulator and run the installer
```

## Build for iOS

Build the project
```
# Build the project
npm run build:ios

# Xcode opens by default.
# Connect your phone/simulator and run the installer
```
