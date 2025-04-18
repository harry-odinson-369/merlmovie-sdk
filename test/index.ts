import MerlMovieSDK from "merlmovie-sdk";

const sdk = new MerlMovieSDK({ PORT: 8080, HOST: "192.168.100.57" });

sdk.handle({
    async onStream(media, controller, request, client) {
        const res = await controller.request({
            url: "https://www.filmxy.vip/movie/tt29623480",
            api: "axios",
            headers: {
                "Cookie": "wp-cache-control=l8WxCdcGR2mhg2zqtBGHBJMf0p7s3FBG; wp-guest-token=6b9e2f684205851684a66ef4b3e2ce3a0a95d7121057295fd9f0f2dec5d42ca3; wp-secure-id=68000a0f710fa; PHPSESSID=6cd87731d5b7a3e83db9d73915a6976f; cf_clearance=jIPPgthPW4l.W1JHd0lq6doQ6qyrgzsA8DSLYIUmM1Y-1744829792-1.2.1.1-GY.p8NDcnWbLPyk3iPdDa2QbA9LRhZMps_BZC_Lx4JedWTc6WOYoqATsHwJ7iVobzQibjKLjSexGeYDdQj6rDUineog3gHoy8PySwqNo5JCO0_Uq91PC__jh65JBSj0hd7OOxn5Fhh.JaU0pjDguoJf5m0.UqgmhvRt5plAFWBavb5hkVH54bxm6xJOvUmifBUHnCQ5NLbNJplHLUarkELSm6UMnH8hqhgmfZRVoUR8QN5bU2l0Gh4y1khcX8cHWN_fd.exr8MLNw8ZDvNGk29txlMu0ZlHzF7xMUyFCbkiE84gkG98BKscTzqfD2QSnjWLta0LTuHB1wvlQ7MZs68ne7buLLd.Q7NjBZxSbwh2g.2KFhqz9GseJ6H45So5D",
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
                "Referer": "https://www.filmxy.vip/movie/tt29623480/"
            },
        });
    
        console.log(res);
        
    },
    onConnection() {
        console.log("A new client has connected!");
    },
    onListening() {
        console.log("Server is listening on port 8080!");
    }
});