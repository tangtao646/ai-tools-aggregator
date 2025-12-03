# backend/app/api/endpoints/tools.py
from typing import List, Optional, Dict, Any 
# 导入 and_ 以确保 JOIN 条件的鲁棒性
from sqlmodel import Session, select, or_, func, distinct, column, and_ 
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
import os
import uuid
from pathlib import Path
from datetime import datetime

from app.core.db import get_session
from app.core.auth import get_current_user_optional
from app.models.tool import Tool, ReviewStatus
from app.models.user import User
from app.models.tool_translation import ToolTranslation
from app.models.tool_faq import ToolFAQ
from app.models.formtool import FormTool
from app.models.category import Category
from app.utils.slug import generate_unique_slug
import json
import traceback
import logging

# 定义当前模块的 Logger，用于可靠地记录异常
logger = logging.getLogger(__name__)

# 默认查询语言代码
DEFAULT_LANG_CODE = "zh" 

# 创建 APIRouter 实例，用于定义路由
router = APIRouter(
    prefix="/tools", # 所有路由都以 /tools 开头
    tags=["Tools"]
)

# --------------------
# 辅助函数: 构建基础 JOIN 查询
# --------------------
def build_base_join_statement(lang_code: str = DEFAULT_LANG_CODE):
    """构建 Tool 和 ToolTranslation 的基础 JOIN 语句，用于列表和详情查询。"""
    # 关键修改：使用 and_ 明确组合 JOIN 条件，避免 Python 布尔 and 带来的歧义
    join_condition = and_(Tool.id == ToolTranslation.tool_id, ToolTranslation.lang_code == lang_code)
    
    # 使用 LEFT OUTER JOIN 以确保即使没有翻译（例如新提交的工具），核心工具也能被选中
    return select(Tool, ToolTranslation).join(
        ToolTranslation, 
        join_condition,
        isouter=True # 使用 LEFT JOIN
    )

