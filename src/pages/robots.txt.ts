import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const isProd = (import.meta.env.PUBLIC_SITE_ENV || "production") === "production";
  const base = (site?.toString() || "https://www.boisloisirs.be/").replace(/\/$/, "");
  const body = isProd
    ? `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${base}/sitemap-index.xml\n`
    : `User-agent: *\nDisallow: /\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
