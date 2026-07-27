-- ============================================================
-- Quizoo — schema do banco (Supabase / Postgres)
-- Rode este arquivo no Supabase: Dashboard > SQL Editor > New query > cole tudo > Run.
-- Seguro rodar mais de uma vez (usa IF NOT EXISTS / OR REPLACE).
-- ============================================================

-- ---------- Perfis (1 por usuário autenticado) ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  username   text,
  created_at timestamptz not null default now()
);

-- Cria um profile automaticamente quando alguém se cadastra.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data ->> 'username')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Quizzes ----------
create table if not exists public.quizzes (
  id           uuid primary key default gen_random_uuid(),
  owner        uuid not null references auth.users (id) on delete cascade,
  title        text not null,
  description  text,
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- Perguntas ----------
create table if not exists public.questions (
  id         uuid primary key default gen_random_uuid(),
  quiz_id    uuid not null references public.quizzes (id) on delete cascade,
  position   int  not null default 0,
  prompt     text not null,
  time_limit int  not null default 20,
  points     int  not null default 1000
);

-- ---------- Alternativas ----------
create table if not exists public.answers (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  position    int  not null default 0,
  label       text not null,
  is_correct  boolean not null default false
);

-- ---------- Partidas (jogo ao vivo) ----------
create table if not exists public.games (
  id               uuid primary key default gen_random_uuid(),
  quiz_id          uuid not null references public.quizzes (id) on delete cascade,
  host             uuid not null references auth.users (id) on delete cascade,
  pin              text not null unique,
  status           text not null default 'lobby'
                     check (status in ('lobby', 'question', 'reveal', 'ended')),
  current_position int not null default -1,
  created_at       timestamptz not null default now()
);

-- ---------- Jogadores de uma partida (podem ser anônimos) ----------
create table if not exists public.game_players (
  id        uuid primary key default gen_random_uuid(),
  game_id   uuid not null references public.games (id) on delete cascade,
  user_id   uuid references auth.users (id) on delete set null,
  nickname  text not null,
  score     int  not null default 0,
  joined_at timestamptz not null default now()
);

-- ---------- Respostas dadas durante a partida ----------
create table if not exists public.game_answers (
  id          uuid primary key default gen_random_uuid(),
  game_id     uuid not null references public.games (id) on delete cascade,
  player_id   uuid not null references public.game_players (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  answer_id   uuid references public.answers (id) on delete set null,
  is_correct  boolean not null default false,
  response_ms int,
  awarded     int not null default 0,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
alter table public.profiles     enable row level security;
alter table public.quizzes      enable row level security;
alter table public.questions    enable row level security;
alter table public.answers      enable row level security;
alter table public.games        enable row level security;
alter table public.game_players enable row level security;
alter table public.game_answers enable row level security;

-- Perfis: qualquer um lê, cada um edita o seu.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select using (true);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Quizzes: dono vê os seus; publicados são públicos. Dono cria/edita/apaga.
drop policy if exists "quizzes_select" on public.quizzes;
create policy "quizzes_select" on public.quizzes for select
  using (owner = auth.uid() or is_published);
drop policy if exists "quizzes_insert_own" on public.quizzes;
create policy "quizzes_insert_own" on public.quizzes for insert with check (owner = auth.uid());
drop policy if exists "quizzes_update_own" on public.quizzes;
create policy "quizzes_update_own" on public.quizzes for update using (owner = auth.uid());
drop policy if exists "quizzes_delete_own" on public.quizzes;
create policy "quizzes_delete_own" on public.quizzes for delete using (owner = auth.uid());

-- Perguntas: visíveis se o quiz é visível; gerenciadas pelo dono do quiz.
drop policy if exists "questions_select" on public.questions;
create policy "questions_select" on public.questions for select
  using (exists (
    select 1 from public.quizzes q
    where q.id = questions.quiz_id and (q.owner = auth.uid() or q.is_published)
  ));
drop policy if exists "questions_write_owner" on public.questions;
create policy "questions_write_owner" on public.questions for all
  using (exists (select 1 from public.quizzes q where q.id = questions.quiz_id and q.owner = auth.uid()))
  with check (exists (select 1 from public.quizzes q where q.id = questions.quiz_id and q.owner = auth.uid()));

-- Alternativas: mesma lógica, via a pergunta -> quiz.
drop policy if exists "answers_select" on public.answers;
create policy "answers_select" on public.answers for select
  using (exists (
    select 1 from public.questions qs
    join public.quizzes q on q.id = qs.quiz_id
    where qs.id = answers.question_id and (q.owner = auth.uid() or q.is_published)
  ));
drop policy if exists "answers_write_owner" on public.answers;
create policy "answers_write_owner" on public.answers for all
  using (exists (
    select 1 from public.questions qs
    join public.quizzes q on q.id = qs.quiz_id
    where qs.id = answers.question_id and q.owner = auth.uid()
  ))
  with check (exists (
    select 1 from public.questions qs
    join public.quizzes q on q.id = qs.quiz_id
    where qs.id = answers.question_id and q.owner = auth.uid()
  ));

-- Partidas: qualquer um lê (para entrar com PIN); só o host cria/atualiza.
drop policy if exists "games_select" on public.games;
create policy "games_select" on public.games for select using (true);
drop policy if exists "games_insert_host" on public.games;
create policy "games_insert_host" on public.games for insert with check (host = auth.uid());
drop policy if exists "games_update_host" on public.games;
create policy "games_update_host" on public.games for update using (host = auth.uid());

-- Jogadores: qualquer um lê e entra (jogador anônimo). Refinaremos na fase do jogo ao vivo.
drop policy if exists "game_players_select" on public.game_players;
create policy "game_players_select" on public.game_players for select using (true);
drop policy if exists "game_players_insert" on public.game_players;
create policy "game_players_insert" on public.game_players for insert with check (true);
drop policy if exists "game_players_update" on public.game_players;
create policy "game_players_update" on public.game_players for update using (true);

-- Respostas do jogo: qualquer um insere/lê (MVP). Endurecer depois com funções server-side.
drop policy if exists "game_answers_select" on public.game_answers;
create policy "game_answers_select" on public.game_answers for select using (true);
drop policy if exists "game_answers_insert" on public.game_answers;
create policy "game_answers_insert" on public.game_answers for insert with check (true);
