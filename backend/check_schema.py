import sqlite3
con = sqlite3.connect("portal.db")
rows = con.execute("SELECT sql FROM sqlite_master WHERE name='announcements'").fetchall()
print(rows)
