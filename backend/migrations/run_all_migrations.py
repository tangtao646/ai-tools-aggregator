"""
批量执行所有数据库迁移
"""
import subprocess
import os

# 迁移脚本执行顺序（按依赖关系排序）
migrations = [
    'add_logo_url.py',
    'add_short_description.py',
    'add_review_status.py',
    'create_admin_table.py',
    'add_rejection_reason.py',
    'add_submitter_email.py',
    'add_edit_count.py',
    'add_submitter_id.py',
    'add_missing_tool_fields.py'
]

print("🚀 开始执行数据库迁移...\n")

for migration in migrations:
    print(f"📦 执行迁移: {migration}")
    try:
        result = subprocess.run(
            ['python', f'migrations/{migration}'],
            capture_output=True,
            text=True,
            check=False
        )
        print(result.stdout)
        if result.returncode != 0:
            print(f"⚠️  警告: {result.stderr}")
    except Exception as e:
        print(f"❌ 错误: {e}")
    print("-" * 50)

print("\n✅ 所有迁移执行完成！")
