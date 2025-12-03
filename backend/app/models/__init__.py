# backend/app/models/__init__.py

# 显式导入所有模型，确保它们被执行并注册到 SQLModel.metadata
from . import admin
from . import user
from . import workflow_template
from . import tool
from . import tool_translation
from . import tool_faq
from . import category
from . import category_translations

# 确保这里列出了所有 .py 模型文件