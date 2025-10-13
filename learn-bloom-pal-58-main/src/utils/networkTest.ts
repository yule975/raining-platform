/**
 * 网络连接测试工具
 * 用于诊断Supabase服务的网络连接问题
 */

export interface NetworkTestResult {
  test: string
  success: boolean
  duration: number
  error?: string
  details?: any
}

export class NetworkTester {
  private supabaseUrl: string
  private supabaseKey: string

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  }

  /**
   * 重试请求机制
   */
  private async retryRequest(
    testName: string,
    requestFn: () => Promise<{ success: boolean; details?: any }>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<NetworkTestResult> {
    const startTime = Date.now()
    let lastError: any = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 ${testName} - 尝试 ${attempt}/${maxRetries}`)
        const result = await requestFn()
        
        if (result.success) {
          console.log(`✅ ${testName} - 成功`)
          return {
            test: testName,
            success: true,
            duration: Date.now() - startTime,
            details: {
              ...result.details,
              attempts: attempt
            }
          }
        } else {
          console.log(`⚠️ ${testName} - 失败，状态: ${result.details?.status}`)
          if (attempt === maxRetries) {
            return {
              test: testName,
              success: false,
              duration: Date.now() - startTime,
              error: `请求失败，状态码: ${result.details?.status}`,
              details: {
                ...result.details,
                attempts: attempt
              }
            }
          }
        }
      } catch (error: any) {
        lastError = error
        let errorMessage = error.message
        
        if (error.name === 'AbortError') {
          errorMessage = `${testName}请求超时`
        } else if (error.message.includes('ERR_ABORTED')) {
          errorMessage = '请求被中止，可能是网络环境限制'
        } else if (error.message.includes('CORS')) {
          errorMessage = 'CORS策略阻止，请检查网络环境'
        }
        
        console.log(`❌ ${testName} - 错误: ${errorMessage}`)
        
        if (attempt === maxRetries) {
          return {
            test: testName,
            success: false,
            duration: Date.now() - startTime,
            error: errorMessage,
            details: {
              attempts: attempt,
              errorType: error.name,
              originalError: error.message
            }
          }
        }
      }
      
      // 指数退避延迟
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1)
        console.log(`⏳ ${testName} - 等待 ${delay}ms 后重试...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    // 这里不应该到达，但为了类型安全
    return {
      test: testName,
      success: false,
      duration: Date.now() - startTime,
      error: lastError?.message || '未知错误'
    }
  }

  /**
   * 测试基本网络连接
   */
  async testBasicConnectivity(): Promise<NetworkTestResult> {
    const startTime = Date.now()
    try {
      // 检查网络状态
      if (!navigator.onLine) {
        return {
          test: '基本网络连接',
          success: false,
          duration: Date.now() - startTime,
          error: '设备处于离线状态',
          details: {
            online: false
          }
        }
      }
      
      // 使用DNS查询测试网络连接（避免被阻止的HTTP请求）
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8秒超时
      
      // 尝试连接到一个可靠的DNS服务
      const response = await fetch('https://1.1.1.1/', {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'no-cors' // 避免CORS问题
      })
      
      clearTimeout(timeoutId)
      
      return {
        test: '基本网络连接',
        success: true,
        duration: Date.now() - startTime,
        details: {
          online: navigator.onLine,
          method: 'DNS服务测试'
        }
      }
    } catch (error: any) {
      const duration = Date.now() - startTime
      let errorMessage = error.message
      
      if (error.name === 'AbortError') {
        errorMessage = '网络请求超时'
      } else if (error.message.includes('ERR_ABORTED')) {
        errorMessage = '网络请求被中止，可能是网络环境限制'
      }
      
      return {
        test: '基本网络连接',
        success: false,
        duration,
        error: errorMessage,
        details: {
          online: navigator.onLine,
          originalError: error.name
        }
      }
    }
  }

  /**
   * 测试Supabase域名解析
   */
  async testSupabaseDNS(): Promise<NetworkTestResult> {
    return this.retryRequest('Supabase域名解析', async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 减少到10秒超时
      
      try {
        // 尝试解析Supabase域名
        const url = new URL(this.supabaseUrl)
        const response = await fetch(`https://dns.google/resolve?name=${url.hostname}&type=A`, {
          signal: controller.signal,
          mode: 'cors'
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          throw new Error(`DNS查询失败: ${response.status}`)
        }
        
        const dnsData = await response.json()
        const success = dnsData.Status === 0 && dnsData.Answer && dnsData.Answer.length > 0
        
        return {
          success,
          details: {
            hostname: url.hostname,
            dnsStatus: dnsData.Status,
            answers: dnsData.Answer || [],
            responseTime: dnsData.TC || 0
          }
        }
      } catch (error: any) {
        clearTimeout(timeoutId)
        
        // 如果DNS查询失败，尝试直接ping域名
        try {
          const pingResponse = await fetch(this.supabaseUrl, {
            method: 'HEAD',
            signal: controller.signal,
            mode: 'no-cors'
          })
          
          return {
            success: true,
            details: {
              method: 'direct_ping',
              note: 'DNS查询失败但直接访问成功'
            }
          }
        } catch (pingError: any) {
          throw new Error(`域名解析和直接访问都失败: ${error.message}`)
        }
      }
    })
  }

  /**
   * 测试SSL证书验证
   */
  async testSSLCertificate(): Promise<NetworkTestResult> {
    return this.retryRequest('SSL证书验证', async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      
      try {
        const url = new URL(this.supabaseUrl)
        const response = await fetch(`https://${url.hostname}`, {
          method: 'HEAD',
          signal: controller.signal,
          mode: 'cors'
        })
        
        clearTimeout(timeoutId)
        
        // 检查响应头中的安全相关信息
        const securityHeaders = {
          'strict-transport-security': response.headers.get('strict-transport-security'),
          'content-security-policy': response.headers.get('content-security-policy'),
          'x-frame-options': response.headers.get('x-frame-options'),
          'x-content-type-options': response.headers.get('x-content-type-options')
        }
        
        return {
          success: true,
          details: {
            hostname: url.hostname,
            protocol: url.protocol,
            securityHeaders,
            certificateValid: true,
            note: 'SSL连接成功建立'
          }
        }
      } catch (error: any) {
        clearTimeout(timeoutId)
        
        // 分析SSL错误类型
        let errorType = 'unknown'
        if (error.message.includes('certificate') || error.message.includes('SSL')) {
          errorType = 'certificate_error'
        } else if (error.message.includes('timeout')) {
          errorType = 'timeout'
        } else if (error.message.includes('network')) {
          errorType = 'network_error'
        }
        
        throw new Error(`SSL证书验证失败 (${errorType}): ${error.message}`)
      }
    })
  }

  /**
   * 测试网络延迟和质量
   */
  async testNetworkLatency(): Promise<NetworkTestResult> {
    return this.retryRequest('网络延迟测试', async () => {
      const measurements: number[] = []
      const testCount = 5
      
      for (let i = 0; i < testCount; i++) {
        const startTime = performance.now()
        
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)
          
          await fetch(this.supabaseUrl, {
            method: 'HEAD',
            signal: controller.signal,
            mode: 'no-cors',
            cache: 'no-cache'
          })
          
          clearTimeout(timeoutId)
          const endTime = performance.now()
          measurements.push(endTime - startTime)
        } catch (error) {
          // 即使请求失败，也记录时间（可能是CORS等非网络问题）
          const endTime = performance.now()
          measurements.push(endTime - startTime)
        }
        
        // 测试间隔
        if (i < testCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
      
      const avgLatency = measurements.reduce((sum, time) => sum + time, 0) / measurements.length
      const minLatency = Math.min(...measurements)
      const maxLatency = Math.max(...measurements)
      const jitter = maxLatency - minLatency
      
      // 评估网络质量
      let quality = 'excellent'
      if (avgLatency > 1000) quality = 'poor'
      else if (avgLatency > 500) quality = 'fair'
      else if (avgLatency > 200) quality = 'good'
      
      return {
        success: true,
        details: {
          measurements,
          avgLatency: Math.round(avgLatency),
          minLatency: Math.round(minLatency),
          maxLatency: Math.round(maxLatency),
          jitter: Math.round(jitter),
          quality,
          testCount
        }
      }
    })
  }

  /**
   * 测试Supabase REST API连接
   */
  async testSupabaseAPI(): Promise<NetworkTestResult> {
    return this.retryRequest('Supabase REST API', async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 减少到15秒超时
      
      const response = await fetch(`${this.supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'cors',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`
        }
      })
      
      clearTimeout(timeoutId)
      
      const success = response.status === 200 || response.status === 404
      return {
        success,
        details: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        }
      }
    })
  }

  /**
   * 测试Supabase Auth API连接
   */
  async testSupabaseAuth(): Promise<NetworkTestResult> {
    return this.retryRequest('Supabase Auth API', async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 减少到15秒超时
      
      const response = await fetch(`${this.supabaseUrl}/auth/v1/settings`, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'cors',
        headers: {
          'apikey': this.supabaseKey
        }
      })
      
      clearTimeout(timeoutId)
      
      const success = response.status === 200
      return {
        success,
        details: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        }
      }
    })
  }

  /**
   * 运行所有网络测试
   */
  async runAllTests(): Promise<NetworkTestResult[]> {
    console.log('🔍 开始网络连接诊断...')
    console.log('🌐 网络环境信息:', this.getNetworkInfo())
    
    const tests = [
      this.testBasicConnectivity(),
      this.testSupabaseDNS(),
      this.testSSLCertificate(),
      this.testNetworkLatency(),
      this.testVPNStatus(),
      this.testSupabaseAPI(),
      this.testSupabaseAuth()
    ]

    const results = await Promise.all(tests)
    
    console.log('📊 网络诊断结果:')
    results.forEach(result => {
      const status = result.success ? '✅' : '❌'
      console.log(`${status} ${result.test}: ${result.duration}ms`)
      if (result.error) {
        console.log(`   错误: ${result.error}`)
        console.log(`   建议: ${this.getErrorSuggestion(result)}`)
      }
      if (result.details) {
        console.log(`   详情:`, result.details)
      }
    })

    // 生成诊断报告
    this.generateDiagnosticReport(results)

    return results
  }

  /**
   * 根据错误类型提供解决建议
   */
  private getErrorSuggestion(result: NetworkTestResult): string {
    if (!result.error) return ''
    
    const error = result.error.toLowerCase()
    
    if (error.includes('超时') || error.includes('timeout')) {
      return '网络连接超时，请检查网络连接或尝试使用VPN'
    }
    
    if (error.includes('cors')) {
      return 'CORS错误，请检查Supabase项目配置中的允许域名设置'
    }
    
    if (error.includes('dns') || error.includes('name resolution')) {
      return 'DNS解析失败，请检查网络设置或尝试更换DNS服务器'
    }
    
    if (error.includes('403') || error.includes('unauthorized')) {
      return '认证失败，请检查Supabase API密钥配置'
    }
    
    if (error.includes('404')) {
      return 'API端点不存在，请检查Supabase URL配置'
    }
    
    if (error.includes('500') || error.includes('internal server')) {
      return 'Supabase服务器错误，请稍后重试或检查服务状态'
    }
    
    if (error.includes('network') || error.includes('fetch')) {
      return '网络请求失败，请检查网络连接、防火墙设置或代理配置'
    }
    
    return '请检查网络连接和Supabase配置，或联系技术支持'
  }

  /**
   * 生成诊断报告
   */
  private generateDiagnosticReport(results: NetworkTestResult[]): void {
    const failedTests = results.filter(r => !r.success)
    const successfulTests = results.filter(r => r.success)
    
    console.log('\n📋 诊断报告:')
    console.log(`✅ 成功测试: ${successfulTests.length}/${results.length}`)
    console.log(`❌ 失败测试: ${failedTests.length}/${results.length}`)
    
    if (failedTests.length > 0) {
      console.log('\n🔧 建议的解决步骤:')
      
      const hasBasicConnectivity = results.find(r => r.test === '基本网络连接')?.success
      const hasSupabaseAccess = results.find(r => r.test === 'Supabase域名解析')?.success
      
      if (!hasBasicConnectivity) {
        console.log('1. 检查网络连接是否正常')
        console.log('2. 检查是否使用了代理或VPN')
        console.log('3. 尝试重启网络连接')
      } else if (!hasSupabaseAccess) {
        console.log('1. 检查Supabase URL配置是否正确')
        console.log('2. 检查防火墙是否阻止了Supabase域名')
        console.log('3. 尝试使用VPN访问')
      } else {
        console.log('1. 检查Supabase API密钥配置')
        console.log('2. 检查Supabase项目状态')
        console.log('3. 查看Supabase控制台的错误日志')
      }
    } else {
      console.log('🎉 所有网络测试通过！')
    }
  }

  /**
   * 获取网络环境信息
   */
  getNetworkInfo() {
    const info = {
      userAgent: navigator.userAgent,
      onLine: navigator.onLine,
      language: navigator.language,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt
      } : null
    }
    
    console.log('🌐 网络环境信息:', info)
    return info
  }

  /**
   * 检测VPN状态和地理位置
   */
  async testVPNStatus(): Promise<NetworkTestResult> {
    return this.retryRequest('VPN状态检测', async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      try {
        // 同时查询多个IP地理位置服务
        const ipServices = [
          { name: 'ipapi.co', url: 'https://ipapi.co/json/' },
          { name: 'ip-api.com', url: 'http://ip-api.com/json/' },
          { name: 'ipinfo.io', url: 'https://ipinfo.io/json' }
        ]
        
        const results = await Promise.allSettled(
          ipServices.map(async service => {
            const response = await fetch(service.url, {
              signal: controller.signal,
              mode: 'cors'
            })
            
            if (!response.ok) {
              throw new Error(`${service.name} 查询失败: ${response.status}`)
            }
            
            const data = await response.json()
            return { service: service.name, data }
          })
        )
        
        clearTimeout(timeoutId)
        
        const successfulResults = results
          .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
          .map(result => result.value)
        
        if (successfulResults.length === 0) {
          throw new Error('所有IP地理位置服务都无法访问')
        }
        
        // 分析结果
        const ipData = successfulResults[0].data
        const allResults = successfulResults.map(r => r.data)
        
        // 检测VPN的多个指标
        const vpnIndicators = {
          // 检查ISP/组织名称
          suspiciousISP: this.checkSuspiciousISP(ipData),
          // 检查国家是否为新加坡（用户说使用新加坡VPN）
          isSingapore: this.checkSingaporeLocation(ipData),
          // 检查多个服务返回的位置是否一致
          locationConsistency: this.checkLocationConsistency(allResults),
          // 检查是否为数据中心IP
          isDataCenter: this.checkDataCenterIP(ipData)
        }
        
        const vpnScore = this.calculateVPNScore(vpnIndicators)
        const isVPNActive = vpnScore > 0.5
        
        return {
          success: true,
          details: {
            ip: ipData.ip || ipData.query,
            country: ipData.country_name || ipData.country,
            city: ipData.city,
            region: ipData.region_name || ipData.regionName,
            isp: ipData.org || ipData.isp,
            timezone: ipData.timezone,
            vpnIndicators,
            vpnScore,
            isVPNActive,
            allResults: successfulResults.map(r => ({
              service: r.service,
              country: r.data.country_name || r.data.country,
              city: r.data.city,
              isp: r.data.org || r.data.isp
            }))
          }
        }
      } catch (error: any) {
        clearTimeout(timeoutId)
        throw new Error(`VPN检测失败: ${error.message}`)
      }
    })
  }
  
  /**
   * 检查可疑的ISP/组织名称
   */
  private checkSuspiciousISP(ipData: any): boolean {
    const org = (ipData.org || ipData.isp || '').toLowerCase()
    const suspiciousKeywords = [
      'vpn', 'proxy', 'datacenter', 'hosting', 'cloud', 'server',
      'digital ocean', 'amazon', 'google cloud', 'microsoft',
      'linode', 'vultr', 'ovh', 'hetzner'
    ]
    
    return suspiciousKeywords.some(keyword => org.includes(keyword))
  }
  
  /**
   * 检查是否为新加坡位置
   */
  private checkSingaporeLocation(ipData: any): boolean {
    const country = (ipData.country_name || ipData.country || '').toLowerCase()
    const countryCode = (ipData.country_code || ipData.countryCode || '').toLowerCase()
    
    return country.includes('singapore') || countryCode === 'sg'
  }
  
  /**
   * 检查多个服务返回的位置一致性
   */
  private checkLocationConsistency(results: any[]): boolean {
    if (results.length < 2) return true
    
    const countries = results.map(r => r.country_name || r.country)
    const uniqueCountries = new Set(countries)
    
    return uniqueCountries.size === 1
  }
  
  /**
   * 检查是否为数据中心IP
   */
  private checkDataCenterIP(ipData: any): boolean {
    const org = (ipData.org || ipData.isp || '').toLowerCase()
    const dataCenterKeywords = [
      'datacenter', 'data center', 'hosting', 'server', 'cloud',
      'infrastructure', 'colocation', 'colo'
    ]
    
    return dataCenterKeywords.some(keyword => org.includes(keyword))
  }
  
  /**
   * 计算VPN可能性评分
   */
  private calculateVPNScore(indicators: any): number {
    let score = 0
    
    if (indicators.suspiciousISP) score += 0.4
    if (indicators.isSingapore) score += 0.3  // 用户说使用新加坡VPN
    if (indicators.isDataCenter) score += 0.2
    if (!indicators.locationConsistency) score += 0.1
    
    return Math.min(score, 1.0)
  }

}

// 导出单例实例
export const networkTester = new NetworkTester()