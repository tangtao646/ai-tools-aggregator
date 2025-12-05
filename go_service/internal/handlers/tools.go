// backend/go_service/internal/handlers/tools.go
package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
	"github.com/tangtao646/ai-tools-aggregator-go/internal/config"
	"github.com/tangtao646/ai-tools-aggregator-go/internal/models"
)

func RegisterToolsRoutes(rg *gin.RouterGroup, db *sqlx.DB, cfg *config.Config) {
	toolsg := rg.Group("/tools")
	{
		toolsg.GET("/compact", getToolsCompact(db))
		toolsg.GET("", getTools(db))
		toolsg.GET("/display-categories", getDisplayCategories(db))
		toolsg.GET("/:id", getToolByIDOrSlug(db, cfg))
		toolsg.GET("/:id/related", getRelatedTools(db, cfg))
		// POST/PUT/DELETE will be added later
	}
}

// getDisplayCategories returns distinct display_category values (optionally by lang_code)
func getDisplayCategories(db *sqlx.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Return bilingual display_category values (zh + en) in a single request.
		// We'll select zh and en translations per category if available.
		// Return unique bilingual (en/zh) display_category pairs.
		// Normalize whitespace in SQL and deduplicate using DISTINCT so the frontend
		// sees one entry per unique display label pair.
		query := `
			SELECT DISTINCT
				TRIM(regexp_replace(ct_en.display_category, '\\s+', ' ', 'g')) AS en,
				TRIM(regexp_replace(ct_zh.display_category, '\\s+', ' ', 'g')) AS zh
			FROM categories c
			LEFT JOIN category_translations ct_en ON c.id = ct_en.category_id AND ct_en.lang_code = 'en'
			LEFT JOIN category_translations ct_zh ON c.id = ct_zh.category_id AND ct_zh.lang_code = 'zh'
			WHERE (ct_en.display_category IS NOT NULL OR ct_zh.display_category IS NOT NULL)
			ORDER BY en NULLS LAST, zh NULLS LAST
		`

		rows, err := db.Queryx(query)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query display categories", "details": err.Error()})
			return
		}
		defer rows.Close()

		out := []map[string]string{}
		// Deduplicate and normalize whitespace in Go to ensure unique pairs.
		normalize := func(ns sql.NullString) string {
			if !ns.Valid {
				return ""
			}
			s := strings.TrimSpace(ns.String)
			if s == "" {
				return ""
			}
			// Collapse any internal whitespace (spaces, newlines, tabs) to single spaces
			return strings.Join(strings.Fields(s), " ")
		}

		seen := make(map[string]struct{})
		for rows.Next() {
			var en sql.NullString
			var zh sql.NullString
			if err := rows.Scan(&en, &zh); err != nil {
				continue
			}
			enStr := normalize(en)
			zhStr := normalize(zh)
			if enStr == "" && zhStr == "" {
				continue
			}
			// Use primary label for deduplication: prefer English label, fall back to zh.
			primary := enStr
			if primary == "" {
				primary = zhStr
			}
			key := strings.ToLower(primary)
			if _, ok := seen[key]; ok {
				continue
			}
			seen[key] = struct{}{}
			entry := map[string]string{"en": enStr, "zh": zhStr}
			out = append(out, entry)
		}

		// Sort output by primary label (en preferred, fallback zh) for stable ordering
		sort.Slice(out, func(i, j int) bool {
			a := out[i]["en"]
			if a == "" {
				a = out[i]["zh"]
			}
			b := out[j]["en"]
			if b == "" {
				b = out[j]["zh"]
			}
			return strings.ToLower(a) < strings.ToLower(b)
		})

		c.JSON(http.StatusOK, gin.H{"display_categories": out, "count": len(out)})
	}
}

