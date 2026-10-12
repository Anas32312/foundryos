import { DomainError } from "@/lib/errors";

export function requestId(): string {
  return crypto.randomUUID();
}

export function apiOk(body: Record<string, unknown>, request: string, status = 200): Response {
  return Response.json(
    { ok: true, ...body, requestId: request },
    { status, headers: { "x-request-id": request } },
  );
}

export function apiError(
  status: number,
  code: string,
  message: string,
  request: string,
): Response {
  return Response.json(
    { ok: false, error: { code, message }, requestId: request },
    { status, headers: { "x-request-id": request } },
  );
}

export async function withApi(
  handler: (request: string) => Promise<Response>,
): Promise<Response> {
  const id = requestId();
  try {
    const response = await handler(id);
    response.headers.set("x-request-id", id);
    return response;
  } catch (error) {
    if (error instanceof DomainError) {
      return apiError(error.status, error.code, error.message, id);
    }
    const message = error instanceof Error ? error.message : "The request failed.";
    console.error(id, message.replace(/postgres(?:ql)?:\/\/\S+/gi, "postgres://[redacted]"));
    return apiError(500, "INTERNAL_ERROR", "The request failed.", id);
  }
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
