CREATE TABLE entries (
  id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  date_created DATE NOT NULL,
  text TEXT NOT NULL,
  user_id INTEGER
    REFERENCES users(id) ON DELETE CASCADE NOT NULL
);
