#!/usr/bin/env python3
"""
Newton School LMS Attendance Tracker (Python Edition)
Usage:
  python3 attendance.py [TOKEN] [COURSE_HASH]
"""

import sys
import os
import json
import urllib.request
import urllib.error
import ssl
import math

BASE_URL = "https://my.newtonschool.co"
_ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TOKEN_FILE = os.path.join(_ROOT_DIR, ".token") if os.path.exists(os.path.join(_ROOT_DIR, ".token")) else os.path.join(_SCRIPT_DIR, ".token")

def get_token():
    if len(sys.argv) > 1 and not sys.argv[1].startswith('-'):
        token = sys.argv[1].strip()
        save_token(token)
        return token

    env_token = os.environ.get("NEWTON_TOKEN")
    if env_token:
        return env_token.strip()

    if os.path.exists(TOKEN_FILE):
        try:
            with open(TOKEN_FILE, 'r') as f:
                saved = f.read().strip()
                if saved:
                    return saved
        except Exception:
            pass

    print("\n" + "="*60)
    print("🎓 NEWTON SCHOOL ATTENDANCE TRACKER")
    print("="*60)
    token = input("👉 Paste your token here: ").strip()
    if not token:
        print("\n[!] No token provided. Exiting.")
        sys.exit(1)

    save_token(token)
    return token

def save_token(token):
    clean = token.replace("Bearer ", "").replace("bearer ", "").strip()
    try:
        with open(TOKEN_FILE, 'w') as f:
            f.write(clean)
    except Exception:
        pass

def fetch_json(endpoint, token):
    clean_token = token.replace("Bearer ", "").replace("bearer ", "").strip()
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {clean_token}",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
    })
    
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    try:
        with urllib.request.urlopen(req, context=ctx) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        if e.code == 401:
            print("\n❌ [401 Unauthorized] Your token has expired or is invalid.")
            if os.path.exists(TOKEN_FILE):
                os.remove(TOKEN_FILE)
        else:
            print(f"\n❌ [HTTP {e.code}] Error fetching {endpoint}: {e.reason}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error connecting to Newton School: {e}")
        sys.exit(1)

def calculate_stats(attended, total, target_pct=75.0):
    if total == 0:
        return 0.0, 0, 0
    
    pct = (attended / total) * 100
    target = target_pct / 100.0
    
    if pct >= target_pct:
        bunkable = math.floor((attended - target * total) / target)
        return pct, max(0, bunkable), 0
    else:
        if target >= 1.0:
            return pct, 0, 999
        required = math.ceil((target * total - attended) / (1.0 - target))
        return pct, 0, max(0, required)

def extract_subjects_from_applied(applied_data, target_semester_hash="u4fvf1rm9v2e"):
    subjects = []
    semester_name = "Semester"

    for course_entry in applied_data:
        children = course_entry.get("children_courses", {})
        admin_units = children.get("admin_unit_courses", [])

        for unit in admin_units:
            if unit.get("hash") == target_semester_hash or not target_semester_hash:
                semester_name = unit.get("title", unit.get("short_display_name", "Current Semester"))
                for sub in unit.get("learning_unit_courses", []):
                    subjects.append({
                        "hash": sub.get("hash"),
                        "name": sub.get("title") or sub.get("short_display_name"),
                        "code": sub.get("short_display_name")
                    })
                if subjects:
                    return semester_name, subjects

        # Direct learning units fallback
        for sub in children.get("learning_unit_courses", []):
            subjects.append({
                "hash": sub.get("hash"),
                "name": sub.get("title") or sub.get("short_display_name"),
                "code": sub.get("short_display_name")
            })

    return semester_name, subjects

def main():
    token = get_token()
    course_hash = sys.argv[2] if len(sys.argv) > 2 else "u4fvf1rm9v2e"

    print("\n⏳ Fetching profile from Newton School LMS...")
    user_data = fetch_json("/api/v1/user/me/", token)
    first_name = user_data.get("first_name", "")
    last_name = user_data.get("last_name", "")
    email = user_data.get("email", user_data.get("username", ""))

    print(f"✅ Logged in as: \033[1m{first_name} {last_name}\033[0m ({email})")

    # Fetch overall applied hierarchy
    applied = fetch_json("/api/v2/course/all/applied/?pagination=false&completed=false", token)
    sem_name, subjects = extract_subjects_from_applied(applied, course_hash)

    # Fetch main semester performance
    sem_perf = fetch_json(f"/api/v2/course/h/{course_hash}/self_performance/", token)
    overall_att = sem_perf.get("total_lectures_attended", 0)
    overall_tot = sem_perf.get("total_lectures", 0)
    overall_pct, overall_bunk, overall_req = calculate_stats(overall_att, overall_tot, 75.0)

    print("\n" + "="*86)
    print(f"ATTENDANCE REPORT — {sem_name.upper()}")
    print("="*86)
    print(f"Overall Semester Attendance : {overall_att}/{overall_tot} classes ({overall_pct:.1f}%)")
    if overall_pct >= 75.0:
        print(f"Overall Status              : \033[32m🟢 SAFE — You can bunk {overall_bunk} classes overall while maintaining 75%\033[0m")
    else:
        print(f"Overall Status              : \033[31m🔴 ATTENDANCE LOW — Must attend {overall_req} consecutive classes to reach 75%\033[0m")
    print("-" * 86)
    print(f"{'#':<3} {'Subject / Course Name':<45} {'Classes':<10} {'%':<8} {'Status / Action'}")
    print("-" * 86)

    for idx, s in enumerate(subjects, 1):
        name = s['name']
        if len(name) > 43:
            name = name[:40] + "..."
        
        try:
            perf = fetch_json(f"/api/v2/course/h/{s['hash']}/self_performance/", token)
            att = perf.get('total_lectures_attended', 0)
            tot = perf.get('total_lectures', 0)
            pct, bunk, req = calculate_stats(att, tot, 75.0)

            if pct >= 80.0:
                status = f"\033[32m🟢 Can bunk {bunk} class(es)\033[0m"
            elif pct >= 75.0:
                status = f"\033[33m🟡 Borderline ({bunk} bunkable)\033[0m"
            elif tot == 0:
                status = "⚪ No lectures yet"
            else:
                status = f"\033[31m🔴 Attend {req} class(es) consecutive\033[0m"

            print(f"{idx:<3} {name:<45} {f'{att}/{tot}':<10} {f'{pct:.1f}%':<8} {status}")
        except Exception:
            print(f"{idx:<3} {name:<45} {'N/A':<10} {'N/A':<8} ⚪ Skipped")

    print("="*86)
    print("💡 Token saved in .token — next time just run: python3 attendance.py\n")

if __name__ == "__main__":
    main()
