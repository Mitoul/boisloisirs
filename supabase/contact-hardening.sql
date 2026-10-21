-- Bois Loisirs : durcissement du formulaire de contact (anti-spam côté base).
-- À exécuter une fois dans Supabase > SQL Editor. Relançable sans risque.
-- « not valid » : les anciennes demandes ne sont pas contrôlées, seules les nouvelles le sont.

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'contact_requests_lengths') then
    alter table public.contact_requests add constraint contact_requests_lengths check (
      char_length(last_name) between 1 and 80 and char_length(first_name) between 1 and 80
      and char_length(phone) between 6 and 30 and char_length(address) between 1 and 160
      and char_length(postal_code) between 3 and 10 and char_length(city) between 1 and 80
      and char_length(message) between 1 and 3000 and char_length(coalesce(quantity, '')) <= 120
      and char_length(coalesce(service, '')) <= 120
    ) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'contact_requests_email_format') then
    alter table public.contact_requests add constraint contact_requests_email_format
      check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 160) not valid;
  end if;
end $$;
