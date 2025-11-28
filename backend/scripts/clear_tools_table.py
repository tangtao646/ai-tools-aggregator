#!/usr/bin/env python3
"""
clear_tools_table.py

Safely clear the `tools` table in the application's database.

Features:
- --dry-run: only report the number of rows and do not modify the DB
- --backup: export current rows to a timestamped JSON file before deletion
- --yes: skip interactive confirmation and proceed

Usage:
  python backend/scripts/clear_tools_table.py --dry-run
  python backend/scripts/clear_tools_table.py --backup
  python backend/scripts/clear_tools_table.py --yes --backup
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

# Ensure `backend` dir is on sys.path so `import app` works when running the script
ROOT_BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_BACKEND))

from sqlmodel import Session, select
from app.core.db import engine
from app.models.tool import Tool


def export_backup(session, out_path: Path):
    stmt = select(Tool)
    rows = session.exec(stmt).all()
    payload = [r.model_dump() for r in rows]

    def _json_default(o):
        # Convert datetimes to ISO format for JSON serialization
        try:
            from datetime import datetime
            if isinstance(o, datetime):
                return o.isoformat()
        except Exception:
            pass
        # Fallback to string representation
        return str(o)

    with out_path.open('w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, indent=2, default=_json_default)
    return len(payload)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--backup', action='store_true')
    parser.add_argument('--yes', action='store_true', help='Skip confirmation')
    args = parser.parse_args()

    with Session(engine) as session:
        stmt = select(Tool)
        rows = session.exec(stmt).all()
        total = len(rows)

        print(f"Tools table rows: {total}")

        if args.dry_run:
            print('Dry run: no changes will be made.')
            return

        if total == 0:
            print('No rows to delete.')
            return

        if args.backup:
            ts = datetime.utcnow().strftime('%Y%m%d%H%M%S')
            out = Path('backend/scripts') / f'tools_backup_{ts}.json'
            count = export_backup(session, out)
            print(f'Backup written: {out} ({count} rows)')

        if not args.yes:
            confirm = input('Are you sure you want to DELETE ALL rows in `tools` table? Type YES to confirm: ')
            if confirm != 'YES':
                print('Aborted.')
                return

        # perform deletion
        from sqlalchemy import delete
        session.exec(delete(Tool))
        session.commit()
        print(f'Deleted {total} rows from tools table.')


if __name__ == '__main__':
    main()