// getToolsCompact returns lightweight tool list with optional filters
func getToolsCompact(db *sqlx.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Parse query parameters
		offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
		search := c.Query("search")

		// ⚠️ 修复：前端发送的 'category' 实际上是 display_category
		displayCategoryFilter := c.Query("category")

		// Robustly handle double-encoded values (e.g. %2520 -> %20 -> space).
		// Try to QueryUnescape up to a few times until it stabilizes.
		decodedCategory := displayCategoryFilter
		if decodedCategory != "" {
			for i := 0; i < 3; i++ {
				if !strings.Contains(decodedCategory, "%") {
					break
				}
				un, err := url.QueryUnescape(decodedCategory)
				if err != nil || un == decodedCategory {
					break
				}
				decodedCategory = un
			}
		}

		pricing := c.Query("pricing_model")
		// Accept either `min_rating` (preferred) or the legacy `rating` param from frontend.
		// This keeps backward compatibility while supporting both consumers.
		minRating := c.Query("rating")

		langCode := c.DefaultQuery("lang_code", "zh")

		// --- Query Construction ---

		// $1 is always langCode
		args := []interface{}{langCode}
		argPos := 2 // Start from $2 for filters

		// Build Joins and WHERE clause
		baseJoins := `
            LEFT JOIN tool_translations tr ON t.id = tr.tool_id AND tr.lang_code = $1
        `
		baseWhere := "WHERE t.review_status = 'PUBLISHED'"

		// If filtering by displayCategory, we MUST INNER JOIN categories and category_translations
		if decodedCategory != "" {
			// 1. INNER JOIN ensures we only consider tools mapped to the requested display_category
			baseJoins += `
				INNER JOIN categories c ON t.category = c.original_category
				INNER JOIN category_translations ct ON c.id = ct.category_id AND ct.lang_code = $1
			`
			// 2. Filter by the display_category (full string) but normalize whitespace
			// Use regexp_replace to collapse any whitespace sequences, then trim
			// and lower-case both sides so comparisons are case-insensitive and
			// robust to extra/multiple whitespace (e.g., "3D Generation").
			baseWhere += fmt.Sprintf(" AND lower(trim(regexp_replace(ct.display_category, '\\s+', ' ', 'g'))) = lower(trim(regexp_replace($%d, '\\s+', ' ', 'g')))", argPos)
			args = append(args, decodedCategory)
			argPos++
		}

		// Add other filters
		if search != "" {
			baseWhere += fmt.Sprintf(" AND (t.name ILIKE $%d OR tr.short_description ILIKE $%d OR tr.description ILIKE $%d)", argPos, argPos, argPos)
			args = append(args, "%"+search+"%")
			argPos++
		}

		if pricing != "" {
			baseWhere += fmt.Sprintf(" AND t.pricing_model = $%d", argPos)
			args = append(args, pricing)
			argPos++
		}
		if minRating != "" {
			baseWhere += fmt.Sprintf(" AND t.rating >= $%d", argPos)
			args = append(args, minRating)
			argPos++
		}

		// --- Count total (using DISTINCT t.id to avoid double counting from joins) ---

		countQuery := fmt.Sprintf(`
            SELECT COUNT(DISTINCT t.id)
            FROM tools t
			%s
			%s
        `, baseJoins, baseWhere)

		var total int
		if err := db.Get(&total, countQuery, args...); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to count tools", "details": err.Error()})
			return
		}

		// --- Build select query ---

		selectFields := `
			t.id, t.name, t.slug, t.logo_url, t.category, 
			t.pricing_model, t.rating,
			tr.short_description
		`

		// 3. 始终确保返回 display_category
		// 如果 filter 已经执行了 INNER JOIN (ct)，则直接使用 ct
		if decodedCategory != "" {
			selectFields += `, ct.display_category`
		} else {
			// 如果没有应用 display_category 过滤，则需要 LEFT JOIN 才能获取 display_category
			baseJoins += `
				LEFT JOIN categories c_disp ON t.category = c_disp.original_category
				LEFT JOIN category_translations ct_disp ON c_disp.id = ct_disp.category_id AND ct_disp.lang_code = $1
			`
			selectFields += `, ct_disp.display_category`
		}

		query := fmt.Sprintf(`
            SELECT 
                %s
            FROM tools t
            %s
            %s 
            ORDER BY t.created_at DESC
        `, selectFields, baseJoins, baseWhere)

		// Add LIMIT and OFFSET
		query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argPos, argPos+1)
		args = append(args, limit, offset)

		var items []models.ToolCompact
		if err := db.Select(&items, query, args...); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch tools", "details": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"items": items,
			"total": total,
		})
	}
}

// getTools returns full tool list (similar to compact but with more fields)
func getTools(db *sqlx.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Reuse compact logic for now
		getToolsCompact(db)(c)
	}
}

