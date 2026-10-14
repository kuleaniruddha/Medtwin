import datetime
import random
import math
import sqlite3
from database import init_db, get_db_connection

def generate_time_series_data():
    """Generates 30 days of hourly time-series data ending on August 25, 2026."""
    end_date = datetime.datetime(2026, 8, 25, 9, 0, 0)
    start_date = end_date - datetime.timedelta(days=30)
    
    records = []
    current_time = start_date
    
    # Starting states
    oxygen_reserve = 11500.0  # liters (Capacity 12500 L)
    
    # Seed reproducible random numbers
    random.seed(42)
    
    while current_time <= end_date:
        hour = current_time.hour
        day_of_week = current_time.weekday() # 0 = Monday, 6 = Sunday
        days_from_start = (current_time - start_date).days
        
        # 1. BED OCCUPANCY (%)
        # Base occupancy around 72%, weekly cycle (+6% midweek, -6% weekend), daily cycle (+3% noon, -3% 4 AM)
        weekly_factor = 6.0 * math.sin(2.0 * math.pi * (day_of_week / 7.0))
        daily_factor = 3.0 * math.sin(2.0 * math.pi * ((hour - 8) / 24.0))
        noise = random.normalvariate(0, 1.5)
        
        bed_occupancy = 72.0 + weekly_factor + daily_factor + noise
        
        # Simulate surge outbreak in the last 48 hours
        hours_before_end = (end_date - current_time).total_seconds() / 3600.0
        if hours_before_end <= 48:
            # Linear ramp up to 76.0% (representing ward) and 91% for ICU
            bed_occupancy += (48 - hours_before_end) * 0.08
            
        bed_occupancy = max(20.0, min(99.0, bed_occupancy))
        
        # 2. OXYGEN RESERVE (Liters)
        # Usage depends on bed occupancy: ~0.35 L per bed per hour + minor base rate
        active_beds = (bed_occupancy / 100.0) * 242.0
        usage = active_beds * 0.38 + random.uniform(5, 15)
        
        # Regular refills when dropping below 4000L, refills to 12000L at 9 AM the next day
        # Except during the last 24 hours (simulating supply delayed refill)
        if hours_before_end <= 24:
            # No refill! Decline continues
            oxygen_reserve -= usage
        else:
            if oxygen_reserve < 4000.0 and hour == 9:
                oxygen_reserve = 12000.0
            else:
                oxygen_reserve -= usage
                
        oxygen_reserve = max(500.0, min(12500.0, oxygen_reserve))
        
        # 3. MEDICINE STOCK (tracked box count, max 100)
        # Declines daily around 8 AM by 1-3 boxes, refilled by 15 boxes on Monday morning (day_of_week=0, hour=8)
        medicine_stock = 70.0 - (days_from_start % 7) * 1.5
        if hour >= 8:
            medicine_stock -= 1.0
        if day_of_week == 0 and hour == 8:
            medicine_stock += 15.0
            
        medicine_stock = max(10.0, min(100.0, medicine_stock + random.normalvariate(0, 0.8)))
        
        # 4. STAFF COVERAGE (%)
        # Shifts: Morning (08:00-16:00), Evening (16:00-24:00), Night (00:00-08:00)
        # Night shifts have lower coverage. Weekend night shifts have the lowest.
        base_staff = 86.0
        if hour in range(0, 8): # Night shift
            shift_factor = -5.0
            if day_of_week in [5, 6]: # Weekend night
                shift_factor = -8.0
        else:
            shift_factor = 2.0
            
        staff_coverage = base_staff + shift_factor + random.normalvariate(0, 2.0)
        
        # Night shift staffing gap seeded on the last day's evening projections
        # (This will be shown in forecasts for tomorrow, August 26)
        staff_coverage = max(40.0, min(100.0, staff_coverage))
        
        records.append((
            current_time.strftime("%Y-%m-%d %H:%M:%S"),
            round(bed_occupancy, 2),
            round(oxygen_reserve, 2),
            round(medicine_stock, 2),
            round(staff_coverage, 2)
        ))
        
        current_time += datetime.timedelta(hours=1)
        
    return records

