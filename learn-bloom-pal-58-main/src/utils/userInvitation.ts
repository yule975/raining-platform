// 用户邀请和临时密码生成工具

// 生成随机临时密码
export const generateTemporaryPassword = (length: number = 12): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  // 确保密码包含至少一个大写字母、小写字母、数字和特殊字符
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // 填充剩余长度
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // 打乱密码字符顺序
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// 生成邀请链接
export const generateInvitationLink = (email: string, tempPassword: string): string => {
  const baseUrl = window.location.origin;
  const encodedEmail = encodeURIComponent(email);
  const encodedPassword = encodeURIComponent(tempPassword);
  
  return `${baseUrl}/invitation?email=${encodedEmail}&temp_password=${encodedPassword}`;
};

// 生成邀请码（短码形式）
export const generateInvitationCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

// 用户邀请信息接口
export interface UserInvitation {
  email: string;
  name: string;
  role: 'student' | 'admin';
  department?: string;
  temporaryPassword: string;
  invitationLink: string;
  invitationCode: string;
  createdAt: Date;
  expiresAt: Date;
}

// 创建用户邀请信息
export const createUserInvitation = (
  email: string,
  name: string,
  role: 'student' | 'admin' = 'student',
  department?: string
): UserInvitation => {
  const temporaryPassword = generateTemporaryPassword();
  const invitationLink = generateInvitationLink(email, temporaryPassword);
  const invitationCode = generateInvitationCode();
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000); // 7天后过期
  
  return {
    email,
    name,
    role,
    department,
    temporaryPassword,
    invitationLink,
    invitationCode,
    createdAt,
    expiresAt
  };
};

// 格式化邀请信息为文本
export const formatInvitationText = (invitation: UserInvitation): string => {
  return `
用户邀请信息
==================
姓名: ${invitation.name}
邮箱: ${invitation.email}
角色: ${invitation.role === 'student' ? '学员' : '管理员'}
${invitation.department ? `部门: ${invitation.department}\n` : ''}临时密码: ${invitation.temporaryPassword}
邀请链接: ${invitation.invitationLink}
邀请码: ${invitation.invitationCode}
创建时间: ${invitation.createdAt.toLocaleString('zh-CN')}
过期时间: ${invitation.expiresAt.toLocaleString('zh-CN')}

请在过期前使用临时密码登录系统，首次登录后请及时修改密码。
  `.trim();
};

// 复制到剪贴板
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('复制到剪贴板失败:', error);
    return false;
  }
};