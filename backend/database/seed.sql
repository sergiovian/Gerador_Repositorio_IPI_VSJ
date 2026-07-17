INSERT OR IGNORE INTO churches (id, name, city, state) VALUES
  (1, 'Igreja Presbiteriana Independente de Vila São José', 'Osasco', 'SP');

INSERT OR IGNORE INTO service_types (name) VALUES
  ('Culto Normal'),
  ('Santa Ceia'),
  ('Batismo'),
  ('Missões'),
  ('Natal'),
  ('Páscoa'),
  ('Jovens'),
  ('Mulheres'),
  ('Homens'),
  ('Evangelístico');

INSERT OR IGNORE INTO tags (name, color) VALUES
  ('Adoração', '#6F42C1'),
  ('Graça', '#0D6EFD'),
  ('Comunhão', '#198754'),
  ('Cruz', '#DC3545'),
  ('Esperança', '#0DCAF0'),
  ('Natal', '#FD7E14'),
  ('Missões', '#20C997'),
  ('Perdão', '#6C757D'),
  ('Santidade', '#6610F2'),
  ('Evangelização', '#FFC107');
