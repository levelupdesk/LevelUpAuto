# App Review Guideline 5 checklist

This is the owner checklist for [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) section 5 (Legal), plus the CarPlay driver-distraction rules that apply if a car UI is added later. Nothing here submits the app for review. TestFlight upload is automated. App Store release stays manual.

Complete every box before the first App Review submission. The implementation notes describe what the repo already does.

## 5.1.1 Privacy policy

Guideline 5.1.1(i) requires a privacy policy link in App Store Connect and inside the app.

- [ ] Publish a privacy policy URL that identifies what is collected, how it is collected, and every use.
- [ ] Name every third party that receives user data (analytics, crash reporting, AI, affiliates) and state that they protect it to the same standard.
- [ ] Describe retention, how someone revokes consent, and how they request deletion.
- [ ] Put the same URL in App Store Connect → App Information → Privacy Policy URL.
- [ ] Add an in-app link that is reachable without signing in (for example a settings or about screen). The current home screen does not include this link yet.

## 5.1.1 Privacy labels (App Privacy)

App Store Connect nutrition labels must match the binary.

- [ ] Fill in App Privacy for this app before submission.
- [ ] Declare location only if a build actually calls location APIs. The purpose string is configured, and no screen requests location yet. Update the label when that call ships.
- [ ] Declare account identifiers, purchase history, and diagnostics only for data the shipping build collects.
- [ ] Re-check the labels whenever a SDK is added. Do not mark data as "not collected" if a third-party SDK collects it.

## 5.1.1 Purpose strings and consent

Guideline 5.1.1(ii) and (iv): ask only for data the feature needs, and describe the use in the system prompt.

- [x] When-in-use location purpose string is set in `app.config.ts` via the `expo-location` plugin. Background location is off.
- [ ] If the user denies location, offer a manual way to enter a place. Do not block the rest of the app on the permission (5.1.1(iv) and 5.1.2(i)).
- [ ] Add a purpose string for every other protected API (camera, photos, microphone, Bluetooth, motion) before that API is called. A missing string crashes the request and is a review rejection.
- [ ] Keep purpose strings specific. "To improve your experience" is not enough.

The location string states that location is not used to control the vehicle. Keep that true.

## 5.1.2 App Tracking Transparency

Guideline 5.1.2(i): tracking across apps or sites owned by other companies requires the App Tracking Transparency prompt before any track. Advertising identifiers without ATT are a rejection.

- [ ] Do not add an ads or cross-app analytics SDK that tracks until `expo-tracking-transparency` is integrated.
- [ ] Show the ATT prompt before the tracking call, not after.
- [ ] If the user denies ATT, continue without tracking. Do not gate features, content, or payment on allowing tracking.
- [ ] Set the App Privacy "Data Used to Track You" section to match that behavior. If the app does not track, leave tracking off and do not link `AdSupport`.
- [ ] Add `NSUserTrackingUsageDescription` only when a tracking call exists. An unused ATT string is a review question.

This foundation does not request ATT and does not include a tracking SDK.

## 5.1.1(v) In-app account deletion

If the app lets someone create an account, it must let them delete that account from inside the app. Sending them to a website or an email-only request is not enough.

- [ ] Decide whether v1 has accounts. If it does not, do not require sign-in for the core flow (5.1.1(v)).
- [ ] If accounts exist, add a delete-account action in the app that completes deletion (or starts an immediate deletion the user can see) without a support ticket.
- [ ] Delete or anonymize the server record, tokens, and stored vehicle data associated with that account.
- [ ] Say in the privacy policy how deletion works and how long backups retain data.
- [ ] If sign-in uses Sign in with Apple, revoke the token as part of deletion.

There is no account screen in this foundation yet. Add the control in the same release that adds account creation.

## 5.1.5 Location

Use location only for features that need it. Guideline 5.1.5 says location APIs must not provide emergency services or autonomous control of vehicles, aircraft, or similar devices (small toys and remote car alarms are the stated exceptions).

- [x] Location permission is when-in-use only. Always and background location are disabled.
- [x] The purpose string explains the use (vehicle, nearby service, and trip context) and says location does not control the vehicle.
- [ ] Keep location out of any path that steers, accelerates, brakes, or otherwise autonomously controls a car. A companion display is in scope. Drive-by-wire is not.
- [ ] Collect location only after the system permission dialog, and stop when the user turns it off.
- [ ] If you later need background location, turn on `isIosBackgroundLocationEnabled`, add the Always strings, declare the background mode, and justify it in App Review notes. Do not enable it for a map that is only visible while the app is open.

## CarPlay driver distraction

CarPlay is not in the binary. The entitlement is still required from Apple. See [APPLE_PLATFORMS.md](APPLE_PLATFORMS.md). These rules apply the moment `react-native-carplay` is added. They come from the CarPlay Human Interface Guidelines, the CarPlay entitlement addendum, and Guideline 5.1.5.

- [ ] Ship CarPlay only after Apple grants the category entitlement. Do not ship a private entitlement or a copied provisioning profile.
- [ ] Limit the car UI to tasks that are relevant while driving. Sign-in, account deletion, payments setup, long forms, and terms belong on the phone, before the trip.
- [ ] Use CarPlay templates. Do not draw a custom canvas, play video, or show a web view on the car display.
- [ ] Keep each screen glanceable: short labels, few actions, no text the driver must read in paragraphs.
- [ ] Do not refresh the car UI more often than the CarPlay guidelines allow, and do not animate in a way that pulls attention off the road.
- [ ] Do not require the driver to look at the iPhone to complete a CarPlay task.
- [ ] Do not use location from the car UI to control the vehicle. Status, charging, parking, and navigation templates are display and routing. They are not an autonomous-driving controller.
- [ ] Test with the CarPlay simulator against the entitlement you were granted. A template from another category fails review even if it compiles.

## Before you click Submit for Review

TestFlight receiving a build is not App Review.

- [ ] Privacy policy URL is live and linked in the app and in App Store Connect.
- [ ] App Privacy labels match this build.
- [ ] Account deletion works in the binary if accounts exist.
- [ ] Export compliance is still accurate (`ITSAppUsesNonExemptEncryption` is `false` today).
- [ ] CarPlay is either absent, or present with the granted entitlement and a glanceable template UI.
- [ ] A person submits the version in App Store Connect. The GitHub workflow must not gain an auto-submit-for-review step.
