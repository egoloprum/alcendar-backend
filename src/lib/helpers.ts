type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T
  error?: {
    code: string
    message: string
    details?: string
  }
  timestamp: string
}

export const responseSuccess = <T>(
  data?: T,
  message: string = 'Success',
  options: {
    status?: number
  } = {}
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  }

  return new Response(JSON.stringify(response), {
    status: options.status || 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export const responseError = (
  error: {
    code: string
    message: string
    details?: string
  },
  message: string = 'Error occurred',
  options: {
    status?: number
  } = {}
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    error,
    timestamp: new Date().toISOString(),
  }

  return new Response(JSON.stringify(response), {
    status: options.status || 400,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
