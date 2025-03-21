import { CreatePlugin } from "../src";

console.log(CreatePlugin({
    name: "Hello World",
    embed_url: "ws://test.com",
    official_website: "https://mytestwebsite.com",
    stream_type: "api",
}));