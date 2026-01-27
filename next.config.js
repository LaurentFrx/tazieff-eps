/* eslint-disable @typescript-eslint/no-require-imports */
const withSerwistInit = require("@serwist/next");
const withSerwist = (withSerwistInit.default ?? withSerwistInit)({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  register: false,
  disable: process.env.NODE_ENV === "development",
  additionalPrecacheEntries: [
    {
      url: "/offline",
      revision: process.env.NEXT_PUBLIC_COMMIT_SHA || "local",
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_COMMIT_SHA:
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.NEXT_PUBLIC_COMMIT_SHA ||
      "local",
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF:
      process.env.VERCEL_GIT_COMMIT_REF || "main",
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || "local",
  },
  outputFileTracingIncludes: {
    "/*": ["content/**/*"],
  },
};

module.exports = withSerwist(nextConfig);
