const express = require("express");
const AuthService = require("./auth-service");

const authRouter = express.Router();
const jsonBodyParser = express.json();

authRouter.post("/login", jsonBodyParser, async (req, res, next) => {
  // compare the email and password provided to our
  // list of users and corresponding password (which are
  // hashed with bcrypt), and return a JSON Web Token
  const { email, password } = req.body;
  const loginUser = { email, password };

  for (const [key, value] of Object.entries(loginUser)) {
    if (value == null) {
      return res
        .status(400)
        .json({ error: `Missing '${key}' in request body` });
    }
  }

  try {
    const dbUser = await AuthService.getUserWithUserName(
      req.app.get("db"),
      loginUser.email
    );
    if (!dbUser) {
      return res.status(400).json({ error: "Incorrect email or password" });
    }

    const compareMatch = await AuthService.comparePasswords(
      loginUser.password,
      dbUser.password
    );
    if (!compareMatch) {
      return res.status(400).json({ error: "Incorrect email or password" });
    }

    const sub = dbUser.email;
    const payload = { user_id: dbUser.id };
    res.send({ authToken: AuthService.createJwt(sub, payload) });
  } catch (error) {
    next(error);
  }
});

module.exports = authRouter;
