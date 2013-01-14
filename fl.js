"use strict";

if (!Array.prototype.first)
    Array.prototype.first = function() {return this[0];};

if (!Array.prototype.rest)
    Array.prototype.rest = function() {return this.slice(1);};

if (!Array.prototype.last)
    Array.prototype.last = function() {return this[this.length - 1]};

var fl = {};

fl.id = function(x) {return x;};

fl.assert = function(cond) {
    if (!cond) throw new Error("Assertion failed");
}

fl.global_env = {
    "+": function(env, xs) {
        return xs.reduce(function(a, b) {return a + b;}, 0);
    },
    "*": function(env, xs) {
        return xs.reduce(function(a, b) {return a * b;}, 1);
    },
    "eq?": function(env, xs) {
        return xs.reduce(function(a, b) {return a === b;});
    },

    "list": function(env, xs) {
        return xs;
    },
    "first": function(env, xs) {
        return xs.first();
    },
    "rest": function(env, xs) {
        return xs.rest();
    },
    "nth": function(env, xs) {
        fl.assert(xs.length == 2);
        return xs[0][xs[1]];
    },
    "append": function(env, xs) {
        return xs.reduce(function(a, b) {return a.concat(b);}, []);
    },

    "help": function(env, xs) {
        var tmp = [];
        if (xs.length == 0) {
            for (var v in env)
                if (env.hasOwnProperty(v))
                    tmp.push(v);
        } else
            xs.forEach(function(x) {
                tmp.push(x.code? x.code : "builtin");
            });
        return tmp;
    },
};

fl.getenv = function(env, key) {
    if (env[key] !== undefined)
        return env[key];
    if (env.parent)
        return fl.getenv(env.parent, key);
    throw new Error("Name not defined: " + key);
};

fl.defenv = function(env, key, value) {
    env[key] = value;
};

fl.setenv = function(env, key, value) {
    if (env[key] !== undefined) {
        env[key] = value;
        return;
    }
    if (env.parent) return fl.setenv(env.parent, key, value);
    throw new Error("Name not defined: " + key);
};

fl.tokenize = function(s) {
    return (s
            .replace(/\(/g, " ( ")
            .replace(/\)/g, " ) ")
            .replace(/'/g, " ' ")
            .split(/[ \n\r\t]+/g)
            .filter(fl.id));
};

fl.read_tokens = function(ts) {
    if (!ts)
        throw new Error("Unexpected end of input");
    var t = ts.shift();
    if (t === "(") {
        var l = [];
        while (ts[0] !== ")") {
            l.push(fl.read_tokens(ts));
        }
        fl.assert(ts.shift() ===  ")");
        return l;
    } else if ("'" === t)
        return ['quote', fl.read_tokens(ts)];
    else if (")" === t)
        throw new Error("Unexpected ')'");
    else return fl.atom(t);
};

fl.atom = function(s) {
    if (!isNaN(s)) return parseInt(s);
    else return s;
};

fl.read = function(s) {
    return fl.read_tokens(fl.tokenize(s));
};

fl.print = function(e) {
    function str(val) {
        if (val.code)
            return val.code;
        else if (typeof val == "string" || typeof val == "number")
            return val;
        else
            return "?";
    }
    return (typeof e === "object")?
        ("(" + e.map(fl.print).join(" ") + ")") : str(e);
};

fl.eval = function(env, e) {
    if (!e)
        return [];
    else if (typeof e === "string")
        return fl.getenv(env, e);
    else if (typeof e === "number")
        return e;
    else {
        // eval in current env
        var eval_ice = function (x) {return fl.eval(env, x);};
        var first = e.first(), rest = e.rest();
        if (!first && first === undefined)
            return e;
        switch (first) {
        case "quote":
            return rest[0];
        case "do":
            return rest.map(eval_ice).last();
        case "define":
        case "set!":
            var name = rest.first();
            var val  = eval_ice(rest.rest().first());
            var update_env = (first === "define")? fl.defenv : fl.setenv;
            update_env(env, name, val);
            return val;
        case "fn":
            var vars = rest[0], body = rest[1];
            var local_env = {};
            local_env.parent = env;
            var fn = function(env, xs) {
                if (xs.length !== vars.length)
                    throw new Error("Arity mismatch in call to " + first);
                for (var i = 0; i < vars.length; i++)
                    local_env[vars[i]] = eval_ice(xs[i]);
                return fl.eval(local_env, body);
            };
            fn.code = e;
            return fn;
        case "if":
            var test = rest[0], iftrue = rest[1], iffalse = rest[2];
            if (eval_ice(test))
                return eval_ice(iftrue);
            else
                return eval_ice(iffalse);
        default:
            var fn = fl.getenv(env, first);
            if (fn)
                return fn(env, rest.map(eval_ice));
            else
                throw new Error("Unknown function: " + first);
        }
    }
};

fl.print(fl.eval(fl.global_env, fl.read_tokens(fl.tokenize('\
(do                                                           \
(define zero? (fn (x) (eq? x 1)))                             \
(define inc   (fn (n) (+ n  1)))                              \
(define dec   (fn (n) (+ n -1)))                              \
(define fact  (fn (n) (if (zero? n) 1 (* n (fact (dec n)))))) \
(define disable-tips (fn () (quote (use the source Luke))))   \
)'))));

fl.rep = function(s) {
    return fl.print(fl.eval(fl.global_env, fl.read_tokens(fl.tokenize(s))));
};
