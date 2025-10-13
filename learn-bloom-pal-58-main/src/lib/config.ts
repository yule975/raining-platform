// 环境配置工具
export const getApiBaseUrl = (): string => {
  // 在开发环境中，使用配置的localhost URL
  if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
  }
  
  // 在生产环境中，API和前端在同一个域名下
  // Vercel会自动处理路由，所以直接使用相对路径
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  // SSR 或其他情况的 fallback
  return ''
}

export const getFullApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl()
  // 确保endpoint以/开头
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${baseUrl}${cleanEndpoint}`
}

// 环境检查工具
export const isDevelopment = (): boolean => {
  return import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development'
}

export const isProduction = (): boolean => {
  return import.meta.env.PROD || import.meta.env.VITE_APP_ENV === 'production'
}
