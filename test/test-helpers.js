const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

function makeUsersArray() {
  return [
    {
      id: 1,
      email: "test-user-1",
      phone: "Test user 1",
      password: "password",
    },
    {
      id: 2,
      email: "test-user-2",
      phone: "Test user 2",
      password: "password",
    },
    {
      id: 3,
      email: "test-user-3",
      phone: "Test user 3",
      password: "password",
    },
    {
      id: 4,
      email: "test-user-4",
      phone: "Test user 4",
      password: "password",
    },
  ];
}

function makeEntriesArray() {
  return [
    {
      id: 1,
      date_created: "2001-01-01",
      text:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Natus consequuntur deserunt commodi, nobis qui inventore corrupti iusto aliquid debitis unde non.Adipisci, pariatur.Molestiae, libero esse hic adipisci autem neque ?",
      user_id: 1,
    },
    {
      id: 2,
      date_created: "2001-01-01",
      text:
        "Natus consequuntur deserunt commodi, nobis qui inventore corrupti iusto aliquid debitis unde non.Adipisci, pariatur.Molestiae, libero esse hic adipisci autem neque ?",
      user_id: 1,
    },
    {
      id: 3,
      date_created: "2001-01-01",
      text:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Natus consequuntur deserunt commodi, nobis qui inventore corrupti iusto aliquid debitis unde non.Adipisci, pariatur.Molestiae, libero esse hic adipisci autem neque ?",
      user_id: 3,
    },
    {
      id: 4,
      date_created: "2001-01-01",
      text:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Natus consequuntur deserunt commodi, nobis qui inventore corrupti iusto aliquid debitis unde non.Adipisci, pariatur.Molestiae, libero esse hic adipisci autem neque ?",
      user_id: 4,
    },
  ];
}

function makeExpectedEntries(user, entries) {
  const filteredEntries = entries.filter((entry) => entry.user_id === user.id);

  return filteredEntries.map((entry) => {
    return {
      ...entry,
      user_id: entry.user_id.toString(),
      date_created:
        "Mon Jan 01 2001 00:00:00 GMT+0000 (Coordinated Universal Time)",
    };
  });
}

function makeMaliciousArticle() {
  const maliciousArticle = {
    id: 911,
    date_created: "2001-01-01",
    image: "http://placehold.it/500x500",
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
    text: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
  };
  const expectedArticle = {
    ...maliciousArticle,
    title:
      'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;',
    text: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
  };
  return {
    maliciousArticle,
    expectedArticle,
  };
}

function makeEntriesFixtures() {
  const testUsers = makeUsersArray();
  const testEntries = makeEntriesArray();
  return { testUsers, testEntries };
}

function cleanTables(db) {
  return db.raw(
    `TRUNCATE
      entries,
      users
      RESTART IDENTITY CASCADE`
  );
}

function seedUsers(db, users) {
  const preppedUsers = users.map((user) => ({
    ...user,
    password: bcrypt.hashSync(user.password, 1),
  }));
  return db
    .into("users")
    .insert(preppedUsers)
    .then(() =>
      db.raw(`SELECT setval('users_id_seq',?)`, [users[users.length - 1].id])
    );
}

function seedEntriesTables(db, users, entries, userArticles = []) {
  // use a transaction to group the queries and auto rollback on any failure
  return db.transaction(async (trx) => {
    await seedUsers(trx, users);
    await trx.into("entries").insert(entries);
    // update the auto sequence to match the forced id values
    await trx.raw(`SELECT setval('entries_id_seq', ?)`, [
      entries[entries.length - 1].id,
    ]);
    // only insert userArticles if there are some, also update the sequence counter
    if (userArticles.length) {
      await trx.into("user_articles").insert(userArticles);
      await trx.raw(`SELECT setval('user_articles_id_seq', ?)`, [
        userArticles[userArticles.length - 1].id,
      ]);
    }
  });
}

function seedMaliciousArticle(db, user, article) {
  return seedUsers(db, [user]).then(() => {
    db.into("entries").insert([article]);
    db.into("user_articles").insert({
      user_id: user.id,
      article_id: article.id,
    });
  });
}

function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
  const token = jwt.sign({ user_id: user.id }, secret, {
    subject: user.email,
    algorithm: "HS256",
  });
  return `Bearer ${token}`;
}

module.exports = {
  makeUsersArray,
  makeEntriesArray,
  makeExpectedEntries,
  makeMaliciousArticle,
  makeEntriesFixtures,
  cleanTables,
  seedEntriesTables,
  seedMaliciousArticle,
  makeAuthHeader,
  seedUsers,
};
