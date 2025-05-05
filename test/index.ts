import MerlMovieSDK, { BrowserInstance } from "merlmovie-sdk";
import { WebSocketServer } from "ws";
import http from "http";
import express from "express";

const app = express();

const server = http.createServer(app);

const WSS = new WebSocketServer({ server, path: "/ws" });

const sdk = new MerlMovieSDK({ WSS: WSS });

sdk.handle({
    async onStream({ controller }) {
        let instance: BrowserInstance;
        instance = controller.browser({
            info: {
                url: "https://ttsave.app",
            },
            onNavigationFinished(url, control) {
                let showed = false;
                setInterval(() => {
                    if (!showed) {
                        instance.visible("yes");
                    } else {
                        instance.visible("no");
                    }
                    showed = !showed;
                }, 2000);
            }
        });
    },
    onConnection() {
        console.log("A new client has connected!");
    },
    onListening() {
        console.log("Server is listening on port 8080!");
    }
});

server.listen({ port: 8080, host: "192.168.100.57" });