-- ============================================================
-- Quizoo — migration: avatares de perfil + imagens nas perguntas
-- Rode no Supabase: Dashboard > SQL Editor > New query > cole tudo > Run.
-- Seguro rodar mais de uma vez.
-- ============================================================

-- 1) Colunas novas -------------------------------------------------
alter table public.profiles     add column if not exists avatar_url text;
alter table public.questions    add column if not exists image_url  text;
-- Avatar do jogador na partida (pode ser anônimo, então guardamos aqui).
alter table public.game_players add column if not exists avatar text;

-- 2) Bucket de Storage público "uploads" ---------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'uploads', 'uploads', true, 5242880,
  array['image/png','image/jpeg','image/jpg','image/webp','image/gif']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/png','image/jpeg','image/jpg','image/webp','image/gif'];

-- 3) Políticas RLS do Storage --------------------------------------
-- Leitura pública (as imagens aparecem no jogo pra qualquer um).
drop policy if exists "uploads_public_read" on storage.objects;
create policy "uploads_public_read" on storage.objects
  for select using (bucket_id = 'uploads');

-- Só usuários autenticados podem enviar/atualizar/apagar no bucket.
drop policy if exists "uploads_auth_insert" on storage.objects;
create policy "uploads_auth_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'uploads');

drop policy if exists "uploads_auth_update" on storage.objects;
create policy "uploads_auth_update" on storage.objects
  for update to authenticated using (bucket_id = 'uploads');

drop policy if exists "uploads_auth_delete" on storage.objects;
create policy "uploads_auth_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'uploads');
