import { config } from "@/config/airdrop";
import { ss58AddressToPublicKeyHex } from "@/utils/format";

export interface UpdateTaskRequest {
	userId: string;
	taskName: string;
	completed: boolean;
	thirdPartyUserId?: string;
	apiKey: string;
}

export interface UpdateTaskResponse {
	success: boolean;
	message?: string;
	data?: unknown;
}

const TASK_UPDATE_ENDPOINT = "/v1/airdrop/tasks/update";

export interface TaskUpdateResult {
	success: boolean;
	message?: string;
}

export async function updateTaskStatus(
	userId: string,
	taskName: string,
	thirdPartyUserId?: string,
): Promise<TaskUpdateResult> {
	try {
		const identifier = userId ? ss58AddressToPublicKeyHex(userId) : userId;
		const requestBody: UpdateTaskRequest = {
			userId: identifier,
			taskName,
			completed: true,
			...(thirdPartyUserId && { thirdPartyUserId }),
			apiKey: config.SENSESPACE_API_KEY,
		};

		console.log(
			`Attempting to update task status for userId: ${userId}, taskName: ${taskName}${thirdPartyUserId ? `, thirdPartyUserId: ${thirdPartyUserId}` : ""}`,
		);

		const response = await fetch(
			`${config.SENSESPACE_ENDPOINT}${TASK_UPDATE_ENDPOINT}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestBody),
			},
		);

		if (!response.ok) {
			const errorText = await response.text();
			const errorMessage = `HTTP ${response.status}: ${response.statusText}. ${errorText}`;
			console.error(
				`Failed to update task status: ${response.status} ${response.statusText}`,
				`Response body: ${errorText}`,
			);
			return { success: false, message: errorMessage };
		}

		const result = (await response.json()) as UpdateTaskResponse;
		console.log("Task status updated successfully:", result);

		// Check if the API response indicates success
		if (result.success === false) {
			console.error("API returned success: false", result);
			return { success: false, message: result.message || "Unknown API error" };
		}

		return { success: true, message: result.message };
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";
		console.error("Error updating task status:", error);
		return { success: false, message: errorMessage };
	}
}
