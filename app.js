
var http    = require("http");
var miniapp = require("./miniapp");

miniapp.route("GET", "/", function (request) {
    return {
        text: "Hello!",
    };
});

http.createServer(miniapp.run).listen(8080);
