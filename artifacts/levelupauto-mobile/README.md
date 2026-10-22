# LevelUpAuto Mobile

Expo SDK 54 app for iPhone, iPad, Apple Watch, and a home-screen widget. Native projects are generated with Continuous Native Generation. Do not commit `ios/` or `android/`.

The bundle identifier is `com.levelupauto.mobile`. Watch and widget targets use sub-identifiers:

| Target | Bundle ID |
| --- | --- |
| iOS app | `com.levelupauto.mobile` |
| watchOS app | `com.levelupauto.mobile.watch` |
| Widget | `com.levelupauto.mobile.widget` |

Platform notes, including visionOS, Mac (Designed for iPad), CarPlay, and tvOS, are in [docs/APPLE_PLATFORMS.md](docs/APPLE_PLATFORMS.md). The App Review Guideline 5 checklist is in [docs/APP_STORE_REVIEW_SECTION_5.md](docs/APP_STORE_REVIEW_SECTION_5.md).

## Local development

From the repository root:

```bash
pnpm install
pnpm --filter @workspace/levelupauto-mobile run dev
pnpm --filter @workspace/levelupauto-mobile run lint
pnpm --filter @workspace/levelupauto-mobile run typecheck
pnpm --filter @workspace/levelupauto-mobile run doctor
```

`expo config` reads `app.config.ts`. `EAS_PROJECT_ID` and `EXPO_APPLE_TEAM_ID` are optional locally. Set them before an EAS build or a native prebuild that must be signed.

The generated React Query client in `lib/api-client-react` is not a dependency of this app yet. That package is also used by the web apps, which resolve React 19.3. Expo SDK 54 requires React 19.1.0, and linking the client pulls a second React into the native tree. Wire it up when the mobile screens call the API and the client can be built against 19.1.0.

## Owner setup

These values are not in the repo. The Apple Team ID, the App Store Connect app ID, and the EAS project ID have to be created by the account owner and stored as secrets.

1. Enroll in the Apple Developer Program and note the 10-character Team ID.
2. Create the App Store Connect app for `com.levelupauto.mobile` and copy its numeric Apple ID (`ascAppId`).
3. Create an App Store Connect API key (Users and Access → Integrations → App Store Connect API). Download the `.p8` once. Record the Key ID and the Issuer ID.
4. Create an Expo access token and run `eas init` in this directory while authenticated. Copy the project ID Expo prints. Do not paste it into `app.config.ts`.
5. Request the CarPlay entitlement from Apple before adding `react-native-carplay`. The iOS build does not include CarPlay today. See [docs/APPLE_PLATFORMS.md](docs/APPLE_PLATFORMS.md).

## Required secrets

Add these in GitHub → Settings → Secrets and variables → Actions. Never commit them, and never put them in `app.json`, `eas.json`, or `extra`.

| Secret | Purpose |
| --- | --- |
| `EXPO_TOKEN` | Expo access token. Required for every EAS build and TestFlight upload. |
| `EXPO_ASC_API_KEY` | Full contents of the App Store Connect API `.p8` file, including the BEGIN and END lines. Required to upload to TestFlight from CI. |
| `EXPO_ASC_KEY_ID` | Key ID of that API key. |
| `EXPO_ASC_ISSUER_ID` | Issuer ID shown above the keys list. Required for a team API key. |
| `EXPO_APPLE_TEAM_ID` | 10-character Apple Team ID. Used for signing and for the submit profile. |
| `EXPO_ASC_APP_ID` | Numeric App Store Connect Apple ID for this app. |
| `EAS_PROJECT_ID` | UUID from `eas init` / the Expo project settings. `app.config.ts` reads it when EAS evaluates the config. |

`eas-cli` does not substitute `ascAppId` or `appleTeamId` inside `eas.json`. The TestFlight job writes the `.p8` to `asc-api-key.p8` (gitignored) and runs `node scripts/apply-apple-submit-env.js`, which fills the production submit profile in the CI checkout only.

Optional: `EXPO_APPLE_TEAM_TYPE` (`COMPANY_OR_ORGANIZATION`, `INDIVIDUAL`, or `IN_HOUSE`) if EAS must create signing credentials non-interactively and cannot infer the team type.

Android Play submission stays manual. `eas.json` still points at `./google-play-service-account.json` for a person running `eas submit --platform android`. That JSON file is gitignored.

## Pipeline

GitHub Actions:

- Pull requests run lint and typecheck (`.github/workflows/ci.yml`).
- A push to `main` that touches this app lints, typechecks, then runs an EAS production build for iOS and Android.
- The production iOS build is uploaded to TestFlight with `eas submit`. That upload does not submit the version for App Review.
- App Store release stays manual in App Store Connect.
- `workflow_dispatch` can build `development`, `preview`, or `production`. Only the production profile is uploaded to TestFlight.

Confirm `ITSAppUsesNonExemptEncryption` before the first upload. It is set to `false` because the app uses only exempt HTTPS and platform encryption. Change it if you add non-exempt cryptography.
