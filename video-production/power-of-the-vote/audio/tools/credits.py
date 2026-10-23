import json, sys, urllib.request, urllib.parse, re, html
UA = "CivicVoteVideo/1.0 (idoitbigtime@gmail.com) python-urllib"
picks = {}
for f in sys.argv[1:-1]: picks.update(json.load(open(f)))
q = {"action": "query", "titles": "|".join(picks.values()), "prop": "imageinfo", "iiprop": "extmetadata|url", "format": "json"}
url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(q)
r = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=60))
norm = {n["from"]: n["to"] for n in r["query"].get("normalized", [])}
by = {p["title"]: p for p in r["query"]["pages"].values()}
strip = lambda s: re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", s or ""))).strip()
out = {}
for k, t in picks.items():
    p = by.get(norm.get(t, t))
    if not p or "imageinfo" not in p: print("missing", k); continue
    md = p["imageinfo"][0]["extmetadata"]
    out[k] = {"title": p["title"], "author": strip(md.get("Artist", {}).get("value")), "license": md.get("LicenseShortName", {}).get("value"),
              "license_url": md.get("LicenseUrl", {}).get("value", ""), "page": p["imageinfo"][0]["descriptionurl"]}
    print(k, "|", out[k]["author"], "|", out[k]["license"])
json.dump(out, open(sys.argv[-1], "w"), ensure_ascii=False, indent=1)
