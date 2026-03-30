import { apiClient } from "./client";

export interface IssueReportPayload {
  subject: string;
  body: string;
  image_base64?: string;
  image_mime_type?: string;
}

export interface IssueReportResponse {
  message: string;
  id?: string;
}

export async function sendIssueReport(
  payload: IssueReportPayload,
): Promise<IssueReportResponse> {
  const response = await apiClient.post<IssueReportResponse>(
    "/api/email/send-issue-report",
    payload,
  );
  return response.data;
}
