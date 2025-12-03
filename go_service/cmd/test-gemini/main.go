package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/tangtao646/ai-tools-aggregator-go/internal/generate"
)

func main() {
	prompt := flag.String("prompt", "测试 gemini 可用性", "Prompt to send to model")
	model := flag.String("model", "gemini-2.5-flash", "Model name override (optional)")
	timeout := flag.Int("timeout", 50, "timeout seconds for CallGemini")
	flag.Parse()

	if *model != "" {
		os.Setenv("GEMINI_MODEL", *model)
	}

	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		fmt.Println("Warning: GEMINI_API_KEY not set. Call will fail unless set in environment or .env.")
	}

	fmt.Printf("Calling CallGemini model=%s timeout=%ds prompt=%q\n", *model, *timeout, *prompt)
	start := time.Now()
	out, err := generate.CallGemini(*prompt, *model, apiKey, *timeout)
	elapsed := time.Since(start)
	if err != nil {
		log.Printf("CallGemini error after %v: %v", elapsed, err)
		os.Exit(1)
	}
	fmt.Printf("CallGemini succeeded in %v:\n", elapsed)
	fmt.Println("--- Response ---")
	fmt.Println(out)
}
