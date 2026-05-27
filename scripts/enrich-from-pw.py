"""
Enrich all-data.json from PsychonautWiki GraphQL API.
Fills: SMILES (sm), ROAs with dose/duration (pr), PW summaries (pw), aliases (a), commonNames.
"""
import json, time, urllib.request, urllib.parse, ssl, sys, os, re

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "src", "data", "all-data.json")
API = "https://api.psychonautwiki.org/"
DELAY = 1.2
ctx = ssl.create_default_context()

# ROA route name mapping between our format and PW
ROA_ROUTES = [
    "oral", "sublingual", "buccal", "insufflated",
    "rectal", "transdermal", "subcutaneous",
    "intramuscular", "intravenous", "smoked"
]

def fetch_substance(name):
    query = """
query($name: String!) {
  substances(query: $name) {
    name
    summary
    commonNames
    roa {
      oral { name dose { units threshold light { min max } common { min max } strong { min max } heavy } duration { onset { min max units } comeup { min max units } peak { min max units } offset { min max units } total { min max units } afterglow { min max units } } }
      sublingual { name dose { units threshold light { min max } common { min max } strong { min max } heavy } duration { onset { min max units } comeup { min max units } peak { min max units } offset { min max units } total { min max units } afterglow { min max units } } }
      buccal { name dose { units threshold light { min max } common { min max } strong { min max } heavy } duration { onset { min max units } comeup { min max units } peak { min max units } offset { min max units } total { min max units } afterglow { min max units } } }
      insufflated { name dose { units threshold light { min max } common { min max } strong { min max } heavy } duration { onset { min max units } comeup { min max units } peak { min max units } offset { min max units } total { min max units } afterglow { min max units } } }
      rectal { name dose { units threshold light { min max } common { min max } strong { min max } heavy } duration { onset { min max units } comeup { min max units } peak { min max units } offset { min max units } total { min max units } afterglow { min max units } } }
      transdermal { name dose { units threshold light { min max } common { min max } strong { min max } heavy } duration { onset { min max units } comeup { min max units } peak { min max units } offset { min max units } total { min max units } afterglow { min max units } } }
      subcutaneous { name dose { units threshold light { min max } common { min max } strong { min max } heavy } duration { onset { min max units } comeup { min max units } peak { min max units } offset { min max units } total { min max units } afterglow { min max units } } }
      intramuscular { name dose { units threshold light { min max } common { min max } strong { min max } heavy } duration { onset { min max units } comeup { min max units } peak { min max units } offset { min max units } total { min max units } afterglow { min max units } } }
      intravenous { name dose { units threshold light { min max } common { min max } strong { min max } heavy } duration { onset { min max units } comeup { min max units } peak { min max units } offset { min max units } total { min max units } afterglow { min max units } } }
      smoked { name dose { units threshold light { min max } common { min max } strong { min max } heavy } duration { onset { min max units } comeup { min max units } peak { min max units } offset { min max units } total { min max units } afterglow { min max units } } }
    }
  }
}
"""
    payload = json.dumps({"query": query, "variables": {"name": name}}).encode()
    req = urllib.request.Request(API, data=payload,
        headers={"Content-Type": "application/json", "User-Agent": "DrugVault/1.0 (enrich)"})
    try:
        resp = urllib.request.urlopen(req, timeout=20, context=ctx)
        data = json.loads(resp.read())
        subs = data.get("data", {}).get("substances", [])
        if subs:
            return subs[0]
    except Exception as e:
        sys.stderr.write(f"  PW error for '{name}': {e}\n")
    return None

def format_dose_range(val, units=None):
    if val is None:
        return None
    if isinstance(val, (int, float)):
        s = str(int(val)) if val == int(val) else str(val)
        return s
    if isinstance(val, dict):
        mn = val.get("min")
        mx = val.get("max")
        if mn is not None and mx is not None:
            mn_s = str(int(mn)) if mn == int(mn) else str(mn)
            mx_s = str(int(mx)) if mx == int(mx) else str(mx)
            if mn_s == mx_s:
                return mn_s
            return f"{mn_s}-{mx_s}"
        if mn is not None:
            return str(int(mn)) if mn == int(mn) else str(mn)
    return None

def format_duration_time(t, units):
    if t is None:
        return None
    s = str(int(t)) if t == int(t) else str(t)
    if units:
        # Normalize units
        u = units.lower().rstrip("s")
        m = {"minute": "min", "hour": "hours", "day": "days", "week": "weeks", "month": "months"}
        u = m.get(u, u)
        if u == "hour":
            u = "hours"
        return f"{s} {u}"
    return s

def pw_to_roa_list(pw_roa):
    roas = []
    for route in ROA_ROUTES:
        data = pw_roa.get(route)
        if data is None:
            continue
        dose = data.get("dose")
        duration = data.get("duration")

        roa_entry = {"n": route, "d": None, "dur": None}

        if dose:
            d_entry = {}
            d_entry["t"] = format_dose_range(dose.get("threshold"), dose.get("units")) or "?"
            d_entry["l"] = format_dose_range(dose.get("light"), dose.get("units")) or ""
            d_entry["c"] = format_dose_range(dose.get("common"), dose.get("units")) or ""
            d_entry["s"] = format_dose_range(dose.get("strong"), dose.get("units")) or ""
            h = dose.get("heavy")
            d_entry["h"] = format_dose_range(h, dose.get("units")) if h is not None else ""
            d_entry["u"] = dose.get("units") or ""
            if d_entry["t"] or d_entry["l"] or d_entry["c"]:
                roa_entry["d"] = d_entry

        if duration:
            dur_entry = {}
            onset = duration.get("onset")
            if onset:
                dur_entry["o"] = format_duration_time(onset.get("max"), onset.get("units")) or ""
            peak = duration.get("peak")
            if peak:
                dur_entry["p"] = format_duration_time(peak.get("max"), peak.get("units")) or ""
            total = duration.get("total")
            if total:
                dur_entry["t"] = format_duration_time(total.get("max"), total.get("units")) or ""
            if dur_entry:
                roa_entry["dur"] = dur_entry

        roas.append(roa_entry)
    return roas