# --------------------
# 1. POST: 创建新工具 (P1 - 工具提交功能)
# --------------------
@router.post("/", response_model=FormTool, status_code=status.HTTP_201_CREATED)
def create_tool(
    tool: FormTool, 
    db: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    提交一个新的 AI 工具。
    """
    # Build core Tool fields from the submitted FormTool
    payload = tool.model_dump()

    tool_fields = {}
    core_keys = [
        'name', 'slug', 'official_link', 'category', 'pricing_model', 'is_featured',
        'tags', 'logo_url', 'rating', 'screenshots', 'video_url', 'supported_platforms',
        'review_status', 'rejection_reason', 'submitter_id', 'submitter_email', 'edit_count'
    ]
    for k in core_keys:
        if k in payload and payload[k] is not None:
            tool_fields[k] = payload[k]

    # Normalize supported_platforms
    if 'supported_platforms' in tool_fields and isinstance(tool_fields['supported_platforms'], str):
        try:
            tool_fields['supported_platforms'] = json.loads(tool_fields['supported_platforms'])
        except Exception:
            tool_fields['supported_platforms'] = []

    # If user provided submitter info implicitly, prefer current_user
    if current_user:
        tool_fields['submitter_id'] = current_user.id
        if not tool_fields.get('submitter_email') and current_user.email:
            tool_fields['submitter_email'] = current_user.email

    # Create Tool row
    db_tool = Tool(**tool_fields)
    # Ensure slug
    if not getattr(db_tool, 'slug', None):
        db_tool.slug = generate_unique_slug(db, Tool, db_tool.name)

    db.add(db_tool)
    db.commit()
    db.refresh(db_tool)

    # Handle translations (default to 'en') and faqs
    trans_keys = [
        'description', 'short_description', 'category_name', 'features', 'use_cases',
        'key_differentiators', 'pricing_details', 'meta_title', 'meta_description', 'pros', 'cons'
    ]
    trans_data = {k: payload.get(k) for k in trans_keys if payload.get(k) is not None}
    if trans_data or payload.get('faqs'):
        tr = ToolTranslation(tool_id=db_tool.id, lang_code=DEFAULT_LANG_CODE)
        for k, v in trans_data.items():
            setattr(tr, k, v)
        db.add(tr)
        db.commit()

        # faqs
        if payload.get('faqs'):
            try:
                # remove any existing faqs (shouldn't be any for new tool)
                db.exec(ToolFAQ.__table__.delete().where(ToolFAQ.tool_id == db_tool.id))
            except Exception:
                pass
            for idx, faq in enumerate(payload.get('faqs') or []):
                q = faq.get('question') if isinstance(faq, dict) else None
                a = faq.get('answer') if isinstance(faq, dict) else None
                if q and a:
                    newf = ToolFAQ(tool_id=db_tool.id, lang_code=DEFAULT_LANG_CODE, faq_order=idx, question=q, answer=a)
                    db.add(newf)
            db.commit()

    # Return merged response (tool core + default translation if present)
    tool_dict = db_tool.model_dump()
    tr = db.exec(select(ToolTranslation).where(ToolTranslation.tool_id == db_tool.id, ToolTranslation.lang_code == DEFAULT_LANG_CODE)).first()
    if tr:
        for fld in trans_keys:
            val = getattr(tr, fld, None)
            if val is not None:
                tool_dict[fld] = val

    return tool_dict


# --------------------
# Upload logo file
# --------------------
@router.post("/upload-logo")
def upload_logo(file: UploadFile = File(...)):
    """
    接受单个图片上传，保存到 `static/logos/`，并返回可用于前端访问的 `logo_url`。
    """
    try:
        # 验证并准备保存路径
        upload_dir = Path("static") / "logos"
        upload_dir.mkdir(parents=True, exist_ok=True)

        # 保留文件扩展名（小写）
        original_name = file.filename or "upload.png"
        ext = Path(original_name).suffix.lower() or ".png"
        allowed_exts = {'.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.ico'}
        if ext not in allowed_exts:
            ext = '.png'

        filename = f"{uuid.uuid4().hex}{ext}"
        dest = upload_dir / filename

        # 写入文件
        with open(dest, 'wb') as f:
            content = file.file.read()
            f.write(content)

        # Ensure file handle closed
        try:
            file.file.close()
        except Exception:
            pass

        logo_url = f"/static/logos/{filename}"
        return {"logo_url": logo_url}
    except Exception as e:
        logger.exception("Failed to upload file:") # 使用 logger.exception 确保打印堆栈
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {e}")

# --------------------
# 2. GET: 获取工具列表 (P0 - 核心功能，已优化)
# --------------------
@router.get("/")
def read_tools(
    offset: int = 0, 
    limit: int = 100,
    category: Optional[str] = None, 
    search: Optional[str] = None,   
    db: Session = Depends(get_session)
):
    """
    获取 AI 工具列表，支持分页、分类筛选和全局搜索 (名称/描述)。
    """
    try:
        # 基础 JOIN 语句 (LEFT JOIN ToolTranslation ON lang_code='en')
        base_statement = build_base_join_statement(DEFAULT_LANG_CODE)
        
        where_conditions = [Tool.review_status == ReviewStatus.PUBLISHED]
        
        # 1. 分类筛选逻辑
        if category and category.lower() != '全部':
            original_category_found = False
            try:
                # 尝试通过 Category 表映射 display_category -> original_category (Tool.category)
                stmt = select(Category.original_category).where(Category.display_category.ilike(category))
                res = db.exec(stmt).all()
                origs = [r[0] if isinstance(r, (list, tuple)) else r for r in res if (r[0] if isinstance(r, (list, tuple)) and len(r) > 0 else r) is not None]
                
                if origs:
                    where_conditions.append(Tool.category.in_(origs))
                    original_category_found = True
                
            except Exception:
                pass 
            
            # 如果没有通过映射找到原始分类，则回退到直接匹配翻译表的 category_name
            if not original_category_found:
                 where_conditions.append(ToolTranslation.category_name.ilike(f"%{category}%"))

        # 2. 全局搜索逻辑 (通过 JOIN 优化)
        if search:
            search_term = f"%{search}%" 
            search_condition = or_(
                Tool.name.ilike(search_term),                               # 搜索工具名称 (Tool表)
                ToolTranslation.description.ilike(search_term),             # 搜索翻译描述 (Translation表)
                ToolTranslation.short_description.ilike(search_term),       # 搜索翻译短描述 (Translation表)
            )
            where_conditions.append(search_condition)
        
        # 3. 查询总数 (COUNT - 必须使用 DISTINCT(Tool.id) 避免 JOIN 产生的重复计数)
        # 关键：使用 and_ 明确组合 JOIN 条件
        count_join_condition = and_(Tool.id == ToolTranslation.tool_id, ToolTranslation.lang_code == DEFAULT_LANG_CODE)
        total_statement = select(func.count(distinct(Tool.id))).select_from(Tool).join(
            ToolTranslation, 
            count_join_condition,
            isouter=True # 修正：确保总数计算也使用 LEFT JOIN，避免因缺少翻译而计数为零
        ).where(
            *where_conditions
        )
        total = db.exec(total_statement).one_or_none() or 0
        
        # 4. 查询分页数据 (SELECT)
        # 排序和分页应用于 JOIN 后的结果集
        data_statement = base_statement.where(*where_conditions).offset(offset).limit(limit).order_by(Tool.created_at.desc())
        results = db.exec(data_statement).all()
        
        # 5. 格式化输出
        parsed_tools = []
        for tool, trans in results:
            tool_dict = tool.model_dump()

            # 合并翻译字段
            if trans:
                for fld in ['description', 'short_description', 'category_name', 'features', 'use_cases', 'key_differentiators', 'pricing_details', 'meta_title', 'meta_description', 'pros', 'cons']:
                    val = getattr(trans, fld, None)
                    if val is not None:
                        tool_dict[fld] = val

            # 解析 JSON 字段
            if isinstance(tool_dict.get('supported_platforms'), str):
                try:
                    tool_dict['supported_platforms'] = json.loads(tool_dict['supported_platforms'])
                except (json.JSONDecodeError, TypeError):
                    tool_dict['supported_platforms'] = []

            parsed_tools.append(tool_dict)
        
        return {
            "items": parsed_tools,
            "total": total
        }
    except Exception as e:
        # 使用 logger.exception 确保打印完整的堆栈信息
        logger.exception("An error occurred while fetching tools (read_tools):")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"An error occurred while fetching tools: {str(e)}"
        )


# --------------------
# Compact list for cards (已优化)
# --------------------
@router.get("/compact")
def read_tools_compact(
    offset: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    search: Optional[str] = None,
    pricing_model: Optional[str] = None,
    rating: Optional[float] = None,
    db: Session = Depends(get_session)
):
    """
    返回精简的工具列表，用于前端卡片展示（性能友好，字段更小）。
    """
    try:
        # 基础 JOIN 语句 (LEFT JOIN ToolTranslation ON lang_code='en')
        base_statement = build_base_join_statement(DEFAULT_LANG_CODE)
        
        where_conditions = [Tool.review_status == ReviewStatus.PUBLISHED]
        
        # 1. 类别过滤逻辑 (Category)
        if category and category.lower() != 'all':
            original_category_found = False
            # 尝试通过 Category 表映射 display_category -> original_category (Tool.category)
            try:
                stmt = select(Category.original_category).where(Category.display_category.ilike(category))
                res = db.exec(stmt).all()
                origs = [r[0] if isinstance(r, (list, tuple)) else r for r in res if (r[0] if isinstance(r, (list, tuple)) and len(r) > 0 else r) is not None]
                
                if origs:
                    where_conditions.append(Tool.category.in_(origs))
                    original_category_found = True
                
            except Exception:
                pass 
            
            # 如果没有通过映射找到原始分类，则回退到直接匹配翻译表的 category_name
            if not original_category_found:
                 where_conditions.append(ToolTranslation.category_name.ilike(f"%{category}%"))

        # 2. 搜索过滤逻辑 (Search)
        if search:
            search_term = f"%{search}%"
            search_condition = or_(
                Tool.name.ilike(search_term),                           # 搜索工具名称 (Tool表)
                ToolTranslation.description.ilike(search_term),         # 搜索翻译描述 (Translation表)
                ToolTranslation.short_description.ilike(search_term)    # 搜索翻译短描述 (Translation表)
            )
            where_conditions.append(search_condition)

        # 3. 价格模型过滤 (Pricing Model)
        if pricing_model:
            where_conditions.append(Tool.pricing_model == pricing_model)

        # 4. 评分过滤 (Rating)
        if rating is not None:
            try:
                min_rating = float(rating)
                where_conditions.append(Tool.rating >= min_rating)
            except Exception:
                pass 

        # 5. 计算总数 (COUNT)
        # 关键：使用 and_ 明确组合 JOIN 条件
        count_join_condition = and_(Tool.id == ToolTranslation.tool_id, ToolTranslation.lang_code == DEFAULT_LANG_CODE)
        total_statement = select(func.count(distinct(Tool.id))).select_from(Tool).join(
            ToolTranslation, 
            count_join_condition,
            isouter=True # <<<<<<<<<<<<<<< 修正: 强制使用 LEFT JOIN，即使没有翻译也计算在内 >>>>>>>>>>>>>>>
        ).where(
            *where_conditions
        )
        total = db.exec(total_statement).one_or_none() or 0

        # 6. 查询分页数据 (SELECT)
        data_statement = base_statement.where(*where_conditions).order_by(Tool.created_at.desc()).offset(offset).limit(limit)
        results = db.exec(data_statement).all()
        
        logging.debug(f"Compact tools query returned {len(results)} items out of total {total} matching tools.")

        # 7. 格式化输出
        compact_items = []
        for t, tt in results:
            # tt 可能为 None (因为是 LEFT JOIN)
            short_desc = None
            category_name = t.category

            if tt:
                # 优先使用翻译表的 short_description
                short_desc = tt.short_description or (tt.description or "")[:160]
                category_name = tt.category_name or t.category

            compact_items.append({
                "id": t.id,
                "name": t.name or "",
                "slug": t.slug or "",
                "logo_url": t.logo_url or "",
                "short_description": short_desc or "",
                "category": category_name or "", # 优先使用翻译的类别名称
                "rating": float(t.rating) if t.rating is not None else None,
                "pricing_model": t.pricing_model or ""
            })

        return {"items": compact_items, "total": total}
    
    except Exception as e:
        # 关键：使用 logger.exception 代替 traceback.print_exc() 来可靠地打印堆栈信息
        logger.exception("An error occurred while fetching compact tools (read_tools_compact):")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"An error occurred while fetching compact tools: {str(e)}"
        )


# --------------------
# GET: distinct display categories from CategoryMapping (保持不变)
# --------------------
@router.get("/display-categories")
def get_display_categories(db: Session = Depends(get_session)):
    """
    返回 `CategoryMapping.display_category` 的去重列表，用于前端在首页展示动态分类。
    """
    try:
        stmt = select(Category.display_category)
        result = db.exec(stmt).all()
        vals = []
        for r in result:
            v = r[0] if isinstance(r, (list, tuple)) and len(r) > 0 else r
            if v:
                vals.append(v)
        cats = sorted(set(vals))
        return {"display_categories": cats, "count": len(cats)}
    except Exception as e:
        logger.exception("Error fetching display categories:")
        raise HTTPException(status_code=500, detail=str(e))

# --------------------
# 3. GET: 查询当前用户提交的工具 (已优化)
# --------------------
@router.get("/my-submissions", response_model=List[FormTool])
def get_my_submissions(
    db: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    查询当前登录用户提交的工具（仅返回待审核和可编辑的审核不通过的）
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="请先登录"
        )
    
    try:
        # 基础 JOIN 语句 (LEFT JOIN ToolTranslation ON lang_code='en')
        base_statement = build_base_join_statement(DEFAULT_LANG_CODE)

        # 查询条件
        where_conditions = [
            or_(
                Tool.submitter_id == current_user.id,
                Tool.submitter_email == current_user.email
            ),
            or_(
                Tool.review_status == ReviewStatus.PENDING,  # 待审核的全部显示
                (Tool.review_status == ReviewStatus.REJECTED) & (Tool.edit_count < 3)  # 不通过且未达修改上限的显示
            )
        ]
        
        statement = base_statement.where(*where_conditions).order_by(Tool.created_at.desc())
        results = db.exec(statement).all()

        # 格式化输出
        parsed_tools = []
        import json as _json
        for tool, trans in results:
            tool_dict = tool.model_dump()
            
            # 合并翻译
            if trans:
                for fld in ['description', 'short_description', 'category_name', 'features', 'use_cases', 'key_differentiators', 'pricing_details', 'meta_title', 'meta_description', 'pros', 'cons']:
                    val = getattr(trans, fld, None)
                    if val is not None:
                        tool_dict[fld] = val

            # 解析 supported_platforms
            if isinstance(tool_dict.get('supported_platforms'), str):
                try:
                    tool_dict['supported_platforms'] = _json.loads(tool_dict['supported_platforms'])
                except (ValueError, TypeError):
                    tool_dict['supported_platforms'] = []
            parsed_tools.append(tool_dict)

        return parsed_tools
    except Exception as e:
        logger.exception("Error fetching user submissions:")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"An error occurred while fetching submissions: {str(e)}"
        )


# --------------------
# 4. GET: 获取单个工具详情（支持 ID 和 Slug）(已优化)
# --------------------
@router.get("/{identifier}")
def read_tool(*, identifier: str, db: Session = Depends(get_session)):
    """
    获取指定 ID 或 Slug 的 AI 工具详情。
    """
    try:
        # 1. 查找核心工具
        if identifier.isdigit():
            tool = db.get(Tool, int(identifier))
        else:
            statement = select(Tool).where(Tool.slug == identifier)
            tool = db.exec(statement).first()
        
        if not tool:
            raise HTTPException(status_code=404, detail="Tool not found")
        
        # 2. 查找所有翻译
        import json
        tool_dict = tool.model_dump()
        transs_stmt = select(ToolTranslation).where(ToolTranslation.tool_id == tool.id)
        transs = db.exec(transs_stmt).all()
        tool_dict['translations'] = [t.model_dump() for t in transs] if transs else []
        
        # 3. 查找所有 FAQ
        faqs_stmt = select(ToolFAQ).where(ToolFAQ.tool_id == tool.id).order_by(ToolFAQ.faq_order)
        faqs = db.exec(faqs_stmt).all()
        tool_dict['faqs'] = [f.model_dump() for f in faqs] if faqs else []

        # 4. 解析 supported_platforms
        if isinstance(tool_dict.get('supported_platforms'), str):
            try:
                tool_dict['supported_platforms'] = json.loads(tool_dict['supported_platforms'])
            except (json.JSONDecodeError, TypeError):
                tool_dict['supported_platforms'] = []

        return tool_dict
    except Exception as e:
        logger.exception(f"Error reading tool detail for {identifier}:")
        raise HTTPException(status_code=500, detail=f"Failed to fetch tool detail: {str(e)}")


# --------------------
# 5. PUT/PATCH: 更新工具 (保持不变)
# --------------------
@router.patch("/{tool_id}", response_model=FormTool)
def update_tool(*, tool_id: int, tool: FormTool, db: Session = Depends(get_session)):
    """
    更新指定 ID 的 AI 工具信息。
    """
    db_tool = db.get(Tool, tool_id)
    if not db_tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    # 检查工具是否允许编辑
    if db_tool.review_status != ReviewStatus.REJECTED:
        raise HTTPException(
            status_code=403, 
            detail="只能编辑审核不通过的工具。如需修改已通过的工具，请联系管理员。"
        )
    
    # 检查修改次数限制（最多 3 次）
    if db_tool.edit_count >= 3:
        raise HTTPException(
            status_code=403,
            detail="此工具已达到最大修改次数（3次）限制。如需进一步修改，请联系管理员。"
        )
    
    # 使用 Pydantic 的 copy_with_update 方法更新字段，并处理翻译字段
    try:
        tool_data = tool.model_dump(exclude_unset=True)

        # Normalize supported_platforms if frontend sent a JSON string
        if 'supported_platforms' in tool_data and isinstance(tool_data['supported_platforms'], str):
            try:
                tool_data['supported_platforms'] = json.loads(tool_data['supported_platforms'])
            except Exception:
                tool_data['supported_platforms'] = []

        # Separate translatable fields
        trans_fields = {}
        for fld in ['description', 'short_description', 'category_name', 'features', 'use_cases', 'key_differentiators', 'pricing_details', 'meta_title', 'meta_description', 'pros', 'cons', 'faqs']:
            if fld in tool_data:
                trans_fields[fld] = tool_data.pop(fld)

        # Update core tool fields
        db_tool.sqlmodel_update(tool_data)

        # 如果名称发生变化，重新生成 slug
        if 'name' in tool_data and tool_data['name'] != db_tool.name:
            db_tool.slug = generate_unique_slug(db, Tool, tool_data['name'], instance_id=tool_id)

        # 增加修改次数
        db_tool.edit_count += 1

        # 编辑后重置为待审核状态，清空拒绝原因
        db_tool.review_status = ReviewStatus.PENDING
        db_tool.rejection_reason = None

        # 手动更新 updated_at 字段
        db_tool.updated_at = datetime.utcnow()

        db.add(db_tool)
        db.commit()

        # Handle translations (update or create default 'en')
        if trans_fields:
            tr = db.exec(select(ToolTranslation).where(ToolTranslation.tool_id == db_tool.id, ToolTranslation.lang_code == DEFAULT_LANG_CODE)).first()
            if not tr:
                tr = ToolTranslation(tool_id=db_tool.id, lang_code=DEFAULT_LANG_CODE)
            # faqs special handling
            faqs_val = trans_fields.pop('faqs', None) if 'faqs' in trans_fields else None
            for k, v in trans_fields.items():
                setattr(tr, k, v)
            db.add(tr)
            db.commit()

            if faqs_val is not None:
                # replace faqs
                db.exec(ToolFAQ.__table__.delete().where(ToolFAQ.tool_id == db_tool.id))
                for idx, faq in enumerate(faqs_val or []):
                    q = faq.get('question') if isinstance(faq, dict) else None
                    a = faq.get('answer') if isinstance(faq, dict) else None
                    if q and a:
                        newf = ToolFAQ(tool_id=db_tool.id, lang_code=DEFAULT_LANG_CODE, faq_order=idx, question=q, answer=a)
                        db.add(newf)
                db.commit()

        db.refresh(db_tool)

        # return merged dict (tool + default translation)
        tool_dict = db_tool.model_dump()
        tr = db.exec(select(ToolTranslation).where(ToolTranslation.tool_id == db_tool.id, ToolTranslation.lang_code == DEFAULT_LANG_CODE)).first()
        if tr:
            for fld in ['description', 'short_description', 'category_name', 'features', 'use_cases', 'key_differentiators', 'pricing_details', 'meta_title', 'meta_description', 'pros', 'cons']:
                val = getattr(tr, fld, None)
                if val is not None:
                    tool_dict[fld] = val

        return tool_dict
    except Exception as e:
        # Log and return clearer error for debugging
        logger.exception("Failed to update tool:")
        raise HTTPException(status_code=500, detail=f"Failed to update tool: {e}")

# --------------------
# 5. DELETE: 删除工具 (保持不变)
# --------------------
@router.delete("/{tool_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tool(*, tool_id: int, db: Session = Depends(get_session)):
    """
    删除指定 ID 的 AI 工具。
    """
    tool = db.get(Tool, tool_id)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    try:
        db.delete(tool)
        db.commit()
        return None
    except Exception as e:
        logger.exception(f"Error deleting tool {tool_id}:")
        raise HTTPException(status_code=500, detail=f"Failed to delete tool: {str(e)}")


# --------------------
# 9. GET: 获取同类推荐工具（简化列表）(已优化)
# --------------------
@router.get("/{identifier}/related")
def get_related_tools(*, identifier: str, limit: int = 5, db: Session = Depends(get_session)):
    """
    获取与指定工具同类的推荐工具（简化字段列表）
    """
    try:
        # 1. 查找当前工具以获取 category
        if identifier.isdigit():
            tool = db.get(Tool, int(identifier))
        else:
            statement = select(Tool).where(Tool.slug == identifier)
            tool = db.exec(statement).first()

        if not tool:
            raise HTTPException(status_code=404, detail="Tool not found")

        # 2. 构建 JOIN 语句查询同分类工具
        base_statement = build_base_join_statement(DEFAULT_LANG_CODE)

        # 查询条件：同分类，排除当前工具，已发布
        where_conditions = [
            Tool.category == tool.category,
            Tool.id != tool.id,
            Tool.review_status == ReviewStatus.PUBLISHED
        ]

        # 3. 执行查询
        stmt = base_statement.where(*where_conditions).order_by(Tool.rating.desc()).limit(limit)
        results = db.exec(stmt).all()

        # 4. 格式化输出
        related = []
        for t, tt in results:
            # tt 可能为 None (因为是 LEFT JOIN)
            short_desc = None
            category_name = t.category

            if tt:
                short_desc = tt.short_description or (tt.description or "")[:160]
                category_name = tt.category_name or t.category

            related.append({
                "id": t.id,
                "name": t.name or "",
                "slug": t.slug or "",
                "logo_url": t.logo_url or "",
                "short_description": short_desc or "",
                "category": category_name or "",
                "rating": float(t.rating) if t.rating is not None else None,
                "pricing_model": t.pricing_model or ""
            })

        return related
    except Exception as e:
        logger.exception(f"Error fetching related tools for {identifier}:")
        raise HTTPException(status_code=500, detail=f"Failed to fetch related tools: {str(e)}")