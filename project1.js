//Takes CNETNews RSS Feed from YQL puts into MongoDB then displays the data at http://localhost:8081
//Jason Hirshman 6/26/2011

var sys = require("sys"),
    http = require("http"),
    mongodb = require('mongodb'),
    events = require("events");

//NOTE: The first procedural 'step' is the opening of the database from there a series of functions are called

//Gets the Data from YQL and stores as a string
function getYqlData () {        
    var pathUrl = "/v1/public/yql?q=select%20*%20from%20rss%20where%20url%3D%22http%3A%2F%2Fnews.cnet.com%2F2547-1_3-0-20.xml%22%20limit%2019&format=json&diagnostics=true&callback="
    
    http.get({host: 'query.yahooapis.com', port: 80, path: pathUrl}, function(response) {
        var text = '';
        response.on('data', function(data) {
            text+=data;
        });
        response.on('end', function() {
            //calls function to convert to JSON and enter into Database
            loadJSON(text);
        });
    });
}

//Evals the data into an object then calls function to enter into Database
function loadJSON(data) {
    var jsonData = eval ('(' + data + ')');
    //Just gets the array of items (news stories)
    var items = jsonData.query.results.item;
    for (i in items){
        enterData(items[i]);
    }
    //calls function to begin output
    outputData();
}

//Inserts each item into the database
function enterData(data){
    cnetNewsCollection.insert (data);
}

//Initiates database and collection
var db = new mongodb.Db('YQLResults', new mongodb.Server("127.0.0.1", 27017, {}, {}));
var cnetNewsCollection;
db.open(function (error, client) {
    cnetNewsCollection = new mongodb.Collection(client, "CNETNews");
    //first clears the collection
    cnetNewsCollection.remove({});
    //calls function to start getting the data
    getYqlData();
});

//Prepares output string as well as http server for output
var output = "<h1>CNET News Stories:</h1><ul>";
function outputData (){
    //compiles html-style document for output by querying the database
    cnetNewsCollection.find({}, function(err, cursor) {
        cursor.each(function(err, story) {
            if (story != null){
                output+="<li><a href='"+story.link+"'>"+story.title+"</a><p>"+story.description+"</p></li>";
            }
        });
        output+="</ul>";
    });
    
    //creates server that writes the output for each request
    http.createServer(function(req,res) {
        res.writeHead(200, { "Content-Type" : "text/html" });  
        res.write(output);
        res.end();
    }).listen(8081);
}




