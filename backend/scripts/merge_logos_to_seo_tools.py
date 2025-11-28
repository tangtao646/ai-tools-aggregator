#!/usr/bin/env python3
"""
merge_logos_to_seo_tools.py

Compare two JSON files: a list of logos (`success_logos.json`) and the
SEO tools file (`seo_tools.json`). For matching `name` values, insert the
`logo_url` from the logos file into the corresponding seo_tools entry.

Usage:
  python backend/scripts/merge_logos_to_seo_tools.py \
      --logos backend/scripts/success_logos.json \
      --seo backend/scripts/seo_tools.json

Options:
  --dry-run      Print summary but do not modify the SEO file
  --overwrite    Overwrite existing `logo_url` values in seo_tools
  --backup       Create a timestamped backup of the original SEO file

This script is conservative by default (no overwrite unless asked).
It attempts exact normalized-name matching first, then falls back to a
simple fuzzy match using SequenceMatcher for best-effort matches.
"""

import argparse
import json
import re
import shutil
from pathlib import Path
from difflib import SequenceMatcher
from datetime import datetime


def normalize_name(name: str) -> str:
    if not name:
        return ""
    s = name.lower().strip()
    # remove punctuation except spaces/word chars
    s = re.sub(r"[^\w\s]", "", s)
    s = re.sub(r"\s+", " ", s)
    return s


def load_json(path: Path):
    with path.open('r', encoding='utf-8') as f:
        return json.load(f)


def save_json(path: Path, data):
    with path.open('w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def find_tools_list(data):
    # If the file is a list, return it
    if isinstance(data, list):
        return data, lambda new_list: new_list

    # Common wrappers
    for key in ('items', 'tools', 'data'):
        if isinstance(data, dict) and key in data and isinstance(data[key], list):
            def setter(new_list, d=data, k=key):
                d[k] = new_list
                return d
            return data[key], setter

    raise ValueError('Unsupported seo_tools.json structure: must be list or contain items/tools/data list')


def best_fuzzy_match(name, candidates):
    # candidates: list of (original_name, normalized_name)
    best = None
    best_score = 0.0
    for orig, norm in candidates:
        score = SequenceMatcher(None, name, norm).ratio()
        if score > best_score:
            best_score = score
            best = orig
    return best, best_score


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--logos', type=Path, default=Path('success_logos.json'))
    parser.add_argument('--seo', type=Path, default=Path('seo_tools.json'))
    parser.add_argument('--dry-run', action='store_true')
    # By default replace existing logo_url values when a match is found
    parser.add_argument('--no-replace-existing', action='store_true', help='Do not replace existing logo_url values')
    parser.add_argument('--backup', action='store_true')
    args = parser.parse_args()

    if not args.logos.exists():
        print(f'Logos file not found: {args.logos}')
        return
    if not args.seo.exists():
        print(f'SEO tools file not found: {args.seo}')
        return

    logos_data = load_json(args.logos)
    seo_data = load_json(args.seo)

    logos_map = {}
    logos_norm = []
    for entry in logos_data:
        name = entry.get('name')
        logo_url = entry.get('logo_url')
        if not name or not logo_url:
            continue
        norm = normalize_name(name)
        logos_map[norm] = logo_url
        logos_norm.append((name, norm))

    seo_list, seo_setter = find_tools_list(seo_data)

    updated = 0
    skipped_existing = 0
    fuzzy_matches = []
    not_found = []

    for tool in seo_list:
        tool_name = tool.get('name') or tool.get('title') or ''
        if not tool_name:
            not_found.append(tool)
            continue
        tool_norm = normalize_name(tool_name)

        if tool.get('logo_url') and args.no_replace_existing:
            skipped_existing += 1
            continue

        # exact normalized match
        logo_url = logos_map.get(tool_norm)

        matched_name = None
        matched_score = None
        if not logo_url:
            # fuzzy fallback
            best_orig, score = best_fuzzy_match(tool_norm, logos_norm)
            if score >= 0.80:
                matched_name = best_orig
                matched_score = score
                logo_url = logos_map.get(normalize_name(best_orig))

        if logo_url:
            tool['logo_url'] = logo_url
            updated += 1
            if matched_name:
                fuzzy_matches.append((tool_name, matched_name, matched_score))
        else:
            not_found.append(tool_name)

    print('Summary:')
    print(f'  SEO tools processed: {len(seo_list)}')
    print(f'  Updated logo_url: {updated}')
    print(f'  Skipped existing (no overwrite): {skipped_existing}')
    print(f'  Fuzzy matches used: {len(fuzzy_matches)}')
    if fuzzy_matches:
        print('  Fuzzy match details:')
        for a, b, s in fuzzy_matches:
            print(f'    {a}  <--matched to-->  {b}  (score={s:.2f})')

    if not_found:
        print(f'  Not found: {len(not_found)} names')

    if args.dry_run:
        print('\nDry run enabled -- no file will be modified.')
        return

    if args.backup:
        bak = args.seo.with_suffix(args.seo.suffix + f'.bak.{datetime.utcnow().strftime("%Y%m%d%H%M%S")}')
        shutil.copy2(args.seo, bak)
        print(f'Backup created: {bak}')

    # write back
    new_data = seo_setter(seo_list) if callable(seo_setter) else seo_list
    save_json(args.seo, new_data)
    print(f'Wrote updated SEO file: {args.seo}')


if __name__ == '__main__':
    main()
