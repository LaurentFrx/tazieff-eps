/// <reference lib="webworker" />

import { CacheFirst, ExpirationPlugin, NetworkFirst, Serwist, StaleWhileRevalidate } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: Array<string | import("serwist").PrecacheEntry> | undefined;
};

const isSameOrigin = (url: URL) => url.origin === self.location.origin;

const isEssentialPage = (pathname: string) =>
  pathname === "/exercices" ||
  pathname.startsWith("/exercices/") ||
  pathname === "/seances" ||
  pathname.startsWith("/seances/") ||
  pathname === "/bac" ||
  pathname.startsWith("/apprendre");

const isHtmlRequest = (request: Request) =>
  request.mode === "navigate" ||
  (request.headers.get("accept") ?? "").includes("text/html");

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url }) =>
        isSameOrigin(url) && url.pathname.startsWith("/_next/static/"),
      handler: new CacheFirst({
        cacheName: "next-static",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 64,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          }),
        ],
      }),
    },
    {
      matcher: ({ request }) => request.destination === "font",
      handler: new CacheFirst({
        cacheName: "fonts",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 24,
            maxAgeSeconds: 60 * 60 * 24 * 365,
          }),
        ],
      }),
    },
    {
      matcher: ({ url }) =>
        isSameOrigin(url) &&
        ["/favicon-16.png", "/favicon-32.png", "/apple-touch-icon.png"].includes(
          url.pathname,
        ),
      handler: new CacheFirst({
        cacheName: "icons",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 12,
            maxAgeSeconds: 60 * 60 * 24 * 365,
          }),
        ],
      }),
    },
    {
      matcher: ({ request }) => request.destination === "image",
      handler: new StaleWhileRevalidate({
        cacheName: "images",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 120,
            maxAgeSeconds: 60 * 60 * 24 * 7,
          }),
        ],
      }),
    },
    {
      matcher: ({ request, url }) =>
        isHtmlRequest(request) && isSameOrigin(url) && isEssentialPage(url.pathname),
      handler: new StaleWhileRevalidate({
        cacheName: "pages-essential",
      }),
    },
    {
      matcher: ({ request, url }) =>
        isHtmlRequest(request) && isSameOrigin(url) && !isEssentialPage(url.pathname),
      handler: new NetworkFirst({
        cacheName: "pages-fallback",
      }),
    },
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();
