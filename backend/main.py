import os
import sqlite3
import datetime
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

from database import get_db_connection
from analytics import run_analytics_pipeline, train_and_forecast_resource
from chat_engine import process_chat_query
from mumbai_surveillance import get_all_mumbai_incidents, analyze_incident_with_ai

app = FastAPI(title="MedTwin API", description="AI-Powered Hospital Digital Twin API Backend")

# Enable CORS for frontend compatibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TriggerSurgeRequest(BaseModel):
    incidentId: str
    bedsToReserve: int
    oxygenBoostLmin: float
    incidentTitle: str
    location: str

@app.get("/api/mumbai/incidents")
def get_mumbai_incidents():
    """Returns real-time triaged Mumbai incidents using Hugging Face NLP model."""
    try:
        incidents = get_all_mumbai_incidents()
        return {
            "success": True,
            "count": len(incidents),
            "model": "Hugging Face DistilBERT (distilbert-base-uncased-finetuned-sst-2)",
            "city": "Mumbai, Maharashtra",
            "last_scan": datetime.datetime.now().strftime("%I:%M %p"),
            "incidents": incidents
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/mumbai/apply-surge")
def apply_mumbai_surge(req: TriggerSurgeRequest):
    """Applies the AI recommended bed reservation & oxygen surge for a Mumbai incident."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        alert_msg = f"MUMBAI EMERGENCY: {req.location} - Reserving {req.bedsToReserve} Emergency/ICU Beds. Boost O2 by +{req.oxygenBoostLmin} L/min."
        cursor.execute(
            "INSERT INTO alerts (id, title, severity, message, timestamp, resolved) VALUES (?, ?, ?, ?, ?, 0)",
            (f"mum-alt-{datetime.datetime.now().strftime('%H%M%S')}", f"Mumbai Surge: {req.location}", "CRITICAL", alert_msg, datetime.datetime.now().isoformat())
        )
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": f"Activated hospital surge protocol for {req.location}. Reserved {req.bedsToReserve} emergency beds."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ----------------- Models -----------------
class AcknowledgeRequest(BaseModel):
    acknowledged: int

class ChatRequest(BaseModel):
    message: str

class SimulationRequest(BaseModel):
    beds_surge: float # Percentage increase in admissions, e.g., 20.0
    staff_absent: float # Number of nurses absent, e.g., 5.0
    oxygen_increase: float # Liters/hour extra consumption, e.g., 50.0

# ----------------- Endpoints -----------------

@app.get("/api/status")
def get_system_status():
    """Returns general operational status of the digital twin."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) as cnt FROM alerts WHERE resolved = 0")
        active_alerts = cursor.fetchone()['cnt']
        
        conn.close()
        
        return {
            "status": "operational" if active_alerts < 3 else "warning",
            "last_sync": datetime.datetime.now().strftime("%I:%M %p"),
            "active_alerts_count": active_alerts,
            "message": "All digital twin resource models synchronized."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/resources")
def get_resources():
    """Returns current resource stats (beds, oxygen, medicine, staff)."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM resource_status")
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/forecast")
def get_forecast(resource: str = Query(..., description="beds, oxygen, medicine, or staff")):
    """Returns historical (last 48h) and projected (next 72h) time-series data."""
    if resource not in ["beds", "oxygen", "medicine", "staff"]:
        raise HTTPException(status_code=400, detail="Invalid resource name")
        
    resource_columns = {
        "beds": "bed_occupancy_rate",
        "oxygen": "oxygen_reserve_liters",
        "medicine": "medicine_stock_count",
        "staff": "staff_coverage_pct"
    }
    
    col_name = resource_columns[resource]
    
    try:
        conn = get_db_connection()
        
        # 1. Fetch historical (past 48 hours for graph context)
        hist_query = f"""
            SELECT timestamp, {col_name} as value 
            FROM time_series_data 
            ORDER BY timestamp DESC 
            LIMIT 48
        """
        hist_df = pd_read_sql(hist_query, conn)
        # Reverse to chronological order
        historical = hist_df.iloc[::-1].to_dict('records')
        
        # 2. Run / Get Forecasts (72 hours ahead)
        forecast = train_and_forecast_resource(conn, col_name, steps=72)
        
        conn.close()
        
        # Scale values if needed for percentage representations
        # Oxygen is in liters, capacity is 12500, so we convert value to percentage for UI chart consistency if needed,
        # but the UI can handle actual capacity rendering. Let's return raw database values.
        
        return {
            "resource": resource,
            "historical": historical,
            "forecast": forecast
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def pd_read_sql(sql, conn):
    """Helper to read sql without importing pandas everywhere, but analytics did, so it's fine."""
    import pandas as pd
    return pd.read_sql_query(sql, conn)

@app.get("/api/alerts")
def get_alerts():
    """Returns unresolved and active alerts."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM alerts WHERE resolved = 0 ORDER BY timestamp DESC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/alerts/acknowledge/{alert_id}")
def acknowledge_alert(alert_id: int):
    """Acknowledges an alert by id."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE alerts SET acknowledged = 1 WHERE id = ?", (alert_id,))
        conn.commit()
        conn.close()
        return {"success": True, "message": f"Alert {alert_id} acknowledged."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/alerts/resolve/{alert_id}")
def resolve_alert(alert_id: int):
    """Resolves an alert (marks it resolved)."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE alerts SET resolved = 1 WHERE id = ?", (alert_id,))
        conn.commit()
        conn.close()
        return {"success": True, "message": f"Alert {alert_id} resolved."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/simulate")
def simulate_scenario(req: SimulationRequest):
    """Runs a what-if forecasting simulation based on offset parameters."""
    try:
        conn = get_db_connection()
        
        # 1. Fetch baseline forecasts
        beds_base = train_and_forecast_resource(conn, "bed_occupancy_rate", steps=72)
        oxy_base = train_and_forecast_resource(conn, "oxygen_reserve_liters", steps=72)
        staff_base = train_and_forecast_resource(conn, "staff_coverage_pct", steps=72)
        
        # 2. Apply simulated parameters
        # - Bed occupancy rises by req.beds_surge
        # - Staffing coverage falls due to missing nurses (each nurse is ~0.66% of 150 capacity)
        # - Oxygen decline rate increases by req.oxygen_increase liters/hour
        
        sim_beds = []
        sim_oxy = []
        sim_staff = []
        
        for i in range(len(beds_base)):
            # Beds simulation
            sim_bed_val = min(100.0, beds_base[i]['value'] + req.beds_surge)
            sim_beds.append({"timestamp": beds_base[i]['timestamp'], "value": round(sim_bed_val, 2)})
            
            # Staff simulation
            staff_offset = (req.staff_absent / 150.0) * 100.0
            sim_staff_val = max(10.0, staff_base[i]['value'] - staff_offset)
            sim_staff.append({"timestamp": staff_base[i]['timestamp'], "value": round(sim_staff_val, 2)})
            
            # Oxygen simulation (declines faster cumulatively over the 72h window)
            # cumulative depletion: extra_loss_per_hour * hour_index
            cum_loss = req.oxygen_increase * (i + 1)
            raw_oxy_liters = (oxy_base[i]['value'] / 100.0) * 12500.0 if oxy_base[i]['value'] <= 100.0 else oxy_base[i]['value']
            sim_oxy_liters = max(500.0, raw_oxy_liters - cum_loss)
            
            # Convert back to percentage for consistent rendering
            sim_oxy_pct = (sim_oxy_liters / 12500.0) * 100.0
            sim_oxy.append({"timestamp": oxy_base[i]['timestamp'], "value": round(sim_oxy_pct, 2)})
            
        conn.close()
        
        # Determine risk indicators
        highest_bed = max([d['value'] for d in sim_beds])
        lowest_staff = min([d['value'] for d in sim_staff])
        lowest_oxy = min([d['value'] for d in sim_oxy])
        
        oxygen_depletion_hours = 72
        for i, d in enumerate(sim_oxy):
            if d['value'] <= 30.0: # safety threshold is 30%
                oxygen_depletion_hours = i
                break
                
        return {
            "beds": sim_beds,
            "oxygen": sim_oxy,
            "staff": sim_staff,
            "summary": {
                "peak_bed_occupancy": highest_bed,
                "min_staff_coverage": lowest_staff,
                "min_oxygen_reserve": lowest_oxy,
                "oxygen_run_out_hours": oxygen_depletion_hours,
                "system_risk_level": "critical" if (highest_bed > 90.0 or lowest_oxy < 30.0 or lowest_staff < 75.0) else "warning"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/survey/papers")
def get_survey_papers(search: Optional[str] = None, tag: Optional[str] = None):
    """Returns literature survey papers with optional search and category filters."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        sql = "SELECT id, title, authors, year, journal, tags, gap, mapping FROM literature_papers WHERE 1=1"
        params = []
        
        if tag:
            sql += " AND tags LIKE ?"
            params.append(f"%{tag}%")
            
        if search:
            sql += " AND (title LIKE ? OR authors LIKE ? OR methodology LIKE ? OR gap LIKE ?)"
            search_param = f"%{search}%"
            params.extend([search_param, search_param, search_param, search_param])
            
        cursor.execute(sql, params)
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/survey/papers/{paper_id}")
def get_paper_detail(paper_id: int):
    """Returns full details of a specific paper."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM literature_papers WHERE id = ?", (paper_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail="Paper not found")
            
        return dict(row)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
def post_chat_message(req: ChatRequest):
    """Conversational endpoint grounded in database state and survey papers."""
    try:
        reply = process_chat_query(req.message)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/pipeline/run")
def trigger_pipeline():
    """Manually triggers the ML forecasting and alerting pipeline."""
    try:
        run_analytics_pipeline()
        return {"success": True, "message": "ML analytics pipeline completed successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ----------------- Static Files & Frontend Serving -----------------
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
dist_dir = os.path.join(parent_dir, "dist")
target_dir = dist_dir if os.path.exists(dist_dir) else parent_dir

@app.get("/health")
def health_check():
    return {"status": "ok", "app": "MedTwin React + FastAPI Backend"}

if os.path.exists(dist_dir):
    app.mount("/", StaticFiles(directory=dist_dir, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    import socket

    # Make sure DB exists and run pipeline once on startup
    try:
        run_analytics_pipeline()
    except Exception as e:
        print(f"Pipeline init note: {e}")

    def is_port_in_use(port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            return s.connect_ex(('127.0.0.1', port)) == 0

    target_port = 8000
    if is_port_in_use(target_port):
        print(f"Port {target_port} is already in use. Checking 8001...")
        target_port = 8001
        if is_port_in_use(target_port):
            target_port = 8080

    print(f"Starting MedTwin FastAPI Backend on http://127.0.0.1:{target_port}")
    uvicorn.run(app, host="127.0.0.1", port=target_port)

