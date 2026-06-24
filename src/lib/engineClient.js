// Cliente do motor local (THEbox Downloader). Testavel com fetch injetado.
export const ENGINE_URL = "http://127.0.0.1:7421";
export const TOKEN_KEY = "thebox-engine-token";
export const ENGINE_RELEASE_URL =
  "https://github.com/MMD-Marcelo/theBOX/releases/latest/download/thebox-downloader.exe";

// Extrai o token do fragmento da URL (#thebox-token=...). O fragmento nunca e
// enviado a servidor, entao o token so existe no navegador local.
export function parseTokenFromHash(hash) {
  const match = (hash || "").match(/[#&]thebox-token=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Captura o token do hash (auto-handshake) e limpa a URL. Roda 1x no boot.
export function captureTokenFromHash() {
  if (typeof window === "undefined") return null;
  const token = parseTokenFromHash(window.location.hash);
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
    const clean = window.location.href.replace(/[#&]thebox-token=[^&]+/, "").replace(/#$/, "");
    window.history.replaceState(null, "", clean);
  }
  return token;
}

async function request(path, { token, body, fetchImpl = fetch } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  const response = await fetchImpl(`${ENGINE_URL}${path}`, {
    method: body ? "POST" : "GET",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Token velho/incompativel: limpa para forcar novo handshake.
    if (response.status === 401 && typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(TOKEN_KEY);
    }
    throw new Error(data.error || `Erro do motor (HTTP ${response.status})`);
  }
  return data;
}

export function checkHealth({ fetchImpl = fetch } = {}) {
  return request("/health", { fetchImpl });
}

export function analyze(url, token, { fetchImpl = fetch } = {}) {
  return request("/analyze", { token, body: { url }, fetchImpl });
}

export function startDownload({ url, formatId, output }, token, { fetchImpl = fetch } = {}) {
  return request("/download", { token, body: { url, formatId, output }, fetchImpl });
}

export function startDirect(url, token, { fetchImpl = fetch } = {}) {
  return request("/direct", { token, body: { url }, fetchImpl });
}

export async function convertFile(file, { to, bitrate }, token, { fetchImpl = fetch } = {}) {
  const params = new URLSearchParams({ name: file.name, to });
  if (bitrate) params.set("bitrate", String(bitrate));
  const response = await fetchImpl(`${ENGINE_URL}/convert?${params.toString()}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: file,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Erro do motor (HTTP ${response.status})`);
  return data;
}

export async function ocr(fileOrBlob, token, options = {}, { fetchImpl = fetch } = {}) {
  const params = new URLSearchParams();
  if (options.languages) params.set("languages", options.languages);
  if (options.layout) params.set("layout", options.layout);
  if (options.dpi) params.set("dpi", String(options.dpi));
  const query = params.size ? `?${params.toString()}` : "";
  const response = await fetchImpl(`${ENGINE_URL}/ocr${query}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fileOrBlob,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Erro do motor (HTTP ${response.status})`);
  return data;
}

export function progressUrl(jobId, token) {
  return `${ENGINE_URL}/progress/${jobId}?token=${token}`;
}

export function fileUrl(jobId, token) {
  return `${ENGINE_URL}/file/${jobId}?token=${token}`;
}

// Busca o arquivo concluido (fetch envia Origin -> autorizado) e dispara o
// download no navegador via blob. Assim funciona sem token e respeita o
// "salvar como" do navegador.
export async function saveToBrowser(jobId, token) {
  if (typeof document === "undefined") return;
  try {
    const response = await fetch(fileUrl(jobId, token));
    if (!response.ok) throw new Error("Falha ao baixar do motor");
    const blob = await response.blob();
    const cd = response.headers.get("content-disposition") || "";
    const match = cd.match(/filename="?([^";]+)"?/);
    const name = match ? decodeURIComponent(match[1]) : `download-${jobId}`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (error) {
    console.warn("saveToBrowser:", error.message);
  }
}
