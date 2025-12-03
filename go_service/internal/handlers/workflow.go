// Package handlers provides HTTP request handlers for workflow templates
package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

// WorkflowHandler handles workflow template requests
type WorkflowHandler struct {
	db *sqlx.DB
}

// NewWorkflowHandler creates a new workflow handler
func NewWorkflowHandler(db *sqlx.DB) *WorkflowHandler {
	return &WorkflowHandler{db: db}
}

// WorkflowTemplateListRequest represents list request parameters
type WorkflowTemplateListRequest struct {
	Category string `form:"category"`
	Skip     int    `form:"skip"`
	Limit    int    `form:"limit" binding:"max=100"`
}

// WorkflowTemplate represents a workflow template
type WorkflowTemplate struct {
	ID                   int    `db:"id" json:"id"`
	Title                string `db:"title" json:"title"`
	Description          string `db:"description" json:"description"`
	Category             string `db:"category" json:"category"`
	FlowChartDescription string `db:"flow_chart_description" json:"flow_chart_description"`
	CreatorID            int    `db:"creator_id" json:"creator_id"`
	Status               string `db:"status" json:"status"`
	CreatedAt            string `db:"created_at" json:"created_at"`
	UpdatedAt            string `db:"updated_at" json:"updated_at"`
}

// WorkflowNode represents a workflow node
type WorkflowNode struct {
	ID             int    `db:"id" json:"id"`
	TemplateID     int    `db:"template_id" json:"template_id"`
	Order          int    `db:"order" json:"order"`
	ToolName       string `db:"tool_name" json:"tool_name"`
	Description    string `db:"description" json:"description"`
	PromptTemplate string `db:"prompt_template" json:"prompt_template"`
}

// ListTemplates returns workflow templates with pagination and category filter
// GET /api/v1/workflow-templates
func (h *WorkflowHandler) ListTemplates(c *gin.Context) {
	var req WorkflowTemplateListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "请求参数错误"})
		return
	}

	// Set defaults
	if req.Limit == 0 {
		req.Limit = 20
	}

	// Build query
	query := "SELECT * FROM workflowtemplate WHERE 1=1"
	args := []interface{}{}
	argNum := 1

	if req.Category != "" {
		query += " AND category = $" + strconv.Itoa(argNum)
		args = append(args, req.Category)
		argNum++
	}

	query += " ORDER BY created_at DESC OFFSET $" + strconv.Itoa(argNum) + " LIMIT $" + strconv.Itoa(argNum+1)
	args = append(args, req.Skip, req.Limit)

	// Execute query
	var templates []WorkflowTemplate
	err := h.db.Select(&templates, query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "查询失败"})
		return
	}

	c.JSON(http.StatusOK, templates)
}

// GetTemplate returns a single workflow template with its nodes
// GET /api/v1/workflow-templates/:id
func (h *WorkflowHandler) GetTemplate(c *gin.Context) {
	templateID := c.Param("id")

	// Query template
	var template WorkflowTemplate
	err := h.db.Get(&template, "SELECT * FROM workflowtemplate WHERE id = $1", templateID)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Template not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "查询失败"})
		return
	}

	// Query nodes
	var nodes []WorkflowNode
	err = h.db.Select(&nodes, `
		SELECT * FROM workflownode 
		WHERE template_id = $1 
		ORDER BY "order"
	`, templateID)
	if err != nil && err != sql.ErrNoRows {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "查询节点失败"})
		return
	}

	// Combine response
	response := gin.H{
		"id":                     template.ID,
		"title":                  template.Title,
		"description":            template.Description,
		"category":               template.Category,
		"flow_chart_description": template.FlowChartDescription,
		"creator_id":             template.CreatorID,
		"status":                 template.Status,
		"created_at":             template.CreatedAt,
		"updated_at":             template.UpdatedAt,
		"nodes":                  nodes,
	}

	c.JSON(http.StatusOK, response)
}

// CreateTemplate creates a new workflow template
// POST /api/v1/workflow-templates
func (h *WorkflowHandler) CreateTemplate(c *gin.Context) {
	// TODO: Implement create workflow template
	// Requires authentication middleware to get current_user
	c.JSON(http.StatusNotImplemented, gin.H{
		"detail": "创建工作流模板功能待实现 - 需要先实现用户认证",
	})
}

// UpdateTemplate updates an existing workflow template
// PUT /api/v1/workflow-templates/:id
func (h *WorkflowHandler) UpdateTemplate(c *gin.Context) {
	// TODO: Implement update workflow template
	// Requires authentication and permission check
	c.JSON(http.StatusNotImplemented, gin.H{
		"detail": "更新工作流模板功能待实现",
	})
}

// DeleteTemplate deletes a workflow template
// DELETE /api/v1/workflow-templates/:id
func (h *WorkflowHandler) DeleteTemplate(c *gin.Context) {
	templateID := c.Param("id")

	// TODO: Add admin authentication check

	// Delete nodes first
	_, err := h.db.Exec("DELETE FROM workflownode WHERE template_id = $1", templateID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "删除节点失败"})
		return
	}

	// Delete template
	result, err := h.db.Exec("DELETE FROM workflowtemplate WHERE id = $1", templateID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "删除模板失败"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Template not found"})
		return
	}

	c.Status(http.StatusNoContent)
}

// ReviewTemplate reviews a workflow template (admin only)
// POST /api/v1/workflow-templates/:id/review
func (h *WorkflowHandler) ReviewTemplate(c *gin.Context) {
	templateID := c.Param("id")
	status := c.Query("status")

	// Validate status
	if status != "approved" && status != "rejected" {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "状态必须是 approved 或 rejected"})
		return
	}

	// TODO: Add admin authentication check

	// Update status
	result, err := h.db.Exec("UPDATE workflowtemplate SET status = $1, updated_at = NOW() WHERE id = $2", status, templateID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "更新失败"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Template not found"})
		return
	}

	// Return updated template
	var template WorkflowTemplate
	err = h.db.Get(&template, "SELECT * FROM workflowtemplate WHERE id = $1", templateID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "查询失败"})
		return
	}

	c.JSON(http.StatusOK, template)
}
