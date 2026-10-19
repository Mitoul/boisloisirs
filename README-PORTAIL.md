# Portail client / administration Bois Loisirs

La refonte inclut un portail `/admin/` pour gérer le prix du bois et les photos, ainsi que les demandes envoyées via le formulaire de contact.

## 1. Créer le projet Supabase

1. Créer un projet sur Supabase.
2. Ouvrir **SQL Editor**.
3. Exécuter `supabase/schema.sql`.
4. Dans **Storage**, créer un bucket public nommé `site-media`.
5. Dans **Authentication > Users**, créer le compte de l'administrateur.
6. Copier l'UUID de cet utilisateur dans `public.admin_users` :

```sql
insert into public.admin_users (user_id)
values ('UUID_DU_COMPTE_ADMIN');
```

## 2. Variables d'environnement

Copier `.env.example` vers `.env` puis renseigner :

```env
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=xxxxx
```

La clé `anon`/publishable peut être exposée au navigateur lorsque les politiques RLS sont correctement configurées. Ne jamais mettre la `service_role` key dans le site.

## 3. Lancer le projet

```bash
npm install
npm run dev
```

Le portail est accessible sur :

`http://localhost:4321/admin/`

## 4. Fonctionnement

- Les visiteurs envoient leurs commandes/demandes de devis via `/#contact`.
- Les demandes sont enregistrées dans `contact_requests`.
- Seuls les comptes présents dans `admin_users` peuvent consulter les demandes.
- Le prix du bois est enregistré dans `site_settings`.
- Les photos sont envoyées dans Storage puis référencées dans `site_media`.
- Les pages produit lisent les prix/photos publiés et conservent un fallback local si Supabase n'est pas configuré.

## À propos des champs de l'ancien formulaire

La page de contact historique n'est pas exposée de manière exploitable par le moteur de recherche utilisé pour cette refonte. Le nouveau formulaire reprend les informations nécessaires à une commande/devis : nom, prénom, email, téléphone, adresse, code postal, ville, produit, quantité et message, avec le choix commande/devis et le consentement. Si une capture/export de l'ancien formulaire est fourni, les libellés et champs peuvent être alignés à l'identique.

## Notification email des demandes

Les demandes restent enregistrées dans `contact_requests` et peuvent aussi être envoyées par email au propriétaire via la fonction Supabase `send-contact-email`.

### Mise en place

1. Créez un compte Resend et vérifiez votre domaine d'envoi.
2. Déployez la fonction :
   `supabase functions deploy send-contact-email`
3. Ajoutez les secrets à Supabase :
   `supabase secrets set RESEND_API_KEY=... CONTACT_OWNER_EMAIL=frederic.vanderlin@gmail.com CONTACT_FROM_EMAIL="Bois Loisirs <contact@votredomaine.be>"`
4. Ajoutez au `.env` du site :
   `PUBLIC_CONTACT_EMAIL_FUNCTION=https://VOTRE-PROJET.supabase.co/functions/v1/send-contact-email`

Le champ `reply_to` utilise l'adresse du client : depuis l'email reçu, le propriétaire peut donc répondre directement au demandeur.
