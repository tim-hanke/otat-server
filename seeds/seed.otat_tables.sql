BEGIN;

TRUNCATE
  entries,
  users
  RESTART IDENTITY CASCADE;

INSERT INTO users (email, phone, password)
VALUES
  ('demo@test.com', '555-111-2222', '$2b$12$SOLYAZIStiolsJYy/mcYjecV5wb0A1SR0vONV2AB6nNUErwI5gn8O'),
  ('tim@timhanke.dev', '555-111-3333',  '$2a$12$TSYFYTSjkBwrMekMgS9g9.wuvpAbCrpBbeMGeLiw0HL.1BcC0UfKy');

INSERT INTO entries (date_created, text, user_id)
VALUES
  ('2020-02-12', 'Eum omnis tempora voluptas odio minima expedita ducimus sint atque quod', 1),
  ('2020-02-13', 'Doloremque nulla odio cum esse aliquid illum officiis sit voluptas enim', 1),
  ('2020-02-14', 'Assumenda, ab exercitationem rerum maiores magni adipisci deleniti?', 1),
  ('2020-02-15', 'Voluptatibus, modi. At explicabo, nesciunt et nisi consectetur dicta est itaque voluptates!', 1),
  ('2020-02-16', 'Alias, nostrum. Libero expedita repellendus, excepturi id eveniet, adipisci dicta ipsa.', 1);

COMMIT;
