import { WebSocket, WebSocketServer } from "ws";
import { DirectLink, FetchResponse, HandleProps, InitialConfig, OnStreamData, PluginMetadata, WSSAction, WSSDataModel, WSSFetchMethod } from "./types";

function __throwError(msg: string) {
    throw Error(`[MerlMovie SDK] ${msg}`);
}

function __create_plugin(props: PluginMetadata): PluginMetadata {
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

function __checkJSON(text: string) {
    try {
        return JSON.parse(text);
    } catch (err) {
        console.error(err);
        return text;
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

async function __sendTest(targetHost: string, data: OnStreamData, progress?: (percent: number) => void): Promise<DirectLink | undefined> {
    return new Promise<DirectLink | undefined>(async resolve => {
        const props = {
            t: data.mediaType,
            i: data.mediaId,
            s: data.season,
            e: data.episode,
        }

        const ws = await new Promise<WebSocket>(resolve => {
            const ws = new WebSocket(targetHost);
            const timer = setInterval(() => {
                if (ws.readyState === 1) {
                    clearInterval(timer);
                    resolve(ws);
                }
            }, 10);
        });

        ws.on("message", async (raw) => {

            const data = _paseWSSData(raw.toString("utf-8"));

            if (data) {
                if (data.action === WSSAction.result) {
                    resolve(data.data as DirectLink);
                    ws.close();
                } else if (data.action === WSSAction.failed) {
                    resolve(undefined);
                    ws.close();
                } else if (data.action === WSSAction.progress) {
                    if (progress) progress(data.data.progress);
                    if (!progress) console.log(`[MerlMovie SDK] Received test progress ${data.data.progress}% for mediaId ${props.i}${props.s && props.e ? ` season ${props.s} episode ${props.e}` : ""}`);
                } else if (data.action === WSSAction.fetch) {
                    const httpInfo = data.data as { url: string, headers: Record<any, any>, method: string, body: any, response_type: string };

                    let resp: Response;

                    if (httpInfo.method === "get") {
                        resp = await fetch(httpInfo.url, { method: "GET", headers: httpInfo.headers });
                    } else {
                        resp = await fetch(httpInfo.url, { method: "POST", headers: httpInfo.headers, body: httpInfo.body });
                    }


                    const isBytesResponse = httpInfo.response_type === "bytes";

                    let body: any;

                    if (isBytesResponse) {
                        const arrBuff = new Uint8Array(await resp.arrayBuffer());
                        body = Array.from(arrBuff);
                    } else {
                        body = __checkJSON(await resp.text());
                    }

                    ws.send(JSON.stringify({ action: WSSAction.result, data: { status: resp.status, body, headers: resp.headers } }));
                }
            }

        });

        ws.send(JSON.stringify({ action: WSSAction.stream, data: props }));

    });
}

function __handle__(wss: WebSocketServer, props: HandleProps): void {
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

const __DefaultWSS = (CONFIG?: InitialConfig) => new WebSocket.Server({ host: CONFIG?.HOST, port: CONFIG?.PORT });

export default class MerlMovieSDK {

    constructor(config?: InitialConfig) {
        this.CONFIG = config;
    }

    CONFIG?: InitialConfig;

    CreatePlugin = (metadata: PluginMetadata) => __create_plugin(metadata);

    SendTest = (targetHost: string, data: OnStreamData, progress?: (percent: number) => void) => __sendTest(targetHost, data, progress);

    Handle(props: HandleProps): void;

    Handle(wss: WebSocketServer, props: HandleProps): void;

    Handle(arg: WebSocketServer | HandleProps, props?: HandleProps) {

        const __props: HandleProps = props || { onStream(_, __, ___) { }, };

        if (arg instanceof WebSocketServer) {
            __handle__(arg, __props);
        } else {
            __handle__(__DefaultWSS(this.CONFIG), arg);
        }
    }

}