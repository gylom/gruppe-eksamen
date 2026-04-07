INSERT INTO Varelager 
(vare_id, husholdning_id, pris, kvantitet, bestfordato, plassering_id, kjopsdato, maaleenhet_id) VALUES

-- =========================
-- HUSHOLDNING 1 (Ola + Kari)
-- =========================

-- Melk (har for lite ift minimum 2)
(1, 1, 22.90, 1, '2026-01-10', 1, NOW(), 3),

-- Brød (OK nivå)
(8, 1, 34.90, 1, '2026-01-05', 3, NOW(), 4),

-- Cola (beredskap – for lite)
(23, 1, 32.90, 2, '2026-06-01', 1, NOW(), 3),

-- Kjøttdeig
(11, 1, 59.90, 2, '2026-01-07', 2, NOW(), 1),

-- Yoghurt
(6, 1, 29.90, 3, '2026-01-08', 1, NOW(), 3),


-- =========================
-- HUSHOLDNING 2 (Per)
-- =========================

-- Sukker (beredskap – OK)
(46, 2, 19.90, 3, '2027-01-01', 8, NOW(), 1),

-- Hermetikk (for lite ift beredskap)
(19, 2, 14.90, 1, '2027-06-01', 8, NOW(), 1),

-- Ris
(17, 2, 29.90, 2, '2027-01-01', 9, NOW(), 1),

-- Pasta
(15, 2, 19.90, 1, '2027-01-01', 9, NOW(), 1),

-- Kattemat
(30, 2, 49.90, 2, '2027-01-01', 10, NOW(), 1);