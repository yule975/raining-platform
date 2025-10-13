// 重新发送邀请邮件脚本
// 用于测试和修复邮件发送功能

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
import dotenv from 'dotenv';
dotenv.config();

// 从环境变量或配置文件读取Supabase配置
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

console.log('🔧 配置检查:');
console.log('Supabase URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? '已设置' : '未设置');
console.log('Service Key:', supabaseServiceKey ? '已设置' : '未设置');

// 创建Supabase客户端（使用service role key以获得管理员权限）
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 邮件发送功能
class EmailSender {
  constructor() {
    this.supabaseUrl = supabaseUrl;
    this.serviceKey = supabaseServiceKey;
  }

  // 生成邀请链接
  generateInvitationLink(email, userName) {
    const inviteToken = Buffer.from(`${email}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`).toString('base64');
    return `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invitation?token=${inviteToken}&email=${encodeURIComponent(email)}`;
  }

  // 创建邮件内容
  createEmailContent(email, inviteUrl, userName) {
    const subject = '欢迎加入训战营学习平台 - 完成账号设置';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px; background: #f9fafb; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          .url-box { word-break: break-all; background: white; padding: 15px; border-radius: 4px; border: 1px solid #e5e7eb; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 训战营学习平台</h1>
          </div>
          <div class="content">
            <h2>欢迎加入我们！</h2>
            <p>亲爱的${userName || '用户'}，</p>
            <p>您已被邀请加入训战营学习平台。请点击下面的链接完成账号设置：</p>
            <p style="text-align: center;">
              <a href="${inviteUrl}" class="button">🚀 完成账号设置</a>
            </p>
            <p>或者复制以下链接到浏览器中打开：</p>
            <div class="url-box">${inviteUrl}</div>
            <p><strong>⚠️ 注意：</strong>此邀请链接将在7天后过期，请尽快完成设置。</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p>完成设置后，您将能够：</p>
            <ul>
              <li>📚 访问所有课程内容</li>
              <li>💬 参与讨论和交流</li>
              <li>📊 查看学习进度</li>
              <li>🏆 获得学习证书</li>
            </ul>
          </div>
          <div class="footer">
            <p>此邮件由系统自动发送，请勿回复。</p>
            <p>© 2024 训战营学习平台. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      欢迎加入训战营学习平台！
      
      亲爱的${userName || '用户'}，
      
      您已被邀请加入训战营学习平台。请访问以下链接完成账号设置：
      ${inviteUrl}
      
      注意：此邀请链接将在7天后过期，请尽快完成设置。
      
      完成设置后，您将能够：
      - 访问所有课程内容
      - 参与讨论和交流
      - 查看学习进度
      - 获得学习证书
      
      此邮件由系统自动发送，请勿回复。
      © 2024 训战营学习平台. All rights reserved.
    `;

    return { subject, html, text };
  }

  // 尝试通过Supabase Edge Function发送邮件
  async sendViaSupabaseEdgeFunction(emailContent) {
    try {
      console.log('🔄 尝试通过Supabase Edge Function发送邮件...');
      
      const response = await fetch(`${this.supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.serviceKey}`,
        },
        body: JSON.stringify(emailContent)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Supabase Edge Function邮件发送成功:', result);
        return { success: true, method: 'supabase-edge-function', result };
      } else {
        const error = await response.text();
        console.log('❌ Supabase Edge Function不可用:', error);
        return { success: false, error: `HTTP ${response.status}: ${error}` };
      }
    } catch (error) {
      console.log('❌ Supabase Edge Function连接失败:', error.message);
      return { success: false, error: error.message };
    }
  }

  // 检查Supabase Auth邮件配置
  async checkSupabaseAuthConfig() {
    try {
      console.log('🔍 检查Supabase Auth邮件配置...');
      
      // 尝试获取项目设置
      const { data, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        console.log('❌ 无法访问Supabase Auth管理API:', error.message);
        return { configured: false, error: error.message };
      }
      
      console.log('✅ Supabase Auth API可访问');
      
      // 检查是否有SMTP配置（通过尝试发送测试邮件）
      try {
        const testResult = await supabase.auth.resetPasswordForEmail('test@example.com', {
          redirectTo: 'http://localhost:3000/reset-password'
        });
        
        console.log('📧 Supabase Auth邮件功能测试结果:', testResult);
        return { configured: true, method: 'supabase-auth' };
      } catch (authError) {
        console.log('⚠️ Supabase Auth邮件功能可能未配置:', authError.message);
        return { configured: false, error: 'Auth邮件功能未配置' };
      }
    } catch (error) {
      console.log('❌ 检查Supabase配置时出错:', error.message);
      return { configured: false, error: error.message };
    }
  }

  // 保存邮件内容到文件（手动发送备用方案）
  async saveEmailToFile(email, emailContent, inviteUrl) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `invitation_${email.replace('@', '_at_')}_${timestamp}.html`;
    const filepath = path.join(__dirname, 'email_backups', filename);
    
    // 确保目录存在
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const fileContent = `
<!-- 邀请邮件备份 -->
<!-- 收件人: ${email} -->
<!-- 生成时间: ${new Date().toLocaleString()} -->
<!-- 邀请链接: ${inviteUrl} -->

${emailContent.html}

<!-- 文本版本 -->
<!--
${emailContent.text}
-->
    `;
    
    fs.writeFileSync(filepath, fileContent, 'utf8');
    console.log(`📁 邮件内容已保存到: ${filepath}`);
    
    return filepath;
  }

  // 主发送方法
  async sendInvitationEmail(email, userName) {
    console.log(`\n🚀 开始为 ${email} (${userName}) 发送邀请邮件...`);
    
    // 生成邀请链接
    const inviteUrl = this.generateInvitationLink(email, userName);
    console.log(`🔗 邀请链接: ${inviteUrl}`);
    
    // 创建邮件内容
    const emailContent = this.createEmailContent(email, inviteUrl, userName);
    
    const results = [];
    
    // 1. 尝试Supabase Edge Function
    const edgeFunctionResult = await this.sendViaSupabaseEdgeFunction(emailContent);
    results.push({ method: 'Supabase Edge Function', ...edgeFunctionResult });
    
    if (edgeFunctionResult.success) {
      console.log('✅ 邮件发送成功！');
      return { success: true, method: 'supabase-edge-function', inviteUrl, results };
    }
    
    // 2. 检查Supabase Auth配置
    const authConfig = await this.checkSupabaseAuthConfig();
    results.push({ method: 'Supabase Auth Check', ...authConfig });
    
    // 3. 保存邮件到文件作为备用方案
    try {
      const filepath = await this.saveEmailToFile(email, emailContent, inviteUrl);
      results.push({ method: 'File Backup', success: true, filepath });
      
      console.log('\n📋 邮件发送总结:');
      console.log('==================');
      results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.method}: ${result.success ? '✅ 成功' : '❌ 失败'}`);
        if (result.error) console.log(`   错误: ${result.error}`);
        if (result.filepath) console.log(`   文件: ${result.filepath}`);
      });
      
      console.log('\n🔧 解决方案建议:');
      console.log('1. 配置Supabase Edge Function用于邮件发送');
      console.log('2. 在Supabase项目设置中配置SMTP');
      console.log('3. 使用保存的HTML文件手动发送邮件');
      console.log(`4. 直接提供邀请链接: ${inviteUrl}`);
      
      return { 
        success: false, 
        method: 'file-backup', 
        inviteUrl, 
        filepath,
        results,
        manualInstructions: {
          email,
          subject: emailContent.subject,
          htmlFile: filepath,
          inviteUrl
        }
      };
    } catch (error) {
      console.error('❌ 保存邮件文件失败:', error.message);
      results.push({ method: 'File Backup', success: false, error: error.message });
      
      return { success: false, error: '所有发送方法都失败了', results };
    }
  }
}

