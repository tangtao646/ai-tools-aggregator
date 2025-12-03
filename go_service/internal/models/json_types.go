package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

// StringArray maps a JSON array in the DB to a Go []string safely.
type StringArray []string

// Scan implements sql.Scanner
func (s *StringArray) Scan(src interface{}) error {
	if src == nil {
		*s = nil
		return nil
	}
	var data []byte
	switch v := src.(type) {
	case string:
		data = []byte(v)
	case []byte:
		data = v
	default:
		return fmt.Errorf("unsupported scan type %T for StringArray", src)
	}
	if len(data) == 0 {
		*s = []string{}
		return nil
	}
	return json.Unmarshal(data, s)
}

// Value implements driver.Valuer
func (s StringArray) Value() (driver.Value, error) {
	if s == nil {
		return nil, nil
	}
	return json.Marshal(s)
}
