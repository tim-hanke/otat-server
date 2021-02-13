const knex = require("knex");
const bcrypt = require("bcrypt");
const app = require("../src/app");
const helpers = require("./test-helpers");

describe("Users endpoints", function () {
  let db;

  const { testUsers } = helpers.makeEntriesFixtures();
  const testUser = testUsers[0];

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

  describe("POST /api/users", () => {
    context("User Validation", () => {
      beforeEach("insert users", () => helpers.seedUsers(db, testUsers));

      const requiredFields = ["email", "password", "phone"];

      requiredFields.forEach((field) => {
        const registrationAttemptBody = {
          email: "test email",
          password: "test password",
          phone: "test phone",
        };

        it(`responds with 400 required error when '${field}' is missing`, () => {
          delete registrationAttemptBody[field];

          return supertest(app)
            .post("/api/users")
            .send(registrationAttemptBody)
            .expect(400, { error: `Missing '${field}' in request body` });
        });
      });

      it(`responds with 400 'Password must be longer than 8 characters' when password too short`, () => {
        const userShortPassword = {
          email: "test email",
          password: "1234567",
          phone: "test phone",
        };

        return supertest(app)
          .post("/api/users")
          .send(userShortPassword)
          .expect(400, {
            error: "Password must be longer than 8 characters",
          });
      });

      it(`responds with 400 'Password must be less than 72 characters' when password too long`, () => {
        const userLongPassword = {
          email: "test email",
          password: "*".repeat(73),
          phone: "test phone",
        };
        return supertest(app)
          .post("/api/users")
          .send(userLongPassword)
          .expect(400, { error: "Password must be less than 72 characters" });
      });

      it(`responds with 400 error when password starts with spaces`, () => {
        const userPasswordStartsSpaces = {
          email: "test email",
          password: " 1AB!cD@",
          phone: "test phone",
        };
        return supertest(app)
          .post("/api/users")
          .send(userPasswordStartsSpaces)
          .expect(400, {
            error: "Password must not start or end with empty spaces",
          });
      });

      it(`responds with 400 error when password ends with spaces`, () => {
        const userPasswordEndsSpaces = {
          email: "test email",
          password: "1AB!cD@ ",
          phone: "test phone",
        };
        return supertest(app)
          .post("/api/users")
          .send(userPasswordEndsSpaces)
          .expect(400, {
            error: "Password must not start or end with empty spaces",
          });
      });

      const passwordsNotComplex = [
        {
          missing: "lowercase character",
          password: "AAA111@@@",
        },
        {
          missing: "uppercase character",
          password: "aaa111@@@",
        },
        {
          missing: "number",
          password: "aaaAAA@@@",
        },
        {
          missing: "special character",
          password: "aaaAAA111",
        },
      ];

      passwordsNotComplex.forEach((password) => {
        it(`responds with 400 error when password doesn't contain ${password.missing}`, () => {
          const userPasswordNotComplex = {
            email: "test email",
            password: password.password,
            phone: "test phone",
          };

          return supertest(app)
            .post("/api/users")
            .send(userPasswordNotComplex)
            .expect(400, {
              error:
                "Password must contain 1 upper case, lower case, number and special character",
            });
        });
      });

      it(`responds with 400 'user name already taken' when email isn't unique`, () => {
        const duplicateUser = {
          email: testUser.email,
          password: "aaAA11!!",
          phone: "test phone",
        };

        return supertest(app)
          .post("/api/users")
          .send(duplicateUser)
          .expect(400, { error: "User name already taken" });
      });
    });

    context("Happy path", () => {
      it(`responds 201, serialized user, storing bcrypted password`, () => {
        const newUser = {
          email: "test email",
          password: "aaAA11@@",
          phone: "test phone",
        };

        return supertest(app)
          .post("/api/users")
          .send(newUser)
          .expect(201)
          .expect((res) => {
            expect(res.body).to.have.property("id");
            expect(res.body.email).to.eql(newUser.email);
            expect(res.body.phone).to.eql(newUser.phone);
            expect(res.body).to.not.have.property("password");
            expect(res.headers.location).to.eql(`/api/users/${res.body.id}`);
          })
          .expect((res) =>
            db
              .from("users")
              .select("*")
              .where({ id: res.body.id })
              .first()
              .then((row) => {
                expect(row.email).to.eql(newUser.email);
                expect(row.phone).to.eql(newUser.phone);
                return bcrypt.compare(newUser.password, row.password);
              })
              .then((compareMatch) => {
                expect(compareMatch).to.be.true;
              })
          );
      });
    });
  });
});
