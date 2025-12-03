package generate

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
)

// GenerateClusteringPrompt builds the prompt text for clustering and mapping.
// This function is now focused on generating the English display categories (Step 1: Clustering and Naming).
func GenerateClusteringPrompt(unmapped []string) string {
	var b strings.Builder
	b.WriteString("You are a professional AI tools taxonomy designer. Your task is to analyze a list of unstructured raw category names and perform the following operations:\n")
	b.WriteString("1. Clustering: Group these raw categories into the most logical clusters based on semantic and functional similarity (min 6 groups, max 15 groups).\n")
	b.WriteString("2. Naming: Define a concise, universal, and user-friendly target display category name for each group (in English, max 3 words).\n")
	b.WriteString("3. Mapping: Map each raw category to its defined target display category name.\n")
	b.WriteString("4. Output Format: Strictly return a JSON object where the Key is the raw category name and the Value is its assigned target display category name (in English).\n\n")
	b.WriteString("--- List of raw categories to cluster and map ---\n")
	for _, c := range unmapped {
		b.WriteString("- ")
		b.WriteString(c)
		b.WriteString("\n")
	}
	b.WriteString("\nImportant: The final number of unique display categories should be between 6 and 10 (8-10 preferred). Display category names should be concise (max 3 words), avoid synonymous repetition or over-subdivision.")
	return b.String()
}

// GenerateTranslationPrompt builds the prompt to translate a list of English display categories into Chinese.
// (Step 2: Translation)
func GenerateTranslationPrompt(categories []string) string {
	var b strings.Builder
	b.WriteString("你是一个专业的翻译家。你的任务是将以下英文 AI 工具分类名称翻译成中文。中文名称必须简洁、通用且用户友好（不超过6个汉字）。\n")
	b.WriteString("输出格式: 严格返回一个 JSON 对象，其中 Key 是英文分类名称，Value 是对应的中文翻译。\n\n")
	b.WriteString("--- 待翻译的英文展示分类列表 ---\n")
	for _, c := range categories {
		b.WriteString("- ")
		b.WriteString(c)
		b.WriteString("\n")
	}
	b.WriteString("\n重要：中文翻译必须在 6 个汉字以内。")
	return b.String()
}

// ExtractJSONFromText attempts to extract a JSON object embedded in free text.
func ExtractJSONFromText(text string) (map[string]interface{}, error) {
	text = strings.TrimSpace(text)
	var out map[string]interface{}
	if err := json.Unmarshal([]byte(text), &out); err == nil {
		return out, nil
	}

	// Try ```json block
	re := regexp.MustCompile("(?s)```json\\s*(.*?)\\s*```")
	if m := re.FindStringSubmatch(text); len(m) > 1 {
		if err := json.Unmarshal([]byte(m[1]), &out); err == nil {
			return out, nil
		}
	}

	// Find first balanced { ... }
	start := strings.Index(text, "{")
	if start == -1 {
		return nil, errors.New("no opening brace found")
	}
	depth := 0
	for i := start; i < len(text); i++ {
		ch := text[i]
		if ch == '{' {
			depth++
		} else if ch == '}' {
			depth--
			if depth == 0 {
				candidate := text[start : i+1]
				if err := json.Unmarshal([]byte(candidate), &out); err == nil {
					return out, nil
				}
				break
			}
		}
	}
	return nil, errors.New("could not extract JSON from model output")
}

