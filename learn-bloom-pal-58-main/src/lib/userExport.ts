import * as XLSX from 'xlsx';
import { generateTempPassword, generateInvitationLink, createInvitationInfo, formatInvitationText } from './userInvitation';

export interface UserExportData {
  id?: number;
  name: string;
  email: string;
  role: string;
  department?: string;
  notes?: string;
  tempPassword?: string;
  invitationLink?: string;
  status?: string;
  addedAt?: string;
}

export interface ExportOptions {
  includePasswords: boolean;
  includeInvitationLinks: boolean;
  format: 'excel' | 'csv' | 'json';
  filename?: string;
}

// 生成用户导出数据
export const generateUserExportData = (users: UserExportData[], options: ExportOptions): UserExportData[] => {
  return users.map(user => {
    const exportUser: UserExportData = {
      ...user
    };

    // 如果需要包含密码，生成临时密码
    if (options.includePasswords) {
      exportUser.tempPassword = generateTempPassword();
    }

    // 如果需要包含邀请链接，生成邀请链接
    if (options.includeInvitationLinks && exportUser.tempPassword) {
      exportUser.invitationLink = generateInvitationLink(user.email, exportUser.tempPassword);
    }

    return exportUser;
  });
};

// 导出为Excel格式
export const exportToExcel = (users: UserExportData[], options: ExportOptions): void => {
  const exportData = generateUserExportData(users, options);
  
  // 创建工作表数据
  const worksheetData = exportData.map(user => ({
    '姓名': user.name,
    '邮箱': user.email,
    '角色': user.role === 'admin' ? '管理员' : '学员',
    '部门': user.department || '',
    '备注': user.notes || '',
    ...(options.includePasswords && { '临时密码': user.tempPassword }),
    ...(options.includeInvitationLinks && { '邀请链接': user.invitationLink }),
    '状态': user.status || 'active',
    '添加时间': user.addedAt || new Date().toISOString().split('T')[0]
  }));

  // 创建工作簿和工作表
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  
  // 设置列宽
  const colWidths = [
    { wch: 15 }, // 姓名
    { wch: 25 }, // 邮箱
    { wch: 10 }, // 角色
    { wch: 15 }, // 部门
    { wch: 20 }, // 备注
    ...(options.includePasswords ? [{ wch: 15 }] : []), // 临时密码
    ...(options.includeInvitationLinks ? [{ wch: 50 }] : []), // 邀请链接
    { wch: 10 }, // 状态
    { wch: 15 }  // 添加时间
  ];
  worksheet['!cols'] = colWidths;

  // 添加工作表到工作簿
  XLSX.utils.book_append_sheet(workbook, worksheet, '用户列表');
  
  // 生成文件名
  const filename = options.filename || `用户列表_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  // 导出文件
  XLSX.writeFile(workbook, filename);
};

// 导出为CSV格式
export const exportToCSV = (users: UserExportData[], options: ExportOptions): void => {
  const exportData = generateUserExportData(users, options);
  
  // 创建CSV头部
  const headers = [
    '姓名',
    '邮箱', 
    '角色',
    '部门',
    '备注',
    ...(options.includePasswords ? ['临时密码'] : []),
    ...(options.includeInvitationLinks ? ['邀请链接'] : []),
    '状态',
    '添加时间'
  ];
  
  // 创建CSV数据行
  const rows = exportData.map(user => [
    user.name,
    user.email,
    user.role === 'admin' ? '管理员' : '学员',
    user.department || '',
    user.notes || '',
    ...(options.includePasswords ? [user.tempPassword || ''] : []),
    ...(options.includeInvitationLinks ? [user.invitationLink || ''] : []),
    user.status || 'active',
    user.addedAt || new Date().toISOString().split('T')[0]
  ]);
  
  // 组合CSV内容
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
  
  // 添加BOM以支持中文
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csvContent;
  
  // 创建下载链接
  const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const filename = options.filename || `用户列表_${new Date().toISOString().split('T')[0]}.csv`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 导出为JSON格式
export const exportToJSON = (users: UserExportData[], options: ExportOptions): void => {
  const exportData = generateUserExportData(users, options);
  
  const jsonContent = JSON.stringify(exportData, null, 2);
  
  // 创建下载链接
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const filename = options.filename || `用户列表_${new Date().toISOString().split('T')[0]}.json`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 批量生成邀请信息文本
export const generateBatchInvitationText = (users: UserExportData[]): string => {
  const invitations = users.map(user => {
    const tempPassword = generateTempPassword();
    const invitationLink = generateInvitationLink(user.email, tempPassword);
    const invitationInfo = createInvitationInfo(user.name, user.email, tempPassword, invitationLink);
    return formatInvitationText(invitationInfo);
  });
  
  return invitations.join('\n\n' + '='.repeat(50) + '\n\n');
};

// 统一导出函数
export const exportUsers = (users: UserExportData[], options: ExportOptions): void => {
  switch (options.format) {
    case 'excel':
      exportToExcel(users, options);
      break;
    case 'csv':
      exportToCSV(users, options);
      break;
    case 'json':
      exportToJSON(users, options);
      break;
    default:
      throw new Error(`不支持的导出格式: ${options.format}`);
  }
};