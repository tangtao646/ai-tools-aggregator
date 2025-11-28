#!/usr/bin/env python3
"""
Load a category mapping JSON file and upsert its entries into the
`category_mapping` table (SQLModel). Useful for applying a mapping
generated offline or by `generate_category_mapping.py` into the DB.

Usage:
  python upsert_category_mapping.py --mapping_file backend/scripts/category_mapping.json

This script expects to be run from the repository root with the
backend virtualenv active so that `app` package imports resolve.
"""
import argparse
import json
import os
import sys
from datetime import datetime

# Ensure backend package path is on sys.path when running from scripts/
backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from app.core.db import engine
from sqlmodel import Session, select
from app.models.category_mapping import CategoryMapping


def load_mapping(path: str):
    if not os.path.exists(path):
        raise FileNotFoundError(path)
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f) or {}
    if not isinstance(data, dict):
        raise ValueError('Mapping file must contain a JSON object (dict)')
    return data


def upsert_mapping(mapping: dict):
    inserted = 0
    updated = 0
    skipped = 0
    with Session(engine) as session:
        for orig, disp in mapping.items():
            try:
                stmt = select(CategoryMapping).where(CategoryMapping.original_category == orig)
                row = session.exec(stmt).first()
                if row:
                    if row.display_category != disp:
                        row.display_category = str(disp)
                        row.updated_at = datetime.utcnow()
                        session.add(row)
                        updated += 1
                    else:
                        skipped += 1
                else:
                    new_row = CategoryMapping(original_category=str(orig), display_category=str(disp))
                    session.add(new_row)
                    inserted += 1
            except Exception as e:
                session.rollback()
                print(f"Warning: failed to upsert '{orig}': {e}")
        try:
            session.commit()
        except Exception as e:
            session.rollback()
            raise

    return {"inserted": inserted, "updated": updated, "skipped": skipped}


def main():
    parser = argparse.ArgumentParser(description='Upsert category mapping JSON into DB table')
    parser.add_argument('--mapping_file', default='backend/scripts/category_mapping.json', help='Path to mapping JSON file')
    args = parser.parse_args()

    mapping_path = args.mapping_file
    print(f"Loading mapping from: {mapping_path}")
    mapping = load_mapping(mapping_path)
    print(f"Loaded {len(mapping)} entries, upserting into DB...")
    summary = upsert_mapping(mapping)
    print("Upsert summary:", summary)


if __name__ == '__main__':
    main()
