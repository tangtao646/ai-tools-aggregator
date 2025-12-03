package main

import (
	"fmt"

	"github.com/tangtao646/ai-tools-aggregator-go/internal/utils"
)

func main() {
	// 测试 GenerateSlug 函数
	testCases := []struct {
		input    string
		expected string
	}{
		{"ChatGPT AI Assistant", "chatgpt-ai-assistant"},
		{"Midjourney - AI Art", "midjourney-ai-art"},
		{"Claude 3.5 Sonnet", "claude-3-5-sonnet"},
		{"GPT-4 Turbo", "gpt-4-turbo"},
		{"Special@Characters#Test!", "specialcharacterstest"},
		{"Multiple   Spaces", "multiple-spaces"},
		{"---Remove-Dashes---", "remove-dashes"},
		{"Café & Résumé", "cafe-resume"},
	}

	fmt.Println("=== Slug Generation Tests ===\n")
	for i, tc := range testCases {
		result := utils.GenerateSlug(tc.input)
		status := "✅"
		if result != tc.expected {
			status = "❌"
		}
		fmt.Printf("%d. %s Input: '%s'\n", i+1, status, tc.input)
		fmt.Printf("   Expected: '%s'\n", tc.expected)
		fmt.Printf("   Got:      '%s'\n\n", result)
	}

	fmt.Println("=== Edge Cases ===\n")
	edgeCases := []string{
		"",
		"   ",
		"---",
		"@#$%^&*()",
		"123456",
		"AI",
		"a",
	}

	for i, input := range edgeCases {
		result := utils.GenerateSlug(input)
		fmt.Printf("%d. Input: '%s' → Output: '%s'\n", i+1, input, result)
	}
}
