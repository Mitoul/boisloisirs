// Origines autorisées (secret ALLOWED_ORIGINS, séparées par des virgules). Sans valeur : toutes.
const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "").split(",").map((o) => o.trim()).filter(Boolean);
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  if (allowedOrigins.length) {
    if (!allowedOrigins.includes(origin)) return json({ error: "Origin not allowed" }, 403);
    corsHeaders["Access-Control-Allow-Origin"] = origin;
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const ownerEmail = Deno.env.get("CONTACT_OWNER_EMAIL");
  const fromEmail = Deno.env.get("CONTACT_FROM_EMAIL") || "Bois Loisirs <onboarding@resend.dev>";

  if (!resendApiKey || !ownerEmail) {
    return json({ error: "Email service is not configured" }, 500);
  }

  let request: Record<string, unknown>;
  try {
    ({ request } = await req.json());
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  if (!isValid(request)) return json({ error: "Invalid request" }, 400);

  const requestLabel = request.request_type === "devis" ? "Demande de devis" : "Commande";
  const productLabel = request.service || ({
    bois: "Bois de chauffage",
    pellets: "Pellets",
    service: "Service",
  }[request.product] || request.product);

  const html = `
    <h2>Nouvelle ${requestLabel.toLowerCase()} — Bois Loisirs</h2>
    <p><strong>Produit / service :</strong> ${escapeHtml(productLabel)}</p>
    <p><strong>Quantité :</strong> ${escapeHtml(request.quantity || "Non précisée")}</p>
    <hr />
    <p><strong>Nom :</strong> ${escapeHtml(request.first_name)} ${escapeHtml(request.last_name)}</p>
    <p><strong>Email :</strong> ${escapeHtml(request.email)}</p>
    <p><strong>Téléphone :</strong> ${escapeHtml(request.phone)}</p>
    <p><strong>Adresse :</strong> ${escapeHtml(request.address)}, ${escapeHtml(request.postal_code)} ${escapeHtml(request.city)}</p>
    <p><strong>Message :</strong></p>
    <p>${escapeHtml(request.message).replace(/\n/g, "<br />")}</p>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [ownerEmail],
      reply_to: request.email,
      subject: `[Bois Loisirs] ${requestLabel} — ${productLabel}`,
      html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Resend error", detail);
    return json({ error: "Email delivery failed" }, 502);
  }

  return json({ ok: true });
});

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[char] || char));
}

// La fonction est appelable par n'importe qui : on refuse tout ce qui ne ressemble pas à une vraie demande.
function isValid(r: Record<string, unknown> | undefined): boolean {
  if (!r || typeof r !== "object") return false;
  const text = (key: string, min: number, max: number) =>
    typeof r[key] === "string" && (r[key] as string).trim().length >= min && (r[key] as string).length <= max;
  return (
    ["commande", "devis"].includes(String(r.request_type)) &&
    ["bois", "pellets", "service"].includes(String(r.product)) &&
    text("first_name", 1, 80) && text("last_name", 1, 80) &&
    text("email", 5, 160) && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(r.email)) &&
    text("phone", 6, 30) && text("address", 1, 160) && text("postal_code", 3, 10) && text("city", 1, 80) &&
    text("message", 1, 3000) &&
    (r.quantity == null || text("quantity", 0, 120)) && (r.service == null || text("service", 0, 120))
  );
}
