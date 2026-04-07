INSERT INTO Ingredienser 
(oppskrift_id, varetype_id, kvantitet, maaleenhet_id, type, valgfritt) VALUES

-- Spaghetti Bolognese (1)
(1, 10, 400, 0, 'ingredient', FALSE), -- kjøttdeig
(1, 36, 1, 3, 'ingredient', FALSE),   -- pastasaus
(1, 34, 200, 0, 'ingredient', FALSE), -- pasta

-- Kylling og ris (2)
(2, 12, 400, 0, 'ingredient', FALSE), -- kylling
(2, 37, 200, 0, 'ingredient', FALSE), -- ris

-- Laks med grønnsaker (3)
(3, 14, 400, 0, 'ingredient', FALSE), -- laks
(3, 7, 200, 0, 'ingredient', FALSE),  -- grønnsaker

-- Omelett (4)
(4, 25, 3, 4, 'ingredient', FALSE),   -- egg

-- Yoghurt med bær (5)
(5, 21, 200, 0, 'ingredient', FALSE), -- yoghurt
(5, 1, 100, 0, 'ingredient', FALSE),  -- bær

-- Pasta med ostesaus (6) (Ola sin)
(6, 34, 200, 0, 'ingredient', FALSE), -- pasta
(6, 22, 150, 0, 'ingredient', FALSE); -- ost