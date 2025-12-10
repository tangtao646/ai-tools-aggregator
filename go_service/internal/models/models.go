// models.go
package models

import (
	"time"
)

// Tool represents the core tool table
type Tool struct {
	ID                 int         `db:"id" json:"id"`
	Name               string      `db:"name" json:"name"`
	Slug               string      `db:"slug" json:"slug"`
	OfficialLink       string      `db:"official_link" json:"official_link"`
	Category           string      `db:"category" json:"category"`
	PricingModel       string      `db:"pricing_model" json:"pricing_model"`
	IsFeatured         bool        `db:"is_featured" json:"is_featured"`
	Tags               StringArray `db:"tags" json:"tags,omitempty"` // JSON, nullable
	LogoURL            *string     `db:"logo_url" json:"logo_url,omitempty"`
	Rating             *float64    `db:"rating" json:"rating,omitempty"`
	Screenshots        StringArray `db:"screenshots" json:"screenshots,omitempty"` // JSON, nullable
	VideoURL           *string     `db:"video_url" json:"video_url,omitempty"`
	SupportedPlatforms StringArray `db:"supported_platforms" json:"supported_platforms,omitempty"` // JSON, nullable
	ReviewStatus       string      `db:"review_status" json:"review_status"`
	RejectionReason    *string     `db:"rejection_reason" json:"rejection_reason,omitempty"`
	SubmitterID        *int64      `db:"submitter_id" json:"submitter_id,omitempty"`
	SubmitterEmail     *string     `db:"submitter_email" json:"submitter_email,omitempty"`
	EditCount          int         `db:"edit_count" json:"edit_count"`
	CreatedAt          time.Time   `db:"created_at" json:"created_at"`
	UpdatedAt          time.Time   `db:"updated_at" json:"updated_at"`
}

// ToolTranslation represents the tool_translations table
type ToolTranslation struct {
	ID                 int         `db:"id" json:"id"`
	ToolID             int         `db:"tool_id" json:"tool_id"`
	LangCode           string      `db:"lang_code" json:"lang_code"`
	ShortDescription   string      `db:"short_description" json:"short_description"`
	Description        string      `db:"description" json:"description"`
	CategoryName       string      `db:"category_name" json:"category_name"`
	Features           StringArray `db:"features" json:"features,omitempty"`                       // JSON, nullable
	UseCases           StringArray `db:"use_cases" json:"use_cases,omitempty"`                     // JSON, nullable
	KeyDifferentiators StringArray `db:"key_differentiators" json:"key_differentiators,omitempty"` // JSON, nullable
	PricingDetails     *string     `db:"pricing_details" json:"pricing_details,omitempty"`
	MetaTitle          *string     `db:"meta_title" json:"meta_title,omitempty"`
	MetaDescription    *string     `db:"meta_description" json:"meta_description,omitempty"`
	Pros               StringArray `db:"pros" json:"pros,omitempty"` // JSON, nullable
	Cons               StringArray `db:"cons" json:"cons,omitempty"` // JSON, nullable
}

// ToolFAQ represents the tool_faqs table
type ToolFAQ struct {
	ID       int    `db:"id" json:"id"`
	ToolID   int    `db:"tool_id" json:"tool_id"`
	LangCode string `db:"lang_code" json:"lang_code"`
	FAQOrder int    `db:"faq_order" json:"faq_order"`
	Question string `db:"question" json:"question"`
	Answer   string `db:"answer" json:"answer"`
}

// User represents the users table
type User struct {
	ID            int       `db:"id" json:"id"`
	Email         string    `db:"email" json:"email"`
	Username      *string   `db:"username" json:"username,omitempty"`
	PasswordHash  *string   `db:"password_hash" json:"-"`
	GoogleID      *string   `db:"google_id" json:"google_id,omitempty"`
	GithubID      *string   `db:"github_id" json:"github_id,omitempty"`
	IsActive      bool      `db:"is_active" json:"is_active"`
	EmailVerified bool      `db:"email_verified" json:"email_verified"`
	CreatedAt     time.Time `db:"created_at" json:"created_at"`
	UpdatedAt     time.Time `db:"updated_at" json:"updated_at"`
}

// Admin represents the admins table
type Admin struct {
	ID           int       `db:"id" json:"id"`
	Username     string    `db:"username" json:"username"`
	PasswordHash string    `db:"password_hash" json:"-"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
}

// Category represents the categories table (core category model)
type Category struct {
	ID               int       `db:"id" json:"id"`
	OriginalCategory string    `db:"original_category" json:"original_category"` // Unique identifier, not translatable
	CreatedAt        time.Time `db:"created_at" json:"created_at"`
	UpdatedAt        time.Time `db:"updated_at" json:"updated_at"`
}

// CategoryTranslation represents the category_translations table
type CategoryTranslation struct {
	ID              int    `db:"id" json:"id"`
	CategoryID      int    `db:"category_id" json:"category_id"`           // Foreign key to categories
	LangCode        string `db:"lang_code" json:"lang_code"`               // Language code ('zh', 'en')
	DisplayCategory string `db:"display_category" json:"display_category"` // Translated display name
}

// ToolCompact is a lightweight view for listing endpoints
type ToolCompact struct {
	ID               int      `db:"id" json:"id"`
	Name             string   `db:"name" json:"name"`
	Slug             string   `db:"slug" json:"slug"`
	ShortDescription *string  `db:"short_description" json:"short_description"`
	LogoURL          *string  `db:"logo_url" json:"logo_url"`
	Category         *string  `db:"category" json:"category"`
	DisplayCategory  *string  `db:"display_category" json:"display_category"`
	PricingModel     *string  `db:"pricing_model" json:"pricing_model"`
	Rating           *float64 `db:"rating" json:"rating"`
}

// ------------------------------上面的是数据库表模型，下方的是页面展示需要返回的模型--------------------------------
// ToolDetail combines Tool with its translation data and FAQs
type ToolDetail struct {
	Tool
	ShortDescription   string      `json:"short_description"`
	Description        string      `json:"description"`
	CategoryName       string      `json:"category_name"`
	Features           StringArray `json:"features,omitempty"`            // JSON, nullable
	UseCases           StringArray `json:"use_cases,omitempty"`           // JSON, nullable
	KeyDifferentiators StringArray `json:"key_differentiators,omitempty"` // JSON, nullable
	PricingDetails     *string     `json:"pricing_details,omitempty"`
	MetaTitle          *string     `json:"meta_title,omitempty"`
	MetaDescription    *string     `json:"meta_description,omitempty"`
	Pros               StringArray `json:"pros,omitempty"` // JSON, nullable
	Cons               StringArray `json:"cons,omitempty"` // JSON, nullable
	FAQs               []FAQ       `json:"faqs,omitempty"`
}

type FAQ struct {
	Question string `json:"question"`
	Answer   string `json:"answer"`
}
