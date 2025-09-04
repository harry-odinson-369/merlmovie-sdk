import { RawData, WebSocket, WebSocketServer } from "ws";
import { DirectLink, FetchFunctionParams, FetchResponse, HandleProps, InitialConfig, MediaInfo, OnStreamFunction, PluginMetadata, BrowserProps, BrowserInstance, WSSAction, WSSDataModel, WSSRequestInfo, DefaultAppInfo, DefaultDeviceInfo, BrowserWebVisible, AxiosRequestProps, HttpRequestProps, WSSSelectModel, WSSClientInfo } from "./types";
import Puppetool, { PageWithCursor } from "puppetool";

export * from './types';

export default class MerlMovieSDK {

    constructor(config?: InitialConfig) {
        this.config = config;
    }

    config?: InitialConfig;

    private defaultWSS = (config?: InitialConfig) => (config?.WSS || new WebSocketServer({ host: config?.HOST, port: config?.PORT }));
    handle(props: HandleProps): void;
    handle(callback: OnStreamFunction): void;
    handle(wss: WebSocketServer, callback: OnStreamFunction): void;
    handle(wss: WebSocketServer, props: HandleProps): void;
    handle(arg: WebSocketServer | HandleProps | OnStreamFunction, arg1?: HandleProps | OnStreamFunction) {
        const __props: HandleProps = typeof arg1 === "function" ? { onStream: arg1 } : (arg1 || { onStream(_) { }, });
        if (arg instanceof WebSocketServer) {
            this.__handle__(arg, __props);
        } else if (typeof arg === "function") {
            this.__handle__(this.defaultWSS(this.config), { onStream: arg });
        } else {
            this.__handle__(this.defaultWSS(this.config), arg);
        }
    }

