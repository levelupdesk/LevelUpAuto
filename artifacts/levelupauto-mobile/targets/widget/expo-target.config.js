/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: "widget",
  displayName: "LevelUpAuto",
  // ".widget" is appended to com.levelupauto.mobile.
  bundleIdentifier: ".widget",
  deploymentTarget: "17.0",
  icon: "../../assets/images/icon.png",
  colors: {
    $accent: "#1F6B4A",
    $widgetBackground: "#10231C",
  },
};