// LoadExistingMappingFromDB reads categories and translations from DB and returns a bilingual mapping
func LoadExistingMappingFromDB(db *sqlx.DB) (map[string]map[string]string, error) {
	bilingual := map[string]map[string]string{}
	rows, err := db.Queryx(`SELECT c.original_category, ct.lang_code, ct.display_category FROM categories c LEFT JOIN category_translations ct ON ct.category_id = c.id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var orig string
		var lang sql.NullString
		var disp sql.NullString
		if err := rows.Scan(&orig, &lang, &disp); err != nil {
			continue
		}
		if _, ok := bilingual[orig]; !ok {
			bilingual[orig] = map[string]string{"zh": "", "en": ""}
		}
		if lang.Valid && disp.Valid {
			bilingual[orig][lang.String] = disp.String
		}
	}
	return bilingual, nil
}

// GenerateCategoryMapping generates a single-language mapping (prefer zh) using the DB as source.
// This is now based on English clustering followed by Chinese translation.
func GenerateCategoryMapping(db *sqlx.DB, model string) (map[string]string, string, error) {
	// Load distinct categories from tools table
	rows, err := db.Queryx(`SELECT DISTINCT category FROM tools WHERE category IS NOT NULL AND TRIM(category) <> ''`)
	if err != nil {
		return nil, "", fmt.Errorf("failed to query tools categories: %w", err)
	}
	defer rows.Close()

	var categories []string
	for rows.Next() {
		var cat sql.NullString
		if err := rows.Scan(&cat); err != nil {
			continue
		}
		if cat.Valid {
			s := strings.TrimSpace(cat.String)
			if s != "" {
				categories = append(categories, s)
			}
		}
	}

	if len(categories) == 0 {
		return nil, "No categories found in tools table.", nil
	}

	existingBilingual, err := LoadExistingMappingFromDB(db)
	if err != nil {
		return nil, "", fmt.Errorf("failed to load existing mapping from DB: %w", err)
	}

	// flatten existing to single-language map (prefer zh then en)
	existing := map[string]string{}
	for k, v := range existingBilingual {
		if s := strings.TrimSpace(v["zh"]); s != "" {
			existing[k] = s
		} else if s := strings.TrimSpace(v["en"]); s != "" {
			existing[k] = s
		} else {
			existing[k] = ""
		}
	}

	// compute unmapped categories
	var unmapped []string
	for _, c := range categories {
		if _, ok := existing[c]; !ok {
			unmapped = append(unmapped, c)
		}
	}
	sort.Strings(unmapped)

	if len(unmapped) == 0 {
		return nil, "No new unmapped categories found.", nil
	}

	// --- NEW STRATEGY ---

	// STEP 1: Generate English Mapping (Clustering and Naming)
	promptEn := GenerateClusteringPrompt(unmapped)

	// Call model for English mapping
	content, err := CallModel(promptEn)
	if err != nil {
		return nil, promptEn, errors.New(err.Error())
	}
	enParsed, err := ExtractJSONFromText(content)
	if err != nil {
		return nil, content, fmt.Errorf("failed to parse en JSON: %w", err)
	}

	// Normalize parsed map to map[string]string: Original -> English Display
	enMap := map[string]string{}
	uniqueEnCategories := map[string]struct{}{}
	for k, v := range enParsed {
		if s, ok := v.(string); ok {
			enMap[k] = s
			uniqueEnCategories[s] = struct{}{}
		} else {
			enMap[k] = fmt.Sprintf("%v", v)
			uniqueEnCategories[fmt.Sprintf("%v", v)] = struct{}{}
		}
	}

	// Extract unique English categories for translation
	var categoriesToTranslate []string
	for cat := range uniqueEnCategories {
		if cat != "" {
			categoriesToTranslate = append(categoriesToTranslate, cat)
		}
	}
	sort.Strings(categoriesToTranslate)

	if len(categoriesToTranslate) == 0 {
		// If no English categories were generated, return existing map.
		return existing, "No new categories to translate after English clustering.", nil
	}

	// STEP 2: Translate English Display Categories to Chinese Display
	promptZh := GenerateTranslationPrompt(categoriesToTranslate)

	// Call model for Chinese translation
	zhResp, err := CallModel(promptZh)
	if err != nil {
		return nil, promptZh, fmt.Errorf("zh translation model call failed: %w", err)
	}
	zhParsed, err := ExtractJSONFromText(zhResp)
	if err != nil {
		return nil, zhResp, fmt.Errorf("failed to parse zh translation JSON: %w", err)
	}

	// Normalize translation map to map[string]string: English Display -> Chinese Display
	translationMap := map[string]string{}
	for k, v := range zhParsed {
		if s, ok := v.(string); ok {
			translationMap[k] = s
		} else {
			translationMap[k] = fmt.Sprintf("%v", v)
		}
	}

	// STEP 3: Create the final ZH map (Original -> ZH Display) and merge into existing (in-memory)
	newMap := map[string]string{}
	for orig, enDisp := range enMap {
		zhDisp, ok := translationMap[enDisp]
		if ok && zhDisp != "" {
			newMap[orig] = zhDisp
		} else {
			// Fallback: use English display if translation failed
			newMap[orig] = enDisp
		}
	}

	// merge newMap into existing (in-memory)
	for k, v := range newMap {
		existing[k] = v
	}

	return existing, "Generated mapping from DB-backed source (English cluster then Chinese translation)", nil
}

// GenerateBilingualMappingsFromDB generates bilingual mappings (zh + en) from DB categories and existing translations.
// This is now based on English clustering followed by Chinese translation (Step 1, 2, 3).
func GenerateBilingualMappingsFromDB(db *sqlx.DB, model string) (map[string]map[string]string, string, error) {
	// Load distinct categories from tools table
	rows, err := db.Queryx(`SELECT DISTINCT category FROM tools WHERE category IS NOT NULL AND TRIM(category) <> ''`)
	if err != nil {
		return nil, "", fmt.Errorf("failed to query tools categories: %w", err)
	}
	defer rows.Close()

	var categories []string
	for rows.Next() {
		var cat sql.NullString
		if err := rows.Scan(&cat); err != nil {
			continue
		}
		if cat.Valid {
			s := strings.TrimSpace(cat.String)
			if s != "" {
				categories = append(categories, s)
			}
		}
	}

	if len(categories) == 0 {
		return nil, "No categories found in tools table.", nil
	}

	existingBilingual, err := LoadExistingMappingFromDB(db)
	if err != nil {
		return nil, "", fmt.Errorf("failed to load existing mapping from DB: %w", err)
	}

	// flatten to check unmapped keys
	existingFlat := map[string]string{}
	for k, v := range existingBilingual {
		if v["zh"] != "" {
			existingFlat[k] = v["zh"]
		} else if v["en"] != "" {
			existingFlat[k] = v["en"]
		} else {
			existingFlat[k] = ""
		}
	}

	// compute unmapped from categories list
	var unmapped []string
	set := map[string]struct{}{}
	for _, c := range categories {
		if _, ok := existingFlat[c]; !ok {
			if _, seen := set[c]; !seen {
				unmapped = append(unmapped, c)
				set[c] = struct{}{}
			}
		}
	}
	sort.Strings(unmapped)

	if len(unmapped) == 0 {
		return existingBilingual, "No new unmapped categories found.", nil
	}

	// --- NEW STRATEGY ---

	// STEP 1: Generate English Mapping (Clustering and Naming)
	promptEn := GenerateClusteringPrompt(unmapped)

	// Call model for English mapping
	enResp, err := CallModel(promptEn)
	if err != nil {
		return nil, promptEn, errors.New(err.Error())
	}
	enParsed, err := ExtractJSONFromText(enResp)
	if err != nil {
		return nil, enResp, fmt.Errorf("failed to parse en JSON: %w", err)
	}

	// Normalize parsed map to map[string]string: Original -> English Display
	enMap := map[string]string{}
	uniqueEnCategories := map[string]struct{}{}
	for k, v := range enParsed {
		if s, ok := v.(string); ok {
			enMap[k] = s
			uniqueEnCategories[s] = struct{}{}
		} else {
			enMap[k] = fmt.Sprintf("%v", v)
			uniqueEnCategories[fmt.Sprintf("%v", v)] = struct{}{}
		}
	}

	// Extract unique English categories for translation
	var categoriesToTranslate []string
	for cat := range uniqueEnCategories {
		if cat != "" {
			categoriesToTranslate = append(categoriesToTranslate, cat)
		}
	}
	sort.Strings(categoriesToTranslate) // Sort for stable prompt input

	if len(categoriesToTranslate) == 0 {
		return existingBilingual, "No new categories to translate after English clustering.", nil
	}

	// STEP 2: Translate English Display Categories to Chinese Display
	promptZh := GenerateTranslationPrompt(categoriesToTranslate)

	// Call model for Chinese translation
	zhResp, err := CallModel(promptZh)
	if err != nil {
		return nil, promptZh, fmt.Errorf("zh translation model call failed: %w", err)
	}
	zhParsed, err := ExtractJSONFromText(zhResp)
	if err != nil {
		return nil, zhResp, fmt.Errorf("failed to parse zh translation JSON: %w", err)
	}

	// Normalize translation map to map[string]string: English Display -> Chinese Display
	translationMap := map[string]string{}
	for k, v := range zhParsed {
		if s, ok := v.(string); ok {
			translationMap[k] = s
		} else {
			translationMap[k] = fmt.Sprintf("%v", v)
		}
	}

	// STEP 3: Merge into bilingual map (Original -> {zh, en})
	bilingual := existingBilingual

	// Iterate over the newly generated English mapping
	for orig, enDisp := range enMap {
		zhDisp, ok := translationMap[enDisp]
		if !ok {
			zhDisp = "" // No translation found, default to empty
		}

		if _, exists := bilingual[orig]; !exists {
			bilingual[orig] = map[string]string{"zh": zhDisp, "en": enDisp}
		} else {
			// Update existing entry with new mapping
			if enDisp != "" {
				bilingual[orig]["en"] = enDisp
			}
			if zhDisp != "" {
				bilingual[orig]["zh"] = zhDisp
			}
		}
	}

	return bilingual, "Generated bilingual mappings using English cluster and Chinese translation.", nil
}

// UpsertCategoryTranslations upserts categories and category_translations for zh and en
func UpsertCategoryTranslations(db *sqlx.DB, bilingual map[string]map[string]string) (map[string]int, error) {
	summary := map[string]int{"categories_inserted": 0, "translations_inserted": 0, "translations_updated": 0}

	tx, err := db.Beginx()
	if err != nil {
		return summary, err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	for orig, langs := range bilingual {
		// Ensure category exists
		var catID int
		err = tx.Get(&catID, "SELECT id FROM categories WHERE original_category = $1", orig)
		if err != nil {
			if err == sql.ErrNoRows {
				// insert
				err = tx.Get(&catID, "INSERT INTO categories (original_category, created_at, updated_at) VALUES ($1, $2, $2) RETURNING id", orig, time.Now())
				if err != nil {
					return summary, fmt.Errorf("failed to insert category %s: %w", orig, err)
				}
				summary["categories_inserted"]++
			} else {
				return summary, fmt.Errorf("failed to query category %s: %w", orig, err)
			}
		}

		// Upsert translations for zh and en
		for _, lang := range []string{"zh", "en"} {
			disp := langs[lang]
			if disp == "" {
				// skip empty
				continue
			}
			var exists int
			err = tx.Get(&exists, "SELECT COUNT(*) FROM category_translations WHERE category_id = $1 AND lang_code = $2", catID, lang)
			if err != nil {
				return summary, fmt.Errorf("failed to query translation for %s:%s: %w", orig, lang, err)
			}
			if exists > 0 {
				// update
				_, err = tx.Exec("UPDATE category_translations SET display_category = $1 WHERE category_id = $2 AND lang_code = $3", disp, catID, lang)
				if err != nil {
					return summary, fmt.Errorf("failed to update translation for %s:%s: %w", orig, lang, err)
				}
				summary["translations_updated"]++
			} else {
				_, err = tx.Exec("INSERT INTO category_translations (category_id, lang_code, display_category) VALUES ($1, $2, $3)", catID, lang, disp)
				if err != nil {
					return summary, fmt.Errorf("failed to insert translation for %s:%s: %w", orig, lang, err)
				}
				summary["translations_inserted"]++
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return summary, err
	}
	return summary, nil
}
