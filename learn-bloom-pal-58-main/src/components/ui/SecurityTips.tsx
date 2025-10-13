import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Lock, 
  Eye, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Clock,
  Key,
  Globe
} from 'lucide-react';

interface SecurityTipsProps {
  variant?: 'compact' | 'detailed';
  showPasswordTips?: boolean;
  showAccountTips?: boolean;
  showGeneralTips?: boolean;
  className?: string;
}

const SecurityTips: React.FC<SecurityTipsProps> = ({
  variant = 'detailed',
  showPasswordTips = true,
  showAccountTips = true,
  showGeneralTips = true,
  className = ''
}) => {
  const passwordTips = [
    {
      icon: <Key className="h-4 w-4" />,
      title: '使用强密码',
      description: '密码应包含大小写字母、数字和特殊字符，长度至少8位',
      level: 'high'
    },
    {
      icon: <Globe className="h-4 w-4" />,
      title: '避免重复使用',
      description: '不要在多个网站或服务中使用相同的密码',
      level: 'high'
    },
    {
      icon: <Clock className="h-4 w-4" />,
      title: '定期更换',
      description: '建议每3-6个月更换一次密码',
      level: 'medium'
    },
    {
      icon: <Eye className="h-4 w-4" />,
      title: '保护隐私',
      description: '不要在公共场所输入密码，注意防范肩窥',
      level: 'medium'
    }
  ];

  const accountTips = [
    {
      icon: <Smartphone className="h-4 w-4" />,
      title: '启用双因素认证',
      description: '为账号添加额外的安全层保护',
      level: 'high'
    },
    {
      icon: <Shield className="h-4 w-4" />,
      title: '监控登录活动',
      description: '定期检查账号的登录记录和异常活动',
      level: 'medium'
    },
    {
      icon: <Lock className="h-4 w-4" />,
      title: '及时退出登录',
      description: '在公共设备上使用后务必退出登录',
      level: 'medium'
    }
  ];

  const generalTips = [
    {
      icon: <AlertTriangle className="h-4 w-4" />,
      title: '识别钓鱼攻击',
      description: '谨慎点击可疑链接，验证网站真实性',
      level: 'high'
    },
    {
      icon: <Info className="h-4 w-4" />,
      title: '保持软件更新',
      description: '及时更新浏览器和安全软件',
      level: 'medium'
    }
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'high':
        return '重要';
      case 'medium':
        return '建议';
      case 'low':
        return '可选';
      default:
        return '提示';
    }
  };

  if (variant === 'compact') {
    return (
      <Alert className={className}>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">安全提示</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>使用包含大小写字母、数字和特殊字符的强密码</li>
              <li>不要在多个网站使用相同密码</li>
              <li>启用双因素认证增强账号安全</li>
              <li>定期检查账号登录活动</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {showPasswordTips && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              密码安全
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {passwordTips.map((tip, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="flex-shrink-0 p-2 bg-white rounded-lg">
                    {tip.icon}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{tip.title}</h4>
                      <Badge variant="outline" className={getLevelColor(tip.level)}>
                        {getLevelText(tip.level)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{tip.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showAccountTips && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              账号安全
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {accountTips.map((tip, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="flex-shrink-0 p-2 bg-white rounded-lg">
                    {tip.icon}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{tip.title}</h4>
                      <Badge variant="outline" className={getLevelColor(tip.level)}>
                        {getLevelText(tip.level)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{tip.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showGeneralTips && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              一般安全建议
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generalTips.map((tip, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="flex-shrink-0 p-2 bg-white rounded-lg">
                    {tip.icon}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{tip.title}</h4>
                      <Badge variant="outline" className={getLevelColor(tip.level)}>
                        {getLevelText(tip.level)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{tip.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 快速安全检查清单 */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">安全检查清单</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>使用强密码</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>启用双因素认证</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>定期更换密码</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>监控登录活动</span>
              </div>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default SecurityTips;