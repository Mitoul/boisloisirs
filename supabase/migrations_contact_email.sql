-- À exécuter si votre table contact_requests existe déjà.
alter table public.contact_requests add column if not exists service text;
