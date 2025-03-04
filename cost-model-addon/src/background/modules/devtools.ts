import { eventBus } from "../shared/eventBus";
import { RoundTrip, Request, ClassificationFlags, Header } from "../../common/network.types";

export class DevtoolsModule {
	private static instance: DevtoolsModule;

	public static getInstance(): DevtoolsModule {
		if (!this.instance) {
			this.instance = new DevtoolsModule();
		}
		return this.instance;
	}

	public constructor() {
		eventBus.on("DEVTOOLS_HAR", this.handleDevtoolsMessage.bind(this));
	}

	private isValidJSONString(str: string): boolean {
		try {
			JSON.parse(str);
		} catch (e) {
			return false;
		}
		return true;
	}

	private handleDevtoolsMessage(rawHARLog: any): RoundTrip | undefined {
		const tabId = rawHARLog.tabId;
		const action = rawHARLog.action;
		
		let request: Request | undefined;
		if (rawHARLog.request && this.isValidJSONString(rawHARLog.request)) {
			try {
				request = JSON.parse(rawHARLog.request) as Request;
			} catch (error) {
				console.error("Error parsing HAR log JSON:", error);
				request = undefined;
			}
		}
		
		if (!request) {
			console.error("Invalid request data received from devtools");
			return;
		}
		
		const nonCachedRequests = this.requestMatchFilter(request, {
			isCached: true,
			isRedirect: true
		});
		
		console.log("Received Request: ", request);
		console.log("Filtered Requests: ", nonCachedRequests);
		
		return {
			tabId,
			action,
			request
		};
	}

	private requestMatchFilter(
		request: Request, 
		filter: Partial<ClassificationFlags>
	  ): boolean {
		// Compute classification flags based on the request details
		const method = request.request.method;
		const responseStatus = request.response.status;
		const responseMimeType = request.response.content.mimeType;
	  
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
