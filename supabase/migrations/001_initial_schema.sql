-- Фильмы
create table public.movies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_original text,
  year integer not null,
  frame_url text not null,
  hints jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Ежедневные пазлы
create table public.daily_puzzles (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  movie_id uuid not null references public.movies(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Попытки игроков
create table public.user_guesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  puzzle_id uuid not null references public.daily_puzzles(id) on delete cascade,
  guess text not null,
  is_correct boolean not null default false,
  attempt_number integer not null,
  created_at timestamptz not null default now()
);

-- Статистика пользователей
create table public.user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  games_played integer not null default 0,
  games_won integer not null default 0,
  current_streak integer not null default 0,
  max_streak integer not null default 0,
  average_attempts numeric(4, 2) not null default 0,
  updated_at timestamptz not null default now()
);

-- Индексы
create index daily_puzzles_date_idx on public.daily_puzzles (date desc);
create index user_guesses_puzzle_id_idx on public.user_guesses (puzzle_id);
create index user_guesses_user_id_idx on public.user_guesses (user_id);

-- RLS
alter table public.movies enable row level security;
alter table public.daily_puzzles enable row level security;
alter table public.user_guesses enable row level security;
alter table public.user_stats enable row level security;

-- Публичное чтение фильмов и пазлов
create policy "Movies are viewable by everyone"
  on public.movies for select using (true);

create policy "Daily puzzles are viewable by everyone"
  on public.daily_puzzles for select using (true);

-- Пользователи видят только свои попытки
create policy "Users can view own guesses"
  on public.user_guesses for select
  using (auth.uid() = user_id or user_id is null);

create policy "Users can insert own guesses"
  on public.user_guesses for insert
  with check (auth.uid() = user_id or user_id is null);

-- Пользователи видят только свою статистику
create policy "Users can view own stats"
  on public.user_stats for select
  using (auth.uid() = user_id);

create policy "Users can update own stats"
  on public.user_stats for update
  using (auth.uid() = user_id);
