"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var src_1 = require("../src");
console.log((0, src_1.create_plugin)({
    name: "Hello World",
    embed_url: "ws://test.com",
    official_website: "https://mytestwebsite.com",
    stream_type: "api",
}));
