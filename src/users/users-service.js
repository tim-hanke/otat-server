const bcrypt = require("bcrypt");
const xss = require("xss");
const REGEX_UPPER_LOWER_NUMBER_SPECIAL = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&])[\S]+/;

// methods for validating new user info and inserting into users table
const UsersService = {
  validatePassword(password) {
    if (password.length < 8) {
      return "Password must be longer than 8 characters";
    }
    if (password.length > 72) {
      return "Password must be less than 72 characters";
    }
    if (password.startsWith(" ") || password.endsWith(" ")) {
      return "Password must not start or end with empty spaces";
    }
    if (!REGEX_UPPER_LOWER_NUMBER_SPECIAL.test(password)) {
      return "Password must contain 1 upper case, lower case, number and special character";
    }
  },
  hashPassword(password) {
    return bcrypt.hash(password, 12);
  },
  hasUserWithUserName(db, email) {
    return db("users")
      .where({ email })
      .first()
      .then((user) => Boolean(user));
  },
  async insertUser(db, newUser) {
    const [user] = await db
      .insert(newUser)
      .into("users")
      .returning(["id", "email", "phone"]);
    return user;
  },
  serializeUser(user) {
    return {
      id: user.id,
      phone: xss(user.phone),
      email: xss(user.email),
      password: user.password,
    };
  },
};

module.exports = UsersService;
