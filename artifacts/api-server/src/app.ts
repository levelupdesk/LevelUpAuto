import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { isCorsOriginAllowed, parseCorsOrigins } from "./lib/cors";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

const corsOptions = {
  nodeEnv: process.env.NODE_ENV,
  configuredOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
};

if (
  corsOptions.nodeEnv === "production" &&
  corsOptions.configuredOrigins.length === 0
) {
  logger.warn(
    "CORS_ORIGINS is unset; browser cross-origin requests will be rejected.",
  );
}

app.use(
  cors({
    origin(origin, callback) {
      if (isCorsOriginAllowed(origin, corsOptions)) {
        callback(null, Boolean(origin));
        return;
      }

      callback(null, false);
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
