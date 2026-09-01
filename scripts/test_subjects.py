import os
import sys
import urllib.request
import json
import ssl

token = os.environ.get("NEWTON_TOKEN")
_ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
token_path = os.path.join(_ROOT_DIR, ".token") if os.path.exists(os.path.join(_ROOT_DIR, ".token")) else os.path.join(_SCRIPT_DIR, ".token")
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

# List of subjects under Semester 3
subjects = [
    {"hash": "y4jra1o5yjcj", "name": "Analysis and Design of Algorithms (ADA)"},
    {"hash": "x3300pxoaayu", "name": "ADA Lab 2"},
    {"hash": "ar66n55tzlgl", "name": "Advanced Programming"},
    {"hash": "rw4p1qnhjcfn", "name": "Advanced Programming Lab 2"},
    {"hash": "oojehllgsouk", "name": "Calculus and Linear Algebra for AI"},
    {"hash": "qobpbvdsyekt", "name": "Data Engineering"},
    {"hash": "onr65jwzgdgj", "name": "Data Engineering Lab 2"},
    {"hash": "abqtra71lo83", "name": "Calculus and Linear Algebra Lab 2"},
    {"hash": "pplfefkvvgtw", "name": "YOGA 2"}
]

print("Fetching attendance for Semester 3 subjects...\n")
for s in subjects:
    try:
        perf = get(f"/api/v2/course/h/{s['hash']}/self_performance/")
        att = perf.get('total_lectures_attended', 0)
        tot = perf.get('total_lectures', 0)
        pct = (att / tot * 100) if tot > 0 else 0
        print(f"📌 {s['name']:<40} : {att}/{tot} ({pct:.1f}%)")
    except Exception as e:
        print(f"⚠️ {s['name']}: {e}")
