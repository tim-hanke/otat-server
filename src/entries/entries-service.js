const xss = require("xss");
const Treeize = require("treeize");

// methods for retrieving and inserting into entries table
const EntriesService = {
  getAllArticles(db) {
    return db
      .from("entries AS ent")
      .select("ent.id", "ent.date_created", "ent.user_id", "ent.text");
  },

  getById(db, id) {
    return this.getAllArticles(db).where("ent.id", id).first();
  },

  getByDate(db, date_created) {
    return this.getAllArticles(db).where("ent.date_created", date_created);
  },

  getEntriesByUserId(db, userId) {
    return this.getAllArticles(db).where("ent.user_id", userId);
  },

  insertEntry(db, newEntry) {
    return db
      .insert(newEntry)
      .into("entries")
      .returning("*")
      .then(([entry]) => entry)
      .then((entry) => this.getById(db, entry.id));
  },

  serializeEntries(entries) {
    return entries.map(this.serializeEntry);
  },

  serializeEntry(article) {
    const entryTree = new Treeize();

    // Some light hackiness to allow for the fact that `treeize`
    // only accepts arrays of objects, and we want to use a single
    // object.
    const entryData = entryTree.grow([article]).getData()[0];

    return {
      id: entryData.id,
      date_created: xss(entryData.date_created),
      user_id: xss(entryData.user_id),
      text: xss(entryData.text),
    };
  },
};

module.exports = EntriesService;
