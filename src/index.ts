import { WebSocket } from "ws";
import { IncomingMessage } from "http";

export type FetchResponse = {
    status: number,
    data: any,
    headers: Record<any, any> | null,
}
export type LinkModel = {
    name: string,
    link: string,
}
export type DirectLink = {
    qualities: LinkModel[],
    subtitles: LinkModel[],
}
export type FetchFunctionParams = {
    url: string,
    method?: "get" | "post",
    headers?: Record<any, any>,
    data?: any,
}
export type FetchFunction = (params: FetchFunctionParams) => Promise<FetchResponse>;
export type FinishFunction = (data: DirectLink) => void;
export type ProgressFunction = (percent: number) => void;
export type FailedFunction = (status?: number, message?: string) => void;
export type WSSController = {
    fetch: FetchFunction,
    progress: ProgressFunction,
    finish: FinishFunction,
    failed: FailedFunction,
}
export type WSSDataModel = {
    action: string,
    data: Record<any, any>,
}
export type WSSFetchMethod = "get" | "post";
export type MediaType = "movie" | "tv";
export type OnStreamData = {
    mediaType?: MediaType,
    mediaId: string,
    season?: string,
    episode?: string,
}
export type PluginMetadata = {
    logo_background_color?: string,
    stream_type: "api" | "internal" | "url" | "webview" | "iframe",
    media_type?: "multi" | "movie" | "tv",
    embed_url: string,
    tv_embed_url?: string,
    headers?: Record<any, any>,
    name: string,
    image?: string,
    description?: string,
    script?: string,
    official_website: string,
    use_imdb?: boolean,
    visible?: "all" | "android" | "ios" | "development" | "none",
    _docId?: string,
    webview_type?: "webview_flutter" | "flutter_inappwebview",
    allowed_domains?: string[],
}

export const WSSAction = {
    stream: "stream",
    fetch: "fetch",
    result: "result",
    progress: "progress",
    failed: "failed",
}

function __throwError(msg: string) {
    throw Error(`[MerlMovie SDK] ${msg}`);
}

export function CreatePlugin(props: PluginMetadata): PluginMetadata {
    if (!props.embed_url) __throwError("embed_url value is required!");
    if (!props.embed_url.startsWith("http") && !props.embed_url.startsWith("ws")) __throwError("embed_url must be start with http or ws protocol!");
    if (!props.name) __throwError("name value is required!");
    let metadata: Record<any, any> = {};
    Object.entries(props).forEach(e => {
        metadata[e[0]] = !e[1] ? null : e[1];
    });
    return JSON.parse(JSON.stringify(metadata));
}

function _paseWSSData(message: string): WSSDataModel | undefined {
    try {
        let data: WSSDataModel;

        let temp = JSON.parse(message);

        if (typeof temp === "string") {
            data = JSON.parse(temp);
        } else {
            data = temp;
        }

        return data;
    } catch (err) {
        console.error(err);
        return undefined;
    }
}

function _request(ws: WebSocket, url: string, method?: WSSFetchMethod, headers?: Record<any, any>, data?: any): Promise<FetchResponse> {
    return new Promise((resolve) => {
        ws.on("message", (raw) => {
            const data = _paseWSSData(raw.toString("utf-8"));
            if (data) {
                if (data.action === WSSAction.result) {
                    resolve({ status: data.data.status, data: data.data.body, headers: data.data.headers });
                }
            }
        });
        ws.send(JSON.stringify({ action: WSSAction.fetch, data: { method: method || "get", url: url, headers: headers, body: data } }));
    });
}

function _send_progress(ws: WebSocket, percent: number) {
    ws.send(JSON.stringify({ action: WSSAction.progress, data: { progress: percent } }));
}

async function _send_final_result(ws: WebSocket, data: DirectLink) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    ws.send(JSON.stringify({ action: WSSAction.result, data: data }));
}

function _send_failed(ws: WebSocket, status?: number, message?: string) {
    const msg = message || "An unexpected error occurred while we tried to load the resource you've requested.";
    ws.send(JSON.stringify({ action: WSSAction.failed, data: { status: status || 500, message: msg } }));
}

export default class MerlMovieSDK {

    constructor(props?: { HOST?: string, PORT?: number }) {
        this.HOST = props?.HOST;
        this.PORT = props?.PORT || 8080;
    }

    PORT: number;
    HOST?: string;

    socket(props: {
        onStream: (data: OnStreamData, controller: WSSController, message: IncomingMessage) => void,
        onConnection?: (ws: WebSocket, message: IncomingMessage) => void,
        onListening?: () => void,
        onClosed?: (code: number, reason: Buffer<ArrayBufferLike>) => void,
    }) {
        const wss = new WebSocket.Server({ host: this.HOST, port: this.PORT });

        wss.on("connection", (ws, message) => {

            if (props.onConnection) props.onConnection(ws, message);

            ws.on("message", (raw) => {
                const data = _paseWSSData(raw.toString("utf-8"));

                if (data) {
                    if (data.action === WSSAction.stream) {
                        props.onStream(
                            {
                                mediaType: data.data.t,
                                mediaId: data.data.i,
                                season: data.data.s,
                                episode: data.data.e,
                            },
                            {
                                fetch: ({ url, method, headers, data }) => _request(ws, url, method, headers, data),
                                progress: (percent) => _send_progress(ws, percent),
                                finish: (data: DirectLink) => _send_final_result(ws, data),
                                failed: (status, message) => _send_failed(ws, status, message),
                            },
                            message,
                        );
                    }
                }

            });

            ws.on("close", (code, reason) => {
                if (props.onClosed) props.onClosed(code, reason);
            });
        });

        wss.on("listening", () => {
            if (props.onListening) props.onListening();
        });
    }

}