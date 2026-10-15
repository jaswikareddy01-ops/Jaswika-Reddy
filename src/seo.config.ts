// Search and AI-answer-engine settings for this app, written by MonstarX's SEO/GEO settings.
//
// Change them in Preview → SEO/GEO or through the authorized builder SEO tools, not here: every save replaces this file. The managed helper
// src/lib/monstarx/seo.ts turns them into the <head> of every page, /robots.txt, /sitemap.xml and /llms.txt.

import type { SeoConfig } from '@/lib/monstarx/seo'

export const seo: SeoConfig = {
  "siteUrl": "",
  "siteName": "Complete Functional JARVIS AI Personal",
  "defaultTitle": "JARVIS Personal Assistant",
  "titleTemplate": "%s · JARVIS",
  "defaultDescription": "",
  "keywords": [],
  "locale": "en",
  "themeColor": "",
  "image": null,
  "imageAlt": "",
  "twitterSite": "",
  "twitterCard": "summary_large_image",
  "indexable": false,
  "robots": {
    "mode": "allow",
    "disallow": [],
    "aiCrawlers": "allow",
    "custom": ""
  },
  "sitemap": {
    "enabled": true,
    "exclude": [],
    "extra": []
  },
  "llms": {
    "enabled": true,
    "summary": "",
    "notes": ""
  },
  "organization": {
    "name": "Complete Functional JARVIS AI Personal",
    "type": "Organization",
    "logo": null,
    "sameAs": [],
    "email": "",
    "phone": "",
    "address": ""
  },
  "verification": {
    "google": "",
    "bing": "",
    "yandex": "",
    "pinterest": ""
  },
  "faq": [],
  "pages": [
    {
      "path": "/",
      "title": "Command Center"
    },
    {
      "path": "/login",
      "title": "Welcome & Sign In"
    },
    {
      "path": "/notes"
    },
    {
      "path": "/notifications"
    },
    {
      "path": "/reminders"
    },
    {
      "path": "/settings"
    },
    {
      "path": "/tasks",
      "title": "Task Manager"
    }
  ],
  "paths": [
    "/",
    "/login",
    "/notes",
    "/notifications",
    "/reminders",
    "/settings",
    "/tasks"
  ]
}

export default seo
