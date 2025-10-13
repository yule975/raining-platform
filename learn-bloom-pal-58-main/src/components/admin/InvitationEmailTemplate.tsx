import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Copy, Eye } from 'lucide-react';

interface InvitationEmailTemplateProps {
  email: string;
  inviteUrl: string;
  onClose?: () => void;
}

const InvitationEmailTemplate: React.FC<InvitationEmailTemplateProps> = ({
  email,
  inviteUrl,
  onClose
}) => {
  const emailSubject = '欢迎加入训战营学习平台 - 完成账号设置';
  
  const emailContent = `亲爱的用户，

欢迎加入训战营学习平台！

我们已为您创建了学习账号，请点击下方链接完成账号设置：

${inviteUrl}

请注意：
• 此链接仅限您本人使用
• 链接有效期为7天，请及时完成设置
• 如有任何问题，请联系管理员

感谢您的加入，期待与您一起开启学习之旅！

训战营学习平台
${new Date().getFullYear()}`;

  const copyEmailContent = () => {
    const fullEmail = `收件人: ${email}\n主题: ${emailSubject}\n\n${emailContent}`;
    
    navigator.clipboard.writeText(fullEmail).then(() => {
      alert('邮件内容已复制到剪贴板');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = fullEmail;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('邮件内容已复制到剪贴板');
    });
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      alert('邀请链接已复制到剪贴板');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = inviteUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('邀请链接已复制到剪贴板');
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>邀请邮件模板</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email Header */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">收件人:</span>
              <span className="text-blue-600">{email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">主题:</span>
              <span>{emailSubject}</span>
            </div>
          </div>

          {/* Email Content */}
          <div className="border rounded-lg p-4 bg-white">
            <div className="whitespace-pre-line text-sm leading-relaxed">
              {emailContent}
            </div>
          </div>

          {/* Invite Link */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-blue-800">邀请链接:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyInviteLink}
                className="text-blue-600 hover:text-blue-800"
              >
                <Copy className="h-4 w-4 mr-1" />
                复制链接
              </Button>
            </div>
            <div className="text-sm text-blue-600 break-all bg-white p-2 rounded border">
              {inviteUrl}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={copyEmailContent}>
              <Copy className="h-4 w-4 mr-2" />
              复制邮件内容
            </Button>
            <Button onClick={onClose}>
              <Eye className="h-4 w-4 mr-2" />
              知道了
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">使用说明:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 复制邮件内容后，可直接粘贴到邮件客户端发送</li>
              <li>• 也可以单独复制邀请链接，通过其他方式发送给用户</li>
              <li>• 建议通过安全的通信渠道发送邀请链接</li>
              <li>• 提醒用户及时完成账号设置，链接有效期为7天</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvitationEmailTemplate;