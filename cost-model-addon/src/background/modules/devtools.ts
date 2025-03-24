import { eventBus } from "../shared/eventBus";
import { RoundTrip, Request, ClassificationFlags, Header } from "../../common/network.types";
import { MessageType } from "../../common/message.types";

export class DevtoolsModule {
	private static instance: DevtoolsModule;

	public static getInstance(): DevtoolsModule {
		if (!this.instance) {
			this.instance = new DevtoolsModule();
		}
		return this.instance;
	}

	public constructor() {
		eventBus.on("DEVTOOLS_MESSAGE", this.handleDevtoolsMessage.bind(this));
	}

	private isValidJSONString(str: string): boolean {
		try {
			JSON.parse(str);
		} catch (e) {
			return false;
		}
		return true;
	}

	private handleDevtoolsMessage(message: RuntimeMessage): void {

		const tabId = message.payload.tabId;
		const action =  message.payload.action;

		let request: Request | undefined;
		if (message.payload.request && this.isValidJSONString(message.payload.request)) {
			try {
				request = JSON.parse(message.payload.request) as Request;
			} catch (error) {
				console.error("Error parsing HAR log JSON:", error);
				request = undefined;
			}
		}

		if (!request) {
			console.error("[DevtoolsModule] Invalid request data received from devtools");
			return;
		}



		const filteredRequests = this.matchesCriteria(request, {
			isTimeNotZero: true,
		});

		// Choose only some metrics to send to the server
		const networkTransferMetrics: any = {
			request: {
				method: request.request.method,
				url: request.request.url,
				bodySize: request.request.bodySize,
				headersSize: request.request.headersSize,
				content_length: request.request.headers.find((header: Header) => header.name.toLowerCase() === "content-length")?.value,

			},
			response: {
				status: request.response.status,
				mimeType: request.response.content.mimeType ?? "",
				fileName: request.request.url.split("/").pop(),
				content_length: request.response.headers.find((header: Header) => header.name.toLowerCase() === "content-length")?.value,
				headersSize: request.response.headersSize,
				bodySize: request.response.bodySize,
			},
			timings: {
				all: request.time,
				send: request.timings.send,
				wait: request.timings.wait,
				receive: request.timings.receive,
			}
		}

		if (filteredRequests) {
			eventBus.publish("DEVTOOLS_SEND_TO_WEBSOCKET", {
				type: "SEND_TO_WEBSOCKET",
				payload: {
					tabId,
					action,
					networkTransferMetrics,
				}
			});
		}

	}
	
	private matchesCriteria(
		request: Request,
		filter: Partial<ClassificationFlags>
	): boolean {
		// Compute classification flags based on the request details
		const method = request.request.method;
		const responseStatus = request.response.status;
		const responseMimeType = request.response.content.mimeType ?? "";
		const computedFlags: ClassificationFlags = {
			isImage: responseMimeType.includes("image"),
			isCSS: responseMimeType.includes("css"),
			isJS: responseMimeType.includes("javascript"),
			isHTML: responseMimeType.includes("html"),
			isSuccessful: responseStatus >= 200 && responseStatus < 300,
			isRedirect: responseStatus >= 300 && responseStatus < 400,
			isClientError: responseStatus >= 400 && responseStatus < 500,
			isServerError: responseStatus >= 500,
			isGET: method === "GET",
			isPOST: method === "POST",
			isPUT: method === "PUT",
			isDELETE: method === "DELETE",
			isTimeNotZero: request.time > 0,
			isXHR: request.response.headers.some((header: Header) =>
				header.name.toLowerCase() === "x-requested-with"
			),
			isCached: request.response.headers.some((header: Header) =>
				header.name.toLowerCase() === "cache-control"
			),
			isSecure: request._securityState === "secure",
			isSecureWithWarnings: request._securityState === "warning",
			isNotSecure: request._securityState === "insecure",
		};
		
		// Loop over each property in the filter object and check against computed flags
		for (const key in filter) {
			if (filter.hasOwnProperty(key)) {
				const flagKey = key as keyof ClassificationFlags;
				if (filter[flagKey] !== computedFlags[flagKey]) {
					return false;
				}
			}
		}
		return true;
	}
}
