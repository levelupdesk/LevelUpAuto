# Publishing Guide

## GitHub & GitLab

### First-time setup

```bash
# GitHub
git remote add github https://github.com/LevelUpAuto/LevelUpAuto.git
git push github main

# GitLab
git remote add gitlab https://gitlab.com/LevelUpAuto/LevelUpAuto.git
git push gitlab main
```

### Required GitHub Secrets
Go to **Settings → Secrets → Actions** and add:

| Secret | Value |
|--------|-------|
| `EXPO_TOKEN` | Expo access token (expo.dev → Account settings → Access tokens). Required for EAS. |
| `EXPO_ASC_API_KEY` | App Store Connect API `.p8` file contents, including the BEGIN/END lines. Required for TestFlight upload. |
| `EXPO_ASC_KEY_ID` | Key ID for that API key. |
| `EXPO_ASC_ISSUER_ID` | Issuer ID for a team API key. |
| `EXPO_APPLE_TEAM_ID` | 10-character Apple Team ID. Not committed. |
| `EXPO_ASC_APP_ID` | Numeric App Store Connect Apple ID. Not committed. |
| `EAS_PROJECT_ID` | EAS project UUID from `eas init`. Not committed. |

Do not commit the `.p8`, the Play service-account JSON, or these IDs. `eas.json` does not hardcode the team ID or the App Store Connect app ID. CI writes them into the checkout with `artifacts/levelupauto-mobile/scripts/apply-apple-submit-env.js` before `eas submit`.

### Required GitLab Variables
Go to **Settings → CI/CD → Variables** and add the same keys.

---

## Mobile App — EAS Build

### One-time EAS project setup (run locally)

```bash
cd artifacts/levelupauto-mobile

# Login to your Expo account
npx eas-cli login

# Link this project to your EAS account (creates projectId)
npx eas-cli project:init

# Export the printed project ID as EAS_PROJECT_ID. Do not commit it.
# app.config.ts reads EAS_PROJECT_ID when the config is evaluated.
```

### Building

| Command | What it does |
|---------|--------------|
| `eas build --profile development --platform ios --simulator` | iOS Simulator build for local dev |
| `eas build --profile preview --platform all` | Shareable internal test builds (APK + IPA) |
| `eas build --profile production --platform all` | Store-ready builds (AAB + signed IPA) |

### Submitting to stores

Production iOS builds on `main` are uploaded to TestFlight by GitHub Actions. `eas submit` delivers the binary to App Store Connect and stops there. It does not send the version to App Review.

```bash
# Manual TestFlight upload (same result as CI). Set the secrets from the README first.
export EAS_PROJECT_ID EXPO_APPLE_TEAM_ID EXPO_ASC_APP_ID EXPO_ASC_KEY_ID EXPO_ASC_ISSUER_ID
export EXPO_ASC_API_KEY_PATH=./asc-api-key.p8
node scripts/apply-apple-submit-env.js
eas submit --platform ios --profile production --latest --non-interactive

# Google Play stays manual (internal track).
eas submit --platform android
```

Release to the App Store by choosing the tested build in App Store Connect and submitting it for review yourself.

### iOS App Store checklist
- [ ] Apple Developer Program membership ($99/yr) at developer.apple.com
- [ ] App created in App Store Connect with Bundle ID `com.levelupauto.mobile`
- [ ] `EXPO_APPLE_TEAM_ID`, `EXPO_ASC_APP_ID`, `EAS_PROJECT_ID`, and the App Store Connect API key stored as secrets
- [ ] CarPlay entitlement requested from Apple before `react-native-carplay` is added
- [ ] Guideline 5 checklist in `artifacts/levelupauto-mobile/docs/APP_STORE_REVIEW_SECTION_5.md`
- [ ] Production build uploaded to TestFlight
- [ ] App Review submission done by a person in App Store Connect

### Google Play checklist
- [ ] Google Play Developer account ($25 one-time) at play.google.com/console
- [ ] App created with package `com.levelupauto.mobile`
- [ ] Download service account JSON → save as `google-play-service-account.json`
- [ ] Run `eas build --profile production --platform android`
- [ ] Run `eas submit --platform android`

---

## CI/CD Workflows

### GitHub Actions (`.github/workflows/`)

| Workflow | Triggers | What it does |
|----------|----------|--------------|
| `ci.yml` | Push to main/develop, PRs | TypeScript, mobile lint and typecheck, web builds, security audit |
| `eas-build.yml` | Push to main (mobile changes) or manual | Lint, typecheck, EAS build. Production iOS builds upload to TestFlight only. App Review stays manual. |

### GitLab CI (`.gitlab-ci.yml`)

| Stage | Jobs |
|-------|------|
| typecheck | api-zod, api-client, api-server, alset-web |
| build | levelupauto-web, alset-web (artifacts saved 7 days) |
| security | pnpm audit |
| mobile | `preview` and `production` EAS builds (manual trigger). No store submit. |
