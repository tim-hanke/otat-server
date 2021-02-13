# One Thing About Today

_What's the one thing you'd like to remember about today?_

_screenshot placeholder_

This is the server side of One Thing About Today (OTAT), a minimalist journaling app.

The client side repo is at [github.com/tim-hanke/otat-client](https://github.com/tim-hanke/otat-client).

The live version is hosted at [otat-client.vercel.app](https://otat-client.vercel.app/).

## Why?

I wanted a minimalist journaling app that encourages brief, simple daily entries and helps you reflect on the past by showing entries from previous years.

After logging in, a user can write an journal entry for today. OTAT suggests that the entry be only the one thing you'd like to remember, thereby encouraging the user to be brief and selective. As the user continues to use OTAT, they will eventually see previous entries when logged in, hopefully sparking good memories.

## Technical Details

This project was created with [Node.js](https://nodejs.org/), using [Express](http://expressjs.com/) and [PostgreSQL](https://www.postgresql.org/).

### Endpoints

#### `POST /api/users`

To register a new user. Accepts `phone`, `email`, and `password` in the request body and if successful returns `phone`, `email`, and an `id` assigned by the server.

#### `POST /api/auth/login`

To log in an existing user. Accepts `email` and `password` in the request body and if successful returns `authToken`, a JSON Web Token.

#### `POST /api/entries`

##### _requires Authentication header_

To add aa daily entry to database. Accepts `text` in the request body and if successful returns `id`, `user_id`, and `article_id` of the saved user article.

#### `GET /api/entries`

##### _requires Authentication header_

Returns all saved entries (each containing `id`, `date_created`, `text`, and `user_id`) for the user authorized in the Authentication header.

#### `DELETE /api/entries`

##### _requires Authentication header_

To delete an entry from the user's saved entries. Accepts `article_id` in the request body and if successful returns `id` of the deleted user article.

### Setting Up

- Install dependencies: `npm install`
- Create development and test databases: `createdb otat`, `createdb otat-test`
- Create database user: `createuser otat`
- Grant privileges to new user in `psql`:
  - `GRANT ALL PRIVILEGES ON DATABASE otat TO otat`
  - `GRANT ALL PRIVILEGES ON DATABASE "otat-test" TO otat`
- Prepare environment file: `cp example.env .env`
- Replace values in `.env` with your custom values.
- Bootstrap development database: `npm run migrate`
- Bootstrap test database: `npm run migrate:test`

### Configuring Postgres

For tests involving time to run properly, your Postgres database must be configured to run in the UTC timezone.

1. Locate the `postgresql.conf` file for your Postgres installation.
   - OS X, Homebrew: `/usr/local/var/postgres/postgresql.conf`
2. Uncomment the `timezone` line and set it to `UTC` as follows:

```
# - Locale and Formatting -

datestyle = 'iso, mdy'
#intervalstyle = 'postgres'
timezone = 'UTC'
#timezone_abbreviations = 'Default'     # Select the set of available time zone
```

### Sample Data

- To seed the database for development: `psql -U otat -d otat -a -f seeds/seed.otat_tables.sql`
- To clear seed data: `psql -U otat -d otat -a -f seeds/trunc.otat_tables.sql`

### Scripts

- Start application for development: `npm run dev`
- Run tests: `npm test`
