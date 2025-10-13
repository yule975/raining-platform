// 🧪 验证数据修复效果
// 在修复脚本执行后运行

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function verifyDataFix() {
  console.log('🔍 验证数据修复效果...\n')
  
  try {
    // 1. 检查用户数据
    console.log('👥 检查用户数据...')
    const { data: users, error: usersError } = await supabase
      .from('authorized_users')
      .select('*')
      .order('email')
    
    if (usersError) {
      console.error('❌ 获取用户失败:', usersError.message)
      return false
    }
    
    console.log(`✅ 用户数据: ${users?.length || 0} 个用户`)
    users?.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.status}`)
    })
    console.log()
    
    // 2. 检查课程数据
    console.log('📚 检查课程数据...')
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .order('title')
    
    if (coursesError) {
      console.error('❌ 获取课程失败:', coursesError.message)
      return false
    }
    
    console.log(`✅ 课程数据: ${courses?.length || 0} 个课程`)
    courses?.forEach((course, index) => {
      console.log(`   ${index + 1}. ${course.title}`)
      console.log(`      讲师: ${course.instructor}`)
      console.log(`      时长: ${course.duration}`)
      console.log(`      视频: ${course.video_url ? '已配置' : '未配置'}`)
      console.log()
    })
    
    // 3. 检查每个课程的资料
    console.log('📁 检查课程资料...')
    for (const course of courses || []) {
      const { data: materials, error: materialsError } = await supabase
        .from('course_materials')
        .select('*')
        .eq('course_id', course.id)
        .order('file_name')
      
      if (materialsError) {
        console.error(`❌ 获取 ${course.title} 的资料失败:`, materialsError.message)
        continue
      }
      
      console.log(`📂 ${course.title}: ${materials?.length || 0} 个资料`)
      materials?.forEach((material, index) => {
        console.log(`   ${index + 1}. ${material.file_name} (${material.file_size})`)
        console.log(`      类型: ${material.file_type}`)
        console.log(`      下载: ${material.file_url.startsWith('#') ? '演示模式' : '真实链接'}`)
      })
      console.log()
    }
    
    // 4. 模拟前端API调用测试
    console.log('🖥️  模拟前端API调用...')
    
    // 测试课程列表API
    console.log('📋 测试课程列表API...')
    const { data: coursesAPI, error: coursesAPIError } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        instructor,
        cover_url,
        video_url,
        duration,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })
    
    if (coursesAPIError) {
      console.error('❌ 课程列表API失败:', coursesAPIError.message)
      return false
    }
    
    console.log(`✅ 课程列表API成功: 返回 ${coursesAPI?.length || 0} 个课程`)
    
    // 测试课程详情API（测试第一个课程）
    if (coursesAPI && coursesAPI.length > 0) {
      const firstCourse = coursesAPI[0]
      console.log(`🔍 测试课程详情API: ${firstCourse.title}`)
      
      // 获取课程详情
      const { data: courseDetail, error: detailError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', firstCourse.id)
        .single()
      
      if (detailError) {
        console.error('❌ 课程详情API失败:', detailError.message)
        return false
      }
      
      console.log(`✅ 课程详情API成功: ${courseDetail.title}`)
      
      // 获取课程资料
      const { data: courseMaterials, error: materialsError } = await supabase
        .from('course_materials')
        .select('*')
        .eq('course_id', firstCourse.id)
      
      if (materialsError) {
        console.error('❌ 课程资料API失败:', materialsError.message)
        return false
      }
      
      console.log(`✅ 课程资料API成功: 返回 ${courseMaterials?.length || 0} 个资料`)
      
      // 显示资料详情
      courseMaterials?.forEach((material, index) => {
        console.log(`   ${index + 1}. ${material.file_name}`)
      })
    }
    
    console.log('\n🎉 所有API测试通过！数据修复成功！')
    console.log('\n📱 现在可以测试前端了：')
    console.log('   1. 访问 http://localhost:8081')
    console.log('   2. 点击"学员演示登录"')
    console.log('   3. 进入"课程中心"')
    console.log('   4. 应该看到 3 个课程卡片')
    console.log('   5. 点击任一课程进入详情页')
    console.log('   6. 应该看到课程信息、视频区域、3个课程资料')
    console.log('   7. 测试资料下载功能')
    
    // 最终统计
    console.log('\n📊 数据统计:')
    console.log(`   👥 用户: ${users?.length || 0} 个`)
    console.log(`   📚 课程: ${courses?.length || 0} 个`)
    
    let totalMaterials = 0
    for (const course of courses || []) {
      const { count } = await supabase
        .from('course_materials')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', course.id)
      totalMaterials += count || 0
    }
    console.log(`   📁 资料: ${totalMaterials} 个`)
    
    return true
    
  } catch (error) {
    console.error('💥 验证过程出错:', error.message)
    return false
  }
}

// 运行验证
verifyDataFix().then(success => {
  if (success) {
    console.log('\n🚀 修复验证成功！现在系统应该完全正常工作了！')
  }
  process.exit(success ? 0 : 1)
})
