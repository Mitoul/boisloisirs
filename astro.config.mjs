import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

const siteUrl = process.env.PUBLIC_SITE_URL || "https://www.boisloisirs.be/";

export default defineConfig({
  site: siteUrl,
  integrations: [
    sitemap({ filter: (page) => !page.includes("/admin") })
  ]
});
