import { IncomingMessage } from "http";
import { PageWithCursor } from "puppetool";
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
                plugin: parsed.plugin_info,
            };
        } else {
            client_info = {
                app: DefaultAppInfo,
                device: DefaultDeviceInfo,
                plugin: {
                    name: "Unknwon",
                    embed_url: "",
                    author: "Unknown",
                    image: "",
                    official_website: "",
                    open_type: "player",
                    stream_type: "api",
                }
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
    use_proxy?: boolean,
    skip_intro?: {
        start?: number,
        end?: number,
    }
}
export type SubtitleRootType = "fetch" | "normal";
export type SubtitleFetchExtension = "gz" | "zip" | "text";
export type SubtitleLink = {
    name: string,
    link: string,
    headers?: Record<any, any>,
    type?: SubtitleRootType,
    is_default?: boolean,
    key?: {
        name: string,
        link: string,
        extension: SubtitleFetchExtension,
    }
}
export type DirectLinkError = {
    status: number,
    message: string,
}
export type DirectLink = {
    qualities: QualityLink[],
    subtitles: SubtitleLink[],
    status?: "FINAL_RESULT" | "PROGRESS_STATUS" | "WEBVIEW_PLAYER",
    website?: string,
    payload?: Record<any, any>,
    source_name?: string,
    title?: string,
    thumbnail?: string,
    _error?: DirectLinkError,
}
export type FetchResponseType = "dynamic" | "bytes";
export type FetchApiType = "http" | "axios";
export type FetchFunctionParams = {
    /** http request url. */
    url: string,
    /** initial_origin used to load the webview for the first time and then start the request using "url" with axios. it good to use a url that return 404 page for the fast request instead of wait until the "url" origin load time before using axios. */
    initial_origin?: string,
    /** http request method. */
    method?: string,
    /** http request headers. */
    headers?: Record<any, any>,
    /** the body for "POST" method */
    body?: any,
    /** specific the response type. default is dynamic. */
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
export type OnNavigationFinished = (url: string) => void;
export type BrowserInstance = {
    close: () => void,
    evaluate: (script: string) => Promise<string>,
    click: (x: number, y: number) => void,
    visible: (show: BrowserWebVisible) => void,
}
export type CacheController = {
    get: GetCacheFunction,
    set: SetCacheFunction,
    delete: DeleteCacheFunction,
}
export type BrowserControl = {
    /** spawn a webview in the MerlMovie app. */
    spawn: (props: BrowserProps) => BrowserInstance,
    /** spawn a puppeteer browser on this server but use http request on client side interception. */
    puppetool: (props?: { fresh?: boolean, turnstile?: boolean }) => Promise<PageWithCursor | undefined>,
    /** "cookie" is used to control the webview cookie. */
    cookie: BrowserCookie,
};
export type AxiosRequestProps = {
    /** http request url. */
    url: string,
    /** initial_origin used to load the webview for the first time and then start the request using "url" with axios. it good to use a url that return 404 page for the fast request instead of wait until the "url" origin load time before using axios. */
    initial_origin?: string,
    /** http request method. */
    method?: string,
    /** http request headers. */
    headers?: Record<any, any>,
    /** the body for "POST" method */
    body?: any,
    /** specific the response type. default is dynamic. */
    response_type?: FetchResponseType,
    /** Set timeout to this request in second. */
    timeout?: number,
    /** specific axios cdn/version script. */
    cdn?: string,
    /** custom axios request script. */
    script?: string,
}
export type HttpRequestProps = {
    /** http request url. */
    url: string,
    /** http request method. */
    method?: string,
    /** http request headers. */
    headers?: Record<any, any>,
    /** the body for "POST" method */
    body?: any,
    /** specific the response type. default is dynamic. */
    response_type?: FetchResponseType,
    /** Set timeout to this request in second. */
    timeout?: number,
}
export type AxiosClient = {
    send: (props: AxiosRequestProps) => Promise<FetchResponse>,
}
export type HttpClient = {
    send: (props: HttpRequestProps) => Promise<FetchResponse>,
}
export type WSSSelectFunction = (items: Array<WSSSelectModel>) => Promise<WSSSelectModel | null | undefined>;
export type WSSController = {
    /** use normal http client in the app. */
    http: HttpClient,
    /** send http request but use axios in webview as client instead. */
    axios: AxiosClient,
    /** "progress" is used to call when show progress loading in the MerlMovie app loading screen before the "finish" function. */
    progress: ProgressFunction,
    /** "finish" is used to call when the direct links is ready to play. */
    finish: FinishFunction,
    /** "failed" is used to call when the error occurred. */
    failed: FailedFunction,
    /** "select" is used to show user which item is the target to scrape. */
    select: WSSSelectFunction,
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
export type WSSSelectModel = {
    title: string,
    subtitle: string,
    image: string,
    image_type: "poster" | "banner",
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
    open_type: "player" | "webview",
    logo_background_color?: string,
    stream_type: "api" | "webview",
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
    select: "select",
    select_result: "select_result",
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
    plugin: PluginMetadata,
}