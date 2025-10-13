#!/bin/bash
# 🧹 清理临时文件脚本
# 删除项目中的临时测试文件和重复脚本

echo "🧹 开始清理临时文件..."
echo

# 切换到项目根目录
cd /Users/yule/Desktop/培训平台

# 统计删除前的文件数量
echo "📊 清理前文件统计:"
echo "SQL文件: $(find . -name "*.sql" | wc -l | tr -d ' ')"
echo "测试脚本: $(find . -name "*test*" | wc -l | tr -d ' ')"
echo

# 删除重复的测试数据脚本
echo "🗑️  删除重复的测试数据脚本..."
rm -f add_complete_test_*.sql 2>/dev/null
rm -f add_demo_material*.sql 2>/dev/null
rm -f check_course_ids.sql 2>/dev/null
rm -f fixed_add_test_data.sql 2>/dev/null
rm -f quick_add_test_data.sql 2>/dev/null
rm -f insert_test_data.sql 2>/dev/null
rm -f final_fixed_test_data.sql 2>/dev/null

# 删除临时配置和检查脚本
echo "🗑️  删除临时配置脚本..."
rm -f check_test_data.sql 2>/dev/null
rm -f clear_test_videos.sql 2>/dev/null
rm -f configure_feishu_*.sql 2>/dev/null
rm -f setup_feishu_links.sql 2>/dev/null
rm -f quick_verify_fix.sql 2>/dev/null
rm -f update_specific_*.sql 2>/dev/null

# 删除临时验证工具
echo "🗑️  删除临时验证工具..."
rm -f learn-bloom-pal-58-main/test-api-connection.js 2>/dev/null
rm -f learn-bloom-pal-58-main/verify_fix.js 2>/dev/null
rm -f verify_fix.js 2>/dev/null

# 删除重复的文档
echo "🗑️  删除重复的文档..."
rm -f cleanup_unused_files.md 2>/dev/null
rm -f download_test_checklist.md 2>/dev/null

# 删除这个清理脚本本身
echo "🗑️  删除清理脚本..."
rm -f cleanup_temp_files.sh 2>/dev/null

echo
echo "✅ 清理完成！"
echo

# 统计删除后的文件数量
echo "📊 清理后文件统计:"
echo "SQL文件: $(find . -name "*.sql" | wc -l | tr -d ' ')"
echo "测试脚本: $(find . -name "*test*" | wc -l | tr -d ' ')"
echo

echo "🎉 项目目录已整理完毕！"
echo
echo "📋 保留的重要文件："
echo "   📄 emergency_insert_data.sql (数据插入脚本)"
echo "   📖 飞书视频配置指南.md"
echo "   📋 开发规划.md"
echo "   📋 需求文档.md"  
echo "   📋 API设计文档.md"
echo "   🧪 quick_test_guide.md (测试指南)"
echo "   🧪 system_test_checklist.md (测试清单)"
echo "   🐳 docker-compose.yml"
echo
echo "🚀 项目现在更加简洁明了！"
