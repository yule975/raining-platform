// 前端邮件服务 - 使用Supabase Edge Functions或第三方服务

// 邮件内容接口
interface EmailContent {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// 邮件发送结果接口
interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  private supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // 发送邮件 - 通过Supabase Edge Function
  async sendEmail(emailContent: EmailContent): Promise<EmailResult> {
    try {
      console.log('准备发送邮件:', emailContent.to);
      
      // 尝试使用Supabase Edge Function发送邮件
      const response = await fetch(`${this.supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
        },
        body: JSON.stringify(emailContent)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('邮件发送成功:', result);
        return {
          success: true,
          messageId: result.messageId || `msg_${Date.now()}`
        };
      } else {
        // 如果Supabase Edge Function不可用，使用备用方案
        console.log('Supabase邮件服务不可用，使用备用方案');
        return await this.sendEmailViaAlternative(emailContent);
      }
    } catch (error) {
      console.log('Supabase邮件服务连接失败，使用备用方案:', error);
      return await this.sendEmailViaAlternative(emailContent);
    }
  }

  // 备用邮件发送方案 - 使用EmailJS或其他服务
  async sendEmailViaAlternative(emailContent: EmailContent): Promise<EmailResult> {
    try {
      // 检查是否有EmailJS配置
      if (window.emailjs) {
        console.log('使用EmailJS发送邮件');
        
        const result = await window.emailjs.send(
          'service_gmail', // 服务ID
          'template_invitation', // 模板ID
          {
            to_email: emailContent.to,
            subject: emailContent.subject,
            html_content: emailContent.html,
            message: emailContent.text || ''
          },
          'your_public_key' // 公钥
        );
        
        return {
          success: true,
          messageId: result.text
        };
      }
      
      // 如果没有配置第三方服务，使用模拟发送并提供手动方案
      console.log('=== 邮件发送模拟模式 ===');
      console.log('由于未配置邮件服务，邮件内容将显示在控制台');
      console.log('收件人:', emailContent.to);
      console.log('主题:', emailContent.subject);
      console.log('内容:', emailContent.html);
      console.log('========================');
      
      // 在生产环境中，这里应该返回错误
      if (import.meta.env.PROD) {
        return {
          success: false,
          error: '邮件服务未配置，请联系管理员设置SMTP或第三方邮件服务'
        };
      }
      
      // 开发环境中模拟成功
      return {
        success: true,
        messageId: `dev_${Date.now()}`
      };
    } catch (error) {
      console.error('备用邮件发送失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '邮件发送失败'
      };
    }
  }

  // 发送邀请邮件
  async sendInvitationEmail(email: string, inviteUrl: string, userName?: string): Promise<EmailResult> {
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

    return await this.sendEmail({
      to: email,
      subject,
      html,
      text
    });
  }

  // 检查邮件服务状态
  async checkStatus(): Promise<{ available: boolean; config?: any; error?: string }> {
    try {
      console.log('检查邮件服务状态...');
      
      // 检查Supabase Edge Function
      try {
        const response = await fetch(`${this.supabaseUrl}/functions/v1/send-email`, {
          method: 'OPTIONS',
          headers: {
            'Authorization': `Bearer ${this.supabaseAnonKey}`,
          }
        });
        
        if (response.ok) {
          return {
            available: true,
            config: {
              type: 'supabase-edge-function',
              status: 'ready'
            }
          };
        }
      } catch (error) {
        console.log('Supabase Edge Function不可用');
      }
      
      // 检查EmailJS
      if (window.emailjs) {
        return {
          available: true,
          config: {
            type: 'emailjs',
            status: 'ready'
          }
        };
      }
      
      // 开发环境模拟可用
      if (import.meta.env.DEV) {
        return {
          available: true,
          config: {
            type: 'development-simulation',
            status: 'ready'
          }
        };
      }
      
      return {
        available: false,
        error: '未配置邮件服务'
      };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : '服务检查失败'
      };
    }
  }

  // 手动获取邮件内容（用于复制粘贴发送）
  async getEmailContent(email: string, inviteUrl: string, userName?: string): Promise<{ subject: string; html: string; text: string }> {
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
}

// 创建邮件服务实例
export const emailService = new EmailService();
export default EmailService;

// 声明全局EmailJS类型
declare global {
  interface Window {
    emailjs?: any;
  }
}