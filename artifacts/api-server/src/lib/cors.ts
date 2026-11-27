const LOOPBACK_ORIGIN =
  /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/;

const CONFIGURED_ORIGIN = /^https?:\/\/[^\s/]+$/;

export function parseCorsOrigins(value: string | undefined): string[] {
  if (!value || value.trim() === "") {
    return [];
  }

  const origins = value
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  for (const origin of origins) {
    if (!CONFIGURED_ORIGIN.test(origin)) {
      throw new Error(
        `Invalid CORS origin "${origin}". Set CORS_ORIGINS to a comma-separated list of origins such as https://app.example.com.`,
      );
    }
  }

  return origins;
}

export function isCorsOriginAllowed(
  origin: string | undefined,
  options: {
    nodeEnv: string | undefined;
    configuredOrigins: readonly string[];
  },
): boolean {
  if (!origin) {
    return true;
  }

  if (options.configuredOrigins.includes(origin)) {
    return true;
  }

  return options.nodeEnv === "development" && LOOPBACK_ORIGIN.test(origin);
}
