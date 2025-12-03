package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/jmoiron/sqlx"
	"github.com/tangtao646/ai-tools-aggregator-go/internal/generate"
)

func main() {
	model := flag.String("model", "gpt-4o-mini", "LLM model to use (Gemini/OpenAI config still driven by env)")
	dbURL := flag.String("db", "", "Database URL (default from env DATABASE_URL)")
	flag.Parse()

	databaseURL := *dbURL
	if databaseURL == "" {
		databaseURL = os.Getenv("DATABASE_URL")
	}
	if databaseURL == "" {
		log.Fatal("DATABASE_URL 未设置。请通过 -db 参数或环境变量提供。")
	}

	db, err := sqlx.Connect("pgx", databaseURL)
	if err != nil {
		log.Fatalf("连接数据库失败: %v", err)
	}
	defer db.Close()

	bilingual, msg, err := generate.GenerateBilingualMappingsFromDB(db, *model)
	if err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		if msg != "" {
			fmt.Fprintf(os.Stderr, "model/raw output or prompts:\n%s\n", msg)
		}
		os.Exit(1)
	}

	fmt.Println("Done. Bilingual mappings generated (sample):")
	cnt := 0
	for k, v := range bilingual {
		fmt.Printf("%s => zh: %s | en: %s\n", k, v["zh"], v["en"])
		cnt++
		if cnt >= 50 {
			break
		}
	}
	fmt.Println(msg)
}
