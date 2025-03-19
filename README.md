# MerlMovie SDK 😎

<img src="https://raw.githubusercontent.com/harry-odinson-369/merlmovie-sdk/refs/heads/main/merlmovie.png" alt="Stremio" width="300" />

The **MerlMovie SDK** was developed by Harry Odinson to greatly simplify Node.js plugin requests for the streaming feature.

**Note: This package only works for WebSocket connections! If you want to handle HTTP requests, just use the [express](https://www.npmjs.com/package/express)/etc package and follow the [documentation](https://merlmovie.org/docs/plugin) here.**

## Code Example

👇 This code example creates a WebSocket handler and do the logic to get the direct video link and send it to the user.

```typescript
import MerlMovieSDK, { DirectLink } from "merlmovie-sdk";

const SDK = new MerlMovieSDK({ PORT: 8080 });

SDK.socket({
    //This function will call when the user make a request and it contain all metadata needed.
    onStream(data, controller, message) {
        
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

