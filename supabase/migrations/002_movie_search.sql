-- Расширение для нечёткого поиска (опечатки, похожие строки)
create extension if not exists pg_trgm with schema extensions;

-- Нормализация названий: lower + ё → е
create or replace function public.normalize_movie_text(input text)
returns text
language sql
immutable
parallel safe
as $$
  select lower(replace(replace(trim(input), 'ё', 'е'), 'Ё', 'е'));
$$;

-- Trigram-индексы для быстрого поиска по обоим названиям
create index if not exists movies_title_trgm_idx
  on public.movies using gin (public.normalize_movie_text(title) gin_trgm_ops);

create index if not exists movies_title_original_trgm_idx
  on public.movies using gin (public.normalize_movie_text(coalesce(title_original, '')) gin_trgm_ops);

-- Поиск фильмов: локализованное + оригинальное название, с учётом опечаток
create or replace function public.search_movies(
  search_query text,
  result_limit int default 8
)
returns table (
  id uuid,
  title text,
  title_original text,
  year int,
  score real
)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  normalized_query text;
  effective_limit int;
begin
  normalized_query := public.normalize_movie_text(search_query);
  effective_limit := greatest(1, least(coalesce(result_limit, 8), 20));

  if length(normalized_query) < 1 then
    return;
  end if;

  -- Порог схожести для оператора % (по умолчанию 0.3 — снижаем для коротких запросов)
  perform set_config('pg_trgm.similarity_threshold', '0.25', true);

  return query
  with candidates as (
    select
      m.id,
      m.title,
      m.title_original,
      m.year,
      public.normalize_movie_text(m.title) as norm_title,
      public.normalize_movie_text(coalesce(m.title_original, '')) as norm_original
    from public.movies m
    where
      public.normalize_movie_text(m.title) % normalized_query
      or public.normalize_movie_text(coalesce(m.title_original, '')) % normalized_query
      or public.normalize_movie_text(m.title) ilike normalized_query || '%'
      or public.normalize_movie_text(coalesce(m.title_original, '')) ilike normalized_query || '%'
      or public.normalize_movie_text(m.title) like '%' || normalized_query || '%'
      or public.normalize_movie_text(coalesce(m.title_original, '')) like '%' || normalized_query || '%'
  )
  select
    c.id,
    c.title,
    c.title_original,
    c.year,
    (
      greatest(
        similarity(c.norm_title, normalized_query),
        similarity(c.norm_original, normalized_query),
        word_similarity(normalized_query, c.norm_title),
        word_similarity(normalized_query, c.norm_original)
      )
      + case when c.norm_title like normalized_query || '%' then 0.6 else 0 end
      + case when c.norm_original like normalized_query || '%' then 0.6 else 0 end
      + case
          when c.norm_title = normalized_query or c.norm_original = normalized_query then 1.0
          else 0
        end
    )::real as score
  from candidates c
  where c.norm_title <> '' or c.norm_original <> ''
  order by score desc, c.year desc
  limit effective_limit;
end;
$$;

grant execute on function public.search_movies(text, int) to anon, authenticated;
