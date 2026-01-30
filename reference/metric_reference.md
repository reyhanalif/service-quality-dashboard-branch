
# 🟦 SUMMARY TABLE — STRATEGIC DASHBOARD (EXECUTIVE)

> **Page purpose:** Direction, monitoring, prioritisation
> **Grain:** Area / Region / Bankwide
> **Cadence:** Monthly / Weekly

| Section                   | Metric                                      | Chart / Visual             | Breakdown       | Purpose                                | Calculation (High-level)                | Source Table              | Availability     |
| ------------------------- | ------------------------------------------- | -------------------------- | --------------- | -------------------------------------- | --------------------------------------- | ------------------------- | ---------------- |
| Service Quality Summary   | Avg Queue Time                              | KPI Tile + Trend Sparkline | Region, Area    | Measure **speed of service**           | Avg(waiting_time)                       | EDA – Queue & Service Log | Daily            |
| Service Quality Summary   | % SLA Met                                   | KPI Tile                   | Region, Area    | Measure SLA compliance                 | (# trx ≤ SLA) / total trx               | EDA – SLA Log             | Daily            |
| Service Quality Summary   | Consistency Success Rate (%)                | KPI Tile                   | Area            | Measure **uniformity across branches** | % days branch avg ≤ standard            | EDA – Queue & Service Log | Daily            |
| Service Quality Summary   | Service Spread (P80–P50)                    | Bullet / Range Indicator   | Area            | Highlight **volatility risk**          | P80(queue_time) − P50(queue_time)       | EDA – Queue & Service Log | Daily            |
| Service Quality Summary   | Avg Transactions per Branch                 | KPI Tile                   | Area            | Measure productivity                   | Total trx / # branches                  | EDA – Transaction Log     | Daily            |
| Service Quality Summary   | NPS / SES / NSI                             | KPI Tile                   | Area / Bankwide | Measure customer perception            | As provided by source                   | External / EDA            | Monthly / Annual |
| Improvement Tracking      | Metric Movement                             | Line Chart                 | Time            | Check if service is improving          | Period-over-period change               | Derived from above        | Daily / Monthly  |
| Improvement Tracking      | # Branches Improving / Stagnant / Declining | Stacked Bar                | Area            | See **breadth of improvement**         | Count by trend status                   | Derived                   | Daily            |
| Intervention Focus        | Ranked Area (Performance)                   | Ranked Table               | Area            | Identify where leadership intervenes   | Rank by Fast / Consistency / Efficiency | Derived                   | Daily            |
| Intervention Focus        | Ranked Area (% Branch Movement)             | Ranked Table               | Area            | Focus on low-momentum areas            | % declining branches                    | Derived                   | Daily            |
| Transformation Validation | Ops vs Perception                           | Scatter / Comparison Chart | Area            | Validate transformation effectiveness  | Δ service vs Δ perception               | EDA + External            | Monthly          |

---

# 🟨 SUMMARY TABLE — TACTICAL DASHBOARD (OBO)

> **Page purpose:** Diagnosis, action, follow-up
> **Grain:** Branch
> **Cadence:** Daily / Weekly

| Section        | Metric                           | Chart / Visual | Breakdown                     | Purpose                        | Calculation (High-level)  | Source Table       | Availability |
| -------------- | -------------------------------- | -------------- | ----------------------------- | ------------------------------ | ------------------------- | ------------------ | ------------ |
| FAST           | Avg Queue Time                   | Line / Bar     | Hour, CS/Teller, Branch Class | Diagnose speed issues          | Avg(waiting_time)         | EDA – Queue Log    | Daily        |
| FAST           | % SLA Met                        | Line / KPI     | CS/Teller, Branch             | Monitor SLA compliance         | (# trx ≤ SLA) / total trx | EDA – SLA Log      | Daily        |
| FAST           | Queue Distribution               | Stacked Bar    | Time Bucket                   | Identify congestion severity   | % trx per bucket          | EDA – Queue Log    | Daily        |
| CONSISTENT     | Consistency Success Rate (%)     | Line Chart     | Branch                        | Detect instability             | % compliant days          | EDA – Queue Log    | Daily        |
| CONSISTENT     | Service Spread (P80–P50)         | Range / Bullet | Branch Class                  | Detect volatility              | P80 − P50                 | EDA – Queue Log    | Daily        |
| CONSISTENT     | Peer Deviation                   | Bar / Table    | Area / Class                  | Identify underperformers       | Branch avg − peer avg     | Derived            | Daily        |
| EFFICIENT      | Transactions per Counter / Staff | Bar Chart      | Branch                        | Measure productivity           | Total trx / staff         | EDA – Trx Log + HR | Daily        |
| EFFICIENT      | Service Time per Transaction     | Line Chart     | CS/Teller                     | Diagnose process inefficiency  | Avg(service_time)         | EDA – Service Log  | Daily        |
| EFFICIENT      | Utilisation Rate                 | Ratio Chart    | Branch                        | Detect over/under capacity     | Workload / capacity       | Derived            | Daily        |
| EFFICIENT      | Channel Mix                      | Donut / Bar    | Cash vs Non-cash              | Identify digitisation gaps     | % by channel              | EDA – Trx Log      | Daily        |
| EFFICIENT      | Digital-Eligible Handled Offline | Bar            | Branch                        | Target migration opportunities | Count eligible trx        | EDA – Trx Log      | Daily        |
| PERCEPTION     | SES by Service Type              | Line / Bar     | CS/Teller                     | Check experience gap           | Avg SES                   | External           | Monthly      |
| PERCEPTION     | Complaint Category               | Bar            | Category                      | Identify service pain points   | Count by category         | CCG                | Weekly       |
| PERCEPTION     | Google Review                    | Line / KPI     | Branch                        | External perception check      | Avg rating                | External           | Monthly      |
| PRIORITISATION | Branch Performance Rank          | Ranked Table   | Area                          | Decide where to act first      | Rank by Fast + Efficiency | Derived            | Daily        |
| PRIORITISATION | Improvement Status               | Status Tag     | Branch                        | Track intervention effect      | Trend classification      | Derived            | Daily        |

---

# 🔑 Important Notes for Engineers

* **Strategic and Tactical dashboards must share base tables**
* Percentiles (P50, P80) computed **within branch class / area**
* Thresholds (SLA, compliance) must be **configurable**
* Individual performance (row 10 in your data list) is **OBO-only**, never shown to executives

---

# ✅ Final Check — Alignment with Your Inputs

✔ Uses **only metrics from your diagram**
✔ Uses **only data sources you listed**
✔ Clean separation: Executive vs OBO
✔ Engineer-readable, no ambiguity
✔ Ready for backlog / sprint planning
