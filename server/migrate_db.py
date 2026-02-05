import json
import os

db_path = r'd:\anti gravity project1\server\database.json'

if os.path.exists(db_path):
    with open(db_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if isinstance(data, list):
        new_data = {
            "posts": data,
            "services": [],
            "metrics": [],
            "process": []
        }
        with open(db_path, 'w', encoding='utf-8') as f:
            json.dump(new_data, f, indent=2)
        print("✅ Database migrated to object structure")
    else:
        print("ℹ️ Database already in object structure")
else:
    print("❌ Database file not found")
