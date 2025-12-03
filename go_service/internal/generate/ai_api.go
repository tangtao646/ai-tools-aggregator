// ai_api.go
package generate

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	genai "google.golang.org/genai"
)

// FetchSiteMetadata fetches a URL and extracts title, description and og:image (best-effort).
func FetchSiteMetadata(url string) (map[string]string, error) {
	out := map[string]string{"title": "", "description": "", "og_image": ""}
	client := &http.Client{Timeout: 8 * time.Second}
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("User-Agent", "metadata-checker/1.0")
	resp, err := client.Do(req)
	if err != nil {
		return out, err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 400 {
		return out, fmt.Errorf("non-200 response: %d", resp.StatusCode)
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return out, err
	}
	s := string(body)

	// title
	reTitle := regexp.MustCompile(`(?is)<title[^>]*>(.*?)</title>`)
	if m := reTitle.FindStringSubmatch(s); len(m) > 1 {
		out["title"] = regexp.MustCompile(`\s+`).ReplaceAllString(m[1], " ")
	}

	// meta name=description
	reDesc := regexp.MustCompile(`(?is)<meta[^>]+name=["']?description["']?[^>]*content=["']?(.*?)["']?[^>]*>`)
	if m := reDesc.FindStringSubmatch(s); len(m) > 1 {
		out["description"] = m[1]
	} else {
		// og:description
		reOGDesc := regexp.MustCompile(`(?is)<meta[^>]+property=["']?og:description["']?[^>]*content=["']?(.*?)["']?[^>]*>`)
		if m := reOGDesc.FindStringSubmatch(s); len(m) > 1 {
			out["description"] = m[1]
		}
	}

	// og:image
	reImg := regexp.MustCompile(`(?is)<meta[^>]+property=["']?og:image["']?[^>]*content=["']?(.*?)["']?[^>]*>`)
	if m := reImg.FindStringSubmatch(s); len(m) > 1 {
		out["og_image"] = m[1]
	}

	return out, nil
}

// CallGemini calls Google Generative Language (Gemini) REST endpoint and returns text content.
func CallGemini(prompt, model, apiKey string, timeoutSecs int) (string, error) {
	if apiKey == "" {
		return "", fmt.Errorf("no gemini api key provided")
	}
	if model == "" {
		model = "gemini-2.5-flash"
	}
	// We'll attempt a couple of times for transient network glitches, with simple backoff.
	maxAttempts := 2
	var lastErr error
	for attempt := 1; attempt <= maxAttempts; attempt++ {
		ctx, cancel := context.WithTimeout(context.Background(), time.Duration(timeoutSecs)*time.Second)
		defer cancel()

		client, err := genai.NewClient(ctx, &genai.ClientConfig{
			APIKey:  apiKey,
			Backend: genai.BackendGeminiAPI,
		})
		fmt.Printf("CallGemini: creating genai client; apiKeyPresent=%v attempt=%d\n", apiKey != "", attempt)
		if err != nil {
			lastErr = fmt.Errorf("failed to create genai client: %w", err)
			// small backoff before retry
			if attempt < maxAttempts {
				time.Sleep(time.Duration(attempt) * time.Second)
				continue
			}
			return "", lastErr
		}
		// best-effort: if client provides Close, ignore error (not all versions require closing)
		if closer, ok := any(client).(interface{ Close() error }); ok {
			defer closer.Close()
		}

		contents := []*genai.Content{
			genai.NewContentFromText(prompt, genai.RoleUser),
		}

		fmt.Printf("CallGemini: calling GenerateContent; model=%s attempt=%d\n", model, attempt)
		resp, err := client.Models.GenerateContent(ctx, model, contents, nil)
		if err != nil {
			lastErr = fmt.Errorf("genai generate error: %T %v", err, err)
			// retry for transient network errors
			if attempt < maxAttempts {
				time.Sleep(time.Duration(attempt) * time.Second)
				continue
			}
			return "", lastErr
		}

		// Marshal response to JSON then parse to extract textual content robustly
		jb, _ := json.Marshal(resp)
		var dat map[string]interface{}
		if err := json.Unmarshal(jb, &dat); err != nil {
			return "", fmt.Errorf("failed to parse genai response: %w", err)
		}
		// try to find candidates -> content -> parts[0].text
		if candidates, ok := dat["candidates"].([]interface{}); ok && len(candidates) > 0 {
			if c0, ok := candidates[0].(map[string]interface{}); ok {
				if content, ok := c0["content"].(map[string]interface{}); ok {
					if parts, ok := content["parts"].([]interface{}); ok && len(parts) > 0 {
						if p0, ok := parts[0].(map[string]interface{}); ok {
							if txt, ok := p0["text"].(string); ok {
								return txt, nil
							}
						}
					}
				}
			}
		}

		// fallback: try top-level "output" or stringify entire response
		if out, ok := dat["output"].(string); ok && out != "" {
			return out, nil
		}
		// last resort: return the marshaled JSON as string
		return string(jb), nil
	}
	if lastErr != nil {
		return "", lastErr
	}
	return "", fmt.Errorf("unreachable: CallGemini failed without error")
}

// CallOpenAIChat calls OpenAI chat completions and returns the assistant content
func CallOpenAIChat(prompt, model, apiKey string, timeoutSecs int) (string, error) {
	if apiKey == "" {
		return "", fmt.Errorf("no openai api key provided")
	}
	if model == "" {
		model = "gpt-4o-mini"
	}
	url := "https://api.openai.com/v1/chat/completions"
	body := map[string]interface{}{
		"model":       model,
		"messages":    []map[string]string{{"role": "user", "content": prompt}},
		"temperature": 0,
	}
	jb, _ := json.Marshal(body)
	client := &http.Client{Timeout: time.Duration(timeoutSecs) * time.Second}
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jb))
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("OpenAI API error %d: %s", resp.StatusCode, string(respBody))
	}

	var dat map[string]interface{}
	if err := json.Unmarshal(respBody, &dat); err != nil {
		return "", fmt.Errorf("failed to parse openai json: %w", err)
	}

	if choices, ok := dat["choices"].([]interface{}); ok && len(choices) > 0 {
		if ch0, ok := choices[0].(map[string]interface{}); ok {
			if msg, ok := ch0["message"].(map[string]interface{}); ok {
				if content, ok := msg["content"].(string); ok {
					return content, nil
				}
			}
		}
	}
	return "", fmt.Errorf("could not extract content from OpenAI response: %s", string(respBody))
}

