# backend/app/api/endpoints/admin.py
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Body
from sqlmodel import Session, select
from pydantic import BaseModel
from sqlalchemy import delete
import sys
import os
import json

# 添加项目根目录到 Python 路径，以便导入 scripts
backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from app.core.db import get_session
from app.core.auth import (
    verify_password,
    create_access_token,
    get_current_admin
)
from app.models.admin import Admin, AdminLogin
from app.models.tool import Tool, ReviewStatus
from app.models.user import User
from app.models.workflow_template import WorkflowTemplate, WorkflowNode
from app.models.category import Category
from app.models.tool_translation import ToolTranslation
from app.models.tool_faq import ToolFAQ
from datetime import datetime

from scripts.content_generator import AIToolsSEOGenerator
seo_generator = AIToolsSEOGenerator()
import subprocess
import time
import shutil
import tempfile

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


# 审核请求模型
class ReviewRequest(BaseModel):
    review_status: str  # PENDING, PUBLISHED, REJECTED
    rejection_reason: Optional[str] = None


@router.post("/login")
def admin_login(credentials: AdminLogin, db: Session = Depends(get_session)):
    """
    管理员登录，返回 JWT Token
    """
    # 查询管理员
    statement = select(Admin).where(Admin.username == credentials.username)
    admin = db.exec(statement).first()
    
    if not admin or not verify_password(credentials.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    
    # 生成 JWT Token
    access_token = create_access_token(data={"sub": admin.username})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": admin.username
    }


