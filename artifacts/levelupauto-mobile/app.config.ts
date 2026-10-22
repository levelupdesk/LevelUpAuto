import type { ConfigContext, ExpoConfig } from "expo/config";

const BUNDLE_ID = "com.levelupauto.mobile";

/**
 * Apple Team ID and the EAS project ID come from the environment.
 * GitHub Actions reads them from secrets. They are not committed.
 */
function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const easProjectId = readEnv("EAS_PROJECT_ID");
  const appleTeamId = readEnv("EXPO_APPLE_TEAM_ID");

  return {
    ...config,
    name: "LevelUpAuto",
    slug: "levelupauto-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "levelupauto-mobile",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: BUNDLE_ID,
      buildNumber: "1",
      ...(appleTeamId ? { appleTeamId } : {}),
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: BUNDLE_ID,
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/images/icon.png",
        backgroundColor: "#ffffff",
      },
    },
    web: {
      favicon: "./assets/images/icon.png",
    },
    plugins: [
      [
        "expo-router",
        {
          origin: "https://levelupauto.com",
        },
      ],
      "expo-font",
      "expo-web-browser",
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "LevelUpAuto uses your location while the app is open to show your vehicle, nearby service, and trip context. Location is not used to control the vehicle.",
          locationAlwaysAndWhenInUsePermission: false,
          locationAlwaysPermission: false,
          isIosBackgroundLocationEnabled: false,
          isAndroidBackgroundLocationEnabled: false,
        },
      ],
      ["@bacons/apple-targets", appleTeamId ? { appleTeamId } : {}],
      "./plugins/strip-unused-permissions",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      ...config.extra,
      ...(easProjectId
        ? {
            eas: {
              projectId: easProjectId,
            },
          }
        : {}),
    },
  };
};