    static create_plugin(props: PluginMetadata): PluginMetadata {
        if (!props.embed_url) throw Error("[MerlMovie SDK] embed_url value is required!");
        if (!props.embed_url.startsWith("http") && !props.embed_url.startsWith("ws")) throw Error("[MerlMovie SDK] embed_url must be start with http or ws protocol!");
        if (!props.name) throw Error("[MerlMovie SDK] name value is required!");
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

    private _paseWSSData(message: string): WSSDataModel | undefined {
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

    private __checkJSON(text: string) {
        try {
            return JSON.parse(text);
        } catch (err) {
            return text;
        }
    }

    private get uniqueId() {
        return Math.random().toString(36).substring(2, 32);
    }

    private _request(ws: WebSocket, props: FetchFunctionParams): Promise<FetchResponse> {
        return new Promise(async (resolve) => {
            const __id = this.uniqueId;
            let __props = props;
            __props.method = __props.method || "get";
            __props.api = __props.api || "http";
            __props.with_credentials = __props.with_credentials || false;
            let __response: FetchResponse | undefined;
            const callback = (raw: RawData) => {
                const data = this._paseWSSData(raw.toString("utf-8"));
                if (data) {
                    if (data.action === WSSAction.result && __id === data.__id) {
                        __response = {
                            status: data.data.status,
                            data: data.data.body,
                            headers: data.data.headers,
                        };
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

    private _send_progress(ws: WebSocket, percent: number) {
        ws.send(JSON.stringify({ action: WSSAction.progress, data: { progress: percent } }));
    }

    private async _send_final_result(ws: WebSocket, data: DirectLink) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        ws.send(JSON.stringify({ action: WSSAction.result, data: data }));
    }

    private _send_failed(ws: WebSocket, status?: number, message?: string) {
        const msg = message || "An unexpected error occurred while we tried to load the resource you've requested.";
        ws.send(JSON.stringify({ action: WSSAction.failed, data: { status: status || 500, message: msg } }));
    }

    private async __getCache<T>(ws: WebSocket, key: string): Promise<T | undefined> {
        const response = await this._request(ws, {
            url: `db://get:${key}`,
            method: "get",
        });
        if (response.status === 200) return response.data as T;
        return undefined;
    }

    private async __setCache(ws: WebSocket, key: string, value: any): Promise<boolean> {
        const response = await this._request(ws, {
            url: `db://set:${key}`,
            method: "post",
            body: typeof value === "string" ? value : JSON.stringify(value),
        });
        return response.status === 200;
    }

    private async __deleteCache(ws: WebSocket, key: string): Promise<void> {
        await this._request(ws, {
            url: `db://delete:${key}`,
            method: "delete",
        });
    }

    private async _browserEvaluate(ws: WebSocket, script: string): Promise<string> {
        let result: string | undefined;
        const __id = this.uniqueId;
        const callback = (raw: RawData) => {
            const wss = this._paseWSSData(raw.toString("utf-8"));
            if (wss?.action === WSSAction.browser_evaluate_result && wss.__id === __id) {
                result = wss.data.result;
            }
        }
        ws.on("message", callback);
        const data: WSSDataModel = {
            action: WSSAction.browser_evaluate,
            __id: __id,
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
        try {
            result = JSON.parse(result);
        } catch { }

        return result || "";
    }

    private __setBrowserCookie(ws: WebSocket, url: string, cookie: string) {
        const data: WSSDataModel = {
            action: WSSAction.browser_set_cookie,
            __id: this.uniqueId,
            data: {
                url,
                cookie,
            }
        };
        ws.send(JSON.stringify(data));
    }

    private async __getBrowserCookie(ws: WebSocket, url: string): Promise<string> {
        let cookie: string | undefined;
        const __id = this.uniqueId;
        const callback = (raw: RawData) => {
            const wss = this._paseWSSData(raw.toString("utf-8"));
            if (wss?.action === WSSAction.browser_cookie_result && wss.__id === __id) {
                cookie = wss.data.cookie;
            }
        }
        ws.on("message", callback);
        const data: WSSDataModel = {
            action: WSSAction.browser_cookie,
            __id: __id,
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

    private _browserClick(ws: WebSocket, x: number, y: number) {
        const data: WSSDataModel = {
            action: WSSAction.browser_click,
            __id: this.uniqueId,
            data: {
                x,
                y,
            }
        }
        ws.send(JSON.stringify(data));
    }

    private __spawn(ws: WebSocket, url: string, props?: BrowserProps, cb?: { onClosed?: () => void, onVisibleChanged?: (state: BrowserWebVisible) => void }): BrowserInstance {
        const __id = this.uniqueId;
        const callback = async (raw: RawData) => {
            const wss = this._paseWSSData(raw.toString("utf-8"));
            if (wss?.action === WSSAction.browser_url_request) {
                const isAllow = props?.onNavigationRequest ? await props.onNavigationRequest(wss.data.url, wss.data.is_main_frame) : true;
                const __data: WSSDataModel = {
                    action: WSSAction.browser_result,
                    __id: wss.__id,
                    data: {
                        allow: isAllow,
                    }
                };
                ws.send(JSON.stringify(__data));
            } else if (wss?.action === WSSAction.browser_url_finished && wss.__id === __id) {
                if (props?.onNavigationFinished) {
                    props?.onNavigationFinished(wss.data.url);
                }
            }
        }
        ws.on("message", callback);
        let __info = props ?? {};
        __info.visible = __info?.visible || "no";
        const data: WSSDataModel = {
            action: WSSAction.browser,
            __id: __id,
            data: { url, ...__info },
        }
        ws.send(JSON.stringify(data));
        const __close = () => {
            const __data: WSSDataModel = {
                action: WSSAction.browser_close,
                __id: __id,
                data: {},
            };
            ws.send(JSON.stringify(__data));
            ws.removeListener("message", callback);
            if (cb?.onClosed) cb?.onClosed();
        }
        const __visible = (show: BrowserWebVisible) => {
            const __data: WSSDataModel = {
                action: WSSAction.browser_visible,
                __id: __id,
                data: { show },
            };
            ws.send(JSON.stringify(__data));
            if (cb?.onVisibleChanged) cb?.onVisibleChanged(show);
        }
        return {
            close: __close,
            visible: __visible,
            evaluate: (script) => this._browserEvaluate(ws, script),
            click: (x, y) => this._browserClick(ws, x, y),
        }
    }

    private __axios_request(ws: WebSocket, props: AxiosRequestProps): Promise<FetchResponse> {
        return this._request(ws, {
            url: props.url,
            method: props.method,
            initial_origin: props.initial_origin,
            with_credentials: props.with_credentials,
            headers: props.headers,
            body: props.body,
            response_type: props.response_type,
            timeout: props.timeout,
            api: "axios",
            axios: {
                cdn: props.cdn,
                script: props.script,
            }
        });
    }

    private __http_request(ws: WebSocket, props: HttpRequestProps): Promise<FetchResponse> {
        return this._request(ws, {
            url: props.url,
            method: props.method,
            headers: props.headers,
            body: props.body,
            response_type: props.response_type,
            timeout: props.timeout,
            api: "http",
        });
    }

    private __select_items(ws: WebSocket, items: Array<WSSSelectModel>): Promise<WSSSelectModel | null | undefined> {
        return new Promise<WSSSelectModel | null | undefined>(async resolve => {
            let result: WSSSelectModel | null | undefined;
            let responed = false;
            const __id = this.uniqueId;
            const callback = (raw: RawData) => {
                const wss = this._paseWSSData(raw.toString("utf-8"));
                if (wss?.action === WSSAction.select_result && wss.__id === __id) {
                    result = wss.data.result;
                    responed = true;
                }
            }
            ws.on("message", callback);
            const data: WSSDataModel = {
                action: WSSAction.select,
                __id: __id,
                data: {
                    items: items,
                }
            }
            ws.send(JSON.stringify(data));
            while (true) {
                if (responed) break;
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            ws.removeListener("message", callback);
            resolve(result);
        });
    }

    private async __puppetool(ws: WebSocket, props?: { fresh?: boolean, turnstile?: boolean }): Promise<PageWithCursor | undefined> {
        const page = await Puppetool.instance.getPage(props ?? { fresh: true, turnstile: true });
        if (page) {
            page?.setRequestInterception(true);
            page?.on("request", async (req) => {
                const response = await this.__http_request(ws, {
                    url: req.url(),
                    headers: req.headers(),
                    body: req.postData() || null,
                    method: req.method().toLowerCase(),
                    response_type: "bytes",
                });
                req.respond({
                    status: response.status,
                    headers: response.headers || undefined,
                    body: Uint8Array.from(response.data),
                });
            });
        }
        return page;
    }

    private __handle__(wss: WebSocketServer, props: HandleProps): void {
        wss.on("connection", (ws, msg) => {
            const request = new WSSRequestInfo(msg);
            const session_id = this.uniqueId;
            if (props.onConnection) props.onConnection(ws, request, session_id);
            
            let __temp_prog: number = 0;
            let __prog_paused: boolean = false;
            let __has_ended: boolean = false;

            const callback = (raw: RawData) => {
                const wss_data = this._paseWSSData(raw.toString("utf-8"));
                if (wss_data) {
                    if (wss_data.action === WSSAction.stream) {
                        const clientInfo: WSSClientInfo = {
                            app: wss_data.data.client.app_info,
                            device: wss_data.data.client.device_info,
                            plugin: wss_data.data.client.plugin_info,
                        };
                        props.onStream({
                            media: wss_data.data.media as MediaInfo,
                            request: request,
                            client: clientInfo,
                            controller: {
                                http: {
                                    send: (props) => this.__http_request(ws, props),
                                },
                                axios: {
                                    send: (props) => this.__axios_request(ws, props),
                                },
                                progress: async (arg) => {
                                    if (arg === "auto") {
                                        for (let i = 0; i < 30; i++) {
                                            if (__prog_paused) {
                                                await new Promise(async resolve => {
                                                    while (__prog_paused) {
                                                        await new Promise(resolve0 => setTimeout(resolve0, 200));
                                                        if (!__prog_paused) {
                                                            resolve(undefined);
                                                            break;
                                                        }
                                                    }
                                                });
                                            }
                                            if (__temp_prog < 90) {
                                                __temp_prog = Math.min(Math.max(__temp_prog + 3, 0), 100);
                                                this._send_progress(ws, __temp_prog);
                                                await new Promise(resolve => setTimeout(resolve, 2000));
                                            } else {
                                                break;
                                            }
                                        }
                                    } else if (typeof arg === "number") {
                                        __temp_prog = arg;
                                        this._send_progress(ws, arg);
                                    } else if (arg === "pause") {
                                        __prog_paused = true;
                                    } else if (arg === "resume") {
                                        __prog_paused = false;
                                    }
                                },
                                finish: (data: DirectLink) => {
                                    if (__has_ended) return;
                                    __temp_prog = 100;
                                    __prog_paused = false;
                                    __has_ended = true;
                                    this._send_progress(ws, 100);
                                    this._send_final_result(ws, data);
                                },
                                failed: (status, message) => {
                                    if (__has_ended) return;
                                    __temp_prog = 100;
                                    __prog_paused = false;
                                    __has_ended = true;
                                    this._send_failed(ws, status, message);
                                },
                                select: async (items: Array<WSSSelectModel>) => {
                                    __prog_paused = true;
                                    const selected = await this.__select_items(ws, items);
                                    __prog_paused = false;
                                    return selected;
                                },
                                browser: {
                                    webview: (url, __props) => {
                                        if (__props?.visible === "yes") __prog_paused = true;
                                        return this.__spawn(
                                            ws,
                                            url,
                                            __props,
                                            {
                                                onClosed() {
                                                    __prog_paused = false;
                                                },
                                                onVisibleChanged(state) {
                                                    __prog_paused = state === "yes";
                                                },
                                            });
                                    },
                                    puppetool: (props) => this.__puppetool(ws, props),
                                    cookie: {
                                        get: (url) => this.__getBrowserCookie(ws, url),
                                        set: async (url, cookie) => this.__setBrowserCookie(ws, url, cookie),
                                    },
                                },
                                session_id: session_id,
                                cache: {
                                    get: (key: string) => this.__getCache(ws, key),
                                    set: (key, value) => this.__setCache(ws, key, value),
                                    delete: (key) => this.__deleteCache(ws, key),
                                },
                            },
                        });
                    }
                }
            };
            ws.on("message", callback);
            ws.on("close", (code, reason) => {
                if (props.onClosed) props.onClosed({ code, reason }, request, session_id);
                ws.removeListener("message", callback);
            });
        });
        wss.on("listening", () => {
            if (props.onListening) props.onListening();
        });
    }

    public async sendTest(host: string, media: MediaInfo, progress?: (percent: number) => void): Promise<DirectLink | undefined> {
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
                const msg = this._paseWSSData(raw.toString("utf-8"));
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
                            body = this.__checkJSON(await resp.text());
                        }
                        ws.send(JSON.stringify({ action: WSSAction.result, data: { status: resp.status, body, headers: resp.headers } }));
                    }
                }
            });
            ws.send(JSON.stringify({ action: WSSAction.stream, data: media }));
        });
    }

}