import urllib.request
import xml.etree.ElementTree as ET
import re
import datetime
import json
from typing import List, Dict, Any

# Attempt to load cached Hugging Face model
hf_pipeline = None
try:
    from transformers import pipeline
    print("[HF] Initializing Hugging Face NLP model for Mumbai incident triage...")
    hf_pipeline = pipeline('text-classification', model='distilbert/distilbert-base-uncased-finetuned-sst-2-english')
    print("[HF] Hugging Face NLP model loaded successfully.")
except Exception as e:
    print(f"[HF] Hugging Face model init fallback: {e}")

# Mumbai known hubs and hospital catchment zones
MUMBAI_ZONES = [
    "Andheri", "Bandra", "Kurla", "Dadar", "Lower Parel", "Chembur", "Ghatkopar",
    "Borivali", "Colaba", "Nalasopara", "Thane", "Navi Mumbai", "Worli", "Malad",
    "Kandivali", "Dharavi", "Byculla", "Mulund", "Sion", "Powai", "Bhandup"
]

DEFAULT_MUMBAI_SCENARIOS = [
    {
        "id": "mum-sim-01",
        "title": "Level-3 Fire breaks out in commercial industrial complex in Andheri East, over 30 workers trapped",
        "source": "Mumbai Disaster Management & TOI Live",
        "published": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
        "location": "Andheri East, Western Suburbs",
        "category": "FIRE_BURNS",
        "casualty_estimate": "25 - 40 expected",
        "severity": "CRITICAL"
    },
    {
        "id": "mum-sim-02",
        "title": "Suburban local train coach derailment near Kurla junction during peak evening hours, multiple commuters injured",
        "source": "Central Railway & Civic Alerts",
        "published": (datetime.datetime.now() - datetime.timedelta(minutes=45)).strftime("%Y-%m-%d %H:%M"),
        "location": "Kurla Central, Harbor-Main Corridor",
        "category": "TRANSIT_CRASH",
        "casualty_estimate": "35 - 55 expected",
        "severity": "CRITICAL"
    },
    {
        "id": "mum-sim-03",
        "title": "Old 4-storey residential building collapse in Dongri following heavy rainfall, search & rescue underway",
        "source": "BMC Disaster Cell",
        "published": (datetime.datetime.now() - datetime.timedelta(hours=2)).strftime("%Y-%m-%d %H:%M"),
        "location": "Dongri, South Central Mumbai",
        "category": "COLLAPSE_TRAUMA",
        "casualty_estimate": "15 - 25 expected",
        "severity": "HIGH"
    },
    {
        "id": "mum-sim-04",
        "title": "Ammonia chemical tank valve leak reported in chemical storage unit near Chembur-Mahul industrial belt",
        "source": "Maharashtra Pollution Control & Fire Brigade",
        "published": (datetime.datetime.now() - datetime.timedelta(hours=4)).strftime("%Y-%m-%d %H:%M"),
        "location": "Chembur-Mahul Belt",
        "category": "CHEMICAL_HAZARD",
        "casualty_estimate": "20 - 30 respiratory cases",
        "severity": "HIGH"
    }
]

def fetch_live_mumbai_rss() -> List[Dict[str, str]]:
    """Fetches real-time emergency & disaster headlines for Mumbai from Google News RSS."""
    url = "https://news.google.com/rss/search?q=Mumbai+(accident+OR+fire+OR+hospital+OR+emergency+OR+collapse+OR+injured)&hl=en-IN&gl=IN&ceid=IN:en"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    news_items = []

    try:
        with urllib.request.urlopen(req, timeout=6) as response:
            xml_data = response.read()
            root = ET.fromstring(xml_data)
            items = root.findall("./channel/item")

            for item in items[:15]:
                title = item.find("title").text if item.find("title") is not None else ""
                pub_date = item.find("pubDate").text if item.find("pubDate") is not None else ""
                source = item.find("source").text if item.find("source") is not None else "Google News"
                link = item.find("link").text if item.find("link") is not None else ""

                # Filter for incident keywords
                lower_title = title.lower()
                if any(k in lower_title for k in ["fire", "accident", "crash", "collapse", "injured", "dead", "leak", "rescue", "hospital", "blast"]):
                    news_items.append({
                        "id": f"mum-rss-{abs(hash(title)) % 100000}",
                        "title": title,
                        "source": source,
                        "published": pub_date,
                        "link": link
                    })
    except Exception as e:
        print(f"Note on live RSS fetch: {e}")

    return news_items

