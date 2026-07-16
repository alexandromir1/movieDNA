-- Daily-система: порядок фильмов, кадры, очистка статического пазла

alter table public.movies
  add column if not exists sort_order integer,
  add column if not exists frame_urls jsonb not null default '[]'::jsonb;

-- Проставить порядок существующим фильмам
update public.movies set sort_order = 1,  frame_urls = '["https://picsum.photos/seed/kinoshka-m1-f1/1280/720","https://picsum.photos/seed/kinoshka-m1-f2/1280/720","https://picsum.photos/seed/kinoshka-m1-f3/1280/720","https://picsum.photos/seed/kinoshka-m1-f4/1280/720","https://picsum.photos/seed/kinoshka-m1-f5/1280/720","https://picsum.photos/seed/kinoshka-m1-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000001';
update public.movies set sort_order = 2,  frame_urls = '["https://picsum.photos/seed/kinoshka-m2-f1/1280/720","https://picsum.photos/seed/kinoshka-m2-f2/1280/720","https://picsum.photos/seed/kinoshka-m2-f3/1280/720","https://picsum.photos/seed/kinoshka-m2-f4/1280/720","https://picsum.photos/seed/kinoshka-m2-f5/1280/720","https://picsum.photos/seed/kinoshka-m2-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000002';
update public.movies set sort_order = 3,  frame_urls = '["https://picsum.photos/seed/kinoshka-m3-f1/1280/720","https://picsum.photos/seed/kinoshka-m3-f2/1280/720","https://picsum.photos/seed/kinoshka-m3-f3/1280/720","https://picsum.photos/seed/kinoshka-m3-f4/1280/720","https://picsum.photos/seed/kinoshka-m3-f5/1280/720","https://picsum.photos/seed/kinoshka-m3-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000003';
update public.movies set sort_order = 4,  frame_urls = '["https://picsum.photos/seed/kinoshka-m4-f1/1280/720","https://picsum.photos/seed/kinoshka-m4-f2/1280/720","https://picsum.photos/seed/kinoshka-m4-f3/1280/720","https://picsum.photos/seed/kinoshka-m4-f4/1280/720","https://picsum.photos/seed/kinoshka-m4-f5/1280/720","https://picsum.photos/seed/kinoshka-m4-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000004';
update public.movies set sort_order = 5,  frame_urls = '["https://picsum.photos/seed/kinoshka-m5-f1/1280/720","https://picsum.photos/seed/kinoshka-m5-f2/1280/720","https://picsum.photos/seed/kinoshka-m5-f3/1280/720","https://picsum.photos/seed/kinoshka-m5-f4/1280/720","https://picsum.photos/seed/kinoshka-m5-f5/1280/720","https://picsum.photos/seed/kinoshka-m5-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000005';
update public.movies set sort_order = 6,  frame_urls = '["https://picsum.photos/seed/kinoshka-m6-f1/1280/720","https://picsum.photos/seed/kinoshka-m6-f2/1280/720","https://picsum.photos/seed/kinoshka-m6-f3/1280/720","https://picsum.photos/seed/kinoshka-m6-f4/1280/720","https://picsum.photos/seed/kinoshka-m6-f5/1280/720","https://picsum.photos/seed/kinoshka-m6-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000006';
update public.movies set sort_order = 7,  frame_urls = '["https://picsum.photos/seed/kinoshka-m7-f1/1280/720","https://picsum.photos/seed/kinoshka-m7-f2/1280/720","https://picsum.photos/seed/kinoshka-m7-f3/1280/720","https://picsum.photos/seed/kinoshka-m7-f4/1280/720","https://picsum.photos/seed/kinoshka-m7-f5/1280/720","https://picsum.photos/seed/kinoshka-m7-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000007';
update public.movies set sort_order = 8,  frame_urls = '["https://picsum.photos/seed/kinoshka-m8-f1/1280/720","https://picsum.photos/seed/kinoshka-m8-f2/1280/720","https://picsum.photos/seed/kinoshka-m8-f3/1280/720","https://picsum.photos/seed/kinoshka-m8-f4/1280/720","https://picsum.photos/seed/kinoshka-m8-f5/1280/720","https://picsum.photos/seed/kinoshka-m8-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000008';
update public.movies set sort_order = 9,  frame_urls = '["https://picsum.photos/seed/kinoshka-m9-f1/1280/720","https://picsum.photos/seed/kinoshka-m9-f2/1280/720","https://picsum.photos/seed/kinoshka-m9-f3/1280/720","https://picsum.photos/seed/kinoshka-m9-f4/1280/720","https://picsum.photos/seed/kinoshka-m9-f5/1280/720","https://picsum.photos/seed/kinoshka-m9-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000009';
update public.movies set sort_order = 10, frame_urls = '["https://picsum.photos/seed/kinoshka-m10-f1/1280/720","https://picsum.photos/seed/kinoshka-m10-f2/1280/720","https://picsum.photos/seed/kinoshka-m10-f3/1280/720","https://picsum.photos/seed/kinoshka-m10-f4/1280/720","https://picsum.photos/seed/kinoshka-m10-f5/1280/720","https://picsum.photos/seed/kinoshka-m10-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000010';
update public.movies set sort_order = 11, frame_urls = '["https://picsum.photos/seed/kinoshka-m11-f1/1280/720","https://picsum.photos/seed/kinoshka-m11-f2/1280/720","https://picsum.photos/seed/kinoshka-m11-f3/1280/720","https://picsum.photos/seed/kinoshka-m11-f4/1280/720","https://picsum.photos/seed/kinoshka-m11-f5/1280/720","https://picsum.photos/seed/kinoshka-m11-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000011';
update public.movies set sort_order = 12, frame_urls = '["https://picsum.photos/seed/kinoshka-m12-f1/1280/720","https://picsum.photos/seed/kinoshka-m12-f2/1280/720","https://picsum.photos/seed/kinoshka-m12-f3/1280/720","https://picsum.photos/seed/kinoshka-m12-f4/1280/720","https://picsum.photos/seed/kinoshka-m12-f5/1280/720","https://picsum.photos/seed/kinoshka-m12-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000012';
update public.movies set sort_order = 13, frame_urls = '["https://picsum.photos/seed/kinoshka-m13-f1/1280/720","https://picsum.photos/seed/kinoshka-m13-f2/1280/720","https://picsum.photos/seed/kinoshka-m13-f3/1280/720","https://picsum.photos/seed/kinoshka-m13-f4/1280/720","https://picsum.photos/seed/kinoshka-m13-f5/1280/720","https://picsum.photos/seed/kinoshka-m13-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000013';
update public.movies set sort_order = 14, frame_urls = '["https://picsum.photos/seed/kinoshka-m14-f1/1280/720","https://picsum.photos/seed/kinoshka-m14-f2/1280/720","https://picsum.photos/seed/kinoshka-m14-f3/1280/720","https://picsum.photos/seed/kinoshka-m14-f4/1280/720","https://picsum.photos/seed/kinoshka-m14-f5/1280/720","https://picsum.photos/seed/kinoshka-m14-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000014';
update public.movies set sort_order = 15, frame_urls = '["https://picsum.photos/seed/kinoshka-m15-f1/1280/720","https://picsum.photos/seed/kinoshka-m15-f2/1280/720","https://picsum.photos/seed/kinoshka-m15-f3/1280/720","https://picsum.photos/seed/kinoshka-m15-f4/1280/720","https://picsum.photos/seed/kinoshka-m15-f5/1280/720","https://picsum.photos/seed/kinoshka-m15-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000015';
update public.movies set sort_order = 16, frame_urls = '["https://picsum.photos/seed/kinoshka-m16-f1/1280/720","https://picsum.photos/seed/kinoshka-m16-f2/1280/720","https://picsum.photos/seed/kinoshka-m16-f3/1280/720","https://picsum.photos/seed/kinoshka-m16-f4/1280/720","https://picsum.photos/seed/kinoshka-m16-f5/1280/720","https://picsum.photos/seed/kinoshka-m16-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000016';
update public.movies set sort_order = 17, frame_urls = '["https://picsum.photos/seed/kinoshka-m17-f1/1280/720","https://picsum.photos/seed/kinoshka-m17-f2/1280/720","https://picsum.photos/seed/kinoshka-m17-f3/1280/720","https://picsum.photos/seed/kinoshka-m17-f4/1280/720","https://picsum.photos/seed/kinoshka-m17-f5/1280/720","https://picsum.photos/seed/kinoshka-m17-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000017';
update public.movies set sort_order = 18, frame_urls = '["https://picsum.photos/seed/kinoshka-m18-f1/1280/720","https://picsum.photos/seed/kinoshka-m18-f2/1280/720","https://picsum.photos/seed/kinoshka-m18-f3/1280/720","https://picsum.photos/seed/kinoshka-m18-f4/1280/720","https://picsum.photos/seed/kinoshka-m18-f5/1280/720","https://picsum.photos/seed/kinoshka-m18-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000018';
update public.movies set sort_order = 19, frame_urls = '["https://picsum.photos/seed/kinoshka-m19-f1/1280/720","https://picsum.photos/seed/kinoshka-m19-f2/1280/720","https://picsum.photos/seed/kinoshka-m19-f3/1280/720","https://picsum.photos/seed/kinoshka-m19-f4/1280/720","https://picsum.photos/seed/kinoshka-m19-f5/1280/720","https://picsum.photos/seed/kinoshka-m19-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000019';
update public.movies set sort_order = 20, frame_urls = '["https://picsum.photos/seed/kinoshka-m20-f1/1280/720","https://picsum.photos/seed/kinoshka-m20-f2/1280/720","https://picsum.photos/seed/kinoshka-m20-f3/1280/720","https://picsum.photos/seed/kinoshka-m20-f4/1280/720","https://picsum.photos/seed/kinoshka-m20-f5/1280/720","https://picsum.photos/seed/kinoshka-m20-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000020';
update public.movies set sort_order = 21, frame_urls = '["https://picsum.photos/seed/kinoshka-m21-f1/1280/720","https://picsum.photos/seed/kinoshka-m21-f2/1280/720","https://picsum.photos/seed/kinoshka-m21-f3/1280/720","https://picsum.photos/seed/kinoshka-m21-f4/1280/720","https://picsum.photos/seed/kinoshka-m21-f5/1280/720","https://picsum.photos/seed/kinoshka-m21-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000021';
update public.movies set sort_order = 22, frame_urls = '["https://picsum.photos/seed/kinoshka-m22-f1/1280/720","https://picsum.photos/seed/kinoshka-m22-f2/1280/720","https://picsum.photos/seed/kinoshka-m22-f3/1280/720","https://picsum.photos/seed/kinoshka-m22-f4/1280/720","https://picsum.photos/seed/kinoshka-m22-f5/1280/720","https://picsum.photos/seed/kinoshka-m22-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000022';
update public.movies set sort_order = 23, frame_urls = '["https://picsum.photos/seed/kinoshka-m23-f1/1280/720","https://picsum.photos/seed/kinoshka-m23-f2/1280/720","https://picsum.photos/seed/kinoshka-m23-f3/1280/720","https://picsum.photos/seed/kinoshka-m23-f4/1280/720","https://picsum.photos/seed/kinoshka-m23-f5/1280/720","https://picsum.photos/seed/kinoshka-m23-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000023';
update public.movies set sort_order = 24, frame_urls = '["https://picsum.photos/seed/kinoshka-m24-f1/1280/720","https://picsum.photos/seed/kinoshka-m24-f2/1280/720","https://picsum.photos/seed/kinoshka-m24-f3/1280/720","https://picsum.photos/seed/kinoshka-m24-f4/1280/720","https://picsum.photos/seed/kinoshka-m24-f5/1280/720","https://picsum.photos/seed/kinoshka-m24-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000024';
update public.movies set sort_order = 25, frame_urls = '["https://picsum.photos/seed/kinoshka-m25-f1/1280/720","https://picsum.photos/seed/kinoshka-m25-f2/1280/720","https://picsum.photos/seed/kinoshka-m25-f3/1280/720","https://picsum.photos/seed/kinoshka-m25-f4/1280/720","https://picsum.photos/seed/kinoshka-m25-f5/1280/720","https://picsum.photos/seed/kinoshka-m25-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000025';
update public.movies set sort_order = 26, frame_urls = '["https://picsum.photos/seed/kinoshka-m26-f1/1280/720","https://picsum.photos/seed/kinoshka-m26-f2/1280/720","https://picsum.photos/seed/kinoshka-m26-f3/1280/720","https://picsum.photos/seed/kinoshka-m26-f4/1280/720","https://picsum.photos/seed/kinoshka-m26-f5/1280/720","https://picsum.photos/seed/kinoshka-m26-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000026';
update public.movies set sort_order = 27, frame_urls = '["https://picsum.photos/seed/kinoshka-m27-f1/1280/720","https://picsum.photos/seed/kinoshka-m27-f2/1280/720","https://picsum.photos/seed/kinoshka-m27-f3/1280/720","https://picsum.photos/seed/kinoshka-m27-f4/1280/720","https://picsum.photos/seed/kinoshka-m27-f5/1280/720","https://picsum.photos/seed/kinoshka-m27-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000027';
update public.movies set sort_order = 28, frame_urls = '["https://picsum.photos/seed/kinoshka-m28-f1/1280/720","https://picsum.photos/seed/kinoshka-m28-f2/1280/720","https://picsum.photos/seed/kinoshka-m28-f3/1280/720","https://picsum.photos/seed/kinoshka-m28-f4/1280/720","https://picsum.photos/seed/kinoshka-m28-f5/1280/720","https://picsum.photos/seed/kinoshka-m28-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000028';
update public.movies set sort_order = 29, frame_urls = '["https://picsum.photos/seed/kinoshka-m29-f1/1280/720","https://picsum.photos/seed/kinoshka-m29-f2/1280/720","https://picsum.photos/seed/kinoshka-m29-f3/1280/720","https://picsum.photos/seed/kinoshka-m29-f4/1280/720","https://picsum.photos/seed/kinoshka-m29-f5/1280/720","https://picsum.photos/seed/kinoshka-m29-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000029';
update public.movies set sort_order = 30, frame_urls = '["https://picsum.photos/seed/kinoshka-m30-f1/1280/720","https://picsum.photos/seed/kinoshka-m30-f2/1280/720","https://picsum.photos/seed/kinoshka-m30-f3/1280/720","https://picsum.photos/seed/kinoshka-m30-f4/1280/720","https://picsum.photos/seed/kinoshka-m30-f5/1280/720","https://picsum.photos/seed/kinoshka-m30-f6/1280/720"]'::jsonb where id = '00000000-0000-0000-0000-000000000030';

alter table public.movies
  alter column sort_order set not null;

create unique index if not exists movies_sort_order_idx on public.movies (sort_order);

-- Удалить статический демо-пазл — Daily-система назначает фильм детерминированно
delete from public.daily_puzzles;

-- Сохранение Daily-пазла (вызывается сервером после детерминированного выбора)
create or replace function public.ensure_daily_puzzle(
  puzzle_date date,
  p_movie_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  result_id uuid;
begin
  select id into result_id
  from public.daily_puzzles
  where date = puzzle_date;

  if result_id is not null then
    return result_id;
  end if;

  insert into public.daily_puzzles (date, movie_id)
  values (puzzle_date, p_movie_id)
  on conflict (date) do nothing
  returning id into result_id;

  if result_id is null then
    select id into result_id
    from public.daily_puzzles
    where date = puzzle_date;
  end if;

  return result_id;
end;
$$;

grant execute on function public.ensure_daily_puzzle(date, uuid) to anon, authenticated;
