
var http    = require("http");
var fs      = require("fs");
var miniapp = require("./miniapp");

miniapp.route("GET", "/", function (request) {
    return {
        html: fs.readFileSync("fl.html"),
    };
});

miniapp.route("GET", "/style.css", function (request) {
    return {
        data: fs.readFileSync("style.css"),
        type: "text/css",
    };
});

miniapp.route("GET", "/fl.js", function (request) {
    return {
        data: fs.readFileSync("fl.js"),
        type: "text/javascript",
    };
});

http.createServer(miniapp.run).listen(8080);