@router.get("/tools/pending")
def get_pending_tools(
    offset: int = 0,
    limit: int = 20,
    db: Session = Depends(get_session),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    获取待审核的工具列表（需要管理员权限）
    返回格式: { "items": [...], "total": 总数量 }
    """
    # 查询总数
    count_statement = select(Tool).where(Tool.review_status == ReviewStatus.PENDING)
    total = len(db.exec(count_statement).all())
    
    # 查询分页数据
    statement = select(Tool).where(Tool.review_status == ReviewStatus.PENDING).offset(offset).limit(limit).order_by(Tool.created_at.desc())
    tools = db.exec(statement).all()
    
    return {
        "items": tools,
        "total": total
    }


@router.get("/tools/all")
def get_all_tools(
    offset: int = 0,
    limit: int = 20,
    db: Session = Depends(get_session),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    获取所有工具（包含所有审核状态，需要管理员权限）
    返回格式: { "items": [...], "total": 总数量 }
    """
    # 查询总数
    count_statement = select(Tool)
    total = len(db.exec(count_statement).all())
    
    # 查询分页数据
    statement = select(Tool).offset(offset).limit(limit).order_by(Tool.created_at.desc())
    tools = db.exec(statement).all()
    
    return {
        "items": tools,
        "total": total
    }


@router.put("/tools/{tool_id}/review")
def update_review_status(
    tool_id: int,
    review_request: ReviewRequest,
    db: Session = Depends(get_session),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    更新工具的审核状态（需要管理员权限）
    
    两阶段审核流程：
    1. 内容审核：PENDING → APPROVED_PENDING_SEO（通过）或 REJECTED（拒绝）
    2. SEO审核：SEO_GENERATED → PUBLISHED（通过）或 REJECTED（拒绝）
    
    状态流转：
    - PENDING → APPROVED_PENDING_SEO: 内容审核通过，触发SEO生成
    - PENDING → REJECTED: 内容审核不通过
    - SEO_GENERATED → PUBLISHED: SEO审核通过，正式发布
    - SEO_GENERATED → REJECTED: SEO审核不通过
    - 任何状态 → PENDING: 重新标记为待审核
    """
    review_status = review_request.review_status
    rejection_reason = review_request.rejection_reason
    
    # 验证审核状态
    valid_statuses = [
        ReviewStatus.PENDING, 
        ReviewStatus.APPROVED_PENDING_SEO,
        ReviewStatus.SEO_GENERATED,
        ReviewStatus.REJECTED, 
        ReviewStatus.PUBLISHED
    ]
    if review_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"审核状态必须是 {', '.join(valid_statuses)}"
        )
    
    # 如果是拒绝，必须提供拒绝原因
    if review_status == ReviewStatus.REJECTED and not rejection_reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="审核不通过时必须提供拒绝原因"
        )
    
    # 查询工具
    tool = db.get(Tool, tool_id)
    if not tool:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="工具不存在"
        )
    
    # 记录原状态
    old_status = tool.review_status
    
    # 更新审核状态和拒绝原因
    tool.review_status = review_status
    if review_status == ReviewStatus.REJECTED:
        tool.rejection_reason = rejection_reason
    else:
        # 如果不是拒绝状态，清空拒绝原因
        tool.rejection_reason = None
    
    db.add(tool)
    db.commit()
    db.refresh(tool)
    
    # 如果从 PENDING 转到 APPROVED_PENDING_SEO，触发 SEO 生成
    # 注意：这里只是标记状态，实际生成由后台任务完成
    message = f"工具 {tool.name} 的审核状态已更新"
    
    if review_status == ReviewStatus.APPROVED_PENDING_SEO:
        message += "。SEO内容生成中，完成后需要进行第二次审核。"
    elif review_status == ReviewStatus.PUBLISHED:
        message += "，已正式发布！"
    
    status_text = {
        ReviewStatus.PENDING: "待审核", 
        ReviewStatus.APPROVED_PENDING_SEO: "内容审核通过，等待SEO生成",
        ReviewStatus.SEO_GENERATED: "SEO已生成，待审核",
        ReviewStatus.REJECTED: "审核不通过", 
        ReviewStatus.PUBLISHED: "已发布"
    }
    
    return {
        "message": message,
        "tool_id": tool_id,
        "old_status": old_status,
        "new_status": review_status,
        "status_text": status_text[review_status],
        "rejection_reason": rejection_reason if review_status == ReviewStatus.REJECTED else None
    }


@router.post("/tools/{tool_id}/generate-seo")
def generate_seo_for_tool(
    tool_id: int,
    db: Session = Depends(get_session),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    为指定工具生成 SEO 内容（需要管理员权限）
    
    调用时机：
    1. 管理员将工具从 PENDING 改为 APPROVED_PENDING_SEO 后
    2. 手动触发重新生成 SEO 内容
    
    流程：
    - 检查工具状态必须是 APPROVED_PENDING_SEO
    - 调用 Gemini API 生成 SEO 内容
    - 更新工具的 meta_title, meta_description, pros, cons, faqs
    - 将状态改为 SEO_GENERATED，等待管理员二次审核
    """
    # 查询工具
    tool = db.get(Tool, tool_id)
    if not tool:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="工具不存在"
        )
    
    # 检查状态是否允许生成 SEO
    if tool.review_status != ReviewStatus.APPROVED_PENDING_SEO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"只有状态为 APPROVED_PENDING_SEO 的工具才能生成 SEO 内容，当前状态：{tool.review_status}"
        )
    
    # 生成 SEO 内容
    try:
        print(f"🔍 开始生成 SEO，工具名称：{tool.name}")
        print(f"📝 工具描述：{tool.description}")
        print(f"📂 分类：{tool.category}")
        print(f"🔗 链接：{tool.official_link}")
        
        seo_data = seo_generator.generate_seo_content(tool_data={
            "name": tool.name,
            "description": tool.description,
            "short_description": tool.short_description,
            "category": tool.category,
            "features": tool.features,
            "use_cases": tool.use_cases
        })
        
        print(f"✅ SEO 数据生成成功：{seo_data}")
        
        # 更新工具的 SEO 字段
        tool.meta_title = seo_data.get("meta_title")
        tool.meta_description = seo_data.get("meta_description")
        tool.pros = seo_data.get("pros")
        tool.cons = seo_data.get("cons")
        tool.faqs = seo_data.get("faqs")
        
        # 更新状态为 SEO_GENERATED
        tool.review_status = ReviewStatus.SEO_GENERATED
        
        db.add(tool)
        db.commit()
        db.refresh(tool)
        
        return {
            "message": f"工具 {tool.name} 的 SEO 内容已生成，请审核后发布",
            "tool_id": tool_id,
            "review_status": ReviewStatus.SEO_GENERATED,
            "seo_data": {
                "meta_title": tool.meta_title,
                "meta_description": tool.meta_description,
                "pros": tool.pros,
                "cons": tool.cons,
                "faqs": tool.faqs
            }
        }
        
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"❌ SEO 生成失败！")
        print(f"错误类型：{type(e).__name__}")
        print(f"错误信息：{str(e)}")
        print(f"完整堆栈：\n{error_detail}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SEO 生成失败：{str(e)}"
        )


