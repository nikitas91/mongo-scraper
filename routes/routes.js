const request = require("request");
const cheerio = require("cheerio");
const db = require("../models");

module.exports = function (app) {
    //  Route for Index page
    app.get("/", function (req, res) {
        db.Article.find({
            saved: false
        }).then(function (dbArticles) {
            res.render("index", {
                data: dbArticles,
                currentPage: { index: true }
            });
        }).catch(function (err) {
            res.render("index", {
                data: err,
                currentPage: { index: true }
            });
        });
    });

    //  Route for saved articles page
    app.get("/saved", function (req, res) {
        db.Article.find({
            saved: true
        }).then(function (savedArticles) {
            res.render("saved-articles", {
                data: savedArticles,
                currentPage: { saved: true }
            });
        }).catch(function (err) {
            res.render("saved-articles", {
                data: err,
                currentPage: { saved: true }
            });
        });
    });

    /* API ROUTES */

    //  API route for adding article to saved list
    app.put("/api/save", function (req, res) {
        db.Article.update({
            _id: req.body.id
        }, {
                saved: req.body.saved
            }).then(function (data) {
                res.status(200).send({
                    success: true
                });
            }).catch(function (err) {
                res.status(200).send({
                    success: false
                });
            });
    });

    //  API route for deleting article from saved list
    app.delete("/api/delete/:id", function (req, res) {
        db.Article.update({
            _id: req.params.id
        }, {
                saved: false
            }).then(function (data) {
                res.status(200).send({
                    success: true
                });
            }).catch(function (err) {
                res.status(200).send({
                    success: false
                });
            });
    });

    //  API route for retrieving a list of articles
    app.get("/api/articles", function (req, res) {
        let savedValue = false;

        if (req.query.saved) {
            if (req.query.saved == "true")
                savedValue = true;
        }

        db.Article.find({
            saved: savedValue
        }).then(function (result) {
            res.status(200).send({
                articles: result
            });
        }).catch(function (err) {
            res.status(200).send({
                error: err
            });
        });
    });

    //  API route for scraping articles
    app.get("/api/scrape", function (req, res) {
        db.Article.find({})
            .then(function (dbArticles) {
                let savedArticles = dbArticles.map(article => article.headline);

                request("http://www.digg.com", function (error, response, html) {
                    var $ = cheerio.load(html);
                    var articlesToAdd = [];

                    $(".digg-story__content").each(function (i, element) {
                        let newArticle = {};
                        newArticle.headline = $(element)
                            .children(".digg-story__header")
                            .children(".digg-story__title")
                            .children(".digg-story__title-link")
                            .text()
                            .trim();
                        newArticle.summary = $(element)
                            .children(".digg-story__description")
                            .text()
                            .trim();
                        newArticle.url = $(element)
                            .children(".digg-story__header")
                            .children(".digg-story__title")
                            .children(".digg-story__title-link")
                            .attr("href")
                            .trim();
                        newArticle.saved = false;

                        if (!savedArticles.includes(newArticle.headline)) {
                            articlesToAdd.push(newArticle);
                        }
                    });

                    db.Article.insertMany(articlesToAdd)
                        .then(function (result) {
                            res.status(200).send({
                                "message": `${result.length} new article(s) have been added`,
                                "count": result.length
                            });
                        }).catch(function (err) {
                            res.status(200).send({
                                "message": `${err.message}`
                            });
                        });
                });
            })
            .catch(function (err) {
                res.status(200).send({
                    message: "An error occurred retrieving articles!"
                });
            });
    });

    //  API route for retrieving notes for an article
    app.get("/api/notes/:id", function (req, res) {
        db.Article.findOne({
            _id: req.params.id
        }).populate("notes").then(function (data) {
            res.status(200).send({
                notes: data.notes
            });
        }).catch(function (err) {
            res.status(200).send({
                error: err
            });
        });
    });

    //  API route for saving notes
    app.post("/api/notes", function (req, res) {
        db.Note.create({
            body: req.body.noteBody
        }).then(function (dbNote) {
            db.Article.findOneAndUpdate({
                _id: req.body.id
            }, {
                    $push: { notes: dbNote._id }
                }).then(function (data) {
                    res.status(200).send({
                        success: true
                    });
                });
        }).catch(function (err) {
            res.status(200).send({
                error: err
            });
        });
    });

    //  API route for deleting notes
    app.delete("/api/notes/:id", function (req, res) {
        db.Note.findOneAndRemove({
            _id: req.params.id
        }).then(function (data) {
            db.Article.findOneAndUpdate({
                notes: { $in: [req.params.id] }
            }, {
                    $pull: { notes: req.params.id }
                }).then(function (data) {
                    res.status(200).send({
                        success: true
                    });
                })
                .catch(function (err) {
                    res.status(200).send({
                        error: err
                    });
                });
        }).catch(function (err) {
            res.status(200).send({
                error: err
            });
        });
    });
};