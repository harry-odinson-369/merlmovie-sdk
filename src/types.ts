import { IncomingMessage } from "http";
import { WebSocket, WebSocketServer } from "ws";

export class WSSRequestInfo {
    private request: IncomingMessage;
    constructor(request: IncomingMessage) {
        this.request = request;
    }
    get original(): IncomingMessage {
        return this.request;
    }
    get headers() {
        return this.request.headers;
    }
    get remoteAddress() {
        return this.request.socket.remoteAddress;
    }
    get uri(): URL {
        return new URL(this.request.url || "", "http://merlmovie.org");
    }
    get real_url(): string {
        return this.uri.toString();
    }
    get query(): URLSearchParams {
        return this.uri.searchParams;
    }
    get pathSegments(): string[] {
        return this.uri.pathname.split("/").filter(Boolean);
    }
    get method() {
        return this.request.method;
    }
    get client() {
        let client_info: WSSClientInfo;
        const __key = "__xci__";
        const __xci__ = this.query.get(__key);
        if (__xci__) {
            let text = Buffer.from(__xci__, 'base64').toString("utf-8");
            let parsed = JSON.parse(text);
            if (typeof parsed === "string") parsed = JSON.parse(parsed);
            client_info = {
                app: parsed.app_info,
                device: parsed.device_info,
            };
        } else {
            client_info = {
                app: DefaultAppInfo,
                device: DefaultDeviceInfo,
            };
        }
        return client_info;
    }
}
export const DefaultDeviceInfo = {
    is_physical: false,
    os: "unknown",
    os_version: "unknown",
    model: "Unknwon",
};
export const DefaultAppInfo = {
    app_name: "MerlMovie",
    build_number: "0",
    install_store: "unknown",
    package_name: "com.NOUVANNET.qr",
    version: "9.8.8",
};
export type FetchResponse = {
    status: number,
    data: any,
    headers: Record<any, any> | null,
}
export type QualityLink = {
    name: string,
    link: string,
    headers?: Record<any, any>,
}
export type SubtitleRootType = "fetch" | "normal";
export type SubtitleFetchExtension = "gz" | "zip" | "text";
export type SubtitleLink = {
    name: string,
    link: string,
    headers?: Record<any, any>,
    type?: SubtitleRootType,
    key?: {
        name: string,
        link: string,
        extension: SubtitleFetchExtension,
    }
}
export type DirectLink = {
    qualities: QualityLink[],
    subtitles: SubtitleLink[],
}
export type FetchResponseType = "dynamic" | "bytes";
export type FetchApiType = "http" | "axios";
export type FetchFunctionParams = {
    url: string,
    method?: string,
    headers?: Record<any, any>,
    body?: any,
    response_type?: FetchResponseType,
    /** Set timeout to this request in second. */
    timeout?: number,
    /** when set to "http", this function use normal http client to make network request in the app. and "axios" is used to make http network request using axios in javascript code. */
    api?: FetchApiType,
    axios?: {
        /** axios cdn url. default is "https://cdn.jsdelivr.net/npm/axios@1.8.4/dist/axios.min.js" */
        cdn?: string,
        /** javascript code will be executed after "cdn" url is injected. */
        script?: string,
    }
}
export type BrowserWebType = "web_0" | "web_1";
export type BrowserWebVisible = "no" | "yes";
export type BrowserInfo = {
    url: string,
    type?: BrowserWebType,
    headers?: Record<any, any>,
    visible?: BrowserWebVisible,
};
export type BrowserProps = {
    info: BrowserInfo,
    onNavigationRequest?: OnNavigationRequest,
    onNavigationFinished?: OnNavigationFinished,
};
export type FetchFunction = (params: FetchFunctionParams) => Promise<FetchResponse>;
export type FinishFunction = (data: DirectLink) => void;
export type ProgressFunction = (percent: number) => void;
export type FailedFunction = (status?: number, message?: string) => void;
export type GetCacheFunction = <T>(key: string) => Promise<T | undefined>;
export type SetCacheFunction = (key: string, value: any) => Promise<boolean>;
export type DeleteCacheFunction = (key: string) => Promise<void>;
export type OnNavigationRequest = (url: string, isMainFrame: boolean) => Promise<boolean>;
export type BrowserCookie = {
    get: (url: string) => Promise<string>,
    set: (url: string, cookie: string) => Promise<void>,
};
export type BrowserController = {
    evaluate: (script: string) => Promise<string>,
    click: (x: number, y: number) => void,
}
export type OnNavigationFinished = (url: string, controller: BrowserController) => void;
export type BrowserInstance = {
    close: () => void,
    visible: (show: BrowserWebVisible) => void,
}
export type CacheController = {
    get: GetCacheFunction,
    set: SetCacheFunction,
    delete: DeleteCacheFunction,
}
export type BrowserFunction = (props: BrowserProps) => BrowserInstance;
export type BrowserControl = {
    /** spawn a webview in the MerlMovie app. */
    spawn: BrowserFunction,
    /** "cookie" is used to control the webview cookie. */
    cookie: BrowserCookie,
};
export type WSSController = {
    /** "request" is used to make an http request. this function is useful without using proxy. the app will make a request to the "url" and send back the response instead of interacting directly to the target url from this server. */
    request: FetchFunction,
    /** "progress" is used to call when show progress loading in the MerlMovie app loading screen before the "finish" function. */
    progress: ProgressFunction,
    /** "finish" is used to call when the direct links is ready to play. */
    finish: FinishFunction,
    /** "failed" is used to call when the error occurred. */
    failed: FailedFunction,
    /** "browser" is used to control the headless browser to scrape data from this html. */
    browser: BrowserControl,
    /** "cache" is used to control cache data in the MerlMovie for this plugin. only string value is accepted.*/
    cache: CacheController,
    /** "session_id" is generated when a client is connected once. */
    session_id: string,
}
export type WSSDataModel = {
    action: string,
    __id: string,
    data: Record<any, any>,
}
export type WSSFetchMethod = string;
export type MediaType = "movie" | "tv";
export type MediaInfo = {
    media_id: string,
    media_type?: MediaType,
    season_id?: string,
    episode_id?: string,
    data?: Record<any, any>,
};
export type DeviceInfo = {
    os: string,
    os_version: string,
    is_physical: boolean,
    model: string,
}
export type AppInfo = {
    version: string,
    build_number?: string,
    install_store?: string,
    app_name: string,
    package_name: string,
}
export type PluginMetadata = {
    logo_background_color?: string,
    stream_type: "api" | "internal" | "url" | "webview" | "iframe",
    media_type?: "multi" | "movie" | "tv",
    embed_url: string,
    tv_embed_url?: string,
    headers?: Record<any, any>,
    name: string,
    author: string,
    image: string,
    description?: string,
    script?: string,
    official_website: string,
    use_imdb?: boolean,
    visible?: "all" | "android" | "ios" | "development" | "none",
    _docId?: string,
    webview_type?: "webview_flutter" | "flutter_inappwebview",
    allowed_domains?: string[],
    version?: string,
    query?: string[],
}
export const WSSAction = {
    stream: "stream",
    fetch: "fetch",
    result: "result",
    progress: "progress",
    failed: "failed",
    browser: "browser",
    browser_result: "browser_result",
    browser_click: "browser_click",
    browser_url_request: "browser_url_request",
    browser_url_finished: "browser_url_finished",
    browser_close: "browser_close",
    browser_evaluate: "browser_evaluate",
    browser_evaluate_result: "browser_evaluate_result",
    browser_cookie: "browser_cookie",
    browser_cookie_result: "browser_cookie_result",
    browser_set_cookie: "browser_set_cookie",
    browser_visible: "browser_visible",
}
export type OnStreamFunctionProps = {
    media: MediaInfo,
    controller: WSSController,
    request: WSSRequestInfo
};
export type ClosedReason = {
    code: number,
    reason: Buffer<ArrayBufferLike>,
}
export type OnStreamFunctionCallbackProps = (props: OnStreamFunctionProps) => void;
export type OnStreamFunction = OnStreamFunctionCallbackProps;
export type OnConnectionFunction = (ws: WebSocket, request: WSSRequestInfo, session_id: string) => void;
export type OnListeningFunction = () => void;
export type OnClosedFunction = (reason: ClosedReason, request: WSSRequestInfo, session_id: string) => void;
export type HandleProps = {
    onStream: OnStreamFunction,
    onConnection?: OnConnectionFunction,
    onListening?: OnListeningFunction,
    onClosed?: OnClosedFunction,
};
export type InitialConfig = {
    HOST?: string,
    PORT?: number,
    WSS?: WebSocketServer,
}
export type WSSClientInfo = {
    device: DeviceInfo,
    app: AppInfo,
}