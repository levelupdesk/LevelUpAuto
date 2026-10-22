# Apple platforms

This app stays on Continuous Native Generation. `ios/` and `android/` are gitignored and are produced by `expo prebuild` or EAS Build. Do not commit a generated `ios/` folder to add a platform.

The iOS app identifier is `com.levelupauto.mobile`. `@bacons/apple-targets` (4.0.7, compatible with Expo SDK 54) adds the extensions below. A leading dot on `bundleIdentifier` appends that suffix to the iOS bundle ID.

| Target | Directory | Type | Bundle ID |
| --- | --- | --- | --- |
| Home-screen widget | `targets/widget` | `widget` | `com.levelupauto.mobile.widget` |
| watchOS app | `targets/watch` | `watch` | `com.levelupauto.mobile.watch` |

Both targets are placeholder SwiftUI. React Native does not run on watchOS, and WidgetKit extensions do not run JavaScript. Edit the Swift under `targets/` and let prebuild link it. `EXPO_APPLE_TEAM_ID` is passed into the plugin when it is set. A missing team ID warns at prebuild time and must be set before a signed device build.

Regenerate the Xcode project locally with:

```bash
pnpm exec expo prebuild --platform ios --clean
```

Delete `ios/` afterward if you only needed to inspect it. EAS Build runs prebuild on the builder.

## iPhone and iPad

`ios.supportsTablet` is `true`, so the same binary is an iPhone and iPad app. Keep layouts usable on a regular iPad width. There is no separate iPad target.

## Mac (Designed for iPad)

A Mac Catalyst or native macOS target is not part of this project. Mac support is the Designed for iPad path:

1. Ship the iPad-capable iOS app (`supportsTablet: true` is already set).
2. In App Store Connect, leave the app available as an iPad app on Apple silicon Macs.
3. Check the Mac screenshots and the minimum window size before you turn that availability on.

Do not add a macOS Xcode target unless the product later needs AppKit or Mac-only entitlements. That would leave CNG.

## visionOS

Expo SDK 54 does not generate a native visionOS target. The supported path for this repo is the compatible iPad app:

1. Keep `supportsTablet` enabled so the iOS binary can be offered as a compatible iPad app on Apple Vision Pro.
2. Review it in the visionOS simulator as an iPad app before enabling visionOS availability in App Store Connect.
3. A native visionOS (SwiftUI / RealityKit) target waits until Expo CNG can generate one without a committed `ios/` tree. Do not add a hand-maintained visionOS project beside the iOS app.

`@bacons/apple-targets` does not create a visionOS product. Do not point a widget or watch target at the visionOS SDK.

## watchOS

`targets/watch` is a companion SwiftUI app embedded in the iOS app. It is not a standalone watch app. The placeholder shows the product name only.

When you share data with the phone, add an App Group entitlement to both the iOS app and the watch target, and register that group on the Apple Developer identifier. Do that in `expo-target.config.js` and the iOS config, not by editing a committed Xcode project.

Complications can be a later `watch-widget` target (`type: "watch-widget"`). One widget extension per watch app is the usual shape. Do not add it until the watch UI needs a face complication.

## Widgets

`targets/widget` is a WidgetKit extension (small and medium families) with a static timeline. It does not read vehicle data yet. Live Activities and Control Center widgets are intentionally omitted so the extension stays a small, compiling placeholder.

Guideline 2.5.16 requires widgets to relate to the app. When the timeline shows real vehicle state, keep the widget free of ads (Guideline 2.5.18).

## CarPlay

CarPlay is not linked into this binary. `react-native-carplay` is the intended library when the product is ready, and it needs an Apple entitlement before a device, TestFlight, or App Store build can enable the car UI.

Do not add the dependency yet. Without the entitlement, the capability fails signing and the App Store build is not a valid CarPlay app. Adding it early also risks showing a CarPlay icon before the UI is ready. Apple does not let you hide CarPlay per user once the entitlement is in the provisioning profile.

Request the entitlement at [developer.apple.com/carplay](https://developer.apple.com/carplay/) for one category. Common keys:

| Category | Entitlement |
| --- | --- |
| Audio | `com.apple.developer.carplay-audio` |
| Communication | `com.apple.developer.carplay-communication` |
| EV charging | `com.apple.developer.carplay-charging` |
| Fueling | `com.apple.developer.carplay-fueling` |
| Navigation | `com.apple.developer.carplay-maps` |
| Parking | `com.apple.developer.carplay-parking` |
| Driving task | `com.apple.developer.carplay-driving-task` |
| Quick food ordering | `com.apple.developer.carplay-quick-ordering` |

A vehicle-status app is most likely to fit **driving task**, **EV charging**, or **parking**. Apple assigns the key. Do not combine categories unless Apple's CarPlay entitlement addendum says that pair is allowed.

After the entitlement is on the App ID:

1. Add `react-native-carplay` and a config plugin that sets only the granted entitlement.
2. Rebuild the provisioning profile on EAS so the profile contains that entitlement.
3. Use CarPlay templates only. The app does not draw the car UI itself.
4. Follow the driver-distraction rules in [APP_STORE_REVIEW_SECTION_5.md](APP_STORE_REVIEW_SECTION_5.md).

Guideline 5.1.5 also forbids using location APIs for autonomous control of a vehicle. CarPlay here is a glanceable companion, not a drive-by-wire controller.

## tvOS

tvOS is experimental in Expo SDK 54 and is not enabled in this package. The phone `react-native` pin stays `0.81.5`, which is the version Expo SDK 54 supports. Swapping it for `react-native-tvos` would replace the iOS binary's React Native and is out of scope.

When a TV app is actually required, follow [Expo's TV guide](https://docs.expo.dev/guides/building-for-tv/) on a branch that can break the phone target independently:

- For SDK 54, use `react-native-tvos` at the 0.81 line (`react-native-tvos@0.81-stable`) and exclude `react-native` from `expo install` version checks.
- tvOS replaces the iOS target in that prebuild. It is not an extra target next to the iPhone app inside the same Xcode project generated today.
- Not every Expo module runs on Apple TV. Check the support list in the TV guide before depending on location, maps, or the widget targets.

Do not change the `react-native` version in this app to experiment with tvOS.
