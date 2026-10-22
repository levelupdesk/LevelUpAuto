const { withInfoPlist } = require("expo/config-plugins");

/**
 * The Expo prebuild template includes generic camera, microphone, and photo
 * purpose strings. This app does not call those APIs. Remove the strings so
 * App Review does not see a permission prompt the binary never uses.
 */
module.exports = function stripUnusedPermissions(config) {
  return withInfoPlist(config, (config) => {
    delete config.modResults.NSCameraUsageDescription;
    delete config.modResults.NSMicrophoneUsageDescription;
    delete config.modResults.NSPhotoLibraryUsageDescription;
    delete config.modResults.NSPhotoLibraryAddUsageDescription;
    return config;
  });
};
