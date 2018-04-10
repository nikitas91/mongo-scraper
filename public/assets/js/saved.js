$(document).ready(function () {
    var savedArticlesContainer = $("#savedArticlesContainer");
    var articleNotesList = $("#articleNotesList");
    $(document).on("click", ".delete-article", handleDeleteArticle);
    $(document).on("click", ".view-comments", handleViewComments);
    $(document).on("click", "#saveNote", handleSaveNote);
    $(document).on("click", ".delete-note", handleDeleteNote);

    /* EVENTS */

    function handleDeleteArticle() {
        var articleToDelete = $(this).parent().parent().data();

        $.ajax({
            method: "DELETE",
            url: "/api/delete/" + articleToDelete.id
        }).then(function (data) {
            if (data.success)
                renderArticles();
        });
    }

    function handleViewComments() {
        let article = $(this).parent().parent().data();
        $.get("/api/notes/" + article.id).then(function(data){
            var noteData = {
                articleID: article.id,
                notes: data.notes || []
            }

            $("#saveNote").data("article", noteData);

            renderArticleNotes(noteData);

            $("#notesModal").modal({
                backdrop: 'static',
                keyboard: false
            });
            $("#notesModal").modal("show");
        });
    }

    function handleSaveNote(){
        let noteText = $("#noteText").val().trim();
        let noteData = {
            id: $(this).data("article").articleID,
            noteBody: noteText
        };

        $.post("/api/notes", noteData).then(function(){
            $("#noteText").val("");
            $("#notesModal").modal("hide");
        });
    }

    function handleDeleteNote(){
        let noteToDelete = $(this).data("id");
        console.log(noteToDelete);
        $.ajax({
            url: "/api/notes/" + noteToDelete,
            method: "DELETE"
        }).then(function(){
            $("#notesModal").modal("hide");
        });
    }

    /* FUNCTIONS */

    function renderArticles() {
        savedArticlesContainer.empty();

        $.get("/api/articles?saved=true").then(function (data) {
            if (data.articles.length) {
                var articlePanels = [];

                data.articles.forEach(article => {
                    articlePanels.push(createPanel(article));
                });

                savedArticlesContainer.append(articlePanels);
            }
            else {
                let emptyMessage = $("<h3>");
                emptyMessage.addClass("text-center");
                emptyMessage.text("No articles to display!");
                savedArticlesContainer.append(emptyMessage);
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
                `<a class="btn btn-danger pull-right delete-article">Delete Article</a>`,
                `<a class="btn btn-default pull-right view-comments">View Comments</a>`,
                `</div>`,
                `</div>`
            ].join("")
        );

        return panel;
    }

    function renderArticleNotes(noteData){
        articleNotesList.empty();
        $("#articleId").text(noteData.articleID);

        if(noteData.notes.length > 0){
            let noteItems = [];
            noteData.notes.forEach(note => {
                noteItems.push(renderArticleNoteItem(note));
            });
            articleNotesList.append(noteItems);
        }
        else{
            let noteItem = $("<li>");
            noteItem.addClass("list-group-item");
            noteItem.text("No notes available!");
            articleNotesList.append(noteItem);
        }
    }

    function renderArticleNoteItem(note){
        var commentListItem = $(
            [
                '<li class="list-group-item clearfix">',
                `<a class="btn btn-danger pull-right delete-note" data-id="${note._id}">&times;</a>`,
                `${note.body}`,
                "</li>"
            ].join("")
        );

        return commentListItem;
    }
});