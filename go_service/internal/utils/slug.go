package utils

import (
	"fmt"
	"regexp"
	"strings"
	"unicode"

	"github.com/jmoiron/sqlx"
	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"
)

// GenerateSlug 将文本转换为 SEO 友好的 slug
// 例如: "ChatGPT AI Assistant" -> "chatgpt-ai-assistant"
func GenerateSlug(text string) string {
	// 转换为小写
	text = strings.ToLower(text)

	// 移除重音符号 (例如: é -> e)
	t := transform.Chain(norm.NFKD, runes.Remove(runes.In(unicode.Mn)), norm.NFC)
	text, _, _ = transform.String(t, text)

	// 替换非字母数字字符为连字符（保留字母、数字、空格、连字符）
	reg := regexp.MustCompile(`[^\w\s-]+`)
	text = reg.ReplaceAllString(text, "")

	// 替换多个空格或连字符为单个连字符
	reg = regexp.MustCompile(`[-\s]+`)
	text = reg.ReplaceAllString(text, "-")

	// 移除首尾的连字符
	text = strings.Trim(text, "-")

	return text
}

// GenerateUniqueSlug 生成唯一的 slug（如果重复则添加数字后缀）
//
// Args:
//
//	db: 数据库连接或事务
//	tableName: 表名 (例如 "tools")
//	text: 要转换的文本
//	instanceID: 当前实例的 ID (更新时使用，避免与自己冲突，传 nil 表示新建)
//
// Returns:
//
//	唯一的 slug
func GenerateUniqueSlug(db sqlx.Ext, tableName string, text string, instanceID *int) (string, error) {
	baseSlug := GenerateSlug(text)
	if baseSlug == "" {
		baseSlug = "item"
	}

	slug := baseSlug
	counter := 1

	for {
		// 检查 slug 是否已存在
		query := fmt.Sprintf("SELECT COUNT(*) FROM %s WHERE slug = $1", tableName)
		args := []interface{}{slug}

		// 如果是更新操作，排除当前实例
		if instanceID != nil {
			query += " AND id != $2"
			args = append(args, *instanceID)
		}

		var count int
		err := sqlx.Get(db, &count, query, args...)
		if err != nil {
			return "", fmt.Errorf("检查 slug 唯一性失败: %w", err)
		}

		if count == 0 {
			return slug, nil
		}

		// 如果存在，添加数字后缀
		slug = fmt.Sprintf("%s-%d", baseSlug, counter)
		counter++

		// 防止无限循环
		if counter > 10000 {
			return "", fmt.Errorf("无法生成唯一 slug，已尝试 %d 次", counter)
		}
	}
}
