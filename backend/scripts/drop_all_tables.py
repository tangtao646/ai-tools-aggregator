"""
Safe helper to drop all tables in the configured DATABASE_URL.

Usage:
  - Review this file before running.
  - To run interactively: `python backend/scripts/drop_all_tables.py`
  - The script will prompt for confirmation unless you set the environment
    variable `FORCE_DROP_ALL=true` (use with extreme caution).

IMPORTANT: This is destructive and irreversible. Make a backup before running.
"""

import os
import sys
from app.core.config import settings
from sqlmodel import SQLModel, create_engine
import traceback
from sqlalchemy import MetaData


def confirm():
    force = os.environ.get("FORCE_DROP_ALL", "false").lower()
    if force in ("1", "true", "yes"):
        return True

    print("WARNING: This will DROP ALL TABLES in the database referenced by DATABASE_URL.")
    print(f"DATABASE_URL={settings.DATABASE_URL}")
    reply = input("Type 'DROP' to proceed: ")
    return reply.strip() == "DROP"


def drop_all():
    engine = create_engine(settings.DATABASE_URL)
    print("Dropping all tables...")

    # If you want to drop only tables known to SQLModel metadata, set
    # DROP_ONLY_SQLMODEL=true. By default we reflect the database and drop
    # every table present so that tables created outside of the current
    # model metadata are also removed.
    drop_only_sqlmodel = os.environ.get("DROP_ONLY_SQLMODEL", "false").lower() in ("1", "true", "yes")

    if drop_only_sqlmodel:
        SQLModel.metadata.drop_all(engine)
        print("Dropped tables defined in SQLModel metadata.")
    else:
        meta = MetaData()
        # reflect the current database schema
        meta.reflect(bind=engine)
        if not meta.tables:
            print("No tables found to drop.")
            return
        # drop all reflected tables
        meta.drop_all(bind=engine)
        print(f"Dropped {len(meta.tables)} table(s) from the database.")


def main():
    if not confirm():
        print("Aborted by user. No changes made.")
        sys.exit(1)

    try:
        drop_all()
    except Exception as e:
        print("Error while dropping tables:", e)
        traceback.print_exc()
        sys.exit(2)


if __name__ == "__main__":
    main()

#运行实例
# To run interactively:
# python backend/scripts/drop_all_tables.py
# To run without prompt (use with extreme caution):
# FORCE_DROP_ALL=true python backend/scripts/drop_all_tables.py