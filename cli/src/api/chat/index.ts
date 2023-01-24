import createAxiosInstanceWithAuth from "../createAuthInstance";
import {
  ApprovalRequestRequest,
  CreateInboxRequest,
  MessageResponse,
  RequestChallengeRequest,
  RequestChallengeResponse,
} from "./types";
import { AxiosPromise } from "axios";

const authAxios = createAxiosInstanceWithAuth({
  baseURL: process.env.CHAT_API_BASE_URL,
});

export function requestChallenge(
  request: RequestChallengeRequest
): AxiosPromise<RequestChallengeResponse> {
  return authAxios.post("/challenges", request);
}

export function createInbox(request: CreateInboxRequest): AxiosPromise<void> {
  return authAxios.post("/inboxes", request);
}

export function requestApproval(
  request: ApprovalRequestRequest
): AxiosPromise<MessageResponse> {
  return authAxios.post("/inboxes/approval/request", request);
}
