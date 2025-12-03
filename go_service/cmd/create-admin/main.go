package main

import (
	"fmt"
	"log"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Check command line arguments
	if len(os.Args) != 3 {
		fmt.Println("Usage: create-admin <username> <password>")
		fmt.Println("Example: create-admin taoge646@gmail.com 625749TT")
		os.Exit(1)
	}

	username := os.Args[1]
	password := os.Args[2]

	// Database connection string (from backend/.env)
	dsn := "postgresql://user:db625749TT@localhost:5432/aitools?sslmode=disable"

	// Connect to database
	db, err := sqlx.Connect("pgx", dsn)
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Check if admin already exists
	var count int
	err = db.Get(&count, "SELECT COUNT(*) FROM admin WHERE username = $1", username)
	if err != nil {
		log.Fatalf("❌ Failed to check existing admin: %v", err)
	}

	if count > 0 {
		fmt.Printf("⚠️  Admin account already exists: %s\n", username)
		return
	}

	// Hash password using bcrypt
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("❌ Failed to hash password: %v", err)
	}

	// Insert admin record
	var adminID int
	err = db.QueryRow(
		"INSERT INTO admin (username, password_hash, created_at) VALUES ($1, $2, NOW()) RETURNING id",
		username,
		string(hashedPassword),
	).Scan(&adminID)

	if err != nil {
		log.Fatalf("❌ Failed to create admin: %v", err)
	}

	fmt.Println("✅ Admin account created successfully!")
	fmt.Printf("   Username: %s\n", username)
	fmt.Printf("   ID: %d\n", adminID)
	fmt.Println("\nAccess: http://localhost:5173/admin/login")
}
