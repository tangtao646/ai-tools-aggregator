from typing import List, Optional # 导入 Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlmodel import Session, select, or_ # 导入 or_ 和 select
import os
import uuid
from pathlib import Path
from datetime import datetime

from app.core.db import get_session
from app.core.auth import get_current_user_optional
from app.models.tool import Tool, ToolCreate, ToolRead, ToolUpdate, ReviewStatus
from app.models.user import User
from app.models.category_mapping import CategoryMapping
from app.utils.slug import generate_unique_slug
import json



# 创建 APIRouter 实例，用于定义路由
router = APIRouter(
    prefix="/tools", # 所有路由都以 /tools 开头
    tags=["Tools"]
)

# --------------------
# 1. POST: 创建新工具 (P1 - 工具提交功能)
# ... (保持不变)
# --------------------
@router.post("/", response_model=ToolRead, status_code=status.HTTP_201_CREATED)
def create_tool(
    tool: ToolCreate, 
    db: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    提交一个新的 AI 工具。
    如果用户已登录，自动关联到用户 ID。
    自动生成 SEO 友好的 slug。
    """
    db_tool = Tool.model_validate(tool)

    # Normalize supported_platforms: if frontend sent a JSON string like '[]', parse it to a list
    if isinstance(db_tool.supported_platforms, str):
        try:
            db_tool.supported_platforms = json.loads(db_tool.supported_platforms)
        except Exception:
            db_tool.supported_platforms = []
    
    # 自动生成 slug（如果没有提供）
    if not db_tool.slug:
        db_tool.slug = generate_unique_slug(db, Tool, db_tool.name)
    
    # 如果用户已登录，记录提交者 ID
    if current_user:
        db_tool.submitter_id = current_user.id
        # 如果工具数据中没有邮箱，使用用户邮箱
        if not db_tool.submitter_email and current_user.email:
            db_tool.submitter_email = current_user.email
    
    # 自动生成 meta_title 和 meta_description（如果没有提供）
    if not db_tool.meta_title:
        db_tool.meta_title = f"{db_tool.name} - AI Tool Review & Guide"
    
    if not db_tool.meta_description:
        # 截取描述的前 150 个字符
        desc = db_tool.short_description if db_tool.short_description else db_tool.description
        db_tool.meta_description = desc[:150] if len(desc) > 150 else desc
    
    db.add(db_tool)
    db.commit()
    db.refresh(db_tool)

    # Ensure returned object has supported_platforms as a real list (avoid ResponseValidationError)
    if isinstance(db_tool.supported_platforms, str):
        try:
            db_tool.supported_platforms = json.loads(db_tool.supported_platforms)
        except Exception:
            db_tool.supported_platforms = []
    return db_tool


# --------------------
# Upload logo file
# --------------------
@router.post("/upload-logo")
def upload_logo(file: UploadFile = File(...)):
    """
    接受单个图片上传，保存到 `static/logos/`，并返回可用于前端访问的 `logo_url`。
    返回示例: {"logo_url": "/static/logos/<filename>.png"}
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
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {e}")

# --------------------
# 2. GET: 获取工具列表 (P0 - 核心功能，添加搜索)
# --------------------
@router.get("/")
def read_tools(
    offset: int = 0, 
    limit: int = 100,
    category: Optional[str] = None, # 允许 category 为空
    search: Optional[str] = None,   # 新增的搜索参数
    db: Session = Depends(get_session)
):
    """
    获取 AI 工具列表，支持分页、分类筛选和全局搜索 (名称/描述)。
    只返回审核通过 (review_status=PUBLISHED) 的工具。
    返回格式: { "items": [...], "total": 总数量 }
    """
    # 构建基础查询条件
    where_conditions = [Tool.review_status == ReviewStatus.PUBLISHED]
    
    # 1. 分类筛选逻辑
    if category and category.lower() != '全部':
        # If frontend sends a display_category (dynamic categories), resolve to original categories
        try:
            # try case-insensitive match on display_category
            stmt = select(CategoryMapping.original_category).where(CategoryMapping.display_category.ilike(category))
            res = db.exec(stmt).all()
            origs = []
            for r in res:
                if isinstance(r, (list, tuple)):
                    v = r[0] if len(r) > 0 else None
                else:
                    v = r
                if v:
                    origs.append(v)
            if origs:
                where_conditions.append(Tool.category.in_(origs))
            else:
                # fallback to direct match against Tool.category
                where_conditions.append(Tool.category == category)
        except Exception:
            # if anything goes wrong, fallback to direct match
            where_conditions.append(Tool.category == category)
        
    # 2. 全局搜索逻辑
    if search:
        search_term = f"%{search}%" # SQL LIKE 模糊匹配格式
        search_condition = or_(
            Tool.name.ilike(search_term), # 不区分大小写的 LIKE
            Tool.description.ilike(search_term)
        )
        where_conditions.append(search_condition)
    
    # 查询总数
    count_statement = select(Tool).where(*where_conditions)
    total = len(db.exec(count_statement).all())
    
    # 查询分页数据
    statement = select(Tool).where(*where_conditions).offset(offset).limit(limit).order_by(Tool.created_at.desc())
    tools = db.exec(statement).all()
    
    # 手动解析 JSON 字段
    import json
    parsed_tools = []
    for tool in tools:
        tool_dict = tool.model_dump()
        
        # 解析 JSON 字符串为 Python 对象
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


# --------------------
# Compact list for cards
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

    每项包含：id, name, slug, logo_url, short_description, category, rating, pricing_model
    返回格式: { "items": [...], "total": 总数量 }
    """
    where_conditions = [Tool.review_status == ReviewStatus.PUBLISHED]

    if category and category.lower() != '全部':
        try:
            stmt = select(CategoryMapping.original_category).where(CategoryMapping.display_category.ilike(category))
            res = db.exec(stmt).all()
            origs = []
            for r in res:
                if isinstance(r, (list, tuple)):
                    v = r[0] if len(r) > 0 else None
                else:
                    v = r
                if v:
                    origs.append(v)
            if origs:
                where_conditions.append(Tool.category.in_(origs))
            else:
                where_conditions.append(Tool.category == category)
        except Exception:
            where_conditions.append(Tool.category == category)

    if search:
        search_term = f"%{search}%"
        search_condition = or_(
            Tool.name.ilike(search_term),
            Tool.description.ilike(search_term)
        )
        where_conditions.append(search_condition)

    # filter by pricing model (exact match)
    if pricing_model:
        where_conditions.append(Tool.pricing_model == pricing_model)

    # filter by minimum rating (e.g., rating=4 returns tools with rating >= 4)
    if rating is not None:
        try:
            min_rating = float(rating)
            where_conditions.append(Tool.rating >= min_rating)
        except Exception:
            # ignore invalid rating param
            pass

    count_statement = select(Tool).where(*where_conditions)
    total = len(db.exec(count_statement).all())

    statement = select(Tool).where(*where_conditions).offset(offset).limit(limit).order_by(Tool.created_at.desc())
    tools = db.exec(statement).all()

    compact_items = []
    for t in tools:
        compact_items.append({
            "id": t.id,
            "name": t.name or "",
            "slug": t.slug or "",
            "logo_url": t.logo_url or "",
            "short_description": t.short_description or (t.description or "")[:160],
            "category": t.category or "",
            "rating": float(t.rating) if t.rating is not None else None,
            "pricing_model": t.pricing_model or ""
        })

    return {"items": compact_items, "total": total}


# --------------------
# GET: distinct display categories from CategoryMapping
# --------------------
@router.get("/display-categories")
def get_display_categories(db: Session = Depends(get_session)):
    """
    返回 `CategoryMapping.display_category` 的去重列表，用于前端在首页展示动态分类。
    返回格式: { "display_categories": ["分类A", "分类B", ...], "count": N }
    """
    try:
        stmt = select(CategoryMapping.display_category)
        result = db.exec(stmt).all()
        # result may be a list of scalars or list of 1-tuples depending on driver/version
        vals = []
        for r in result:
            if isinstance(r, (list, tuple)):
                v = r[0] if len(r) > 0 else None
            else:
                v = r
            if v:
                vals.append(v)
        cats = sorted(set(vals))
        return {"display_categories": cats, "count": len(cats)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --------------------
# 3. GET: 查询当前用户提交的工具（必须放在 /{tool_id} 之前）
# --------------------
@router.get("/my-submissions", response_model=List[ToolRead])
def get_my_submissions(
    db: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    查询当前登录用户提交的工具（仅返回待审核和可编辑的审核不通过的）
    优先使用 submitter_id 查询，如果没有则使用 submitter_email（兼容旧数据）
    过滤规则：
    1. 只返回待审核(PENDING)和审核不通过(REJECTED)的工具
    2. 审核不通过且修改次数>=3的也过滤掉（已达修改上限）
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="请先登录"
        )
    
    # 查询条件：
    # 1. 待审核(PENDING)的全部显示
    # 2. 审核不通过(REJECTED)且修改次数<3的显示
    statement = select(Tool).where(
        or_(
            Tool.submitter_id == current_user.id,
            Tool.submitter_email == current_user.email
        ),
        or_(
            Tool.review_status == ReviewStatus.PENDING,  # 待审核的全部显示
            (Tool.review_status == ReviewStatus.REJECTED) & (Tool.edit_count < 3)  # 不通过且未达修改上限的显示
        )
    ).order_by(Tool.created_at.desc())
    
    tools = db.exec(statement).all()

    # Ensure supported_platforms is a proper list in the response
    parsed_tools = []
    import json as _json
    for tool in tools:
        tool_dict = tool.model_dump()
        if isinstance(tool_dict.get('supported_platforms'), str):
            try:
                tool_dict['supported_platforms'] = _json.loads(tool_dict['supported_platforms'])
            except (ValueError, TypeError):
                tool_dict['supported_platforms'] = []
        parsed_tools.append(tool_dict)

    return parsed_tools

# --------------------
# 4. GET: 获取单个工具详情（支持 ID 和 Slug）
# --------------------
@router.get("/{identifier}")
def read_tool(*, identifier: str, db: Session = Depends(get_session)):
    """
    获取指定 ID 或 Slug 的 AI 工具详情。
    
    - 如果 identifier 是纯数字，按 ID 查询
    - 否则按 slug 查询
    
    注意：alternatives 和 comparison_data 通过独立接口获取
    """
    # 判断是 ID 还是 slug
    if identifier.isdigit():
        # 按 ID 查询
        tool = db.get(Tool, int(identifier))
    else:
        # 按 slug 查询
        statement = select(Tool).where(Tool.slug == identifier)
        tool = db.exec(statement).first()
    
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    # 手动解析 JSON 字段
    import json
    tool_dict = tool.model_dump()
    
    # 解析 JSON 字符串为 Python 对象
    if isinstance(tool_dict.get('supported_platforms'), str):
        try:
            tool_dict['supported_platforms'] = json.loads(tool_dict['supported_platforms'])
        except (json.JSONDecodeError, TypeError):
            tool_dict['supported_platforms'] = []
    
    return tool_dict

# --------------------
# 5. PUT/PATCH: 更新工具
# ... (保持不变)
# --------------------
@router.patch("/{tool_id}", response_model=ToolRead)
def update_tool(*, tool_id: int, tool: ToolUpdate, db: Session = Depends(get_session)):
    """
    更新指定 ID 的 AI 工具信息。
    只允许编辑审核不通过（review_status=REJECTED）的工具。
    编辑后工具状态会自动重置为待审核（review_status=PENDING）。
    每个工具最多可修改 3 次。
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
    
    # 使用 Pydantic 的 copy_with_update 方法更新字段
    try:
        tool_data = tool.model_dump(exclude_unset=True)

        # Normalize supported_platforms if frontend sent a JSON string
        if 'supported_platforms' in tool_data and isinstance(tool_data['supported_platforms'], str):
            try:
                tool_data['supported_platforms'] = json.loads(tool_data['supported_platforms'])
            except Exception:
                tool_data['supported_platforms'] = []

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
        db.refresh(db_tool)

        # Ensure supported_platforms is a real list before returning
        if isinstance(db_tool.supported_platforms, str):
            try:
                db_tool.supported_platforms = json.loads(db_tool.supported_platforms)
            except Exception:
                db_tool.supported_platforms = []

        return db_tool
    except Exception as e:
        # Log and return clearer error for debugging
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to update tool: {e}")

# --------------------
# 5. DELETE: 删除工具
# ... (保持不变)
# --------------------
@router.delete("/{tool_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tool(*, tool_id: int, db: Session = Depends(get_session)):
    """
    删除指定 ID 的 AI 工具。
    """
    tool = db.get(Tool, tool_id)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    db.delete(tool)
    db.commit()
    return None



# --------------------
# 9. GET: 获取同类推荐工具（简化列表）
# --------------------
@router.get("/{identifier}/related")
def get_related_tools(*, identifier: str, limit: int = 5, db: Session = Depends(get_session)):
    """
    获取与指定工具同类的推荐工具（简化字段列表）

    返回格式为列表，每项包含：id, name, slug, logo_url, short_description, category, rating, pricing_model
    """
    # 获取当前工具
    if identifier.isdigit():
        tool = db.get(Tool, int(identifier))
    else:
        statement = select(Tool).where(Tool.slug == identifier)
        tool = db.exec(statement).first()

    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    # 查询同分类已发布的工具，按 rating 降序，排除当前工具
    stmt = select(Tool).where(
        Tool.category == tool.category,
        Tool.id != tool.id,
        Tool.review_status == ReviewStatus.PUBLISHED
    ).order_by(Tool.rating.desc()).limit(limit)

    results = db.exec(stmt).all()

    related = []
    for t in results:
        related.append({
            "id": t.id,
            "name": t.name or "",
            "slug": t.slug or "",
            "logo_url": t.logo_url or "",
            "short_description": t.short_description or "",
            "category": t.category or "",
            "rating": float(t.rating) if t.rating is not None else None,
            "pricing_model": t.pricing_model or ""
        })

    return related
