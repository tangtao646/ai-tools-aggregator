package scripts

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/tangtao646/ai-tools-aggregator-go/internal/generate"
)

// LoadJSONFile loads a JSON array from path into a slice of map[string]interface{}
func LoadJSONFile(path string) ([]map[string]interface{}, error) {
	jb, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var out []map[string]interface{}
	if err := json.Unmarshal(jb, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// SaveJSONFile writes the slice to the given path as pretty JSON
func SaveJSONFile(path string, data []map[string]interface{}) error {
	if path == "" {
		return fmt.Errorf("empty path")
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	jb, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return err
	}
	return ioutil.WriteFile(path, jb, 0o644)
}

// extractJSONArray attempts to extract the first JSON array found in text and unmarshal it
func extractJSONArray(text string) ([]map[string]interface{}, error) {
	// Locate first '[' and the matching last ']'
	start := strings.Index(text, "[")
	end := strings.LastIndex(text, "]")
	if start == -1 || end == -1 || end <= start {
		// Try to unmarshal entire text
		var arr []map[string]interface{}
		if err := json.Unmarshal([]byte(text), &arr); err != nil {
			return nil, fmt.Errorf("no JSON array found and direct unmarshal failed: %w", err)
		}
		return arr, nil
	}
	candidate := text[start : end+1]
	var arr []map[string]interface{}
	if err := json.Unmarshal([]byte(candidate), &arr); err != nil {
		// try direct unmarshal of text as fallback
		if err2 := json.Unmarshal([]byte(text), &arr); err2 == nil {
			return arr, nil
		}
		return nil, fmt.Errorf("failed to unmarshal extracted array: %w", err)
	}
	return arr, nil
}

// TranslateItem uses the LLM to translate all values in the map to targetLang.
// It returns the translated map (or original on failure) and a bool indicating success.
func TranslateItem(item map[string]interface{}, targetLang string) (map[string]interface{}, bool, error) {
	// Build source JSON snippet
	jb, _ := json.MarshalIndent([]map[string]interface{}{item}, "", "  ")

	// 明确列出需要跳过的键 (已根据您的最新要求添加了 "tags")
	keysToSkip := []string{
		"name",
		"official_link",
		"category",
		"tags", // <-- 确保此字段的值不会被翻译
		"pricing_model",
		"supported_platforms",
		"rating",
		"is_featured",
		"logo_url",
		"screenshots",
		"video_url",
	}
	skipList := strings.Join(keysToSkip, ", ")

	prompt := fmt.Sprintf("您是一位拥有超过10年经验的资深专业翻译师，专注于AI和技术行业的内容翻译。\n"+
		"您的任务是将以下 JSON 结构中的 **需要翻译的值（Value）** 从中文翻译成 **%s**。\n\n"+
		"--- 翻译要求 (严格遵循) ---\n"+
		"1. **键（Key）不变：** 绝对不能翻译 JSON 中的任何键（Key）。\n"+
		"2. **保持结构：** 必须返回一个结构与输入完全相同的 **JSON 列表**，且该列表只包含一个翻译后的字典。\n"+
		"3. **必须跳过的键：** 以下键的值（Value）在任何情况下都必须保持原始值，**绝对不能翻译**：\n   (%s)\n"+
		"4. **语言跳过规则：** 如果某个值（Value）已经明显是目标语言（%s），则无需再次翻译，直接保留原值。**如果所有可翻译字段均已是目标语言，请原样返回完整的 JSON 结构。**\n"+ // <-- 强化了如果所有字段都跳过时的处理方式
		"5. **数据类型跳过规则：** URL、文件路径、数字或布尔值无需翻译。\n"+ // 独立出数据类型规则
		"6. **专业性：** 保持原文的专业含义和专业术语。\n\n"+
		"--- 输入 JSON 数据 ---\n"+
		"%s\n\n"+
		"--- 输出格式要求 ---\n"+
		"请直接返回翻译后的完整 JSON 结构（即一个包含单个字典的列表），并确保它是一个完全有效的、可被 Python `json.loads` 解析的 JSON。",
		targetLang, skipList, targetLang, string(jb))

	out, err := generate.CallModel(prompt)
	if err != nil {
		return item, false, err
	}
	arr, err := extractJSONArray(out)
	if err != nil {
		return item, false, err
	}
	if len(arr) == 0 {
		return item, false, fmt.Errorf("empty array returned by model")
	}
	return arr[0], true, nil
}

// TranslateResumable translates the input list with resume support.
func TranslateResumable(
	data []map[string]interface{},
	targetLang string,
	successPath string,
	failedPath string,
	keyProperty string,
	delaySeconds int,
) (map[string]int, error) {
	// load existing success/failed
	succ := []map[string]interface{}{}
	failed := []map[string]interface{}{}
	if _, err := os.Stat(successPath); err == nil {
		if d, err := LoadJSONFile(successPath); err == nil {
			succ = d
		}
	}
	if _, err := os.Stat(failedPath); err == nil {
		if d, err := LoadJSONFile(failedPath); err == nil {
			failed = d
		}
	}
	translatedNames := map[string]bool{}
	for _, it := range succ {
		if v, ok := it[keyProperty]; ok {
			if s, ok2 := v.(string); ok2 {
				translatedNames[s] = true
			}
		}
	}

	stats := map[string]int{
		"total_items":            len(data),
		"skipped_count":          len(translatedNames),
		"newly_successful_count": 0,
		"newly_failed_count":     0,
		"previous_failed_count":  len(failed),
	}

	fmt.Printf("\n--- 翻译任务启动 ---\n总记录数: %d | 目标语言: %s\n已成功记录数: %d\n先前失败记录数: %d\n待翻译/重试记录数: %d\n----------------------\n",
		stats["total_items"], targetLang, stats["skipped_count"], stats["previous_failed_count"], stats["total_items"]-stats["skipped_count"])

	// enforce a minimum interval between actual LLM calls
	var lastCall time.Time
	// compute desired wait duration: at least 15s, or delaySeconds if larger
	waitDur := time.Duration(delaySeconds) * time.Second
	if waitDur < 15*time.Second {
		waitDur = 15 * time.Second
	}

	for i, item := range data {
		idx := i + 1
		nameVal, ok := item[keyProperty]
		if !ok {
			fmt.Printf("[警告] 第 %d 条记录缺少关键属性 '%s'，跳过。\n", idx, keyProperty)
			continue
		}
		nameStr, _ := nameVal.(string)
		if nameStr == "" {
			fmt.Printf("[警告] 第 %d 条记录关键属性为空，跳过。\n", idx)
			continue
		}
		if translatedNames[nameStr] {
			fmt.Printf("[跳过] 第 %d/%d 条 (Name: %s) 已成功翻译，跳过...\n", idx, stats["total_items"], nameStr)
			continue
		}

		fmt.Printf("\n[处理进度] 正在翻译第 %d/%d 条 (Name: %s)...\n", idx, stats["total_items"], nameStr)

		// Ensure minimum interval since last LLM call
		if !lastCall.IsZero() {
			elapsed := time.Since(lastCall)
			if elapsed < waitDur {
				toWait := waitDur - elapsed
				fmt.Printf("   [速率控制] 在调用 LLM 之前等待 %v ...\n", toWait)
				time.Sleep(toWait)
			}
		}

		translatedItem, ok, err := TranslateItem(item, targetLang)
		if err != nil {
			fmt.Printf("[ERROR] 翻译失败 (Name: %s): %v\n", nameStr, err)
		}
		if ok {
			stats["newly_successful_count"]++
			succ = append(succ, translatedItem)
			if err := SaveJSONFile(successPath, succ); err != nil {
				fmt.Printf("[WARN] 无法保存成功文件: %v\n", err)
			}
			// remove from failed if present (by keyProperty equality)
			for j := 0; j < len(failed); j++ {
				if fv, ok := failed[j][keyProperty]; ok {
					if sv, ok2 := fv.(string); ok2 && sv == nameStr {
						failed = append(failed[:j], failed[j+1:]...)
						j--
					}
				}
			}
			if err := SaveJSONFile(failedPath, failed); err != nil {
				fmt.Printf("[WARN] 无法保存失败文件: %v\n", err)
			}
		} else {
			stats["newly_failed_count"]++
			// append to failed if not already present (key equality)
			found := false
			for _, ff := range failed {
				if fv, ok := ff[keyProperty]; ok {
					if sv, ok2 := fv.(string); ok2 && sv == nameStr {
						found = true
						break
					}
				}
			}
			if !found {
				failed = append(failed, item)
				if err := SaveJSONFile(failedPath, failed); err != nil {
					fmt.Printf("[WARN] 无法保存失败文件: %v\n", err)
				}
			}
		}

		// record time of this call so next iteration can enforce spacing
		lastCall = time.Now()
	}

	return stats, nil
}
