import { RawData, WebSocket, WebSocketServer } from "ws";
import { AppInfo, DirectLink, FetchFunctionParams, FetchResponse, HandleProps, InitialConfig, MediaInfo, OnStreamFunction, PluginMetadata, VirtualFunctionProps, VirtualFunctionResponse, WSSAction, WSSClientInfo, WSSDataModel } from "./types";

const DefaultDeviceInfo = {
    is_physical: false,
    os: "Android",
    os_version: "15",
    model: "Pixel 6 Pro (Test)",
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

    let query: string[] = [];

    let temp: string = '';

    for (let i = 0; i < props.name.length; i++) {
        temp = temp + props.name[i];
        query.push(temp.toLowerCase());
    }

    metadata["query"] = query;

    if (!(props.version || "").length) {
        metadata["version"] = "1.0.0";
    }

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

const uniqueId = () => Math.random().toString(36).substring(2, 24);

function _request(ws: WebSocket, props: FetchFunctionParams, app_info: AppInfo): Promise<FetchResponse> {
    return new Promise(async (resolve) => {
        const __version = parseInt(app_info.version.split(".").join(""));
        const __id = uniqueId();
        let __props = props;

        __props.method = __props.method || "get";

        let __response: FetchResponse | undefined;

        const callback = (raw: RawData) => {
            const data = _paseWSSData(raw.toString("utf-8"));
            if (data) {
                if (data.action === WSSAction.result) {
                    if (__version <= 988) {
                        __response = {
                            status: data.data.status,
                            data: data.data.body,
                            headers: data.data.headers,
                        };
                    } else {
                        if (__id === data.__id) {
                            __response = {
                                status: data.data.status,
                                data: data.data.body,
                                headers: data.data.headers,
                            };
                        }
                    }
                }
            }
        }

        ws.on("message", callback);

        const payload: WSSDataModel = {
            action: WSSAction.fetch,
            __id: __id,
            data: __props,
        }

        ws.send(JSON.stringify(payload));

        while (true) {
            if (__response) {
                ws.removeListener("message", callback);
                resolve(__response);
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 300));
        }
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

async function __getCache<T>(ws: WebSocket, key: string, app_info: AppInfo): Promise<T | undefined> {
    const response = await _request(ws, {
        url: `db://get:${key}`,
        method: "get",
    }, app_info);
    if (response.status === 200) return response.data as T;
}

async function __setCache(ws: WebSocket, key: string, value: any, app_info: AppInfo): Promise<boolean> {
    const response = await _request(ws, {
        url: `db://set:${key}`,
        method: "post",
        headers: {},
        data: typeof value === "string" ? value : JSON.stringify(value),
    }, app_info);
    return response.status === 200;
}

export async function sendTest(host: string, media: MediaInfo, progress?: (percent: number) => void): Promise<DirectLink | undefined> {
    return new Promise<DirectLink | undefined>(async resolve => {
        const ws = await new Promise<WebSocket>(resolve => {
            let target = host;

            let app_info = DefaultAppInfo;
            app_info.version = "9.8.9";

            const encoded = Buffer.from(JSON.stringify({
                app_info,
                device_info: DefaultDeviceInfo,
            }), "utf-8").toString("base64");

            if (target.includes("?")) {
                target = `${target}&__xci__=${encoded}`;
            } else {
                target = `${target}?__xci__=${encoded}`;
            }

            const ws = new WebSocket(target);
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
                    if (!progress) console.log(`[MerlMovie SDK] Received test progress ${msg.data.progress}% for mediaId ${media.media_id}${media.season_id && media.episode_id ? ` season ${media.season_id} episode ${media.episode_id}` : ""}`);
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

        ws.send(JSON.stringify({ action: WSSAction.stream, data: media }));

    });
}

async function __evaluateVirtual(ws: WebSocket, script: string): Promise<string> {

    let result: string | undefined;

    const callback = (raw: RawData) => {
        const wss = _paseWSSData(raw.toString("utf-8"));
        if (wss?.action === WSSAction.virtual_evaluate_result) {
            result = wss.data.result;
        }
    }

    ws.on("message", callback);

    const data: WSSDataModel = {
        action: WSSAction.virtual_evaluate,
        data: {
            script: script,
        }
    }

    ws.send(JSON.stringify(data));

    while (true) {
        if (typeof result !== "undefined") break;
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    ws.removeListener("message", callback);

    return result;
}

async function __cookieVirtual(ws: WebSocket, url: string): Promise<string> {
    let cookie: string | undefined;

    const callback = (raw: RawData) => {
        const wss = _paseWSSData(raw.toString("utf-8"));
        if (wss?.action === WSSAction.virtual_cookie_result) {
            cookie = wss.data.cookie;
        }
    }

    ws.on("message", callback);

    const data: WSSDataModel = {
        action: WSSAction.virtual_cookie,
        data: {
            url: url,
        }
    }

    ws.send(JSON.stringify(data));

    while (true) {
        if (typeof cookie !== "undefined") break;
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    ws.removeListener("message", callback);

    return cookie;

}

function __clickVirtual(ws: WebSocket, x: number, y: number) {
    const data: WSSDataModel = {
        action: WSSAction.virtual_click,
        data: {
            x,
            y,
        }
    }
    ws.send(JSON.stringify(data));
}

function __browser(ws: WebSocket, props: VirtualFunctionProps): VirtualFunctionResponse {

    const callback = async (raw: RawData) => {
        const wss = _paseWSSData(raw.toString("utf-8"));
        if (wss?.action === WSSAction.virtual_url_request) {
            const isAllow = await props.onNavigationRequest(wss.data.url);
            const __data: WSSDataModel = {
                action: WSSAction.virtual_result,
                data: {
                    allow: isAllow,
                }
            };
            ws.send(JSON.stringify(__data));
        } else if (wss?.action === WSSAction.virtual_url_finished) {
            props.onNavigationFinished(wss.data.url, {
                cookie: (url) => __cookieVirtual(ws, url),
                evaluate: (script) => __evaluateVirtual(ws, script),
                click: (x, y) => __clickVirtual(ws, x, y),
            });
        }
    }

    ws.on("message", callback);

    let __info = props.info;

    __info.visible = __info.visible || "no";

    const data: WSSDataModel = {
        action: WSSAction.virtual,
        data: __info,
    }

    ws.send(JSON.stringify(data));

    const __close = () => {
        const __data: WSSDataModel = {
            action: WSSAction.virtual_close,
            data: {},
        };
        ws.send(JSON.stringify(__data));
        ws.removeListener("message", callback);
    }

    return {
        close: __close,
    }
}

function __handle__(wss: WebSocketServer, props: HandleProps): void {
    wss.on("connection", (ws, request) => {

        const session_id = uniqueId();

        const __url = new URL(request.url || "", "https://merlmovie.org");

        let client_info: WSSClientInfo;

        const __key = "__xci__";

        const __xci__ = __url.searchParams.get(__key);

        if (__xci__) {
            let text = Buffer.from(__xci__, 'base64').toString("utf-8");
            client_info = JSON.parse(text);
        } else {
            client_info = {
                app_info: DefaultAppInfo,
                device_info: DefaultDeviceInfo,
            };
        }

        if (props.onConnection) props.onConnection(ws, request, session_id, client_info);

        const callback = (raw: RawData) => {
            const wss_data = _paseWSSData(raw.toString("utf-8"));

            if (wss_data) {
                if (wss_data.action === WSSAction.stream) {

                    let __media: MediaInfo;

                    if (parseInt(client_info.app_info.version.split(".").join("")) <= 988) {
                        __media = {
                            media_id: wss_data.data.i,
                            media_type: wss_data.data.t,
                            season_id: wss_data.data.s,
                            episode_id: wss_data.data.e,
                        };
                    } else {
                        __media = wss_data.data as MediaInfo;
                    }

                    props.onStream(
                        __media,
                        {
                            request: (props) => _request(ws, props, client_info.app_info),
                            progress: (percent) => _send_progress(ws, percent),
                            finish: (data: DirectLink) => _send_final_result(ws, data),
                            failed: (status, message) => _send_failed(ws, status, message),
                            get: (key: string) => __getCache(ws, key, client_info.app_info),
                            set: (key, value) => __setCache(ws, key, value, client_info.app_info),
                            browser: (__props) => __browser(ws, __props),
                            session_id: session_id,
                        },
                        request,
                        client_info,
                    );
                }
            }

        };

        ws.on("message", callback);

        ws.on("close", (code, reason) => {
            if (props.onClosed) props.onClosed(code, reason, session_id, client_info);
            ws.removeListener("message", callback);
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