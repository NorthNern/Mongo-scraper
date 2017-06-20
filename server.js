var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");

var request = require("request");
var cheerio = require("cheerio");

mongoose.Promise = Promise;

var PORT = process.env.PORT || 8080;
// Initialize Express
var app = express();

// Set Handlebars
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: false }));

// Make public a static dir
app.use(express.static(process.cwd() + "/public"));

// Database configuration with mongoose
// mongoose.connect("mongodb://heroku_64064gld:sgl8sf84m9onaf0nbdaojgp0lf@ds131782.mlab.com:31782/heroku_64064gld");
// Local DB
mongoose.connect("mongodb://localhost/scrapethis");

var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});



//Routes 
//TODO:  put routes in seperate folder once working
// require("./routes/note-routes.js")(app);
// require("./routes/article-routes.js")(app);




// A GET request to scrape reddit
app.get("/scrape", function(req, res) {
  request("https://www.reddit.com/r/webdev", function(error, response, html) {
  	// Load the HTML into cheerio and save it to a variable
 	// '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
 	var $ = cheerio.load(html);
 	// An empty object to save the data that we'll scrape
  	var result = {};
    // With cheerio, find each p-tag with the "title" class
  	// (i: iterator. element: the current element)
	$("p.title").each(function(i, element) { 

    // Save the text of the element (this) in a "title" variable
    var title = $(this).text();

    // In the currently selected element, look at its child elements (i.e., its a-tags),
    // then save the values for any "href" attributes that the child elements may have
    var link = $(element).children().attr("href");
    var result = {};
    // Save these results in an object that we'll push into the result object we defined earlier
    result.title = title;
    result.link = link;
	
 	// Now, save that entry to the db
      entry.save(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        // Or log the doc
        else {
          console.log(doc);
        }
      });
  	// Tell the browser that we finished scraping the text
  	
	});
	res.send("Scrape Complete");
  });
});

// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
  // Grab every doc in the Articles array
  Article.find({}, function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Or send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});

// New note creation via POST route
app.post("/submit", function(req, res) {
  // Use our Note model to make a new note from the req.body
  var newNote = new Note(req.body);
  // Save the new note to mongoose
  newNote.save(function(error, doc) {
    // Send any errors to the browser
    if (error) {
      res.send(error);
    }
    // Otherwise
    else {
      // Find our article and push the new note id Initializeo the Article's notes array
      Article.findOneAndUpdate({}, { $push: { "notes": doc._id } }, { new: true }, function(err, newdoc) {
        // Send any errors to the browser
        if (err) {
          res.send(err);
        }
        // Or send the newdoc to the browser
        else {
          res.send(newdoc);
        }
      });
    }
  });
});

// Route to see notes we have added
app.get("/notes", function(req, res) {
  // Find all notes in the note collection with our Note model
  Note.find({}, function(error, doc) {
    // Send any errors to the browser
    if (error) {
      res.send(error);
    }
    // Or send the doc to the browser
    else {
      res.send(doc);
    }
  });
});

//TODO:  Add route to delete notes


// Listen on port
app.listen(PORT, function() {
  console.log("App running on port " + PORT);
});