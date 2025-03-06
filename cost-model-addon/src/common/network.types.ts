interface RoundTrip {
    tabId: number;
    action: string;
    request: Request;
}

interface Header {
  name: string;
  value: string;
}

interface Cookie {
  name: string;
  value: string;
}

interface RequestDetails {
  bodySize: number;
  method: string;
  httpVersion: string;
  headers: Header[];
  cookies: Cookie[];
  headersSize: number;
}

interface PostData {
  mimeType: string;
  params: any[];
  text: string;
}

interface ResponseContent {
  size: number;
  mimeType: string;
  text: string;
}

interface ResponseDetails {
  status: number;
  statusText: string;
  httpVersion: string;
  headers: Header[];
  cookies: Cookie[];
  content: ResponseContent;
  redirectURL: string;
  headersSize: number;
  bodySize: number;
}

interface CacheData {
  beforeRequest?: Record<string, any>;
  afterRequest?: Record<string, any>;
}

interface Timings {
  blocked: number;
  dns: number;
  connect: number;
  send: number;
  wait: number;
  receive: number;
  ssl: number;
}

interface Request {
  startedDateTime: string;
  request: RequestDetails;
  postData: PostData;
  response: ResponseDetails;
  cache: CacheData;
  timings: Timings;
  time: number;
  _securityState: string;
  serverIPAddress: string;
  connection: string;
}



interface ClassificationFlags {
    isImage: boolean;
    isCSS: boolean;
    isJS: boolean;
    isHTML: boolean;
    isSuccessful: boolean;
    isRedirect: boolean;
    isClientError: boolean;
    isServerError: boolean;
    isGET: boolean;
    isPOST: boolean;
    isPUT: boolean;
    isDELETE: boolean;
    isXHR: boolean;
    isCached: boolean;
    isSecure: boolean;
    isSecureWithWarnings: boolean;
    isNotSecure: boolean;
    isTimeNotZero: boolean;
}

export type { RoundTrip, Header, Cookie, RequestDetails, PostData, ResponseContent, ResponseDetails, CacheData, Timings, Request, ClassificationFlags };