const { expect } = require("chai");
const knex = require("knex");
const app = require("../src/app");
const helpers = require("./test-helpers");

describe("Entries Endpoints", function () {
  let db;

  const { testUsers, testEntries } = helpers.makeEntriesFixtures();

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DATABASE_URL,
    });
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  before("cleanup", () => helpers.cleanTables(db));

  afterEach("cleanup", () => helpers.cleanTables(db));

  describe(`GET /api/entries`, () => {
    context(`Given no entries`, () => {
      before("insert users", () => helpers.seedUsers(db, testUsers));
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get("/api/entries")
          .set("Authorization", helpers.makeAuthHeader(testUsers[0]))
          .expect(200, []);
      });
    });

    context("Given there are entries in the database", () => {
      before("insert users, entries", () =>
        helpers.seedEntriesTables(db, testUsers, testEntries)
      );

      it("responds with 200 and all of the entries for a user", () => {
        const expectedEntries = helpers.makeExpectedEntries(
          testUsers[0],
          testEntries
        );
        return supertest(app)
          .get("/api/entries")
          .set("Authorization", helpers.makeAuthHeader(testUsers[0]))
          .expect(200, expectedEntries);
      });
    });
  });

  describe(`POST /api/entries`, () => {
    context("Entry does not exist in database", () => {
      before("insert users, entries", () =>
        helpers.seedEntriesTables(db, testUsers, testEntries)
      );

      it("responds with 201 and entry object, and inserts into db", () => {
        const expectedText = "Lorem ipsum sico dolor.";
        return supertest(app)
          .post("/api/entries")
          .send({ text: expectedText })
          .set("Authorization", helpers.makeAuthHeader(testUsers[0]))
          .expect(201)
          .expect((res) => {
            expect(res.body).to.have.property("id");
            expect(res.body.user_id).to.eql(testUsers[0].id);
            expect(res.body.text).to.eql(expectedText);
          })
          .expect((res) =>
            db
              .from("user_articles")
              .select("*")
              .where({ id: res.body.id })
              .first()
              .then((row) => {
                expect(row.article_id).to.eql(res.body.article_id);
                expect(row.user_id).to.eql(testUsers[0].id);
                expect(row.text).to.eql(expectedText);
              })
          );
      });
    });
  });
});
