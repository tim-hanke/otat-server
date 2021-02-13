const express = require("express");
const EntriesService = require("./entries-service");
const { requireAuth } = require("../middleware/jwt-auth");

const router = express.Router();
const jsonBodyParser = express.json();

router
  .route("/")
  .all(requireAuth)
  .get(async (req, res, next) => {
    // returns all entries saved by the current user, using
    // the user object that is placed on the req by requireAuth
    // middleware
    try {
      const entries = await EntriesService.getEntriesByUserId(
        req.app.get("db"),
        req.user.id
      );

      res.json(EntriesService.serializeEntries(entries));
    } catch (err) {
      next(err);
    }
  })
  .post(jsonBodyParser, async (req, res, next) => {
    // get text from req.body
    // get user_id from req.user
    // make date_created be today's date in format YYYY-MM-DD
    // make an entry object using those three things
    // insert that object into entries table
    // return 201 and new entry
    try {
      const { text } = req.body;
      const { id: user_id } = req.user;
      const date_created = new Date().toISOString().split("T")[0];

      const entry = { date_created, text, user_id };

      let insertedEntry = await EntriesService.insertEntry(
        req.app.get("db"),
        entry
      );

      res.status(201).json(insertedEntry);
    } catch (err) {
      next(err);
    }

    //
    //
    // find an existing article based on the URL
    // if not found, create new article
    // 1. fetch site metadata
    // 2. insert new article into entries table
    // insert new row into user_articles with article_id and user_id
    // try {
    //   const { target_url } = req.body;
    //   const { id: user_id } = req.user;
    //   let article = await EntriesService.getByDate(
    //     req.app.get("db"),
    //     target_url
    //   );
    //   // if article exists, check if user article exists
    //   // if both already exist, return success code
    //   if (article) {
    //     const userArticle = await UserArticlesService.getByUserAndArticleId(
    //       req.app.get("db"),
    //       user_id,
    //       article.id
    //     );
    //     if (userArticle) {
    //       return res.status(200).json(userArticle);
    //     }
    //   }
    //   if (!article) {
    //     // if article/URL isn't in entries table,
    //     // get the page metadata using metascraper and
    //     // insert it into the article table
    //     let html, url;
    //     try {
    //       ({ body: html, url } = await got(target_url));
    //     } catch (err) {
    //       return res.status(400).json({
    //         error: "We couldn't access this URL. Please make sure it is valid.",
    //       });
    //     }
    //     const articleData = await metascraper({ html, url });
    //     article = await EntriesService.insertEntry(
    //       req.app.get("db"),
    //       articleData
    //     );
    //   }
    //   // create a new entry in user_articles table to link
    //   // the article with the current user
    //   const newUserArticle = {
    //     article_id: article.id,
    //     user_id: user_id,
    //   };
    //   const insertedUserArticle = await UserArticlesService.insertUserArticle(
    //     req.app.get("db"),
    //     newUserArticle
    //   );
    //   res.status(201).json(insertedUserArticle);
    // } catch (err) {
    //   next(err);
    // }
  });

module.exports = router;
