export function getBaseURL() {
  const localURL = "http://localhost:3001/";
  const lilaURL = "http://localhost:3001/";
  const serverMode = localStorage.getItem("serverMode") || "lila";

  return serverMode === "local" ? localURL : lilaURL;
}