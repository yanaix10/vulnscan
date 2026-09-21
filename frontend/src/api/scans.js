import { request, API_BASE_URL } from "./client";

export async function listScans() {
  return await request("/api/scans/");
}

export async function getScan(scanId) {
  return await request(`/api/scans/${scanId}`);
}

export async function createScan(scanData) {
  return await request("/api/scans/", {
    method: "POST",
    body: JSON.stringify(scanData),
  });
}

export async function getScanFindings(scanId) {
  return await request(`/api/scans/${scanId}/findings`);
}

export function getScanReportDownloadUrl(scanId, format = "html") {
  return `${API_BASE_URL}/api/scans/${scanId}/report?format=${format}`;
}
