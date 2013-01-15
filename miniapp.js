
var url = require("url");

var routes = {};

// TODO: generate HEAD from GET handlers
// TODO: answer OPTIONS requests

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

function route(methods, url, handler) {
    if (typeof methods === "string")
        methods = [methods];
    if (routes[url] === undefined)
        routes[url] = {};
    for (var i = 0; i < methods.length; i++)
        routes[url][methods[i]] = handler;
}

route.get = function get(url, handler) {
    return route("GET", url, handler);
}

route.post = function post(url, handler) {
    return route("POST", url, handler);
}

route.put = function put(url, handler) {
    return route("PUT", url, handler);
}

route.del = function del(url, handler) {
    return route("DELETE", url, handler);
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
        console.log(request.method, request.url, 500, e);
    }
    response.end();
};

exports.route = route;
exports.run = run;
