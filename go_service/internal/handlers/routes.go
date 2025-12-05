// Package handlers provides route registration functions
package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
	"github.com/tangtao646/ai-tools-aggregator-go/internal/config"
	"github.com/tangtao646/ai-tools-aggregator-go/internal/middleware"
)

// RegisterAdminRoutes registers admin-related routes
func RegisterAdminRoutes(r *gin.RouterGroup, db *sqlx.DB) {
	handler := NewAdminHandler(db)

	admin := r.Group("/admin")
	{
		// Public routes
		admin.POST("/login", handler.Login)
		admin.GET("/is-admin", handler.IsAdmin)

		// Protected routes (require admin authentication)
		admin.GET("/tools/pending", middleware.RequireAdmin(db), handler.GetPendingTools)
		admin.GET("/tools/all", middleware.RequireAdmin(db), handler.GetAllTools)
		admin.PUT("/tools/:tool_id/review", middleware.RequireAdmin(db), handler.UpdateReviewStatus)
		admin.POST("/tools/:tool_id/generate-seo", middleware.RequireAdmin(db), handler.GenerateSEO)

		// Data management routes
		admin.POST("/import-seo-auto-split", middleware.RequireAdmin(db), handler.ImportSEOToolsAutoSplit)
		// Translator: upload a JSON array and run resumable translation using internal scripts
		admin.POST("/translate-tools", middleware.RequireAdmin(db), handler.TranslateTools)
		// Download a server-side file (translation results) by filename (admin only)
		// NOTE: download endpoint removed to avoid referencing an unimplemented handler
		admin.DELETE("/delete/:table_key", middleware.RequireAdmin(db), handler.DeleteTableData)
		admin.POST("/generate-category-mapping", middleware.RequireAdmin(db), handler.GenerateCategoryMapping)
	}
}

// RegisterSEORoutes registers SEO-related routes
func RegisterSEORoutes(r *gin.RouterGroup, db *sqlx.DB, cfg *config.Config) {
	domain := "https://aicollection.tools"
	if cfg.Environment != "production" {
		domain = "http://localhost:5173"
	}

	handler := NewSEOHandler(db, domain)

	seo := r.Group("/seo")
	{
		seo.GET("/sitemap.xml", handler.GetSitemap)
		seo.GET("/robots.txt", handler.GetRobots)
	}
}

// RegisterWorkflowRoutes registers workflow template routes
func RegisterWorkflowRoutes(r *gin.RouterGroup, db *sqlx.DB) {
	handler := NewWorkflowHandler(db)

	workflows := r.Group("/workflow-templates")
	{
		// Public routes
		workflows.GET("", handler.ListTemplates)
		workflows.GET("/:id", handler.GetTemplate)

		// Protected routes (TODO: add authentication middleware)
		workflows.POST("", handler.CreateTemplate)
		workflows.PUT("/:id", handler.UpdateTemplate)
		workflows.DELETE("/:id", handler.DeleteTemplate)
		workflows.POST("/:id/review", handler.ReviewTemplate)
	}
}

// RegisterStaticRoutes registers lightweight public static routes such as ads.txt
// This function intentionally accepts the top-level *gin.Engine so we can register
// root-level paths (e.g. "/ads.txt").
func RegisterStaticRoutes(r *gin.Engine) {
	// Serve Google AdSense ads.txt from the repository static folder.
	// Edit ./static/ads.txt to update your publisher ID (e.g. "google.com, pub-123..., DIRECT, f08c47fec0942fa0").
	r.StaticFile("/ads.txt", "./static/ads.txt")
}
