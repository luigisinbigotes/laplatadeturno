import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "https://laplatadeturno.vercel.app";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  failOnFlakyTests: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html"], ["github"]] : [["list"], ["html"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "android-chrome",
      use: {
        ...devices["Pixel 7"],
        browserName: "chromium",
        permissions: ["geolocation"],
        geolocation: {
          latitude: -34.9214,
          longitude: -57.9545
        },
        colorScheme: "light"
      }
    },
    {
      name: "iphone-safari",
      use: {
        ...devices["iPhone 14"],
        browserName: "webkit",
        permissions: ["geolocation"],
        geolocation: {
          latitude: -34.9214,
          longitude: -57.9545
        },
        colorScheme: "light"
      }
    },
    {
      name: "iphone-dark",
      use: {
        ...devices["iPhone 14"],
        browserName: "webkit",
        permissions: ["geolocation"],
        geolocation: {
          latitude: -34.9214,
          longitude: -57.9545
        },
        colorScheme: "dark"
      }
    }
  ]
});
