import os
import re

folder = "alembic/versions"
for fname in sorted(os.listdir(folder)):
    if not fname.endswith(".py"):
        continue
    path = os.path.join(folder, fname)
    text = open(path, encoding="utf-8").read()
    rev = re.search(r"^revision:?\s*(?:str)?\s*=\s*['\"]([\w]+)", text, re.MULTILINE)
    down = re.search(r"^down_revision.*=\s*(.+)", text, re.MULTILINE)
    print(fname, "| rev=", rev.group(1) if rev else "?", "| down=", down.group(1).strip() if down else "?")