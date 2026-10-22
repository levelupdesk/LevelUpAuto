/**
 * Fills the production iOS submit profile from the environment.
 *
 * eas-cli does not interpolate ascAppId or appleTeamId inside eas.json.
 * This script writes them at CI time. Do not commit the result.
 */
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const easPath = path.join(projectRoot, "eas.json");

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(
      `Missing ${name}. Set it from GitHub secrets or your shell before uploading to TestFlight. See README.md.`,
    );
    process.exit(1);
  }
  return value;
}

const ascAppId = required("EXPO_ASC_APP_ID");
const appleTeamId = required("EXPO_APPLE_TEAM_ID").toUpperCase();
const keyId = required("EXPO_ASC_KEY_ID");
const issuerId = required("EXPO_ASC_ISSUER_ID");
const keyPath = path.resolve(
  projectRoot,
  process.env.EXPO_ASC_API_KEY_PATH?.trim() || "asc-api-key.p8",
);

if (!/^\d+$/.test(ascAppId)) {
  console.error("EXPO_ASC_APP_ID must be the numeric App Store Connect Apple ID.");
  process.exit(1);
}

if (!/^[A-Z0-9]{10}$/.test(appleTeamId)) {
  console.error("EXPO_APPLE_TEAM_ID must be a 10-character Apple Team ID.");
  process.exit(1);
}

if (!fs.existsSync(keyPath)) {
  console.error(
    "App Store Connect API key file was not found. Write the .p8 contents to EXPO_ASC_API_KEY_PATH before running this script.",
  );
  process.exit(1);
}

const relativeKey = path.relative(projectRoot, keyPath);
const ascApiKeyPath = relativeKey.startsWith(".") ? relativeKey : `./${relativeKey}`;

const eas = JSON.parse(fs.readFileSync(easPath, "utf8"));
eas.submit = eas.submit || {};
eas.submit.production = eas.submit.production || {};
eas.submit.production.ios = {
  ...(eas.submit.production.ios || {}),
  ascAppId,
  appleTeamId,
  ascApiKeyPath,
  ascApiKeyId: keyId,
  ascApiKeyIssuerId: issuerId,
};

fs.writeFileSync(easPath, `${JSON.stringify(eas, null, 2)}\n`);
console.log(
  "Wrote the production iOS submit profile from the environment. Do not commit eas.json.",
);
