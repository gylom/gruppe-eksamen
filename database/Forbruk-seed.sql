INSERT INTO Forbruk 
(user_id, vare_id, forbruksdato, innkjopspris, maaleenhet_id, kvantitet) VALUES

-- Ola (husholdning 1)
(1, 1, NOW(), 22.90, 3, 1),  -- melk
(1, 11, NOW(), 59.90, 1, 1), -- kjøttdeig

-- Kari (husholdning 1)
(2, 6, NOW(), 29.90, 3, 1),  -- yoghurt
(2, 8, NOW(), 34.90, 4, 1),  -- brød

-- Per (husholdning 2)
(3, 17, NOW(), 29.90, 1, 1), -- ris
(3, 19, NOW(), 14.90, 1, 1); -- hermetikk