import { UserService } from './supabaseService';
import { generateTempPassword, generateInvitationLink, createInvitationInfo } from './userInvitation';

// 批量用户数据接口
export interface BatchUserData {
  email: string;
  name: string;
  role?: 'student' | 'admin';
  department?: string;
  notes?: string;
}

// 批量导入结果接口
export interface BatchImportResult {
  success: BatchUserData[];
  failed: {
    user: BatchUserData;
    error: string;
  }[];
  invitations: {
    user: BatchUserData;
    tempPassword: string;
    invitationLink: string;
    invitationCode: string;
  }[];
}

// 解析CSV文件
export const parseCSVFile = (file: File): Promise<BatchUserData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          throw new Error('CSV文件至少需要包含标题行和一行数据');
        }
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const users: BatchUserData[] = [];
        
        // 验证必需的列
        const requiredColumns = ['email', 'name'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        if (missingColumns.length > 0) {
          throw new Error(`CSV文件缺少必需的列: ${missingColumns.join(', ')}`);
        }
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          
          if (values.length !== headers.length) {
            console.warn(`第${i + 1}行数据列数不匹配，跳过`);
            continue;
          }
          
          const user: BatchUserData = {
            email: '',
            name: ''
          };
          
          headers.forEach((header, index) => {
            const value = values[index];
            switch (header.toLowerCase()) {
              case 'email':
                user.email = value;
                break;
              case 'name':
                user.name = value;
                break;
              case 'role':
                user.role = value === 'admin' ? 'admin' : 'student';
                break;
              case 'department':
                user.department = value;
                break;
              case 'notes':
                user.notes = value;
                break;
            }
          });
          
          // 验证必需字段
          if (!user.email || !user.name) {
            console.warn(`第${i + 1}行数据缺少必需字段，跳过`);
            continue;
          }
          
          // 验证邮箱格式
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(user.email)) {
            console.warn(`第${i + 1}行邮箱格式无效，跳过`);
            continue;
          }
          
          users.push(user);
        }
        
        resolve(users);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsText(file, 'UTF-8');
  });
};

// 解析Excel文件（简化版，实际项目中可能需要使用xlsx库）
export const parseExcelFile = (file: File): Promise<BatchUserData[]> => {
  return new Promise((resolve, reject) => {
    reject(new Error('Excel文件解析功能需要额外的库支持，请使用CSV格式'));
  });
};

// 批量创建用户
export const batchCreateUsers = async (
  users: BatchUserData[],
  generateInvitations: boolean = true
): Promise<BatchImportResult> => {
  const result: BatchImportResult = {
    success: [],
    failed: [],
    invitations: []
  };
  
  for (const user of users) {
    try {
      // 创建用户
      await UserService.addAuthorizedUser(
        user.email,
        user.name,
        user.role || 'student',
        user.department,
        user.notes
      );
      
      result.success.push(user);
      
      // 生成邀请信息
      if (generateInvitations) {
        const tempPassword = generateTempPassword();
        const invitationLink = generateInvitationLink(user.email, tempPassword);
        const invitationCode = generateInvitationLink(user.email, tempPassword).split('code=')[1] || '';
        
        result.invitations.push({
          user,
          tempPassword,
          invitationLink,
          invitationCode
        });
      }
      
    } catch (error) {
      result.failed.push({
        user,
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }
  
  return result;
};

// 生成批量邀请文本
export const generateBatchInvitationText = (invitations: BatchImportResult['invitations']): string => {
  let text = '=== 批量用户邀请信息 ===\n\n';
  
  invitations.forEach((invitation, index) => {
    text += `${index + 1}. ${invitation.user.name} (${invitation.user.email})\n`;
    text += `   临时密码: ${invitation.tempPassword}\n`;
    text += `   邀请链接: ${invitation.invitationLink}\n`;
    text += `   部门: ${invitation.user.department || '未指定'}\n`;
    text += `   角色: ${invitation.user.role === 'admin' ? '管理员' : '学员'}\n`;
    text += '\n';
  });
  
  text += '=== 使用说明 ===\n';
  text += '1. 将邀请链接发送给对应用户\n';
  text += '2. 用户点击链接后使用临时密码登录\n';
  text += '3. 首次登录后用户需要修改密码\n';
  
  return text;
};

// 下载批量邀请信息
export const downloadBatchInvitations = (invitations: BatchImportResult['invitations'], filename: string = 'batch_invitations.txt') => {
  const text = generateBatchInvitationText(invitations);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// 生成CSV模板
export const generateCSVTemplate = (): string => {
  const headers = ['email', 'name', 'role', 'department', 'notes'];
  const sampleData = [
    'user1@example.com,张三,student,技术部,新员工',
    'user2@example.com,李四,admin,产品部,部门主管',
    'user3@example.com,王五,student,运营部,实习生'
  ];
  
  return [headers.join(','), ...sampleData].join('\n');
};

// 下载CSV模板
export const downloadCSVTemplate = (filename: string = 'user_import_template.csv') => {
  const csvContent = generateCSVTemplate();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};