def seed_data():
    # Initialize DB schema
    init_db()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Insert Static/Current Resource Status
    resources = [
        ("beds", "Bed occupancy", 76.0, "%", "good", 242.0, "up", 4.2),
        ("oxygen", "Oxygen reserve", 41.0, "%", "watch", 12500.0, "down", -8.1),
        ("medicine", "Medicine inventory", 68.0, "%", "good", 100.0, "up", 1.8),
        ("staff", "Staff coverage", 84.0, "%", "risk", 150.0, "down", -6.4)
    ]
    cursor.executemany("""
        INSERT OR REPLACE INTO resource_status 
        (resource_name, display_name, current_value, unit, status, total_capacity, trend, trend_value)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, resources)
    
    # 2. Insert Time Series Records
    time_series = generate_time_series_data()
    cursor.executemany("""
        INSERT OR REPLACE INTO time_series_data
        (timestamp, bed_occupancy_rate, oxygen_reserve_liters, medicine_stock_count, staff_coverage_pct)
        VALUES (?, ?, ?, ?, ?)
    """, time_series)
    
    # 3. Insert Initial Alerts
    alerts = [
        ("oxygen", "critical", "Oxygen reserve declining: projected below safety threshold of 30% in 18 hours.", "2026-08-25 09:01:00", 0, 0),
        ("beds", "urgent", "ICU occupancy surge: 14% higher than expected seasonal patterns.", "2026-08-25 08:35:00", 0, 0),
        ("staff", "warning", "Night shift staffing gap: 6 nurses short for tomorrow's night shift (22:00-06:00).", "2026-08-25 08:12:00", 0, 0)
    ]
    cursor.executemany("""
        INSERT INTO alerts (resource, status, message, timestamp, acknowledged, resolved)
        VALUES (?, ?, ?, ?, ?, ?)
    """, alerts)
    
    # 4. Insert Literature Papers
    papers = [
        (1, "Digital Twins for Health: A Scoping Review", "Katsoulakis, E., Wang, Q., Wu, H., et al.", 2024, "npj Digital Medicine, 7, 77", 
         "Digital Twin, Review, Scoping", 
         "Scoping review methodology surveying peer-reviewed literature on DT applications in healthcare.",
         "High-level conceptual review; does not provide an implementable technical architecture.",
         "Lack of a unified, implementable framework that combines DT concepts with predictive resource forecasting specifically for hospital operations.",
         "MedTwin implements a functional, open-source pipeline built specifically for hospital resource forecasting based on the review's guidelines."),
        
        (2, "Advancing Health Care With Digital Twins: Meta-Review of Applications and Implementation Challenges", "Ringeval, M., et al.", 2025, "Journal of Medical Internet Research (JMIR), 27, e69544", 
         "Digital Twin, Meta-Review, Interoperability", 
         "Systematic meta-review across five databases (PubMed, CINAHL, Web of Science, Embase, PsycINFO) with thematic synthesis.",
         "Presents no original technical implementation, forecasting model, or working prototype.",
         "Scalability and interoperability gaps in DT systems built for hospital operational efficiency remain largely unresolved.",
         "MedTwin's use of a REST API over FastAPI, backed by SQLite (extensible to PostgreSQL), is a direct response to that interoperability concern."),
         
        (3, "Advancing Emergency Care With Digital Twins", "Li, H., Zhang, J., Zhang, N., Zhu, B.", 2025, "JMIR Aging, e71777", 
         "Digital Twin, Emergency Care, Conceptual", 
         "Narrative/discussion review of DT use cases in emergency care.",
         "Purely conceptual; no working prototype, and does not address multi-resource (beds, oxygen, medicine, staff) integration simultaneously.",
         "No unified, hospital-wide DT model that integrates multiple resource streams under one predictive framework.",
         "MedTwin folds beds, oxygen, medicines, and staffing into a single twin, so a shortage in one area can be reasoned about alongside the others."),
         
        (4, "A Comprehensive Review of Digital Twin in Healthcare in the Scope of Simulative Health-Monitoring", "Nadeem, M., Kostic, S., Dornhöfer, M., Weber, C., Fathi, M.", 2025, "Digital Health (SAGE), 11", 
         "Digital Twin, Simulation, Review", 
         "Literature review with thematic categorization of DT applications in healthcare.",
         "Primarily conceptual; lacks empirical validation of resource-forecasting accuracy against real or simulated hospital data.",
         "Absence of empirically validated, data-driven DT prototypes tested against quantifiable hospital operational metrics.",
         "MedTwin is tested against simulated hospital time-series data with measurable forecasting accuracy."),
         
        (5, "Digital Twins in Healthcare: A Comprehensive Review and Future Directions", "MD Anderson Cancer Center Authors", 2025, "Frontiers in Digital Health, 7, 1633539", 
         "Digital Twin, Review, Patient-Level", 
         "Comprehensive narrative literature review.",
         "Focuses predominantly on patient-level (personalized medicine) DTs rather than facility-level, hospital-wide resource DTs.",
         "Comparatively limited research focus on facility-level (whole-hospital) resource-management DTs versus patient-level DTs.",
         "MedTwin sits on the facility side of that divide, modeling the hospital as a whole rather than an individual patient."),
         
        (6, "Digital Twin Technology in Healthcare: Applications, Challenges, and Future Insights", "IJGIS Editorial Contributors", 2024, "International Journal on Geoinformatics and Interdisciplinary Studies (IJGIS)", 
         "Digital Twin, Case-Study, Conversational AI", 
         "Literature review supported by case-study analysis of an NHS Trust.",
         "Case-study-driven with no open, reproducible technical architecture; lacks any conversational/natural-language interface for administrators.",
         "No natural-language interface integrated with a hospital DT that allows administrators to query system state conversationally.",
         "MedTwin adds that missing layer through MedTwin Chat, a conversational assistant wired into the twin's live data."),
         
        (7, "An Intelligent Digital Twin Framework with AI-Driven Optimization for Patient Flow and Clinical Scheduling in Smart Healthcare Systems", "Frontiers in Digital Health Contributors", 2026, "Frontiers in Digital Health, 1835028", 
         "Digital Twin, Scheduling, Patient Flow", 
         "DT simulates feasible scheduling solutions under practical constraints; an AI-enabled prediction-and-evaluation algorithm assesses waiting-time impact.",
         "Narrowly focused on patient flow and scheduling; does not address oxygen or medicine inventory forecasting or anomaly detection.",
         "No integration of scheduling-optimization DTs with anomaly detection and consumable-resource (oxygen/medicine) forecasting in one platform.",
         "MedTwin extends the optimization scope by including consumable resources (oxygen/medicine) and anomaly detection alongside scheduling."),
         
        (8, "BedreFlyt: Improving Patient Flows Through Hospital Wards with Digital Twins", "Sartaj, H., Ali, S., Yue, T., et al.", 2025, "arXiv preprint 2505.06287", 
         "Digital Twin, Patient Flow, Formal Models", 
         "Formal digital-twin modeling combined with scenario-generation languages for what-if analysis of bed demand.",
         "Focused solely on bed and ward-flow; does not extend to oxygen, medicine, staff, or provide a natural-language interface.",
         "Restricted to a single resource type (beds); lacks a generalized multi-resource forecasting and simulation platform.",
         "MedTwin generalizes the same what-if thinking across beds, oxygen, medicine, and staff at once."),
         
        (9, "Forecasting Hospital Bed Occupancy: A Time Series Approach with Prophet", "Fattouh, M., Lyssenko, L., Heilmeyer, F., et al.", 2026, "BMC Medical Informatics and Decision Making, 26, 162", 
         "Forecasting, Bed Occupancy, Prophet", 
         "Prophet trend/seasonality/holiday decomposition; rolling cross-validation over 2022-2023 for 30-, 60-, 90-, and 180-day forecast horizons.",
         "Single-hospital, single-resource (beds only) study; does not include anomaly detection or an automated alerting layer.",
         "Prophet-based bed forecasting has not been integrated with other hospital resources or coupled with automated alerting and decision support.",
         "MedTwin couples Prophet/regression forecasts with alert thresholds across multiple resources."),
         
        (10, "Forecasting Hospital Room and Ward Occupancy Using Static and Dynamic Information Concurrently: Retrospective Single-Center Cohort Study", "Seo, H., Ahn, I., Gwon, H., Kang, H., Kim, Y., et al.", 2024, "JMIR Medical Informatics, 12, e53400", 
         "Forecasting, Ward Occupancy, ARIMA", 
         "ARIMA modeling combined with static hospital metadata; benchmarking against simple trend-fitting and regression baselines.",
         "Retrospective, single-center dataset; not deployed as a real-time system and does not generalize across resource types.",
         "A real-time, generalizable, multi-resource forecasting pipeline (versus a retrospective single-center bed study) is missing.",
         "MedTwin is built to run forecasting live on data streamed in continuously rather than analyzed retrospectively."),
         
        (11, "A Comparative Evaluation of Time-Series Models for Forecasting Inpatient Deaths and Discharges Against Medical Advice", "Nature Reports Contributors", 2026, "Scientific Reports (Nature Portfolio), 2026", 
         "Forecasting, Benchmarking, Clinical Outcomes", 
         "RMSE, MAE, and MAPE evaluation metrics with Diebold-Mariano statistical significance testing across six candidate models.",
         "Targets clinical-outcome forecasting (mortality/DAMA) rather than operational resource forecasting (beds, oxygen, medicine, staff).",
         "Rigorous multi-model comparison studies rarely extend to operational hospital-resource forecasting coupled with an anomaly-detection and alerting layer.",
         "MedTwin shifts the benchmarking focus from clinical outcomes to day-to-day operational planning (beds, oxygen, medicine, staff)."),
         
        (12, "Bayesian Model Averaging Based Deep Learning Forecasts of Inpatient Bed Occupancy in Mental Health Facilities", "Nature Reports Contributors", 2025, "Scientific Reports (Nature Portfolio), 2025", 
         "Forecasting, Deep Learning, Bayesian Averaging", 
         "Lag-feature engineering (52-week lag window), PACF-based seasonality confirmation, and deep-learning ensembling with Bayesian model averaging.",
         "Domain-specific to a single mental-health facility; the deep-learning ensemble approach is computationally heavier than is practical for lightweight academic prototypes.",
         "Lightweight, interpretable forecasting approaches suited to resource-constrained hospital settings are underexplored relative to heavy deep-learning ensembles.",
         "MedTwin deliberately uses lightweight, interpretable models (lags and Ridge regression) that run on low-end hardware."),
         
        (13, "Formulating and Evaluating Time Series Algorithms to Forecast Daily Asthma Hospital Admissions", "PMC Contributors", 2025, "PMC (peer-reviewed journal), 2025", 
         "Forecasting, Disease-Specific, Surge", 
         "Comparative evaluation of ARIMA, ETS, Prophet, and ensemble models with threshold-based high-risk-day identification.",
         "Disease-specific (asthma only); not integrated with broader hospital resource planning such as oxygen or bed availability.",
         "Threshold-based admission-surge forecasting tends to be disease-specific and is not linked to downstream, cross-resource allocation actions.",
         "MedTwin ties surge detection directly to alerts across every resource category instead of one condition."),
         
        (14, "Early Detection of Patient Surge Anomalies in Hospitals: A Comparative Analysis of Gradient Boosting, Random Forest, and SVM", "Masparudin, Marfuah, M., Abdullah, A.", 2025, "Jurnal Sistem Informasi Bisnis, 15(4), 488-495", 
         "Anomaly Detection, Surge, ML Classification", 
         "Comparative machine-learning classification (Gradient Boosting Classifier, Random Forest, SVM) on imbalanced hospital-visit data.",
         "Severe class imbalance limits F1-score to modest levels (~37%); the classifier is not integrated into a live dashboard or alerting system.",
         "Surge-anomaly-detection research seldom couples model outputs with real-time dashboards or automated notification mechanisms.",
         "MedTwin couples model outputs directly with a live dashboard and alerts, ensuring anomalies are visible and actionable."),
         
        (15, "Game Over for the Baseline: Influenza Hospitalization Patterns Before, During, and After the COVID-19 Pandemic (FluSurv-NET, 2009-2025)", "FluSurv-NET Contributors", 2026, "Infectious Disease Reports (MDPI), 18(3), Article 61", 
         "Anomaly Detection, Prophet, Isolation Forest", 
         "STL seasonal-trend decomposition, Prophet time-series forecasting, and Isolation Forest anomaly detection across multiple contamination thresholds.",
         "Conducted at national surveillance (population) level rather than individual hospital-facility operational level.",
         "The Prophet-plus-Isolation-Forest combination is validated at national surveillance scale but has not been translated into a facility-level operational tool.",
         "MedTwin brings this exact combination (Prophet/regression and Isolation Forest) down to the single-hospital facility level."),
         
        (16, "Forecasting Hospital Resource Demand Using Time Series and Machine Learning Models", "Gulf Journal Contributors", 2025, "Gulf Journal of Advance Business Research, 2025", 
         "Forecasting, Resource Demand, Hybrid Model", 
         "A hybrid model combining classical time-series techniques with machine-learning methods to forecast hospital resource requirements (staff, oxygen, antivirals).",
         "Presents a broad, conceptual hybrid-modeling discussion with limited detail on real-time system architecture or UI.",
         "Forecasting research frequently stops at model development without an accompanying deployable, real-time monitoring and alerting system.",
         "MedTwin builds the full stack: FastAPI backend, SQLite storage, and React/HTML dashboard working together."),
         
        (17, "Enhancing Hospital Inventory Forecasting Accuracy Through Hybrid and Ensemble Learning Models", "ResearchGate Contributors", 2026, "ResearchGate preprint, 2026", 
         "Forecasting, Inventory, Medicine Demand", 
         "Hybrid and ensemble machine-learning models benchmarked against classical ARIMA for medicine and supply demand forecasting.",
         "Narrowly focused on inventory/medicine forecasting; does not address real-time anomaly detection or conversational query interfaces.",
         "Medicine-inventory-specific forecasting research remains siloed from broader, unified hospital-resource digital-twin platforms.",
         "MedTwin treats medicine inventory forecasting as one of four pillars inside a wider resource digital twin platform."),
         
        (18, "Forecasting and Optimizing Real-Time Ventilator Allocation in Healthcare Systems Using Artificial Intelligence and Geographic Clustering", "ScienceDirect Contributors", 2026, "Expert Systems with Applications, 2026", 
         "Forecasting, Ventilator, Clustering", 
         "Machine-learning demand forecasting integrated with geographic clustering algorithms for equipment-allocation optimization across regions.",
         "Focused on a single equipment type (ventilators) and multi-facility geographic distribution rather than single-hospital multi-resource management.",
         "Multi-facility equipment-allocation optimization is comparatively well studied, but single-hospital, multi-resource predictive dashboards are less explored.",
         "MedTwin focuses on a single-hospital, multi-resource (beds, oxygen, medicine, staff) predictive dashboard, leaving geographic clustering as future work."),
         
        (19, "Large Language Models in Medical Chatbots: Opportunities, Challenges, and the Need to Address AI Risks", "MDPI Contributors", 2025, "Information (MDPI), 16(7), 549", 
         "Conversational AI, Chatbots, Risk Management", 
         "Literature review and technical analysis of LLM-based chatbot applications in healthcare.",
         "Primarily addresses patient-facing or clinical-diagnostic chatbot use cases, not administrator-facing operational assistants.",
         "LLM-chatbot research rarely addresses grounding a conversational assistant in live, non-clinical operational hospital-resource data.",
         "MedTwin Chat is built explicitly for administrative decision-support, querying live database records and projection tables."),
         
        (20, "Conversational AI with Large Language Models to Increase the Uptake of Clinical Guidance", "ScienceDirect Contributors", 2024, "International Journal of Medical Informatics, 2024", 
         "Conversational AI, Guidance documents, RAG", 
         "Conceptual and applied discussion of LLM-based conversational guidance systems, including retrieval-augmented approaches.",
         "Focused on static guideline documents rather than real-time, live operational-data querying.",
         "Conversational-AI research for healthcare largely targets guideline navigation rather than live, time-series operational-data querying for resource management.",
         "MedTwin Chat is grounded in live, time-stamped operational database metrics to answer time-critical resource queries (e.g., depletion hour).")
    ]
    
    cursor.executemany("""
        INSERT OR REPLACE INTO literature_papers
        (id, title, authors, year, journal, tags, methodology, limitations, gap, mapping)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, papers)
    
    conn.commit()
    conn.close()
    print("Database seeded with current values, 30 days of hourly data, initial alerts, and 20 literature papers.")

if __name__ == "__main__":
    seed_data()
