// 模拟前端API调用逻辑
console.log('=== 调试前端API调用问题 ===');

// 模拟localStorage中的用户角色
const localStorage_user_role = 'admin';
console.log('localStorage user_role:', localStorage_user_role);

// 模拟路径检查
const isAdminPath_courses = '/admin/courses'.includes('/admin');
const isAdminPath_sessions = '/admin/sessions'.includes('/admin');
console.log('isAdminPath (courses):', isAdminPath_courses);
console.log('isAdminPath (sessions):', isAdminPath_sessions);

// 模拟useBackendProxy决定
const useBackendProxy = localStorage_user_role === 'admin' || isAdminPath_courses;
console.log('useBackendProxy:', useBackendProxy);

// 模拟API base URL
const VITE_API_BASE_URL = 'http://localhost:3000';
console.log('API Base URL:', VITE_API_BASE_URL);

// 测试API调用
async function testApiCalls() {
    console.log('\n=== 测试API调用 ===');
    
    try {
        console.log('正在调用课程API...');
        const coursesUrl = `${VITE_API_BASE_URL}/api/courses`;
        console.log('URL:', coursesUrl);
        
        const coursesResponse = await fetch(coursesUrl);
        console.log('课程API状态:', coursesResponse.status);
        if (coursesResponse.ok) {
            const coursesData = await coursesResponse.json();
            console.log('课程数量:', coursesData.length);
            console.log('第一门课程:', coursesData[0]?.title);
        } else {
            console.error('课程API错误:', coursesResponse.statusText);
        }
    } catch (error) {
        console.error('课程API调用失败:', error.message);
    }
    
    try {
        console.log('\n正在调用期次API...');
        const sessionsUrl = `${VITE_API_BASE_URL}/api/training-sessions`;
        console.log('URL:', sessionsUrl);
        
        const sessionsResponse = await fetch(sessionsUrl);
        console.log('期次API状态:', sessionsResponse.status);
        if (sessionsResponse.ok) {
            const sessionsData = await sessionsResponse.json();
            console.log('期次数量:', sessionsData.length);
            console.log('第一个期次:', sessionsData[0]?.name);
        } else {
            console.error('期次API错误:', sessionsResponse.statusText);
        }
    } catch (error) {
        console.error('期次API调用失败:', error.message);
    }
}

// 在Node.js环境中需要使用node-fetch
const fetch = require('node-fetch');
testApiCalls().then(() => {
    console.log('\n=== 调试完成 ===');
    process.exit(0);
}).catch(console.error);
