import sqlite3
conn = sqlite3.connect("portal.db")
conn.execute("UPDATE employees SET access_tier = 'Admin/Leadership' WHERE employee_id = 'ADMIN001'")
conn.commit()
print("Updated ADMIN001's access_tier to Admin/Leadership")