// 测试登录脚本 - 在浏览器控制台中运行
console.log('=== 开始测试登录 ===');

// 清除现有的用户数据
localStorage.clear();
console.log('已清除localStorage');

// 设置管理员用户信息
localStorage.setItem('user_role', 'admin');
localStorage.setItem('user_id', 'admin-test-001');
localStorage.setItem('user_email', 'admin@test.com');
localStorage.setItem('user_name', '测试管理员');

console.log('已设置管理员用户信息:');
console.log('用户角色:', localStorage.getItem('user_role'));
console.log('用户ID:', localStorage.getItem('user_id'));
console.log('用户邮箱:', localStorage.getItem('user_email'));
console.log('用户姓名:', localStorage.getItem('user_name'));

console.log('=== 请刷新页面查看数据 ===');

// 自动刷新页面
setTimeout(() => {
  window.location.reload();
}, 2000);

// 额外的调试信息
console.log('当前页面URL:', window.location.href);
console.log('API基础URL:', import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:3000');