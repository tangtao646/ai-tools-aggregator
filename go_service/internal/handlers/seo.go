// Package handlers provides HTTP request handlers for SEO features
package handlers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

// SEOHandler handles SEO-related requests
type SEOHandler struct {
	db     *sqlx.DB
	domain string
}

// NewSEOHandler creates a new SEO handler
func NewSEOHandler(db *sqlx.DB, domain string) *SEOHandler {
	return &SEOHandler{
		db:     db,
		domain: domain,
	}
}

// Tool represents a simplified tool for sitemap
type SitemapTool struct {
	ID        int       `db:"id"`
	Slug      string    `db:"slug"`
	UpdatedAt time.Time `db:"updated_at"`
}

// GetSitemap generates sitemap.xml dynamically
// GET /api/v1/seo/sitemap.xml
func (h *SEOHandler) GetSitemap(c *gin.Context) {
	// Query all published tools
	var tools []SitemapTool
	err := h.db.Select(&tools, `
		SELECT id, slug, updated_at 
		FROM tools 
		WHERE review_status = 'PUBLISHED' AND slug IS NOT NULL
		ORDER BY updated_at DESC
	`)
	if err != nil {
		c.String(http.StatusInternalServerError, "Internal Server Error")
		return
	}

	// Build XML content
	var xml strings.Builder
	xml.WriteString(`<?xml version="1.0" encoding="UTF-8"?>`)
	xml.WriteString("\n")
	xml.WriteString(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`)
	xml.WriteString("\n")

	// Homepage
	xml.WriteString("  <url>\n")
	xml.WriteString(fmt.Sprintf("    <loc>%s/</loc>\n", h.domain))
	xml.WriteString(fmt.Sprintf("    <lastmod>%s</lastmod>\n", time.Now().Format("2006-01-02")))
	xml.WriteString("    <changefreq>daily</changefreq>\n")
	xml.WriteString("    <priority>1.0</priority>\n")
	xml.WriteString("  </url>\n")

	// Tool pages
	for _, tool := range tools {
		xml.WriteString("  <url>\n")
		xml.WriteString(fmt.Sprintf("    <loc>%s/tool/%s</loc>\n", h.domain, tool.Slug))
		xml.WriteString(fmt.Sprintf("    <lastmod>%s</lastmod>\n", tool.UpdatedAt.Format("2006-01-02")))
		xml.WriteString("    <changefreq>weekly</changefreq>\n")
		xml.WriteString("    <priority>0.8</priority>\n")
		xml.WriteString("  </url>\n")
	}

	xml.WriteString("</urlset>")

	c.Header("Content-Type", "application/xml; charset=utf-8")
	c.Header("Content-Disposition", "inline; filename=sitemap.xml")
	c.String(http.StatusOK, xml.String())
}

// GetRobots generates robots.txt
// GET /api/v1/seo/robots.txt
func (h *SEOHandler) GetRobots(c *gin.Context) {
	robotsTxt := fmt.Sprintf(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /my-submissions

# Sitemap
Sitemap: %s/api/v1/seo/sitemap.xml

# Crawl-delay (optional, in seconds)
Crawl-delay: 1
`, h.domain)

	c.Header("Content-Type", "text/plain; charset=utf-8")
	c.Header("Content-Disposition", "inline; filename=robots.txt")
	c.String(http.StatusOK, robotsTxt)
}
