// 网络连接测试脚本 - 诊断Supabase连接问题
const https = require('https');
const dns = require('dns');
const { performance } = require('perf_hooks');

// Supabase配置
const SUPABASE_URL = 'https://upwrgkhpuwxkbwndxxxs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwd3Jna2hwdXd4a2J3bmR4eHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MzU4NzgsImV4cCI6MjA3MjMxMTg3OH0.NyJFFUG5B72cw99TAkmJMifxCM9tAKVN8OrCTBuHwAo';

console.log('🔍 开始网络连接诊断...');
console.log('=' .repeat(50));

// 1. DNS解析测试
function testDNS() {
  return new Promise((resolve) => {
    console.log('\n📡 测试DNS解析...');
    const hostname = 'upwrgkhpuwxkbwndxxxs.supabase.co';
    const startTime = performance.now();
    
    dns.lookup(hostname, (err, address, family) => {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      if (err) {
        console.log('❌ DNS解析失败:', err.message);
        console.log('💡 可能原因: DNS服务器问题或域名被屏蔽');
        resolve(false);
      } else {
        console.log(`✅ DNS解析成功: ${hostname} -> ${address} (IPv${family})`);
        console.log(`⏱️  解析耗时: ${duration}ms`);
        resolve(true);
      }
    });
  });
}

// 2. HTTPS连接测试
function testHTTPS() {
  return new Promise((resolve) => {
    console.log('\n🔐 测试HTTPS连接...');
    const startTime = performance.now();
    
    const req = https.get(SUPABASE_URL + '/rest/v1/', {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      timeout: 10000
    }, (res) => {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      console.log(`✅ HTTPS连接成功`);
      console.log(`📊 状态码: ${res.statusCode}`);
      console.log(`⏱️  连接耗时: ${duration}ms`);
      console.log(`🌐 服务器: ${res.headers.server || '未知'}`);
      
      if (duration > 5000) {
        console.log('⚠️  连接较慢，可能存在网络问题');
      }
      
      resolve(true);
    });
    
    req.on('error', (err) => {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      console.log('❌ HTTPS连接失败:', err.message);
      console.log(`⏱️  失败耗时: ${duration}ms`);
      
      if (err.code === 'ENOTFOUND') {
        console.log('💡 可能原因: DNS解析失败或网络不可达');
      } else if (err.code === 'ETIMEDOUT') {
        console.log('💡 可能原因: 网络超时，可能被防火墙阻止');
      } else if (err.code === 'ECONNREFUSED') {
        console.log('💡 可能原因: 连接被拒绝，可能是代理或防火墙问题');
      }
      
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log('❌ 连接超时 (10秒)');
      console.log('💡 可能原因: 网络延迟过高或被防火墙阻止');
      req.destroy();
      resolve(false);
    });
  });
}

// 3. Supabase Auth API测试
function testSupabaseAuth() {
  return new Promise((resolve) => {
    console.log('\n🔑 测试Supabase Auth API...');
    const startTime = performance.now();
    
    const postData = JSON.stringify({
      email: 'test@example.com',
      password: 'testpassword123'
    });
    
    const options = {
      hostname: 'upwrgkhpuwxkbwndxxxs.supabase.co',
      port: 443,
      path: '/auth/v1/token?grant_type=password',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      timeout: 10000
    };
    
    const req = https.request(options, (res) => {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 Auth API响应状态: ${res.statusCode}`);
        console.log(`⏱️  API调用耗时: ${duration}ms`);
        
        if (res.statusCode === 400) {
          console.log('✅ Auth API可访问 (400错误是预期的，因为使用了测试凭据)');
          resolve(true);
        } else if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ Auth API正常响应');
          resolve(true);
        } else {
          console.log('⚠️  Auth API响应异常');
          console.log('📄 响应内容:', data.substring(0, 200));
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      console.log('❌ Auth API调用失败:', err.message);
      console.log(`⏱️  失败耗时: ${duration}ms`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log('❌ Auth API调用超时');
      req.destroy();
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

// 4. 网络环境检测
function detectNetworkEnvironment() {
  console.log('\n🌍 检测网络环境...');
  
  // 检测代理设置
  const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
  const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  
  if (httpProxy || httpsProxy) {
    console.log('🔄 检测到代理设置:');
    if (httpProxy) console.log(`   HTTP代理: ${httpProxy}`);
    if (httpsProxy) console.log(`   HTTPS代理: ${httpsProxy}`);
  } else {
    console.log('🔄 未检测到代理设置');
  }
  
  // 检测地理位置（通过时区推测）
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  console.log(`🌏 系统时区: ${timezone}`);
  
  if (timezone.includes('Asia/Shanghai') || timezone.includes('Asia/Beijing')) {
    console.log('📍 检测到中国大陆网络环境');
    console.log('💡 建议: 如果连接失败，可能需要使用VPN或代理');
  }
}

// 5. 提供解决方案
function provideSolutions(results) {
  console.log('\n' + '=' .repeat(50));
  console.log('🔧 问题诊断和解决方案:');
  console.log('=' .repeat(50));
  
  const [dnsOk, httpsOk, authOk] = results;
  
  if (!dnsOk) {
    console.log('\n❌ DNS解析问题:');
    console.log('   1. 尝试更换DNS服务器 (8.8.8.8, 1.1.1.1)');
    console.log('   2. 检查网络连接是否正常');
    console.log('   3. 联系网络管理员检查DNS设置');
  }
  
  if (!httpsOk) {
    console.log('\n❌ HTTPS连接问题:');
    console.log('   1. 检查防火墙设置，确保允许HTTPS连接');
    console.log('   2. 尝试使用VPN连接');
    console.log('   3. 检查是否有企业代理阻止连接');
    console.log('   4. 尝试使用手机热点测试网络');
  }
  
  if (!authOk && httpsOk) {
    console.log('\n❌ Auth API问题:');
    console.log('   1. 检查Supabase项目状态');
    console.log('   2. 验证API密钥是否正确');
    console.log('   3. 检查Supabase服务是否正常');
  }
  
  if (dnsOk && httpsOk && authOk) {
    console.log('\n✅ 网络连接正常!');
    console.log('   登录问题可能不是网络原因，建议检查:');
    console.log('   1. 用户凭据是否正确');
    console.log('   2. Supabase Auth配置');
    console.log('   3. 应用程序代码逻辑');
  } else {
    console.log('\n🌐 中国大陆用户建议:');
    console.log('   1. 使用稳定的VPN服务');
    console.log('   2. 尝试不同的网络环境 (移动网络/WiFi)');
    console.log('   3. 考虑使用国内云服务替代方案');
    console.log('   4. 联系开发者获取技术支持');
  }
}

// 主函数
async function runNetworkTest() {
  try {
    detectNetworkEnvironment();
    
    const dnsResult = await testDNS();
    const httpsResult = await testHTTPS();
    const authResult = await testSupabaseAuth();
    
    provideSolutions([dnsResult, httpsResult, authResult]);
    
    console.log('\n' + '=' .repeat(50));
    console.log('🏁 网络诊断完成');
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
runNetworkTest();