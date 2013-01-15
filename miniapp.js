
var url = require("url");

var routes = {};

function error_not_found(request) {
    return {
        status: 404,
        text: "404 Not Found: " + url.parse(request.url).pathname,
    };
}

function error_method_not_allowed(request) {
    return {
        status: 405,
        text: "405 Method Not Allowed: " + request.method,
    };
}

function route(method, url, handler) {
    if (routes[url] === undefined)
        routes[url] = {};
    routes[url][method] = handler;
}

function get_handler(method, url) {
    if (routes[url] === undefined)
        return error_not_found;
    if (routes[url][method] === undefined)
        return error_method_not_allowed;
    return routes[url][method];
}

function run(request, response) {
    try {
        handler = get_handler(
            request.method,
            url.parse(request.url).pathname
        );
        var result = handler(request);
        if (result.status === undefined)
            result.status = 200;
        if (result.headers === undefined)
            result.headers = {};
        if (result.headers["Content-Type"] === undefined)
            result.headers["Content-Type"] = (
                result.html !== undefined? "text/html"        :
                result.text !== undefined? "text/plain"       :
                result.json !== undefined? "application/json" :
                result.type !== undefined? result.type        :
                undefined
            );
        response.writeHead(result.status, result.headers);
        response.write(
            result.html !== undefined? result.html                 :
            result.text !== undefined? result.text                 :
            result.json !== undefined? JSON.stringify(result.json) :
            result.data !== undefined? result.data                 :
            ""
        );
        console.log(request.method, request.url, result.status);
    } catch (e) {
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write("500 Internal Server Error: " + e);
        console.log(request.method, request.url, 500);
    }
    response.end();
};

exports.route = route;
exports.run = run;
