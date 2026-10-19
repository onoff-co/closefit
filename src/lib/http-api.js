export async function httpRequest(url, method = "GET", body, options = {}) {
  const response = await fetch(url, {
    method,
    credentials: "same-origin",
    headers:
      body !== undefined
        ? { "Content-Type": "application/json" }
        : {
            ...(method !== "GET" ? { "Content-Type": "application/json" } : {}),
          },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: options.signal,
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw Error("로컬 API 응답을 확인해주세요.");
  }
  if (!response.ok) {
    const error = Error(result.error || "요청을 처리할 수 없습니다.");
    error.status = response.status;
    throw error;
  }
  return result;
}
