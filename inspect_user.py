import os
import sys
import urllib.request
import json
import ssl

token = os.environ.get("NEWTON_TOKEN")
token_path = os.path.join(os.path.dirname(__file__), ".token")
if not token and os.path.exists(token_path):
    with open(token_path, "r") as f:
        token = f.read().strip()

if not token:
    print("Error: No token found. Set NEWTON_TOKEN or save into .token file.")
    sys.exit(1)

BASE_URL = "https://my.newtonschool.co"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    "Authorization": f"Bearer {token}",
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0"
}

def get(path):
    req = urllib.request.Request(f"{BASE_URL}{path}", headers=headers)
    with urllib.request.urlopen(req, context=ctx) as r:
        return json.loads(r.read().decode('utf-8'))

print("=== USER INFO ===")
user = get("/api/v1/user/me/")
print(json.dumps(user, indent=2))

print("\n=== APPLIED COURSES ===")
try:
    applied = get("/api/v2/course/all/applied/?pagination=false&completed=false")
    print(json.dumps(applied, indent=2))
except Exception as e:
    print("Error getting applied:", e)

print("\n=== PERFORMANCE FOR u4fvf1rm9v2e ===")
try:
    perf = get("/api/v2/course/h/u4fvf1rm9v2e/self_performance/")
    print(json.dumps(perf, indent=2))
except Exception as e:
    print("Error getting perf:", e)