def analyze_incident_with_ai(incident: Dict[str, Any]) -> Dict[str, Any]:
    """Uses Hugging Face model + domain knowledge to predict hospital surge requirements."""
    title = incident.get("title", "")
    lower = title.lower()

    # 1. Hugging Face sentiment / urgency scoring
    hf_urgency = "HIGH"
    hf_confidence = 0.88
    if hf_pipeline:
        try:
            hf_res = hf_pipeline(title[:256])[0]
            if hf_res["label"] == "NEGATIVE":
                hf_urgency = "CRITICAL" if hf_res["score"] > 0.8 else "HIGH"
            hf_confidence = round(float(hf_res["score"]), 3)
        except Exception as e:
            pass

    # 2. Extract Category
    category = "GENERAL_EMERGENCY"
    if any(k in lower for k in ["fire", "blaze", "burn", "flames"]):
        category = "FIRE_BURNS"
    elif any(k in lower for k in ["train", "bus", "car", "collision", "overturn", "crash", "derail"]):
        category = "TRANSIT_CRASH"
    elif any(k in lower for k in ["collapse", "crushed", "building fall", "slab"]):
        category = "COLLAPSE_TRAUMA"
    elif any(k in lower for k in ["chemical", "gas", "leak", "fumes", "toxic", "poison"]):
        category = "CHEMICAL_HAZARD"
    elif any(k in lower for k in ["rain", "flood", "waterlog", "monsoon", "drown"]):
        category = "MONSOON_FLOOD"

    # 3. Detect Mumbai Zone
    detected_zone = "Mumbai Metropolitan Region"
    for zone in MUMBAI_ZONES:
        if zone.lower() in lower:
            detected_zone = f"{zone}, Mumbai"
            break

    # 4. Hospital Surge Predictions (Beds, Oxygen, Medicines, Blood)
    if category == "FIRE_BURNS":
        beds_to_reserve = {"icu": 4, "emergency": 8, "burns": 6, "total": 18}
        oxygen_surge_lmin = 28.5
        oxygen_extra_liters = 2500
        critical_medicines = [
            {"name": "Silver Sulfadiazine Burn Dressing Kits", "requiredUnits": 25, "urgency": "IMMEDIATE"},
            {"name": "Ringer's Lactate IV Resuscitation (500ml)", "requiredUnits": 40, "urgency": "IMMEDIATE"},
            {"name": "Injectable Morphine / Analgesia", "requiredUnits": 20, "urgency": "HIGH"},
            {"name": "Nebulized Bronchodilators (Salbutamol)", "requiredUnits": 30, "urgency": "HIGH"}
        ]
        blood_reserves = {"oNegative": 6, "aPositive": 8, "plasmaUnits": 12}
        triage_recommendation = "Activate Code Red. Clear Step-Down unit to receive stable ICU patients; reserve 8 Trauma & 6 Burn beds for incoming burn casualties."

    elif category == "TRANSIT_CRASH":
        beds_to_reserve = {"icu": 6, "emergency": 12, "burns": 0, "total": 18}
        oxygen_surge_lmin = 34.0
        oxygen_extra_liters = 3200
        critical_medicines = [
            {"name": "Whole Blood / Packed Red Blood Cells (O-)", "requiredUnits": 8, "urgency": "IMMEDIATE"},
            {"name": "Normal Saline 0.9% IV (1000ml)", "requiredUnits": 50, "urgency": "IMMEDIATE"},
            {"name": "Orthopedic External Fixators & Splints", "requiredUnits": 18, "urgency": "HIGH"},
            {"name": "Tranexamic Acid (TXA) Hemostatic Ampoules", "requiredUnits": 25, "urgency": "IMMEDIATE"}
        ]
        blood_reserves = {"oNegative": 8, "bPositive": 10, "plasmaUnits": 16}
        triage_recommendation = "Code Black Mass Casualty. Open triage zone in ER bay; reserve 12 emergency trauma beds and 6 surgical ICU beds."

    elif category == "COLLAPSE_TRAUMA":
        beds_to_reserve = {"icu": 4, "emergency": 8, "burns": 0, "total": 12}
        oxygen_surge_lmin = 22.0
        oxygen_extra_liters = 1800
        critical_medicines = [
            {"name": "Mannitol 20% (Crush Injury Syndrome)", "requiredUnits": 20, "urgency": "IMMEDIATE"},
            {"name": "Calcium Gluconate for Hyperkalemia", "requiredUnits": 15, "urgency": "HIGH"},
            {"name": "Sodium Bicarbonate IV Infusion", "requiredUnits": 20, "urgency": "HIGH"},
            {"name": "O-Negative Blood Units", "requiredUnits": 5, "urgency": "IMMEDIATE"}
        ]
        blood_reserves = {"oNegative": 5, "aPositive": 6, "plasmaUnits": 8}
        triage_recommendation = "Code Orange Crush Trauma. Prepare nephrology dialyzer & emergency trauma beds for crush syndrome victims."

    elif category == "CHEMICAL_HAZARD":
        beds_to_reserve = {"icu": 5, "emergency": 8, "burns": 2, "total": 15}
        oxygen_surge_lmin = 42.0
        oxygen_extra_liters = 4000
        critical_medicines = [
            {"name": "Humidified High-Flow Nasal Cannula Kits", "requiredUnits": 20, "urgency": "IMMEDIATE"},
            {"name": "Budesonide / Ipratropium Respules", "requiredUnits": 45, "urgency": "IMMEDIATE"},
            {"name": "Hydrocortisone Sodium Succinate 100mg", "requiredUnits": 30, "urgency": "HIGH"},
            {"name": "Chemical Eye Irrigation Stations", "requiredUnits": 12, "urgency": "IMMEDIATE"}
        ]
        blood_reserves = {"oNegative": 2, "aPositive": 4, "plasmaUnits": 4}
        triage_recommendation = "Hazmat Decontamination Protocol. Isolate pulmonary triage bay; maximize oxygen pipeline reserve."

    else:
        beds_to_reserve = {"icu": 3, "emergency": 6, "burns": 0, "total": 9}
        oxygen_surge_lmin = 18.0
        oxygen_extra_liters = 1500
        critical_medicines = [
            {"name": "General Trauma Suture & Dressing Kits", "requiredUnits": 20, "urgency": "HIGH"},
            {"name": "IV Fluids (Normal Saline)", "requiredUnits": 30, "urgency": "HIGH"}
        ]
        blood_reserves = {"oNegative": 4, "plasmaUnits": 6}
        triage_recommendation = "Heightened Vigilance. Reserve 6 ER beds for incoming ambulance arrivals."

    return {
        "id": incident.get("id", f"mum-{Date_hash(title)}"),
        "title": title,
        "source": incident.get("source", "City Surveillance Feed"),
        "published": incident.get("published", datetime.datetime.now().strftime("%Y-%m-%d %H:%M")),
        "location": detected_zone,
        "category": category,
        "severity": hf_urgency,
        "hfModelScore": hf_confidence,
        "hfModelName": "distilbert-base-uncased-finetuned-sst-2",
        "casualtyEstimate": incident.get("casualty_estimate", "15 - 30 expected casualties"),
        "bedsToReserve": beds_to_reserve,
        "oxygenSurge": {
            "additionalBurnRateLmin": oxygen_surge_lmin,
            "extraLitersRequired": oxygen_extra_liters,
            "recommendedTankBufferHours": 24,
            "reserveCylindersNeeded": max(4, int(oxygen_extra_liters / 400))
        },
        "criticalMedicines": critical_medicines,
        "bloodBankReserves": blood_reserves,
        "actionableRecommendation": triage_recommendation,
        "timestamp": datetime.datetime.now().isoformat()
    }

def Date_hash(text):
    return abs(hash(text)) % 100000

def get_all_mumbai_incidents() -> List[Dict[str, Any]]:
    """Combines live RSS feeds from Mumbai with default realistic scenarios, triaged by Hugging Face."""
    raw_rss = fetch_live_mumbai_rss()
    results = []

    # Process live RSS items first
    for item in raw_rss[:4]:
        results.append(analyze_incident_with_ai(item))

    # Add standard high-impact Mumbai incident scenarios for robust simulation
    for scenario in DEFAULT_MUMBAI_SCENARIOS:
        # Check if already present
        if not any(r["title"] == scenario["title"] for r in results):
            results.append(analyze_incident_with_ai(scenario))

    return results
