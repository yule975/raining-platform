import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertTriangle, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
  showSecurityTips?: boolean;
  className?: string;
}

export interface PasswordStrengthResult {
  score: number;
  level: 'weak' | 'fair' | 'good' | 'strong';
  checks: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
    noCommon: boolean;
  };
  suggestions: string[];
}

// Common weak passwords to check against
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  '111111', '123123', 'admin', 'root', 'user', 'test', 'guest',
  '000000', '666666', '888888', '999999', '12345678', 'qwerty123'
];

// Calculate password strength
export const calculatePasswordStrength = (password: string): PasswordStrengthResult => {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>\[\]\\;'`~\-_+=]/.test(password),
    noCommon: !COMMON_PASSWORDS.includes(password.toLowerCase())
  };

  let score = 0;
  const suggestions: string[] = [];

  // Basic length check (20 points)
  if (checks.length) {
    score += 20;
  } else {
    suggestions.push('密码至少需要8个字符');
  }

  // Character variety (15 points each)
  if (checks.lowercase) {
    score += 15;
  } else {
    suggestions.push('添加小写字母');
  }

  if (checks.uppercase) {
    score += 15;
  } else {
    suggestions.push('添加大写字母');
  }

  if (checks.number) {
    score += 15;
  } else {
    suggestions.push('添加数字');
  }

  if (checks.special) {
    score += 15;
  } else {
    suggestions.push('添加特殊字符 (!@#$%^&* 等)');
  }

  // Bonus points
  if (password.length >= 12) score += 10; // Long password bonus
  if (checks.noCommon) {
    score += 10; // Not common password bonus
  } else {
    suggestions.push('避免使用常见密码');
  }

  // Determine level
  let level: 'weak' | 'fair' | 'good' | 'strong';
  if (score < 40) level = 'weak';
  else if (score < 70) level = 'fair';
  else if (score < 90) level = 'good';
  else level = 'strong';

  return {
    score: Math.min(score, 100),
    level,
    checks,
    suggestions
  };
};

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showRequirements = true,
  showSecurityTips = false,
  className = ''
}) => {
  const strength = calculatePasswordStrength(password);

  const getLevelConfig = (level: string) => {
    switch (level) {
      case 'weak':
        return {
          text: '弱',
          color: 'text-red-500',
          bgColor: 'bg-red-500',
          description: '密码强度较弱，容易被破解'
        };
      case 'fair':
        return {
          text: '一般',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500',
          description: '密码强度一般，建议进一步加强'
        };
      case 'good':
        return {
          text: '良好',
          color: 'text-blue-500',
          bgColor: 'bg-blue-500',
          description: '密码强度良好'
        };
      case 'strong':
        return {
          text: '很强',
          color: 'text-green-500',
          bgColor: 'bg-green-500',
          description: '密码强度很强，安全性高'
        };
      default:
        return {
          text: '未知',
          color: 'text-gray-500',
          bgColor: 'bg-gray-500',
          description: ''
        };
    }
  };

  const levelConfig = getLevelConfig(strength.level);

  if (!password) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength Indicator */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">密码强度</span>
          <span className={`text-sm font-medium ${levelConfig.color}`}>
            {levelConfig.text} ({strength.score}/100)
          </span>
        </div>
        <Progress value={strength.score} className="h-2" />
        <p className={`text-xs ${levelConfig.color}`}>
          {levelConfig.description}
        </p>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">密码要求</h4>
          <div className="grid grid-cols-1 gap-1 text-xs">
            <div className={`flex items-center space-x-2 ${
              strength.checks.length ? 'text-green-600' : 'text-gray-400'
            }`}>
              {strength.checks.length ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              <span>至少8个字符</span>
            </div>
            <div className={`flex items-center space-x-2 ${
              strength.checks.lowercase ? 'text-green-600' : 'text-gray-400'
            }`}>
              {strength.checks.lowercase ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              <span>包含小写字母 (a-z)</span>
            </div>
            <div className={`flex items-center space-x-2 ${
              strength.checks.uppercase ? 'text-green-600' : 'text-gray-400'
            }`}>
              {strength.checks.uppercase ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              <span>包含大写字母 (A-Z)</span>
            </div>
            <div className={`flex items-center space-x-2 ${
              strength.checks.number ? 'text-green-600' : 'text-gray-400'
            }`}>
              {strength.checks.number ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              <span>包含数字 (0-9)</span>
            </div>
            <div className={`flex items-center space-x-2 ${
              strength.checks.special ? 'text-green-600' : 'text-gray-400'
            }`}>
              {strength.checks.special ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              <span>包含特殊字符 (!@#$%^&* 等)</span>
            </div>
            <div className={`flex items-center space-x-2 ${
              strength.checks.noCommon ? 'text-green-600' : 'text-red-400'
            }`}>
              {strength.checks.noCommon ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              <span>避免常见密码</span>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {strength.suggestions.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">建议改进：</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {strength.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Security Tips */}
      {showSecurityTips && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">安全提示：</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>不要在多个网站使用相同密码</li>
                <li>定期更换密码（建议3-6个月）</li>
                <li>不要在密码中包含个人信息</li>
                <li>考虑使用密码管理器</li>
                <li>启用双因素认证增强安全性</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;