@router.post("/import-seo")
def import_seo_tools(
    file: UploadFile = File(...),
    db: Session = Depends(get_session),
    current_admin: Admin = Depends(get_current_admin)
):
    """Upload a tools JSON and import into the `tools` table.

    Accepts a multipart file upload (JSON array of tool objects). Returns a summary of inserted/skipped items.
    Requires admin authentication.
    """
    try:
        content = file.file.read().decode("utf-8")
        tools_data = json.loads(content)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"无法读取或解析上传的JSON文件: {e}")

    from app.utils.slug import generate_unique_slug

    def ensure_list(val):
        return val if isinstance(val, list) else []

    def ensure_dict_list(val):
        return val if isinstance(val, list) and all(isinstance(i, dict) for i in val) else []

    inserted = 0
    skipped = 0
    errors = []
    try:
        for tool in tools_data:
            try:
                # Helper: ensure strings don't exceed DB column limits
                def _truncate_str(val, max_len):
                    if val is None:
                        return None
                    if not isinstance(val, str):
                        val = str(val)
                    if len(val) <= max_len:
                        return val
                    return val[:max_len]

                exists = db.query(Tool).filter_by(name=tool.get('name')).first()
                if exists:
                    skipped += 1
                    continue
                # sanitize fields that map to varchar limits in the DB
                meta_title_raw = tool.get('meta_title')
                meta_description_raw = tool.get('meta_description')
                slug_raw = tool.get('slug') or tool.get('name')

                meta_title = _truncate_str(meta_title_raw, 60)
                meta_description = _truncate_str(meta_description_raw, 160)

                db_tool = Tool(
                    name=tool.get('name', ''),
                    official_link=tool.get('official_link', ''),
                    category=tool.get('category', ''),
                    category_name=tool.get('category_name', ''),
                    tags=ensure_list(tool.get('tags', [])),
                    pricing_model=tool.get('pricing_model', ''),
                    pricing_model_name=tool.get('pricing_model_name', ''),
                    supported_platforms=ensure_list(tool.get('supported_platforms', [])),
                    features=ensure_list(tool.get('features', [])),
                    use_cases=ensure_list(tool.get('use_cases', [])),
                    key_differentiators=ensure_list(tool.get('key_differentiators', [])),
                    pricing_details=tool.get('pricing_details', ''),
                    rating=tool.get('rating', 0),
                    is_featured=tool.get('is_featured', False),
                    logo_url=tool.get('logo_url', ''),
                    screenshots=ensure_list(tool.get('screenshots', [])),
                    video_url=tool.get('video_url', ''),
                    meta_title=meta_title,
                    meta_description=meta_description,
                    description=tool.get('description', ''),
                    short_description=tool.get('short_description', ''),
                    pros=ensure_list(tool.get('pros', [])),
                    cons=ensure_list(tool.get('cons', [])),
                    faqs=ensure_dict_list(tool.get('faqs', [])),
                    review_status=str(tool.get('review_status', 'PUBLISHED'))
                )
                # ensure slug exists and fits DB length (truncate if necessary)
                if not getattr(db_tool, 'slug', None):
                    db_tool.slug = generate_unique_slug(db, Tool, slug_raw)
                if db_tool.slug and len(db_tool.slug) > 60:
                    db_tool.slug = db_tool.slug[:60]
                db.add(db_tool)
                db.commit()
                inserted += 1
            except Exception as e:
                db.rollback()
                errors.append({"name": tool.get('name'), "error": str(e)})
        return {"inserted": inserted, "skipped": skipped, "errors": errors}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/import-seo-auto-split")
