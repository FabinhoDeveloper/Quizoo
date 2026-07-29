-- Temas de fundo por quiz. Seguro rodar mais de uma vez.
alter table public.quizzes add column if not exists theme text not null default 'default';
alter table public.games   add column if not exists theme text not null default 'default';
