import { IncomingMessage } from "http";
import { WebSocket, WebSocketServer } from "ws";

export type FetchResponse = {
    status: number,
    data: any,
    headers: Record<any, any> | null,
}
export type LinkModel = {
    name: string,
    link: string,
    headers?: Record<any, any>,
}
export type DirectLink = {
    qualities: LinkModel[],
    subtitles: LinkModel[],
}
export type FetchResponseType = "dynamic" | "bytes";
export type FetchFunctionParams = {
    url: string,
    method?: string,
    headers?: Record<any, any>,
    data?: any,
    response_type?: FetchResponseType,
}
export type VirtualWebType = "web_0" | "web_1";
export type VirtualWebVisible = "no" | "yes";
export type VirtualFunctionInfo = {
    url: string,
    type: VirtualWebType,
    headers?: Record<any, any>,
    visible?: VirtualWebVisible,
};
export type VirtualFunctionProps = {
    info: VirtualFunctionInfo,
    onNavigationRequest: OnNavigationRequest,
    onNavigationFinished: OnNavigationFinished,
};
export type FetchFunction = (params: FetchFunctionParams) => Promise<FetchResponse>;
export type FinishFunction = (data: DirectLink) => void;
export type ProgressFunction = (percent: number) => void;
export type FailedFunction = (status?: number, message?: string) => void;
export type GetCacheFunction = <T>(key: string) => Promise<T | undefined>;
export type SetCacheFunction = (key: string, value: any) => Promise<boolean>;
export type OnNavigationRequest = (url: string) => Promise<boolean>;
export type OnNavigationFinishedController = {
    evaluate: (script: string) => Promise<any>,
    cookie: (url: string) => Promise<string>,
    click: (x: number, y: number) => void,
}
export type OnNavigationFinished = (url: string, controller: OnNavigationFinishedController) => void;
export type VirtualFunctionResponse = {
    close: () => void,
}
export type VirualFunction = (props: VirtualFunctionProps) => VirtualFunctionResponse;
export type WSSController = {
    fetch: FetchFunction,
    progress: ProgressFunction,
    finish: FinishFunction,
    failed: FailedFunction,
    get: GetCacheFunction,
    set: SetCacheFunction,
    virtual: VirualFunction,
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
export type OnStreamData = {
    media_info: MediaInfo,
    device_info: DeviceInfo,
    app_info: AppInfo,
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
    virtual: "virtual",
    virtual_result: "virtual_result",
    virtual_click: "virtual_click",
    virtual_url_request: "virtual_url_request",
    virtual_url_finished: "virtual_url_finished",
    virtual_close: "virtual_close",
    virtual_evaluate: "virtual_evaluate",
    virtual_evaluate_result: "virtual_evaluate_result",
    virtual_cookie: "virtual_cookie",
    virtual_cookie_result: "virtual_cookie_result",
}

export type OnStreamFunction = (data: OnStreamData, controller: WSSController, request: IncomingMessage) => void;
export type OnConnectionFunction = (ws: WebSocket, request: IncomingMessage, connection_id: string) => void;
export type OnListeningFunction = () => void;
export type OnClosedFunction = (code: number, reason: Buffer<ArrayBufferLike>, connection_id: string) => void;

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

export type SendTestProps = {
    media_info: MediaInfo,
    device_info?: DeviceInfo,
    app_info?: AppInfo,
}