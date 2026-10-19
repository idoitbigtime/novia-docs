import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

// E2E runs against the Vite dev server with the API mocked (no Supabase/OpenAI needed),
// so it can run in CI and in sandboxes without outbound network access.
// In sandboxes that ship a system Chromium (and block downloads) we use it directly;
// CI installs its own matching browser via `playwright install`.
const systemChromium = process.env.PW_CHROMIUM_PATH || "/opt/pw-browsers/chromium";
const launchOptions = !process.env.CI && existsSync(systemChromium)
  ? { executablePath: systemChromium, args: ["--no-sandbox", "--disable-dev-shm-usage"] }
  : undefined;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
    launchOptions,
  },
  webServer: {
    command: "npx vite --port 5173 --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || "https://example.supabase.co",
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || "ci-placeholder",
    },
  },
  // Both projects run on Chromium (the only engine guaranteed everywhere); the
  // iPhone profile is used for its viewport/DPR/UA, which is what the layout tests need.
  projects: [
    { name: "iphone-se", use: { ...devices["iPhone SE"], browserName: "chromium", defaultBrowserType: "chromium" } },
    { name: "android-360", use: { ...devices["Pixel 5"], viewport: { width: 360, height: 740 } } },
  ],
});