def import_seo_tools_auto_split(
    file: UploadFile = File(...),
    overwrite: bool = False,
    db: Session = Depends(get_session),
    current_admin: Admin = Depends(get_current_admin)
):
    """Upload a large tools JSON and run `import_tools_auto_split.py` server-side.

    Saves the uploaded file under `backend/scripts/` with a timestamped name,
    invokes the `import_tools_auto_split.py` script using the running Python
    interpreter, and returns the script stdout/stderr and exit code.
    """
    try:
        # Do not write files into the repository directory. Create a system
        # temporary file and pass its path to the import script. The temp file
        # will be removed after the script finishes.
        filename = getattr(file, 'filename', f"upload_{int(time.time())}.json")
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.json')
        try:
            tmp.write(file.file.read())
            tmp.flush()
            dest_path = tmp.name
        finally:
            tmp.close()

        # locate script in repository scripts/ but do not save uploads there
        scripts_dir = os.path.abspath(os.path.join(backend_root, 'scripts'))
        script_path = os.path.join(scripts_dir, 'import_tools_auto_split.py')
        if not os.path.exists(script_path):
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server missing import_tools_auto_split.py")
        # The import script expects the filepath as a positional argument (sys.argv[1]).
        cmd = [sys.executable, script_path, dest_path]

        # run script (capture output); ensure temp file is removed afterward
        try:
            try:
                proc = subprocess.run(cmd, capture_output=True, text=True, timeout=60*10)
            except subprocess.TimeoutExpired:
                raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail="Import script timed out")

            return {
                "success": proc.returncode == 0,
                "returncode": proc.returncode,
                "stdout": proc.stdout,
                "stderr": proc.stderr,
                "uploaded_file": filename
            }
        finally:
            try:
                if os.path.exists(dest_path):
                    os.remove(dest_path)
            except Exception:
                pass

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/delete/{table_key}")
def delete_table_data(
    table_key: str,
    db: Session = Depends(get_session),
    current_admin: Admin = Depends(get_current_admin)
):
    """Delete all rows from an allowed table (does not drop the table schema).

    Allowed `table_key` values:
    - "seo_tools" -> `Tool`
    - "users" -> `User`
    - "workflows" -> `WorkflowTemplate` (also clears related `WorkflowNode` rows)
    """
    allowed = {
        "seo_tools": Tool,
        "users": User,
        "workflows": WorkflowTemplate,
        "category_mapping": Category
    }

    model = allowed.get(table_key)
    if not model:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown table key: {table_key}")

    try:
        # For workflows, delete child nodes first to avoid FK constraint issues
        if table_key == "workflows":
            db.exec(delete(WorkflowNode))

        # For tools, delete dependent child rows first to avoid FK constraint issues
        if table_key == "seo_tools":
            # Use table-level deletes to ensure SQL is executed directly against DB
            # Delete translations and faqs which reference tools.id and commit before deleting tools
            try:
                res1 = db.exec(ToolTranslation.__table__.delete())
                res2 = db.exec(ToolFAQ.__table__.delete())
                # commit child deletes separately to ensure FK constraints are cleared
                db.commit()
            except Exception as e:
                db.rollback()
                raise

        # Use table-level delete for the target model to avoid ORM bulk-delete oddities
        try:
            result = db.exec(model.__table__.delete())
            db.commit()
        except Exception:
            db.rollback()
            raise
        # result.rowcount may be None depending on DB; return boolean and attempt count
        rows_deleted = getattr(result, 'rowcount', None)
        return {"deleted": True, "rows_deleted": rows_deleted}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/is-admin")
def is_admin_username(
    username: str,
    db: Session = Depends(get_session)
):
    """Check whether the provided username corresponds to an Admin account.

    Public endpoint used by the frontend to avoid hardcoding admin emails.
    Returns: {"is_admin": true|false}
    """
    try:
        stmt = select(Admin).where(Admin.username == username)
        admin = db.exec(stmt).first()
        return {"is_admin": bool(admin)}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/generate-category-mapping")
