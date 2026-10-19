const corsHeaders = {
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
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const ownerEmail = Deno.env.get("CONTACT_OWNER_EMAIL");
  const fromEmail = Deno.env.get("CONTACT_FROM_EMAIL") || "Bois Loisirs <onboarding@resend.dev>";

  if (!resendApiKey || !ownerEmail) {
    return json({ error: "Email service is not configured" }, 500);
  }

  const { request } = await req.json();
  if (!request) return json({ error: "Missing request" }, 400);

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
