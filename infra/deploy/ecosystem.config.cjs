// pm2 process definition for the Gardening Helper backend.
// Usage: pm2 startOrReload infra/deploy/ecosystem.config.cjs --update-env
//
// Expects backend/.env (or equivalent process env vars) to provide
// DATABASE_URL, SUPABASE_*, VAPID_*, AI_* etc. per docs/env.example.
// Never commit real secrets into this file.

const path = require("node:path");

const backendDir = path.join(__dirname, "..", "..", "backend");

module.exports = {
  apps: [
    {
      name: "gardening-helper-backend",
      cwd: backendDir,
      script: "dist/server.js",
      instances: 1,
      exec_mode: "fork",
      env_file: path.join(backendDir, ".env"),
      env: {
        NODE_ENV: "production",
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
};
