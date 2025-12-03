// main.go
package main

import (
	"flag"
	"fmt"
	"os"

	"github.com/tangtao646/ai-tools-aggregator-go/internal/scripts"
)

func main() {
	inPath := flag.String("in", "./data/seo_tools_validated.json", "input JSON file path (array of objects)")
	target := flag.String("lang", "zh", "target language code, e.g. en, zh")
	success := flag.String("success", "./data/translation_zh_success.json", "path to success output file")
	failed := flag.String("failed", "./data/translation_zh_failed.json", "path to failed output file")
	key := flag.String("key", "name", "key property used to dedupe/resume")
	delay := flag.Int("delay", 15, "delay seconds between requests")
	flag.Parse()

	if *inPath == "" {
		fmt.Println("--in is required")
		os.Exit(2)
	}

	data, err := scripts.LoadJSONFile(*inPath)
	if err != nil {
		fmt.Printf("failed to load input: %v\n", err)
		os.Exit(1)
	}

	stats, err := scripts.TranslateResumable(data, *target, *success, *failed, *key, *delay)
	if err != nil {
		fmt.Printf("TranslateResumable error: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Done: %+v\n", stats)
}
