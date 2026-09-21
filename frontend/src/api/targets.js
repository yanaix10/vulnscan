import { request } from "./client";

export async function listTargets() {
  return await request("/api/targets/");
}

export async function getTarget(targetId) {
  return await request(`/api/targets/${targetId}`);
}

export async function createTarget({ base_url, notes = "" }) {
  return await request("/api/targets/", {
    method: "POST",
    body: JSON.stringify({ base_url, notes }),
  });
}

export async function deleteTarget(targetId) {
  return await request(`/api/targets/${targetId}`, {
    method: "DELETE",
  });
}
