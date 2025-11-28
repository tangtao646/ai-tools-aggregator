# api_utils.py

import json
import os
import re
from typing import Dict, Any, List
import requests
from bs4 import BeautifulSoup
import yaml

# --- Data Loading and Saving ---

def load_tools(path: str) -> List[Dict[str, Any]]:
    """Loads a full JSON file."""
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            print(f"Warning: Could not fully parse {path}. File may be incomplete or corrupted.")
            # 尝试修复
            try:
                f.seek(0)
                content = f.read().strip()
                if content.startswith("[") and not content.endswith("]"):
                    if content.endswith(","):
                        content = content[:-1]
                    content += "]"
                    return json.loads(content)
            except Exception:
                return []
            return []



def save_tools(tools: List[Dict[str, Any]], path: str):
    """Saves a full list of tools to a JSON file."""
    with open(path, "w", encoding="utf-8") as f:
        # 确保输出格式与输入文件一致
        json.dump(tools, f, ensure_ascii=False, indent=2)

# --- 新增/修正 ---
# save_mapping 是用于保存字典的通用函数，它与 save_tools 功能相同，用于生成映射脚本
def save_mapping(mapping: Dict[str, str], path: str):
    """将映射字典保存为 JSON 文件，确保格式良好。"""
    with open(path, "w", encoding="utf-8") as f:
        # 使用 indent=4 更好地格式化映射文件
        json.dump(mapping, f, ensure_ascii=False, indent=4, sort_keys=True)

# --- Site Scraping ---

def fetch_site_metadata(url: str) -> Dict[str, Any]:
    """Fetch page and extract basic metadata useful for validation."""
    try:
        r = requests.get(url, timeout=8, headers={"User-Agent": "metadata-checker/1.0"})
        r.raise_for_status()
    except Exception as e:
        # print(f"Warning: Failed to fetch metadata for {url}. Error: {e}") # 避免在工具中重复打印
        return {}
    
    html = r.text
    soup = BeautifulSoup(html, "html.parser")
    metas = {}
    title = soup.title.string.strip() if soup.title and soup.title.string else None
    metas["title"] = title
    desc = None
    dtag = soup.find("meta", attrs={"name": "description"})
    if dtag and dtag.get("content"):
        desc = dtag.get("content").strip()
    og_desc = soup.find("meta", attrs={"property": "og:description"})
    if og_desc and og_desc.get("content"):
        desc = desc or og_desc.get("content").strip()
    metas["description"] = desc
    og_image = soup.find("meta", attrs={"property": "og:image"})
    metas["og_image"] = og_image.get("content").strip() if og_image and og_image.get("content") else None
    
    return metas


# --- Robust JSON Extraction ---

def extract_json_from_text(text: str) -> Any:
    """
    Tries direct load, then looks for JSON blocks in Markdown format, then uses brace counting.
    """
    text = text.strip()
    
    # 1. Try to parse JSON directly
    try:
        return json.loads(text)
    except Exception:
        pass
    
    # 2. Try to extract content from Markdown JSON block (```json ... ```)
    match = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL)
    if match:
        candidate = match.group(1).strip()
        try:
            return json.loads(candidate)
        except Exception:
            pass
            
    # 3. Original logic: find first { ... } that balances
    start = text.find("{")
    if start == -1:
        raise ValueError("Could not extract JSON: No opening brace found.")
    
    depth = 0
    for i in range(start, len(text)):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                candidate = text[start:i + 1]
                try:
                    return json.loads(candidate)
                except Exception:
                    break
    
    raise ValueError("Could not extract JSON from model output: Unparsable content or unbalanced braces.")


# --- API Callers ---

def call_gemini(prompt: str, model: str, api_key: str, timeout: int = 60) -> str:
    """Uses the Gemini API to generate content."""
    url = f"https://generativelanguage.googleapis.com/v1/models/{model}:generateContent?key={api_key}"
    
    payload = {
        "contents": [
            {"role": "user", "parts": [{"text": prompt}]}
        ],
        "generationConfig": { 
            "temperature": 0
        }
    }
    
    try:
        r = requests.post(url, json=payload, timeout=timeout)
        r.raise_for_status()
    except requests.exceptions.HTTPError as e:
        error_details = {"response_code": e.response.status_code}
        try:
            if 'application/json' in r.headers.get('Content-Type', ''):
                 error_details.update(e.response.json())
            else:
                 error_details["raw_text"] = e.response.text
        except:
             error_details["raw_text"] = e.response.text
        
        raise ValueError(f"Gemini API returned {e.response.status_code}. Details: {json.dumps(error_details, ensure_ascii=False)}")
    except requests.exceptions.ReadTimeout as e:
        raise ConnectionError(f"Gemini API Read timed out. (read timeout={timeout})") from e

    data = r.json()
    
    if data.get("candidates") and data["candidates"][0].get("content"):
        parts = data["candidates"][0]["content"].get("parts", [])
        if parts:
            return parts[0].get("text", "")

    raise ValueError(f"Could not extract content from Gemini response: {json.dumps(data, ensure_ascii=False)}")


def call_openai_chat(prompt: str, model: str, api_key: str, timeout: int = 60) -> str:
    """Uses OpenAI with explicit JSON mode for reliability."""
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    body = {
        "model": model, 
        "messages": [{"role": "user", "content": prompt}], 
        "temperature": 0,
        "response_format": {"type": "json_object"}
    }
    
    try:
        r = requests.post(url, json=body, headers=headers, timeout=timeout)
        r.raise_for_status()
    except requests.exceptions.ReadTimeout as e:
        raise ConnectionError(f"OpenAI API Read timed out. (read timeout={timeout})") from e

    data = r.json()
    return data["choices"][0]["message"]["content"]


def call_model(prompt: str) -> str:
    # 配置文件和环境变量加载逻辑
    config_path = os.path.join(os.path.dirname(__file__), "config.yaml")
    gemini_key = None
    gemini_model = None
    openai_key = None
    openai_model = None
    
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as cf:
                cfg = yaml.safe_load(cf)
                gemini_cfg = cfg.get("gemini") if isinstance(cfg, dict) else None
                if gemini_cfg:
                    gemini_key = gemini_cfg.get("api_key") or gemini_cfg.get("api_key")
                    gemini_model = gemini_cfg.get("model")
        except Exception:
            pass

    gemini_key = os.environ.get("GEMINI_API_KEY") or gemini_key
    gemini_model = os.environ.get("GEMINI_MODEL") or gemini_model or "gemini-2.5-flash"
    openai_key = os.environ.get("OPENAI_API_KEY")
    openai_model = os.environ.get("OPENAI_MODEL") or "gpt-4o-mini"
    
    if gemini_key:
        print(f"-> Calling Gemini model: {gemini_model}")
        return call_gemini(prompt, gemini_model, gemini_key)
    elif openai_key:
        print(f"-> Calling OpenAI model: {openai_model}")
        return call_openai_chat(prompt, openai_model, openai_key)
    else:
        raise RuntimeError("No API key found. Set GEMINI_API_KEY or OPENAI_API_KEY in environment or configure `config.yaml`.")