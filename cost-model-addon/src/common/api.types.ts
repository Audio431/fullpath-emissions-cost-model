export interface ApiResponse<T> {
    data?: T;
    error?: string;
    status: number;             // HTTP status code
    statusText: string;         // HTTP status text
    headers: Headers;           // Response headers
    ok: boolean;               // Whether the response was successful (status in range 200-299)
    redirected: boolean;       // Whether the response is the result of a redirect
    type: ResponseType;        // Response type (basic, cors, error, etc)
    url: string;              // URL of the response
    message?: string;         // Optional message from server
    timestamp?: string;       // Response timestamp
}