def merge_roas(existing, pw_roas):
    if not pw_roas:
        return existing if existing else None

    if not existing:
        return pw_roas if pw_roas else None

    existing_map = {}
    for roa in existing:
        existing_map[roa["n"]] = roa

    for pw_roa in pw_roas:
        name = pw_roa["n"]
        if name in existing_map:
            cur = existing_map[name]
            merged_dose = cur["d"] if cur["d"] else pw_roa["d"]
            merged_dur = cur["dur"] if cur["dur"] else pw_roa["dur"]
            if cur["d"] is None or cur.get("d", {}).get("t") in ("?", None, ""):
                if pw_roa["d"]:
                    merged_dose = pw_roa["d"]
            existing_map[name] = {"n": name, "d": merged_dose, "dur": merged_dur}
        else:
            existing_map[name] = pw_roa

    result = list(existing_map.values())
    return result if result else None

def main():
    with open(DATA_PATH) as f:
        data = json.load(f)

    substances = data["s"]
    total = len(substances)

    stats = {"smiles_filled": 0, "roas_filled": 0, "pw_filled": 0, "aliases_added": 0, "dose_filled": 0, "dur_filled": 0}

    for i, sub in enumerate(substances):
        name = sub["n"]
        needs_smiles = not sub.get("sm")
        needs_roas = sub.get("pr") is None or len(sub.get("pr", [])) == 0
        has_null_dose = False
        has_null_dur = False
        if sub.get("pr"):
            for roa in sub["pr"]:
                if roa.get("d") is None:
                    has_null_dose = True
                if roa.get("dur") is None:
                    has_null_dur = True
        needs_pw = not sub.get("pw")
        needs_any = needs_smiles or needs_roas or needs_pw or has_null_dose or has_null_dur

        if not needs_any:
            continue

        candidates = [name] + [a for a in sub.get("a", []) if a]
        found = None
        used_name = None
        for cname in candidates:
            result = fetch_substance(cname)
            if result:
                found = result
                used_name = cname
                break

        sys.stdout.write(f"[{i+1}/{total}] {name}")
        sys.stdout.flush()

        if found:
            pw_name = found.get("name", name)
            sys.stdout.write(f" (PW: {pw_name})")

            # Fill SMILES - not available from PW API, skip
            # (PW doesn't return SMILES)

            # Fill summary
            if needs_pw or True:
                summary = found.get("summary")
                if summary and len(summary) > 10:
                    # Clean up PW summary (remove "Summary sheet: " prefix etc.)
                    cleaned = re.sub(r'^Summary sheet:\s*[A-Za-z0-9\s]+\n?', '', summary).strip()
                    if cleaned and len(cleaned) > 10:
                        sub["pw"] = cleaned
                        stats["pw_filled"] += 1
                        sys.stdout.write(" +pw")

            # Fill aliases from commonNames
            common_names = found.get("commonNames", [])
            if common_names:
                existing = set(a.lower() for a in sub.get("a", []))
                new_aliases = [n for n in common_names if n.lower() not in existing and n.lower() != name.lower()]
                if new_aliases:
                    sub["a"] = list(dict.fromkeys(sub.get("a", []) + new_aliases))
                    stats["aliases_added"] += 1
                    sys.stdout.write(" +aliases")

            # Fill ROAs
            pw_roa = found.get("roa")
            if pw_roa:
                pw_roas = pw_to_roa_list(pw_roa)
                if pw_roas:
                    merged = merge_roas(sub.get("pr"), pw_roas)
                    if merged and (needs_roas or has_null_dose or has_null_dur):
                        old_roas = sub.get("pr")
                        sub["pr"] = merged
                        if needs_roas:
                            stats["roas_filled"] += 1
                            sys.stdout.write(" +roas")
                        else:
                            stats["dose_filled"] += 1
                            sys.stdout.write(" +dose")

            sys.stdout.write("\n")
        else:
            sys.stdout.write(" (not found in PW)\n")

        sys.stdout.flush()
        time.sleep(DELAY)

        # Save every 50
        if (i + 1) % 50 == 0 or i == total - 1:
            with open(DATA_PATH, "w") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            sys.stderr.write(f"  [saved after {i+1}]\n")

    with open(DATA_PATH, "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n=== Enrichment complete ===")
    print(f"  SMILES filled: {stats['smiles_filled']}")
    print(f"  ROAs added: {stats['roas_filled']}")
    print(f"  Dose data filled: {stats['dose_filled']}")
    print(f"  PW summaries filled: {stats['pw_filled']}")
    print(f"  Aliases added: {stats['aliases_added']}")

if __name__ == "__main__":
    main()
