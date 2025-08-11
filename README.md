# MerlMovie SDK 😎

<img src="https://raw.githubusercontent.com/harry-odinson-369/merlmovie-sdk/refs/heads/main/merlmovie.png" alt="Stremio" width="300" />

The **MerlMovie SDK** is a powerful software package developed by Harry Odinson to greatly simplify Node.js (TypeScript) plugin requests for the streaming feature.

**Note: This package only works for WebSocket connections! If you want to handle HTTP requests, just use the [express](https://www.npmjs.com/package/express)/etc package and follow the [documentation](https://merlmovie.org/docs/plugin) here.**

## Code Example

👇 This code example creates a WebSocket handler and do the logic to get the direct video link and send it to the user.

```typescript
import MerlMovieSDK, { DirectLink, sendTest } from "merlmovie-sdk";

const sdk = new MerlMovieSDK({ HOST: "localhost", PORT: 8080 });

sdk.handle({
    //This function used to receive the request from user and it contain all metadata needed.
    onStream({controller, request, media}) {
        
        //Do the logic here

        //Example result from the logic above
        //The link property in qualities array below support both video format .mp4 and .m3u8
        //And the link property in subtitles array below support both text format .srt and .vtt
        const result: DirectLink | undefined = {
            qualities: [
                {
                    name: "Big Buck Bunny - 1080p",
                    link: "https://example.com/video/big-buck-bunny-1080p.mp4",
                }
            ],
            subtitles: [
                {
                    name: "Big Buck Bunny - English",
                    link: "https://example.com/subtitle/big-buck-bunny-1080p.srt",
                }
            ]
        }

        //After the logic finished pass the final result to send back to user
        if (result) {
            controller.finish(result);
        } else {
            controller.failed();
        }

    },
});

```
🎉✌️ Now you can run it on your self-hosted server normally.

👇 **How to use the SDK with [express](https://www.npmjs.com/package/express) server.**
```typescript
// server.js
import express from 'express';
import { createServer } from 'http';
import MerlMovieSDK from 'merlmovie-sdk';
import { WebSocketServer } from 'ws';

const app = express();
const port = 3000;

// Create HTTP server
const server = createServer(app);

const WSS = new WebSocketServer({ server, path: "/ws" });

const sdk = new MerlMovieSDK({ WSS });

sdk.handle({
    async onStream(data, controller, request) {
        
        //Do the logic here and the result should be look like below
        const result: DirectLink | undefined = {
            qualities: [
                {
                    name: "Big Buck Bunny - 1080p",
                    link: "https://example.com/video/big-buck-bunny-1080p.mp4",
                }
            ],
            subtitles: [
                {
                    name: "Big Buck Bunny - English",
                    link: "https://example.com/subtitle/big-buck-bunny-1080p.srt",
                }
            ]
        }

        if (result) controller.finish(result);
        if (!result) controller.failed(); 
    },
    onConnection(ws, request) {
        console.log("A client connected " + request.socket.remoteAddress);
    },
    onListening() {
        console.log("WebSocket is listening...");
    },
});

// Express route
app.get('/', (req, res) => {
    res.send('Hello from Express server!');
});

// Start the server
server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

```

## Plugin Metadata Structure

👇 Here is the plugin metadata structure that user will install it into the MerlMovie app.
The **embed_url** is the url where you're going to host the code above.

 ```json
 {
    "embed_url": "wss://example.com/websocket_url",
    "name": "My Example Plugin",
    "stream_type": "api",
    "image": "https://example.com/logo/example.png",
    "logo_background_color": "#212121"
 }
 ```

 Now go to [Encode Plugin](https://merlmovie.org/plugin/encode) to pack this json metadata to .merlmovieplugin file then you can share it to anyone that have MerlMovie app on their device.

 ## Report an issue

 If you have any issues regarding the MerlMovie SDK, please feel free to report them [here](https://github.com/harry-odinson-369/merlmovie-sdk/issues).