var dotenvLoaded bool

// ensureDotenvLoaded attempts to read a local `.env` file (service dir or parent)
// and sets any variables that are not already present in the environment.
func ensureDotenvLoaded() {
	if dotenvLoaded {
		return
	}
	wd, _ := os.Getwd()
	candidates := []string{
		filepath.Join(wd, ".env"),
		filepath.Join(wd, "..", ".env"),
	}
	for _, p := range candidates {
		if info, err := os.Stat(p); err == nil && !info.IsDir() {
			f, err := os.Open(p)
			if err != nil {
				continue
			}
			scanner := bufio.NewScanner(f)
			for scanner.Scan() {
				line := strings.TrimSpace(scanner.Text())
				if line == "" || strings.HasPrefix(line, "#") {
					continue
				}
				idx := strings.Index(line, "=")
				if idx <= 0 {
					continue
				}
				key := strings.TrimSpace(line[:idx])
				val := strings.TrimSpace(line[idx+1:])
				if len(val) >= 2 {
					if (val[0] == '"' && val[len(val)-1] == '"') || (val[0] == '\'' && val[len(val)-1] == '\'') {
						val = val[1 : len(val)-1]
					}
				}
				if os.Getenv(key) == "" {
					os.Setenv(key, val)
				}
			}
			f.Close()
			break
		}
	}
	dotenvLoaded = true
}

// CallModel chooses Gemini first (if configured) then OpenAI. It will also try to read a local
// ../scripts/config.yaml for gemini settings if the env var is missing.
func CallModel(prompt string) (string, error) {
	ensureDotenvLoaded()

	geminiKey := os.Getenv("GEMINI_API_KEY")
	geminiModel := os.Getenv("GEMINI_MODEL")

	if geminiModel == "" {
		geminiModel = "gemini-2.5-flash"
	}
	openaiKey := os.Getenv("OPENAI_API_KEY")
	openaiModel := os.Getenv("OPENAI_MODEL")
	if openaiModel == "" {
		openaiModel = "gpt-5-mini"
	}

	// Prefer Gemini if configured; on any runtime error try OpenAI if available.
	if geminiKey != "" {
		fmt.Println("CallModel: trying Gemini")
		out, err := CallGemini(prompt, geminiModel, geminiKey, 60)
		if err == nil {
			fmt.Println("CallModel: Gemini succeeded")
			return out, nil
		}
		fmt.Printf("CallModel: Gemini error: %v\n", err)
		if openaiKey != "" {
			fmt.Println("CallModel: falling back to OpenAI")
			if out2, err2 := CallOpenAIChat(prompt, openaiModel, openaiKey, 60); err2 == nil {
				return out2, nil
			} else {
				return "", fmt.Errorf("gemini error: %v; openai fallback error: %w", err, err2)
			}
		}
		return "", fmt.Errorf("gemini call failed: %w", err)
	}

	// If no Gemini key, try OpenAI if configured.
	if openaiKey != "" {
		fmt.Println("CallModel: using OpenAI as primary provider")
		return CallOpenAIChat(prompt, openaiModel, openaiKey, 60)
	}

	return "", fmt.Errorf("no API key found; set GEMINI_API_KEY or OPENAI_API_KEY")
}
