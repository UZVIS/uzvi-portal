import sqlite3
con = sqlite3.connect("portal.db")
con.execute("DROP TABLE IF EXISTS announcement_acks")
con.execute("DROP TABLE IF EXISTS announcements")
con.commit()
print("dropped")
