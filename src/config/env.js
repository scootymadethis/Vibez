function requireEnvironmentVariable(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required but not set.`);
  }

  return value;
}

const nodeEnv = process.env.NODE_ENV || "development";

const config = {
  nodeEnv,
  isDevelopment: nodeEnv === "development",
  isProduction: nodeEnv === "production",
  isTest: nodeEnv === "test",
  port: Number(process.env.PORT ?? 3000),
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  storagePath: process.env.STORAGE_PATH ?? "./storage",
  logLevel:
    process.env.LOG_LEVEL ?? (nodeEnv === "development" ? "debug" : "info"),
};

if(Number.isNaN(config.port)) {
    throw new Error(`Invalid PORT value: ${process.env.PORT}`);
}

module.exports = config;