// getToolByIDOrSlug returns detailed tool information by ID or slug
func getToolByIDOrSlug(db *sqlx.DB, cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		idOrSlug := c.Param("id")

		// Try to parse as ID first
		var tool models.Tool
		var err error

		id, parseErr := strconv.Atoi(idOrSlug)
		if parseErr == nil {
			// It's a numeric ID
			err = db.Get(&tool, "SELECT * FROM tools WHERE id = $1", id)
		} else {
			// It's a slug
			err = db.Get(&tool, "SELECT * FROM tools WHERE slug = $1", idOrSlug)
		}

		if err != nil {
			if err == sql.ErrNoRows {
				c.JSON(http.StatusNotFound, gin.H{"error": "tool not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch tool"})
			return
		}

		// Get translation for requested language using lang_code query param
		langCode := c.DefaultQuery("lang_code", cfg.DefaultLang)

		// Attempt to fetch a single translation row with preference order:
		// 1) requested lang, 2) zh, 3) en, 4) any other available translation
		// This avoids sequential fallbacks that can yield inconsistent/partial results.
		var translation models.ToolTranslation
		transQuery := `
            SELECT * FROM tool_translations
            WHERE tool_id = $1
              AND (lang_code = $2 )
            ORDER BY CASE
              WHEN lang_code = $2 THEN 0
              WHEN lang_code = 'zh' THEN 1
              WHEN lang_code = 'en' THEN 2
              ELSE 3 END
            LIMIT 1
        `
		transErr := db.Get(&translation, transQuery, tool.ID, langCode)
		if transErr != nil && transErr != sql.ErrNoRows {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch translation", "details": transErr.Error()})
			return
		}

		// If none found in the prioritized set above, try any translation as final fallback
		if translation.ID == 0 {
			_ = db.Get(&translation, "SELECT * FROM tool_translations WHERE tool_id = $1 LIMIT 1", tool.ID)
		}

		// Determine which language we actually selected for translations/fallbacks
		usedLang := langCode
		if translation.ID != 0 && translation.LangCode != "" {
			usedLang = translation.LangCode
		}

		// Get FAQs for the selected language (allow empty slice)
		var faqs []models.ToolFAQ
		if err := db.Select(&faqs, "SELECT id, tool_id, lang_code, faq_order, question, answer FROM tool_faqs WHERE tool_id = $1 AND lang_code = $2 ORDER BY faq_order", tool.ID, usedLang); err != nil {
			faqs = []models.ToolFAQ{}
		}

		// Convert DB faqs (ToolFAQ) to display FAQ objects (models.FAQ)
		var faqsOut []models.FAQ
		for _, f := range faqs {
			faqsOut = append(faqsOut, models.FAQ{Question: f.Question, Answer: f.Answer})
		}

		// Build detail response
		detail := models.ToolDetail{
			Tool: tool,
			FAQs: faqsOut,
		}

		// Populate translation fields if found
		if translation.ID != 0 {
			detail.ShortDescription = translation.ShortDescription
			detail.Description = translation.Description
			detail.CategoryName = translation.CategoryName
			detail.Features = translation.Features
			detail.UseCases = translation.UseCases
			detail.KeyDifferentiators = translation.KeyDifferentiators
			detail.PricingDetails = translation.PricingDetails
			detail.MetaTitle = translation.MetaTitle
			detail.MetaDescription = translation.MetaDescription
			detail.Pros = translation.Pros
			detail.Cons = translation.Cons
		}

		c.JSON(http.StatusOK, detail)
	}
}

// getRelatedTools returns tools related to the given tool (same category, similar rating)
func getRelatedTools(db *sqlx.DB, cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		idOrSlug := c.Param("id")
		langCode := c.DefaultQuery("lang_code", cfg.DefaultLang)
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "6"))

		// First, get the base tool to find its category
		var tool models.Tool
		var err error

		id, parseErr := strconv.Atoi(idOrSlug)
		if parseErr == nil {
			err = db.Get(&tool, "SELECT * FROM tools WHERE id = $1", id)
		} else {
			err = db.Get(&tool, "SELECT * FROM tools WHERE slug = $1", idOrSlug)
		}

		if err != nil {
			if err == sql.ErrNoRows {
				c.JSON(http.StatusNotFound, gin.H{"error": "tool not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch tool"})
			return
		}

		// Find related tools: same category, different tool, published status
		query := `
            SELECT 
                t.id, t.name, t.slug, t.logo_url, t.category, 
                t.pricing_model, t.rating,
                tr.short_description
            FROM tools t
            LEFT JOIN tool_translations tr ON t.id = tr.tool_id AND tr.lang_code = $1
            WHERE t.category = $2 
                AND t.id != $3 
                AND t.review_status = 'PUBLISHED'
            ORDER BY ABS(t.rating - $4) ASC, t.rating DESC, t.created_at DESC
            LIMIT $5
        `

		var relatedTools []models.ToolCompact
		err = db.Select(&relatedTools, query, langCode, tool.Category, tool.ID, tool.Rating, limit)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch related tools", "details": err.Error()})
			return
		}

		// Return empty array if no related tools found
		if relatedTools == nil {
			relatedTools = []models.ToolCompact{}
		}

		c.JSON(http.StatusOK, relatedTools)
	}
}
