// 诊断网络连接问题
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import https from 'https';
import dns from 'dns';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 开始诊断网络连接问题...\n');

// 1. 检查环境变量
console.log('1. 📋 检查环境变量:');
console.log(`   VITE_SUPABASE_URL: ${supabaseUrl ? '✅ 已设置' : '❌ 未设置'}`);
console.log(`   VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ 已设置' : '❌ 未设置'}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ 已设置' : '❌ 未设置'}`);

if (supabaseUrl) {
  console.log(`   Supabase URL: ${supabaseUrl}`);
}

// 2. DNS解析测试
function testDNS() {
  return new Promise((resolve) => {
    console.log('\n2. 🌐 DNS解析测试:');
    
    if (!supabaseUrl) {
      console.log('   ❌ 无法测试，Supabase URL未设置');
      resolve(false);
      return;
    }
    
    try {
      const hostname = new URL(supabaseUrl).hostname;
      console.log(`   测试域名: ${hostname}`);
      
      dns.lookup(hostname, (err, address) => {
        if (err) {
          console.log(`   ❌ DNS解析失败: ${err.message}`);
          resolve(false);
        } else {
          console.log(`   ✅ DNS解析成功: ${address}`);
          resolve(true);
        }
      });
    } catch (error) {
      console.log(`   ❌ URL解析失败: ${error.message}`);
      resolve(false);
    }
  });
}

// 3. HTTPS连接测试
function testHTTPS() {
  return new Promise((resolve) => {
    console.log('\n3. 🔒 HTTPS连接测试:');
    
    if (!supabaseUrl) {
      console.log('   ❌ 无法测试，Supabase URL未设置');
      resolve(false);
      return;
    }
    
    try {
      const url = new URL(supabaseUrl);
      
      const options = {
        hostname: url.hostname,
        port: 443,
        path: '/rest/v1/',
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        timeout: 10000
      };
      
      const req = https.request(options, (res) => {
        console.log(`   ✅ HTTPS连接成功，状态码: ${res.statusCode}`);
        console.log(`   响应头: ${JSON.stringify(res.headers, null, 2)}`);
        resolve(true);
      });
      
      req.on('error', (error) => {
        console.log(`   ❌ HTTPS连接失败: ${error.message}`);
        if (error.code === 'ENOTFOUND') {
          console.log('   💡 提示: 这可能是DNS解析问题或网络连接问题');
        } else if (error.code === 'ECONNREFUSED') {
          console.log('   💡 提示: 连接被拒绝，可能是防火墙或VPN问题');
        } else if (error.code === 'ETIMEDOUT') {
          console.log('   💡 提示: 连接超时，请检查网络连接');
        }
        resolve(false);
      });
      
      req.on('timeout', () => {
        console.log('   ❌ 请求超时');
        req.destroy();
        resolve(false);
      });
      
      req.end();
    } catch (error) {
      console.log(`   ❌ 请求创建失败: ${error.message}`);
      resolve(false);
    }
  });
}

// 4. Supabase客户端测试
async function testSupabaseClient() {
  console.log('\n4. 🎯 Supabase客户端测试:');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('   ❌ 无法测试，缺少必要的环境变量');
    return false;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('   ✅ Supabase客户端创建成功');
    
    // 测试简单查询
    console.log('   🔄 测试数据库连接...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log(`   ❌ 数据库连接失败: ${error.message}`);
      console.log(`   错误详情: ${JSON.stringify(error, null, 2)}`);
      return false;
    } else {
      console.log('   ✅ 数据库连接成功');
      return true;
    }
  } catch (error) {
    console.log(`   ❌ Supabase客户端测试失败: ${error.message}`);
    return false;
  }
}

// 5. 网络诊断
function networkDiagnostics() {
  console.log('\n5. 🔧 网络诊断建议:');
  
  console.log('   📋 请检查以下项目:');
  console.log('   1. VPN设置是否正确');
  console.log('   2. 防火墙是否阻止了连接');
  console.log('   3. 代理设置是否影响连接');
  console.log('   4. 网络连接是否稳定');
  console.log('   5. Supabase服务是否正常');
  
  console.log('\n   🛠️  故障排除步骤:');
  console.log('   1. 尝试关闭VPN后测试');
  console.log('   2. 尝试使用手机热点');
  console.log('   3. 清除DNS缓存');
  console.log('   4. 重启网络适配器');
  console.log('   5. 检查Supabase控制台状态');
}

// 主诊断流程
async function runDiagnostics() {
  try {
    const dnsResult = await testDNS();
    const httpsResult = await testHTTPS();
    const supabaseResult = await testSupabaseClient();
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 诊断结果汇总:');
    console.log('='.repeat(50));
    console.log(`DNS解析: ${dnsResult ? '✅ 正常' : '❌ 失败'}`);
    console.log(`HTTPS连接: ${httpsResult ? '✅ 正常' : '❌ 失败'}`);
    console.log(`Supabase连接: ${supabaseResult ? '✅ 正常' : '❌ 失败'}`);
    
    if (!dnsResult || !httpsResult || !supabaseResult) {
      console.log('\n❌ 检测到网络连接问题');
      networkDiagnostics();
      
      console.log('\n🔧 立即解决方案:');
      if (!dnsResult) {
        console.log('   • DNS问题: 尝试更换DNS服务器 (8.8.8.8, 1.1.1.1)');
      }
      if (!httpsResult) {
        console.log('   • HTTPS问题: 检查防火墙和VPN设置');
      }
      if (!supabaseResult) {
        console.log('   • Supabase问题: 检查API密钥和权限设置');
      }
    } else {
      console.log('\n✅ 网络连接正常，问题可能在其他地方');
    }
    
  } catch (error) {
    console.error('❌ 诊断过程中发生错误:', error.message);
  }
}

// 运行诊断
runDiagnostics();
