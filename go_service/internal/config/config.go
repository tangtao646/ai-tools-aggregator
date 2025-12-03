package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL    string
	JWTSecret      string
	Port           string
	Environment    string
	AllowedOrigins []string
	DefaultLang    string
	// Gemini / LLM related configuration
	Gemini    GeminiConfig
	RateLimit RateLimitConfig
}

func Load() (*Config, error) {
	// Load .env file if exists
	_ = godotenv.Load()

	cfg := &Config{
		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/aitools?sslmode=disable"),
		JWTSecret:   getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		Port:        getEnv("PORT", "8000"),
		Environment: getEnv("ENVIRONMENT", "development"),
		DefaultLang: getEnv("DEFAULT_LANG", "zh"),
	}

	// Load Gemini / LLM config
	cfg.Gemini = GeminiConfig{
		APIKey:     getEnv("GEMINI_API_KEY", ""),
		Model:      getEnv("GEMINI_MODEL", "gemini-2.5-flash"),
		DelaySecs:  getEnvFloat("GEMINI_DELAY", 1.0),
		MaxRetries: getEnvInt("GEMINI_MAX_RETRIES", 3),
	}

	// Rate limiting defaults
	cfg.RateLimit = RateLimitConfig{
		GeminiRequestsPerMinute:  getEnvInt("GEMINI_REQUESTS_PER_MINUTE", 15),
		ScraperRequestsPerMinute: getEnvInt("SCRAPER_REQUESTS_PER_MINUTE", 30),
	}

	// Parse allowed origins
	originsStr := getEnv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
	cfg.AllowedOrigins = []string{}
	if originsStr != "" {
		// Simple split by comma
		var current string
		for _, ch := range originsStr {
			if ch == ',' {
				if current != "" {
					cfg.AllowedOrigins = append(cfg.AllowedOrigins, current)
					current = ""
				}
			} else {
				current += string(ch)
			}
		}
		if current != "" {
			cfg.AllowedOrigins = append(cfg.AllowedOrigins, current)
		}
	}

	return cfg, nil
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

func getEnvInt(key string, defaultVal int) int {
	if val := os.Getenv(key); val != "" {
		if intVal, err := strconv.Atoi(val); err == nil {
			return intVal
		}
	}
	return defaultVal
}

// getEnvFloat reads a float64 from an environment variable or returns the default.
func getEnvFloat(key string, defaultVal float64) float64 {
	if val := os.Getenv(key); val != "" {
		if f, err := strconv.ParseFloat(val, 64); err == nil {
			return f
		}
	}
	return defaultVal
}

// GeminiConfig holds configuration for Gemini / LLM API usage.
type GeminiConfig struct {
	APIKey     string
	Model      string
	DelaySecs  float64
	MaxRetries int
}

// RateLimitConfig holds simple rate-limiting configuration.
type RateLimitConfig struct {
	GeminiRequestsPerMinute  int
	ScraperRequestsPerMinute int
}