// 主执行函数
async function main() {
  console.log('🚀 开始重新发送邀请邮件...');
  
  try {
    const emailSender = new EmailSender();
    
    // 目标学员信息
    const studentInfo = {
      email: 'xiewenxuan001@51Talk.com',
      name: 'wenxuan',
      role: '学员'
    };
    
    console.log('👤 目标学员信息:', studentInfo);
    
    // 重新发送邮件
    console.log(`📧 正在发送邮件给 ${studentInfo.name} (${studentInfo.email})...`);
    const result = await emailSender.sendInvitationEmail(
      studentInfo.email,
      studentInfo.name
    );
    
    console.log('📬 发送结果:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ 邮件发送成功!');
      console.log('发送方式:', result.method);
      if (result.inviteUrl) {
        console.log('邀请链接:', result.inviteUrl);
      }
    } else {
      console.log('❌ 邮件发送失败:', result.error);
      if (result.manualInstructions) {
        console.log('\n📋 手动发送说明:');
        console.log(`收件人: ${result.manualInstructions.email}`);
        console.log(`主题: ${result.manualInstructions.subject}`);
        console.log(`HTML文件: ${result.manualInstructions.htmlFile}`);
        console.log(`邀请链接: ${result.manualInstructions.inviteUrl}`);
      }
    }
    
  } catch (error) {
    console.error('💥 发送过程中出现错误:', error.message);
    console.error('详细错误:', error);
    console.error('错误堆栈:', error.stack);
  }
  
  console.log('🏁 脚本执行完成');
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith('resend_invitation.js')) {
  console.log('🎯 检测到直接运行脚本，开始执行...');
  main().catch(console.error);
} else {
  console.log('📦 脚本作为模块被导入');
}

export { EmailSender };