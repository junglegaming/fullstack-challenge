export class ApiError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_KONG_URL}${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    }
  )

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(data?.message || "Erro inesperado", response.status)
  }

  return data as T
}
