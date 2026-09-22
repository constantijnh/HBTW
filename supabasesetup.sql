-- HBTW: tabel voor offerteaanvragen en vragen uit het contactformulier.
-- Plak dit in Supabase > SQL Editor > New query en klik op Run.

create table if not exists public.aanvragen (
  id              uuid primary key default gen_random_uuid(),
  aangemaakt      timestamptz not null default now(),
  type            text not null default 'offerte' check (type in ('offerte','vraag')),
  status          text not null default 'nieuw'
                  check (status in ('nieuw','in_behandeling','offerte_verstuurd','akkoord','afgewezen','afgerond')),
  naam            text not null check (char_length(naam) between 1 and 120),
  email           text not null check (char_length(email) between 3 and 200),
  telefoon        text check (char_length(telefoon) <= 40),
  plaats          text check (char_length(plaats) <= 120),
  soort_werk      text check (char_length(soort_werk) <= 80),
  gewenste_start  text check (char_length(gewenste_start) <= 80),
  budget          text check (char_length(budget) <= 80),
  omschrijving    text not null check (char_length(omschrijving) between 1 and 4000),
  notities        text check (char_length(notities) <= 4000)
);

alter table public.aanvragen enable row level security;

-- Bezoekers van de website mogen alleen NIEUWE aanvragen toevoegen, niets lezen.
create policy "Bezoekers mogen een aanvraag insturen"
  on public.aanvragen for insert to anon
  with check (status = 'nieuw' and notities is null);

-- Alleen jij (ingelogd) mag aanvragen lezen, aanpassen en verwijderen.
create policy "Ingelogd mag lezen"
  on public.aanvragen for select to authenticated using (true);
create policy "Ingelogd mag aanpassen"
  on public.aanvragen for update to authenticated using (true) with check (true);
create policy "Ingelogd mag verwijderen"
  on public.aanvragen for delete to authenticated using (true);

grant insert on public.aanvragen to anon;
grant select, update, delete on public.aanvragen to authenticated;
