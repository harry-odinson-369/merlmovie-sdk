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
export type FetchFunctionParams = {
    url: string,
    method?: "get" | "post",
    headers?: Record<any, any>,
    data?: any,
    response_type?: "dynamic" | "bytes",
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

export type HandleProps = {
    onStream: (data: OnStreamData, controller: WSSController, request: IncomingMessage) => void,
    onConnection?: (ws: WebSocket, request: IncomingMessage) => void,
    onListening?: () => void,
    onClosed?: (code: number, reason: Buffer<ArrayBufferLike>) => void,
};

export type InitialConfig = {
    HOST?: string,
    PORT?: number,
    WSS?: WebSocketServer,
}