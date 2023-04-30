import { makeRequest } from "./makeRequest";
export function getUsersWithoutAccess(documentId) {
  return makeRequest(`/users/withoutAccess/${documentId}`);
}
export function getUsersWithAccess(documentId) {
  return makeRequest(`/users/withAccess/${documentId}`);
}
export function addUserToDocument({ documentId, name }) {
  return makeRequest(`/users/addUserToDocument`, {
    method: "POST",
    data: { documentId, name },
  });
}