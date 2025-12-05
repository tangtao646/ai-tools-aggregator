package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/tangtao646/ai-tools-aggregator-go/internal/config"
	"github.com/tangtao646/ai-tools-aggregator-go/internal/db"
	"github.com/tangtao646/ai-tools-aggregator-go/internal/handlers"
)

func main() {
	// Load config
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Connect to database
	database, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	// Setup Gin router
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.Default()

	// CORS middleware
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = cfg.AllowedOrigins
	corsConfig.AllowCredentials = true
	corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	r.Use(cors.New(corsConfig))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Register lightweight public static routes (ads.txt etc.)
	handlers.RegisterStaticRoutes(r)
	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		handlers.RegisterToolsRoutes(v1, database, cfg)
		handlers.RegisterAuthRoutes(v1, database)
		handlers.RegisterAdminRoutes(v1, database)
		handlers.RegisterSEORoutes(v1, database, cfg)
		handlers.RegisterWorkflowRoutes(v1, database)
	}

	// Start server
	addr := ":" + cfg.Port
	log.Printf("Server starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
