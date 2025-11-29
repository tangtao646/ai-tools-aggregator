# 导入必要的库
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql 
from sqlalchemy.sql import table, column, select
import json

# revision identifiers, used by Alembic.
revision = '9d29a0b9c1af_split_tool_table' 
down_revision = '9d29a0b9c1af' 
branch_labels = None
depends_on = None

# 定义您的新表结构（用于后续的创建和插入操作）
metadata = sa.MetaData()

# --- 新表定义 (与之前一致) ---

# 表 1: tools (核心数据表)
new_tools = sa.Table(
    'tools', metadata,
    sa.Column('id', sa.Integer, primary_key=True),
    sa.Column('name', sa.String(255), nullable=False), 
    sa.Column('official_link', sa.String(255)),
    sa.Column('category', sa.String(50)),
    sa.Column('tags', postgresql.JSONB),
    sa.Column('pricing_model', sa.String(50)),
    sa.Column('supported_platforms', postgresql.JSONB),
    sa.Column('rating', sa.Numeric(3, 1)),
    sa.Column('is_featured', sa.Boolean),
    sa.Column('logo_url', sa.String(255)),
    sa.Column('screenshots', postgresql.JSONB),
    sa.Column('video_url', sa.String(255))
)

# 表 2: tool_translations (通用翻译表)
tool_translations = sa.Table(
    'tool_translations', metadata,
    sa.Column('id', sa.Integer, primary_key=True),
    sa.Column('tool_id', sa.Integer, sa.ForeignKey('tools.id'), nullable=False),
    sa.Column('lang_code', sa.String(5), nullable=False),
    sa.Column('category_name', sa.String(255)),
    sa.Column('pricing_model_name', sa.String(255)),
    sa.Column('pricing_details', sa.Text),
    sa.Column('meta_title', sa.String(255)),
    sa.Column('meta_description', sa.Text),
    sa.Column('description', sa.Text),
    sa.Column('short_description', sa.String(255)),
    sa.Column('features', postgresql.JSONB),
    sa.Column('use_cases', postgresql.JSONB),
    sa.Column('key_differentiators', postgresql.JSONB),
    sa.Column('pros', postgresql.JSONB),
    sa.Column('cons', postgresql.JSONB),
    sa.UniqueConstraint('tool_id', 'lang_code', name='uq_tool_lang_code')
)

# 表 3: tool_faqs (FAQ 详情表)
tool_faqs = sa.Table(
    'tool_faqs', metadata,
    sa.Column('id', sa.Integer, primary_key=True),
    sa.Column('tool_id', sa.Integer, sa.ForeignKey('tools.id'), nullable=False),
    sa.Column('lang_code', sa.String(5), nullable=False),
    sa.Column('faq_order', sa.Integer, nullable=False),
    sa.Column('question', sa.Text, nullable=False),
    sa.Column('answer', sa.Text, nullable=False)
)

def upgrade():
    # 1. 结构变更：创建新的三张空表
    print("Creating new tables: tools, tool_translations, tool_faqs...")
    op.create_table('tools', *new_tools.columns)
    op.create_table('tool_translations', *tool_translations.columns)
    op.create_table('tool_faqs', *tool_faqs.columns)

    # 2. **数据迁移：从旧表 'tool' 中读取数据，并拆分写入新表**
    bind = op.get_bind()
    session = sa.orm.Session(bind=bind) 

    # --- 关键：定义旧表结构，用于读取数据 ---
    # 旧表名就是 'tool'
    tool_legacy = sa.Table('tool', metadata, autoload_with=bind)

    # 遍历旧表中的所有中文记录
    old_records = session.execute(sa.select(tool_legacy)).fetchall() 
    print(f"Loaded {len(old_records)} records from tool (legacy table).")

    for i, row in enumerate(old_records):
        # 将 row 对象（旧表的一行数据）转换为 dict 方便处理
        old_data = dict(row._mapping) 
        
        # --- 数据拆分逻辑 (使用 'zh' 作为语言代码) ---
        
        # A. 核心数据 (不可翻译部分)
        core_data = {
            'name': old_data['name'], 
            'official_link': old_data['official_link'],
            'category': old_data['category'],
            'tags': old_data['tags'],
            'pricing_model': old_data['pricing_model'],
            'supported_platforms': old_data['supported_platforms'],
            'rating': old_data['rating'],
            'is_featured': old_data['is_featured'],
            'logo_url': old_data['logo_url'],
            'screenshots': old_data['screenshots'],
            'video_url': old_data['video_url'],
        }
        
        # B. 翻译数据 (中文部分)
        trans_zh = {
            'lang_code': 'zh',
            'category_name': old_data['category_name'],
            'pricing_model_name': old_data['pricing_model_name'],
            'pricing_details': old_data['pricing_details'],
            'meta_title': old_data['meta_title'],
            'meta_description': old_data['meta_description'],
            'description': old_data['description'],
            'short_description': old_data['short_description'],
            'features': old_data['features'],
            'use_cases': old_data['use_cases'],
            'key_differentiators': old_data['key_differentiators'],
            'pros': old_data['pros'],
            'cons': old_data['cons'],
        }
        
        # C. FAQ 数据 (中文部分)
        faqs_zh = old_data['faqs'] 
        
        # 3. 插入新表

        # 3.1 插入主表 (tools) 并获取 ID
        result = session.execute(new_tools.insert().values(**core_data))
        new_tool_id = result.inserted_primary_key[0] 

        # 3.2 插入中文翻译 (tool_translations)
        trans_zh['tool_id'] = new_tool_id
        session.execute(tool_translations.insert().values(**trans_zh))

        # 3.3 插入中文 FAQ (tool_faqs)
        # 确保 faqs_zh 是列表类型，然后拆分插入
        if isinstance(faqs_zh, list):
            for order, item in enumerate(faqs_zh):
                 session.execute(
                    tool_faqs.insert().values(
                        tool_id=new_tool_id,
                        lang_code='zh',
                        faq_order=order,
                        question=item['question'],
                        answer=item['answer']
                    )
                )

    # 4. 提交所有数据更改
    session.commit()
    session.close()

    # 5. **重要清理步骤：删除旧的 'tool' 表**
    # 这一步是不可逆的。在生产环境执行前，请务必做好数据备份！
    print("Dropping legacy table 'tool'...")
    op.drop_table('tool') 


def downgrade():
    # 撤销操作：删除新的三张表 (数据将被删除，因为旧表已被 drop)
    print("Reverting migration: Dropping new tables.")
    op.drop_table('tool_faqs')
    op.drop_table('tool_translations')
    op.drop_table('tools')
    # 注意：无法自动恢复旧的 'tool' 表结构和数据，需要依赖备份。