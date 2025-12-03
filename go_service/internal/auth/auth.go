package auth

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	// Secret should come from env in production
	secret = func() string {
		if s := os.Getenv("JWT_SECRET"); s != "" {
			return s
		}
		return "your-secret-key-change-in-production"
	}()

	// Default token expiry (24 hours, matching Python's ACCESS_TOKEN_EXPIRE_MINUTES)
	defaultTokenExpiryMinutes = 60 * 24
)

// HashPassword returns SHA256 hex digest of the password
func HashPassword(password string) string {
	h := sha256.Sum256([]byte(password))
	return hex.EncodeToString(h[:])
}

// VerifyPassword compares plaintext password with hashed hex string
func VerifyPassword(plain string, hashed string) bool {
	return HashPassword(plain) == hashed
}

// CreateAccessToken creates a JWT token with claims (sub, user_id) and default 24h expiry
// This matches Python's create_access_token function
func CreateAccessToken(sub string, userID int64) (string, error) {
	return CreateAccessTokenWithExpiry(sub, userID, defaultTokenExpiryMinutes)
}

// CreateAccessTokenWithExpiry creates a JWT token with custom expiry in minutes
func CreateAccessTokenWithExpiry(sub string, userID int64, minutes int) (string, error) {
	claims := jwt.MapClaims{
		"sub":     sub,
		"user_id": userID,
		"exp":     time.Now().Add(time.Duration(minutes) * time.Minute).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}
	return signed, nil
}

// VerifyToken parses and verifies a token, returning claims map
func VerifyToken(tokenStr string) (map[string]interface{}, error) {
	parser := jwt.NewParser()
	var claims jwt.MapClaims
	_, err := parser.ParseWithClaims(tokenStr, &claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, fmt.Errorf("token verify failed: %w", err)
	}
	m := map[string]interface{}{}
	for k, v := range claims {
		m[k] = v
	}
	return m, nil
}

// GetUserIDFromClaims extracts user_id from JWT claims
func GetUserIDFromClaims(claims map[string]interface{}) (int64, error) {
	userIDRaw, ok := claims["user_id"]
	if !ok {
		return 0, fmt.Errorf("user_id not found in claims")
	}

	// Handle both float64 (from JSON) and int64
	switch v := userIDRaw.(type) {
	case float64:
		return int64(v), nil
	case int64:
		return v, nil
	case int:
		return int64(v), nil
	default:
		return 0, fmt.Errorf("user_id has unexpected type: %T", userIDRaw)
	}
}

// GetSubFromClaims extracts sub (subject) from JWT claims
func GetSubFromClaims(claims map[string]interface{}) (string, error) {
	sub, ok := claims["sub"]
	if !ok {
		return "", fmt.Errorf("sub not found in claims")
	}

	subStr, ok := sub.(string)
	if !ok {
		return "", fmt.Errorf("sub is not a string")
	}

	return subStr, nil
}
