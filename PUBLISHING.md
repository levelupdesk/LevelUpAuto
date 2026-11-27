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
| `EXPO_TOKEN` | From expo.dev → Account Settings → Access Tokens |
| `APPLE_APP_SPECIFIC_PASSWORD` | From appleid.apple.com → App-Specific Passwords |

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

# Copy the projectId printed above into app.json → extra.eas.projectId
```

### Building

| Command | What it does |
|---------|--------------|
| `eas build --profile development --platform ios --simulator` | iOS Simulator build for local dev |
| `eas build --profile preview --platform all` | Shareable internal test builds (APK + IPA) |
| `eas build --profile production --platform all` | Store-ready builds (AAB + signed IPA) |

### Submitting to stores

```bash
# App Store (requires Apple Developer account + App Store Connect app created)
eas submit --platform ios

# Google Play (requires service account JSON — see eas.json submit config)
eas submit --platform android
```

### iOS App Store checklist
- [ ] Apple Developer Program membership ($99/yr) at developer.apple.com
- [ ] App created in App Store Connect with Bundle ID `com.levelupauto.mobile`
- [ ] Update `eas.json` → submit → ios → `appleId`, `ascAppId`, `appleTeamId`
- [ ] Run `eas build --profile production --platform ios`
- [ ] Run `eas submit --platform ios`

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
| `ci.yml` | Push to main/develop, PRs | TypeScript check + web builds + critical dependency audit + gitleaks secret scan |
| `eas-build.yml` | Push to main (mobile changes) or manual | EAS build for all platforms; production profile also submits to stores |

### GitLab CI (`.gitlab-ci.yml`)

| Stage | Jobs |
|-------|------|
| typecheck | api-zod, api-client, api-server, alset-web |
| build | levelupauto-web, alset-web (artifacts saved 7 days) |
| security | pnpm audit |
| mobile | `preview` and `production` EAS builds (manual trigger) |
