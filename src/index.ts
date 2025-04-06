import { WebSocket, WebSocketServer } from "ws";
import { DirectLink, FetchResponse, HandleProps, InitialConfig, OnStreamData, OnStreamFunction, PluginMetadata, SendTestProps, WSSAction, WSSDataModel, WSSFetchMethod } from "./types";

const DefaultDeviceInfo = {
    is_physical: false,
    os: "Android",
    os_version: "15",
    model: "Pixel 6 Pro",
};

const DefaultAppInfo = {
    app_name: "MerlMovie",
    build_number: "0",
    install_store: "unknown",
    package_name: "com.NOUVANNET.qr",
    version: "9.8.8",
};

function __throwError(msg: string) {
    throw Error(`[MerlMovie SDK] ${msg}`);
}

export function createPlugin(props: PluginMetadata): PluginMetadata {
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

export async function sendTest(host: string, props: SendTestProps, progress?: (percent: number) => void): Promise<DirectLink | undefined> {
    return new Promise<DirectLink | undefined>(async resolve => {

        let data: OnStreamData = {
            media_info: props.media_info,
            device_info: props.device_info || DefaultDeviceInfo,
            app_info: props.app_info || DefaultAppInfo,
        }

        const ws = await new Promise<WebSocket>(resolve => {
            const ws = new WebSocket(host);
            const timer = setInterval(() => {
                if (ws.readyState === 1) {
                    clearInterval(timer);
                    resolve(ws);
                }
            }, 10);
        });

        ws.on("message", async (raw) => {

            const msg = _paseWSSData(raw.toString("utf-8"));

            if (msg) {
                if (msg.action === WSSAction.result) {
                    resolve(msg.data as DirectLink);
                    ws.close();
                } else if (msg.action === WSSAction.failed) {
                    resolve(undefined);
                    ws.close();
                } else if (msg.action === WSSAction.progress) {
                    if (progress) progress(msg.data.progress);
                    if (!progress) console.log(`[MerlMovie SDK] Received test progress ${msg.data.progress}% for mediaId ${data.media_info.media_id}${data.media_info.season_id && data.media_info.episode_id ? ` season ${data.media_info.season_id} episode ${data.media_info.episode_id}` : ""}`);
                } else if (msg.action === WSSAction.fetch) {
                    const httpInfo = msg.data as { url: string, headers: Record<any, any>, method: string, body: any, response_type: string };

                    let resp: Response = await fetch(httpInfo.url, { method: httpInfo.method.toUpperCase(), headers: httpInfo.headers, body: httpInfo.body });

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

        ws.send(JSON.stringify({ action: WSSAction.stream, data: data }));

    });
}

function __handle__(wss: WebSocketServer, props: HandleProps): void {
    wss.on("connection", (ws, message) => {

        if (props.onConnection) props.onConnection(ws, message);

        ws.on("message", (raw) => {
            const data = _paseWSSData(raw.toString("utf-8"));

            if (data) {
                if (data.action === WSSAction.stream) {

                    let __data: OnStreamData = data.data.i ? {
                        media_info: {
                            media_id: data.data.i,
                            media_type: data.data.t,
                            season_id: data.data.s,
                            episode_id: data.data.e,
                        },
                        device_info: DefaultDeviceInfo,
                        app_info: DefaultAppInfo,
                    } : (data.data as OnStreamData);

                    props.onStream(
                        __data,
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

export default class MerlMovieSDK {

    constructor(config?: InitialConfig) {
        this.config = config;
    }

    config?: InitialConfig;

    private defaultWSS = (config?: InitialConfig) => (config?.WSS || new WebSocket.Server({ host: config?.HOST, port: config?.PORT }));

    handle(props: HandleProps): void;
    handle(callback: OnStreamFunction): void;
    handle(wss: WebSocketServer, callback: OnStreamFunction): void;
    handle(wss: WebSocketServer, props: HandleProps): void;
    handle(arg: WebSocketServer | HandleProps | OnStreamFunction, arg1?: HandleProps | OnStreamFunction) {

        const __props: HandleProps = typeof arg1 === "function" ? { onStream: arg1 } : (arg1 || { onStream(_, __, ___) { }, });

        if (arg instanceof WebSocketServer) {
            __handle__(arg, __props);
        } else if (typeof arg === "function") {
            __handle__(this.defaultWSS(this.config), { onStream: arg });
        } else {
            __handle__(this.defaultWSS(this.config), arg);
        }
    }

}

export * from './types';