# Document-Scanner

> Repo-specific guide. System-wide context: `../CLAUDE.md`.

## Purpose

Standalone **document scanning** app that reads passport/ID documents (NFC chip + MRZ) using
the Proofme SDK reader module. A focused, embeddable capture experience rather than a full
wallet.

## Tech stack

Angular + **Ionic** + **Capacitor**. Depends primarily on **`@proofme-id/sdk`** (reader
module). Minimal extra deps: `ngx-device-detector`, `angular-svg-icon`,
`capacitor-plugin-safe-area`. No NGXS/i18n stack (smaller than the other apps).

## Structure

Angular/Ionic `src/` plus native `android/` and `ios/` shells. The app is thin — most logic
lives in `@proofme-id/sdk`.

## External dependencies

- `@proofme-id/sdk` — passport/ID reading (NFC/MRZ), the core dependency.
- Requires an **organisation JWT license** (test or production) for the SDK.

## Development commands

Install requires `packages.didux.network` registry access (see README `~/.npmrc` setup).

- Web build: `npm run build` (`-c=development`) / `npm run build:prod`.
- Android: `npm run build:android` (+ `:prod`) → `build && cap sync android`.
- iOS: `npm run build:ios` (+ `:prod`) → `build && cap sync ios && cap open ios`.

Tooling prerequisites (from README): Java 17, Node 18, Xcode 14.3, Android Studio Flamingo.

## Configuration

The SDK **license key** goes in `src/environments/environment.ts` (`license: "…"`). Do not
commit a real license.

## Coding conventions

Keep the app thin; prefer extending behaviour in the `sdk` repo over duplicating reader logic
here.

## Common change patterns

New document capability: usually implement it in `sdk` (reader), bump the SDK, then surface it
in this app's page/service.

## Important constraints / pitfalls

- Native NFC/camera permissions are configured in the native projects.
- Behaviour is tightly coupled to the installed `@proofme-id/sdk` version — mismatches surface
  as reader failures.

## Instructions for Claude

Reader logic belongs in `sdk`, not here. When changing scanning behaviour, check whether the
fix should live in the SDK so the other mobile apps benefit too.
