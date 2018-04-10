$(document).ready(function () {
    var articleContainer = $("#articleContainer");
    $(document).on("click", "#scrapeArticles", handleScrapeArticles);
    $(document).on("click", ".save-article", handleSaveArticle);

    /* EVENTS */

    function handleScrapeArticles() {
        var scrapeBtn = $(this).button("loading");
        $.get("/api/scrape").then(function (data) {
            if (data.message) {
                $("#alertMessage").text(data.message);
                $("#alertModal").modal({
                    backdrop: 'static',
                    keyboard: false
                });
                $("#alertModal").modal("show");
                if (data.count && data.count > 0) {
                    renderArticles();
                }
            }
            scrapeBtn.button("reset");
        });
    };

    function handleSaveArticle() {
        var articleToSave = $(this).parent().parent().data();
        articleToSave.saved = true;

        $.ajax({
            method: "PUT",
            url: "/api/save",
            data: articleToSave
        }).then(function (data) {
            if (data.success)
                renderArticles();
        });
    }

    /* FUNCTIONS */

    function renderArticles() {
        articleContainer.empty();

        $.get("/api/articles?saved=false").then(function (data) {
            if (data.articles.length) {
                var articlePanels = [];

                data.articles.forEach(article => {
                    articlePanels.push(createPanel(article));
                });

                articleContainer.append(articlePanels);
            }
            else {
                let emptyMessage = $("<h3>");
                emptyMessage.addClass("text-center");
                emptyMessage.text("No articles to display!");
                articleContainer.append(emptyMessage);
            }
        });
    }

    function createPanel(article) {
        var panel = $(
            [
                `<div class="panel panel-default" data-id="${article._id}">`,
                `<div class="panel-heading">`,
                `<h3 class="panel-title">${article.headline}</h3>`,
                `</div>`,
                `<div class="panel-body">${article.summary}</div>`,
                `<div class="panel-footer clearfix">`,
                `<a class="btn btn-success pull-right save-article">Save Article</a>`,
                `<a href="${article.url}" target="_blank" class="btn btn-default pull-right">View Article</a>`,
                `</div>`,
                `</div>`
            ].join("")
        );

        return panel;
    }
});