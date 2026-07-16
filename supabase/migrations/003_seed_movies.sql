-- Каталог фильмов для автодополнения и демо-игры
insert into public.movies (id, title, title_original, year, frame_url) values
  ('00000000-0000-0000-0000-000000000001', 'Матрица', 'The Matrix', 1999, 'https://picsum.photos/seed/kinoshka-m1/1280/720'),
  ('00000000-0000-0000-0000-000000000002', 'Начало', 'Inception', 2010, 'https://picsum.photos/seed/kinoshka-m2/1280/720'),
  ('00000000-0000-0000-0000-000000000003', 'Криминальное чтиво', 'Pulp Fiction', 1994, 'https://picsum.photos/seed/kinoshka-m3/1280/720'),
  ('00000000-0000-0000-0000-000000000004', 'Бойцовский клуб', 'Fight Club', 1999, 'https://picsum.photos/seed/kinoshka-m4/1280/720'),
  ('00000000-0000-0000-0000-000000000005', 'Форрест Гамп', 'Forrest Gump', 1994, 'https://picsum.photos/seed/kinoshka-m5/1280/720'),
  ('00000000-0000-0000-0000-000000000006', 'Интерстеллар', 'Interstellar', 2014, 'https://picsum.photos/seed/kinoshka-m6/1280/720'),
  ('00000000-0000-0000-0000-000000000007', 'Темный рыцарь', 'The Dark Knight', 2008, 'https://picsum.photos/seed/kinoshka-m7/1280/720'),
  ('00000000-0000-0000-0000-000000000008', 'Крестный отец', 'The Godfather', 1972, 'https://picsum.photos/seed/kinoshka-m8/1280/720'),
  ('00000000-0000-0000-0000-000000000009', 'Список Шиндлера', 'Schindler''s List', 1993, 'https://picsum.photos/seed/kinoshka-m9/1280/720'),
  ('00000000-0000-0000-0000-000000000010', 'Зелёная миля', 'The Green Mile', 1999, 'https://picsum.photos/seed/kinoshka-m10/1280/720'),
  ('00000000-0000-0000-0000-000000000011', 'Гладиатор', 'Gladiator', 2000, 'https://picsum.photos/seed/kinoshka-m11/1280/720'),
  ('00000000-0000-0000-0000-000000000012', 'Титаник', 'Titanic', 1997, 'https://picsum.photos/seed/kinoshka-m12/1280/720'),
  ('00000000-0000-0000-0000-000000000013', 'Аватар', 'Avatar', 2009, 'https://picsum.photos/seed/kinoshka-m13/1280/720'),
  ('00000000-0000-0000-0000-000000000014', 'Джокер', 'Joker', 2019, 'https://picsum.photos/seed/kinoshka-m14/1280/720'),
  ('00000000-0000-0000-0000-000000000015', 'Паразиты', 'Parasite', 2019, 'https://picsum.photos/seed/kinoshka-m15/1280/720'),
  ('00000000-0000-0000-0000-000000000016', 'Один дома', 'Home Alone', 1990, 'https://picsum.photos/seed/kinoshka-m16/1280/720'),
  ('00000000-0000-0000-0000-000000000017', 'Назад в будущее', 'Back to the Future', 1985, 'https://picsum.photos/seed/kinoshka-m17/1280/720'),
  ('00000000-0000-0000-0000-000000000018', 'Чужой', 'Alien', 1979, 'https://picsum.photos/seed/kinoshka-m18/1280/720'),
  ('00000000-0000-0000-0000-000000000019', 'Терминатор 2', 'Terminator 2', 1991, 'https://picsum.photos/seed/kinoshka-m19/1280/720'),
  ('00000000-0000-0000-0000-000000000020', 'Король Лев', 'The Lion King', 1994, 'https://picsum.photos/seed/kinoshka-m20/1280/720'),
  ('00000000-0000-0000-0000-000000000021', 'Шрэк', 'Shrek', 2001, 'https://picsum.photos/seed/kinoshka-m21/1280/720'),
  ('00000000-0000-0000-0000-000000000022', 'Гарри Поттер и философский камень', 'Harry Potter and the Philosopher''s Stone', 2001, 'https://picsum.photos/seed/kinoshka-m22/1280/720'),
  ('00000000-0000-0000-0000-000000000023', 'Властелин колец: Братство кольца', 'The Lord of the Rings: The Fellowship of the Ring', 2001, 'https://picsum.photos/seed/kinoshka-m23/1280/720'),
  ('00000000-0000-0000-0000-000000000024', 'Мстители: Финал', 'Avengers: Endgame', 2019, 'https://picsum.photos/seed/kinoshka-m24/1280/720'),
  ('00000000-0000-0000-0000-000000000025', 'Django освобождённый', 'Django Unchained', 2012, 'https://picsum.photos/seed/kinoshka-m25/1280/720'),
  ('00000000-0000-0000-0000-000000000026', 'Ла-Ла Ленд', 'La La Land', 2016, 'https://picsum.photos/seed/kinoshka-m26/1280/720'),
  ('00000000-0000-0000-0000-000000000027', 'Одержимость', 'Whiplash', 2014, 'https://picsum.photos/seed/kinoshka-m27/1280/720'),
  ('00000000-0000-0000-0000-000000000028', 'Бегущий по лезвию 2049', 'Blade Runner 2049', 2017, 'https://picsum.photos/seed/kinoshka-m28/1280/720'),
  ('00000000-0000-0000-0000-000000000029', 'Дюна', 'Dune', 2021, 'https://picsum.photos/seed/kinoshka-m29/1280/720'),
  ('00000000-0000-0000-0000-000000000030', 'Оппенгеймер', 'Oppenheimer', 2023, 'https://picsum.photos/seed/kinoshka-m30/1280/720')
on conflict (id) do nothing;

-- Демо-пазл на сегодня
insert into public.daily_puzzles (date, movie_id)
values (current_date, '00000000-0000-0000-0000-000000000024')
on conflict (date) do nothing;
