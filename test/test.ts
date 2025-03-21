import { sendTest } from "../src";

(async () => {
    const result = await sendTest("ws://localhost:8080?provider=vidsrc.cc", { mediaId: "76479", season: "1", episode: "1" });
    console.log(result);
})();