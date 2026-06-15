export type ApiErrorBody = {
  statusCode: number;
  code?: string;
  message: string;
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiErrorBody,
  ) {
    super(body.message);
    this.name = "ApiError";
  }
}

export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

export async function expectJson<T>(
  response: Response,
  expectedStatus?: number,
): Promise<T> {
  const body = await parseJsonResponse<T | ApiErrorBody>(response);

  if (expectedStatus !== undefined && response.status !== expectedStatus) {
    throw new ApiError(response.status, body as ApiErrorBody);
  }

  if (!response.ok) {
    throw new ApiError(response.status, body as ApiErrorBody);
  }

  return body as T;
}
