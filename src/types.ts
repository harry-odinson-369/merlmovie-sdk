import { IncomingMessage } from "http";
import { WebSocket, WebSocketServer } from "ws";

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
    timeout?: number,
    api?: FetchApiType,
    axios?: {
        cdn?: string,
        script?: string,
    }
}
export type BrowserWebType = "web_0" | "web_1";
export type BrowserWebVisible = "no" | "yes";
export type BrowserInfo = {
    url: string,
    type: BrowserWebType,
    headers?: Record<any, any>,
    visible?: BrowserWebVisible,
};
export type BrowserProps = {
    info: BrowserInfo,
    onNavigationRequest: OnNavigationRequest,
    onNavigationFinished: OnNavigationFinished,
};
export type FetchFunction = (params: FetchFunctionParams) => Promise<FetchResponse>;
export type FinishFunction = (data: DirectLink) => void;
export type ProgressFunction = (percent: number) => void;
export type FailedFunction = (status?: number, message?: string) => void;
export type GetCacheFunction = <T>(key: string) => Promise<T | undefined>;
export type SetCacheFunction = (key: string, value: any) => Promise<boolean>;
export type OnNavigationRequest = (url: string, isMainFrame: boolean) => Promise<boolean>;
export type BrowserController = {
    evaluate: (script: string) => Promise<string>,
    cookie: (url: string) => Promise<string>,
    click: (x: number, y: number) => void,
}
export type OnNavigationFinished = (url: string, controller: BrowserController) => void;
export type BrowserInstance = {
    close: () => void,
}
export type BrowserFunction = (props: BrowserProps) => BrowserInstance;
export type WSSController = {
    request: FetchFunction,
    progress: ProgressFunction,
    finish: FinishFunction,
    failed: FailedFunction,
    get: GetCacheFunction,
    set: SetCacheFunction,
    browser: BrowserFunction,
    session_id: string,
}
export type WSSDataModel = {
    action: string,
    __id?: string,
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
}
export type OnStreamFunction = (media: MediaInfo, controller: WSSController, request: IncomingMessage, client: WSSClientInfo) => void;
export type OnConnectionFunction = (ws: WebSocket, request: IncomingMessage, session_id: string, client: WSSClientInfo) => void;
export type OnListeningFunction = () => void;
export type OnClosedFunction = (code: number, reason: Buffer<ArrayBufferLike>, session_id: string, client: WSSClientInfo) => void;
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
    device_info: DeviceInfo,
    app_info: AppInfo,
}