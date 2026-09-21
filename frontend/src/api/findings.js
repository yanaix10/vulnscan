import { request } from "./client";

export async function getFinding(findingId) {
  return await request(`/api/findings/${findingId}`);
}

export async function getFindingsByScan(scanId) {
  return await request(`/api/findings/scan/${scanId}`);
}