def generate_category_mapping(
    mapping_file: str = "backend/scripts/category_mapping.json",
    commit: bool = False,
    mapping_override: Optional[dict] = Body(None),
    force: bool = False,
    db: Session = Depends(get_session),
    current_admin: Admin = Depends(get_current_admin)
):
    """Generate category mapping for unmapped tool categories using LLM.

    Reads all `Tool.category` values from the DB, compares against an existing mapping
    file (JSON dict) and asks the LLM to cluster and name groups for unmapped categories.
    The merged mapping is saved to `mapping_file` and the new mappings are returned.
    """
    try:
        # Use canonical mapping file in backend/scripts/category_mapping.json
        default_mapping_path = os.path.abspath(os.path.join(backend_root, 'scripts', 'category_mapping.json'))
        mapping_file = default_mapping_path
        existing = {}
        if os.path.exists(mapping_file):
            try:
                with open(mapping_file, 'r', encoding='utf-8') as mf:
                    existing = json.load(mf) or {}
            except Exception:
                existing = {}

        # collect categories from DB (do NOT rely on any external mapping_file)
        stmt = select(Tool)
        tools = db.exec(stmt).all()
        all_cats = set()
        for t in tools:
            cat = getattr(t, 'category', None)
            if cat:
                all_cats.add(cat)

        # For "always regenerate" behavior, always consider all_cats as "unmapped" for LLM generation
        # The existing mapping is still loaded, but won't filter the list of categories sent to the LLM
        # for generating new mapping candidates in preview mode.
        categories_to_map = sorted(list(all_cats))
        if not categories_to_map:
            return {"message": "No categories found in DB to map", "new_mappings": {}}

        categories_list_str = "\n- ".join(categories_to_map)
        # Stronger prompt: ask the model to produce a smaller, user-friendly set of display categories
        prompt = (
            "你是一位顶尖的 AI 产品分类架构师。你的任务是将提供的杂乱、细碎的原始分类名称，整合成一套**简洁、清晰、面向最终用户**的工具分类体系。\n"
            "最终的目标是生成一个高质量、人性化的映射表，供用户筛选工具使用。\n"
            "请严格遵循以下步骤和要求：\n"
            "\n--- 约束与目标 ---\n"
            "1. **聚类原则 (Clustering):** 根据工具的**最终应用场景和主要功能**（而非底层技术）进行分组。例如，将所有与内容、文本、SEO 相关的合并。\n"
            "2. **目标数量 (Minimization):** 请务必将**最终的唯一展示分类数量控制在 8 到 10 个之间**（不可超过 10 个）。如果识别到更多细分，请务必将相近或相关的分类合并为更宽泛的父标签。\n"
            "3. **命名规范 (Naming):** 定义的每个目标展示分类名称必须：\n"
            "   a) 使用**简体中文**。\n"
            "   b) **不超过 6 个汉字**。\n"
            "   c) 必须**用户友好，通用易懂**，例如：使用 '图像生成'，而不是 'Ai Image Gen' 或 'Text-to-Image'。\n"
            "4. **避免冗余合并：** 避免近义但形式不同的重复标签（例如 '内容创作' 与 '写作辅助' 应合并为同一标签，如 '内容/写作'）。\n"
            "\n--- 待聚类和映射的原始分类列表 ---\n"
            f"- {categories_list_str}\n"
            "\n--- 输出要求 ---\n"
            "请直接返回一个 JSON 对象，**不要包含任何解释性文字或 Markdown 代码块**。其中 Key 是原始分类名称，Value 是你最终确定的目标展示分类名称。\n"
            "**请再次确认，输出中 Value 的唯一值数量不超过 10 个。**\n"
        )

        # Import the ai_api_utils helpers at runtime. Forcing LLM calls every time means
        # we should fail fast and return a clear error if the optional LLM helpers
        # or API configuration are unavailable.
        try:
            from scripts.ai_api_utils import call_model, extract_json_from_text, save_mapping
        except Exception as e:
            # Don't silently fall back — inform the caller that LLM support is required.
            err_msg = (
                "LLM helper modules are not available.\n"
                "Please install optional dependencies: `pip install requests beautifulsoup4 pyyaml`\n"
                f"Import error: {e}"
            )
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=err_msg)

        # call the model and parse with fallback
        new_mapping = None
        used_fallback = False
        llm_error = None
        try:
            # Always call the configured model. call_model will raise if no API key is set.
            model_response = call_model(prompt)
            new_mapping = extract_json_from_text(model_response)
            if not isinstance(new_mapping, dict):
                llm_error = "Model did not return a JSON mapping object"
                new_mapping = None
        except Exception as e:
            # Bubble up LLM errors as a 502 to indicate an upstream model/service problem.
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"LLM generation failed: {e}")

        # If LLM failed or returned invalid data, create a simple deterministic fallback mapping
        if not isinstance(new_mapping, dict):
            used_fallback = True
            def normalize_display(s: str) -> str:
                s = (s or '').strip()
                # basic cleanup: replace slashes/underscores, collapse spaces, title-case
                s = s.replace('/', ' ').replace('_', ' ')
                s = ' '.join(s.split())
                # shorten long names to 12 chars for display purposes
                disp = s.title()
                if len(disp) > 12:
                    disp = disp[:12].rstrip()
                if not disp:
                    disp = 'Other'
                return disp

            new_mapping = {cat: normalize_display(cat) for cat in categories_to_map}

        # If the caller provided a non-empty mapping_override in the request body, use it when committing.
        # Note: FastAPI will deserialize an empty JSON body to `{}` which we should treat as "no override".
        if commit and isinstance(mapping_override, dict) and mapping_override:
            # Validate mapping_override shape: keys are original categories, values are display names
            try:
                validated = {str(k): str(v) for k, v in mapping_override.items()}
                new_mapping = validated
                used_fallback = False
            except Exception:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid mapping_override body; expected JSON object mapping original->display.")

        # If this is a preview (commit==False), return generated mapping without saving/upserting
        if not commit:
            merged_preview = existing.copy()
            merged_preview.update(new_mapping)
            return {
                "message": "Mapping generated (preview)",
                "new_mappings": new_mapping,
                "merged_mapping": merged_preview,
                "used_fallback": used_fallback,
                "commit": False
            }

        # merge and save to file (commit == True)
        updated = existing.copy()
        updated.update(new_mapping)
        os.makedirs(os.path.dirname(mapping_file) or '.', exist_ok=True)
        save_mapping(updated, mapping_file)

        # Additionally, ensure the canonical mapping file is overwritten by this commit
        # so that temporary preview files (passed from frontend) are persisted to the main mapping.
        try:
            default_mapping_path = os.path.abspath(os.path.join(backend_root, 'scripts', 'category_mapping.json'))
            provided_abs = os.path.abspath(mapping_file)
            if provided_abs != default_mapping_path:
                # Ensure target dir exists
                os.makedirs(os.path.dirname(default_mapping_path), exist_ok=True)
                save_mapping(updated, default_mapping_path)
                mapping_file_saved_to_default = True
            else:
                mapping_file_saved_to_default = True
        except Exception:
            mapping_file_saved_to_default = False

        # Upsert new mappings into the CategoryMapping table with detailed stats
        stats = {"inserted": 0, "updated": 0, "skipped": 0}
        for orig_cat, disp_cat in new_mapping.items():
            try:
                stmt = select(Category).where(Category.original_category == orig_cat)
                existing_row = db.exec(stmt).first()
                if existing_row:
                    # if force is set, always overwrite and count as updated
                    if force:
                        existing_row.display_category = disp_cat
                        existing_row.updated_at = datetime.utcnow()
                        db.add(existing_row)
                        stats["updated"] += 1
                    else:
                        # update only when changed
                        if existing_row.display_category != disp_cat:
                            existing_row.display_category = disp_cat
                            existing_row.updated_at = datetime.utcnow()
                            db.add(existing_row)
                            stats["updated"] += 1
                        else:
                            stats["skipped"] += 1
                else:
                    new_row = Category(original_category=orig_cat, display_category=disp_cat)
                    db.add(new_row)
                    stats["inserted"] += 1
            except Exception:
                # don't fail the whole operation for a single bad row
                db.rollback()
        try:
            db.commit()
        except Exception:
            db.rollback()

        resp = {
            "message": "Mapping generated",
            "new_mappings": new_mapping,
            "mapping_file": mapping_file,
            "stats": stats,
            "db_upserted": stats.get("inserted", 0) + stats.get("updated", 0),
            "used_fallback": used_fallback,
            "commit": True,
            "force": force,
            "mapping_file_saved_to_default": mapping_file_saved_to_default
        }
        return resp

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
