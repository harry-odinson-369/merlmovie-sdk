import MerlMovieSDK from "../src";

const SDK = new MerlMovieSDK({ PORT: 8080 });

SDK.Handle({
    onStream(data, controller, message) {
        
    },

    onConnection(ws, message) {
        console.log(message.socket.remoteAddress);
        
    },

    onListening() {
        console.log(`Server listening on port ${SDK.CONFIG?.PORT}...`);
        
    },
});