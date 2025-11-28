"""Set or update the administrator account credentials.

Usage:
  python3 set_admin_credentials.py

This script upserts an Admin with the provided username and password.
It uses the project's `get_session` and `hash_password` utilities.
"""

import sys
from pathlib import Path

backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.core.db import get_session
from app.models.admin import Admin
from app.core.auth import hash_password
from sqlmodel import select


def set_admin_credentials(username: str, password: str):
    session = next(get_session())
    try:
        statement = select(Admin).where(Admin.username == username)
        existing = session.exec(statement).first()

        hashed = hash_password(password)

        if existing:
            existing.hashed_password = hashed
            session.add(existing)
            session.commit()
            session.refresh(existing)
            print(f"✅ Updated admin '{username}' (id={existing.id})")
        else:
            admin = Admin(username=username, hashed_password=hashed)
            session.add(admin)
            session.commit()
            session.refresh(admin)
            print(f"✅ Created admin '{username}' (id={admin.id})")

    except Exception as e:
        print(f"❌ Failed to set admin credentials: {e}")
        session.rollback()
    finally:
        session.close()


if __name__ == '__main__':
    # Credentials requested by the user
    USERNAME = 'taoge646@gmail.com'
    PASSWORD = '625749TT'

    set_admin_credentials(USERNAME, PASSWORD)
    # Deprecate the original default admin if it exists (username: 'admin')
    try:
        session = next(get_session())
        stmt = select(Admin).where(Admin.username == 'admin')
        old = session.exec(stmt).first()
        if old:
            # Avoid deleting if the requested username is the same as 'admin'
            if USERNAME != 'admin':
                session.delete(old)
                session.commit()
                print("✅ Deprecated and removed legacy admin account 'admin'")
            else:
                print("⚠️ New admin username is 'admin' — skipping removal of legacy account")
        else:
            print("ℹ️ No legacy 'admin' account found to remove.")
    except Exception as e:
        print(f"❌ Failed to remove legacy admin: {e}")
    finally:
        try:
            session.close()
        except:
            pass
