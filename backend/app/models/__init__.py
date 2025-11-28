# backend/app/models/__init__.py

# 显式导入所有模型，确保它们被执行并注册到 SQLModel.metadata
from . import admin
from . import category_mapping
from . import tool
from . import user
from . import workflow_template
# 确保这里列出了所有 .py 模型文件