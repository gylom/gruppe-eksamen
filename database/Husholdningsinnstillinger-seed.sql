INSERT INTO Husholdningsinnstillinger 
(husholdning_id, varetype_id, minimumslager, beredskapslager) VALUES

-- Husholdning 1 (Ola + Kari)

-- Melk (kategori 11 → f.eks Helmelk/Lettmelk → bruk riktig ID fra Varetyper)
(1, 1, 2, FALSE),  -- Melk, minst 2

-- Brød
(1, 27, 1, FALSE), -- Brød, minst 1

-- Cola (beredskap)
(1, 55, 3, TRUE),  -- Cola som beredskap


-- Husholdning 2 (Per)

-- Sukker (baking)
(2, 46, 2, TRUE),  -- Sukker beredskap

-- Hermetikk
(2, 44, 3, TRUE);  -- Hermetikk beredskap