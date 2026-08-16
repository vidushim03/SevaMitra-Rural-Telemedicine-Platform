-- SevaMitra — Operations analytics: the KPI queries
--
-- Run against the schema in schema.sql with data from appointments.csv,
-- doctors.csv and pharmacy_stock.csv (SQLite). Each query answers one of the
-- platform KPIs surfaced in the app's Operations Analytics dashboard.

-- 1. Consultation volume (per day, per week)
SELECT date, COUNT(*) AS consults_per_day
FROM appointments
WHERE outcome = 'completed'
GROUP BY date
ORDER BY date;

SELECT STRFTIME('%Y-W%W', date) AS week, COUNT(*) AS consults_per_week
FROM appointments
WHERE outcome = 'completed'
GROUP BY week
ORDER BY week;

-- 2. Average consultation wait time (completed)
SELECT
    ROUND(AVG(wait_min), 1)            AS avg_wait_min,
    ROUND(AVG(wait_min) / 60.0, 2)     AS avg_wait_hours,
    COUNT(*)                           AS completed_consults
FROM appointments
WHERE outcome = 'completed';

-- 3. Doctor utilization (completed consults per day / daily capacity)
SELECT
    d.specialty,
    ROUND(COUNT(a.appointment_id) / 365.0 / d.capacity_per_day, 3) AS utilization
FROM doctors d
LEFT JOIN appointments a ON a.doctor_id = d.doctor_id AND a.outcome = 'completed'
GROUP BY d.doctor_id
ORDER BY utilization DESC;

-- 4. Appointment completion rate
SELECT
    outcome,
    COUNT(*)                                   AS count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS pct
FROM appointments
GROUP BY outcome
ORDER BY pct DESC;

-- 5. Cancellation / no-show rate
SELECT
    ROUND(SUM(CASE WHEN outcome = 'cancelled' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS cancellation_rate_pct,
    ROUND(SUM(CASE WHEN outcome = 'no_show'   THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS no_show_rate_pct,
    COUNT(*)                                                                           AS total
FROM appointments;

-- 6. Patient language distribution (completed consults)
SELECT
    language,
    COUNT(*)                                   AS consults,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS pct
FROM appointments
WHERE outcome = 'completed'
GROUP BY language
ORDER BY consults DESC;

-- 7. Symptom distribution (top symptoms)
SELECT symptom, COUNT(*) AS consults
FROM appointments
WHERE outcome = 'completed'
GROUP BY symptom
ORDER BY consults DESC
LIMIT 10;

-- 8. Pharmacy stock-out rate by specialty (completed consults that hit a shortage)
SELECT
    specialty,
    ROUND(AVG(pharmacy_stock_shortage) * 100.0, 1) AS stock_out_rate_pct
FROM appointments
WHERE outcome = 'completed'
GROUP BY specialty
ORDER BY stock_out_rate_pct DESC;

-- 9. Medicine availability (from pharmacy stock checks)
SELECT
    specialty,
    medicine,
    ROUND(AVG(availability_rate) * 100.0, 1) AS availability_pct
FROM pharmacy_stock
GROUP BY specialty, medicine
ORDER BY availability_pct ASC
LIMIT 10;

-- 10. Rural vs specialist access
-- Of completed consultations from rural villages, how many reached a
-- specialist (non-general) doctor? Telemedicine's core value proposition.
SELECT
    CASE WHEN is_rural = 1 THEN 'rural' ELSE 'hub' END          AS origin,
    CASE WHEN is_specialist = 1 THEN 'specialist' ELSE 'general' END AS doctor_type,
    COUNT(*)                                                    AS consults,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY is_rural), 1) AS pct_within_origin
FROM appointments
WHERE outcome = 'completed'
GROUP BY origin, doctor_type
ORDER BY origin, consults DESC;
