import traceback, sys, json
from app.api.endpoints import tools as tools_mod
from app.core.db import get_session

try:
    gen = get_session()
    db = next(gen)
    try:
        res = tools_mod.read_tools_compact(db=db)
        print(json.dumps(res, default=str, ensure_ascii=False))
    finally:
        try:
            next(gen)
        except StopIteration:
            pass
except Exception as e:
    with open('backend/inspect_compact_error.log','w') as f:
        f.write('Exception:\n')
        traceback.print_exc(file=f)
    print('ERROR_WRITTEN')
