INSERT INTO Ingredienser
(id, oppskrift_id, varetype_id, kvantitet, maaleenhet_id, type, valgfritt)
VALUES
-- 1 Spaghetti Bolognese
(1, 1, 12, 0.50, 2, 'ingredient', 0),
(2, 1, 7, 0.40, 2, 'ingredient', 0),
(3, 1, 15, 0.50, 3, 'ingredient', 0),

-- 2 Kylling og ris
(4, 2, 8, 0.60, 2, 'ingredient', 0),
(5, 2, 14, 1.00, 2, 'ingredient', 0),

-- 3 Laks med grønnsaker
(6, 3, 9, 0.50, 2, 'ingredient', 0),
(7, 3, 33, 0.50, 2, 'ingredient', 0),

-- 4 Omelett
(8, 4, 1, 0.30, 3, 'ingredient', 0),
(9, 4, 2, 0.10, 2, 'tilbehor', 1),

-- 5 Yoghurt med bær
(10, 5, 4, 0.50, 3, 'ingredient', 0),
(11, 5, 27, 0.10, 2, 'ingredient', 0),
(12, 5, 28, 0.10, 2, 'ingredient', 0),

-- 6 Pasta med ostesaus
(13, 6, 13, 0.50, 2, 'ingredient', 0),
(14, 6, 2, 0.30, 2, 'ingredient', 0),

-- 7 Yoghurt med jordbær
(15, 7, 4, 0.50, 3, 'ingredient', 0),
(16, 7, 27, 0.20, 2, 'ingredient', 0),

-- 8 Knekkebrød med leverpostei
(17, 8, 6, 0.20, 2, 'ingredient', 0),
(18, 8, 32, 0.20, 2, 'ingredient', 0),

-- 9 Penne med pastasaus
(19, 9, 13, 0.50, 2, 'ingredient', 0),
(20, 9, 15, 0.50, 3, 'ingredient', 0),

-- 10 Kyllingfilet med ris
(21, 10, 8, 0.60, 2, 'ingredient', 0),
(22, 10, 14, 1.00, 2, 'ingredient', 0),

-- 11 Toast med hvitost og skinke
(23, 11, 5, 1.00, 4, 'ingredient', 0),
(24, 11, 3, 0.20, 2, 'ingredient', 0),
(25, 11, 31, 0.10, 2, 'ingredient', 0),

-- 12 Nudler med kylling
(26, 12, 34, 1.00, 4, 'ingredient', 0),
(27, 12, 8, 0.50, 2, 'ingredient', 0),

-- 13 Laks med ris
(28, 13, 9, 0.50, 2, 'ingredient', 0),
(29, 13, 14, 1.00, 2, 'ingredient', 0),

-- 14 Brød med leverpostei
(30, 14, 5, 1.00, 4, 'ingredient', 0),
(31, 14, 32, 0.20, 2, 'ingredient', 0),

-- 15 Yoghurt med blåbær
(32, 15, 4, 0.50, 3, 'ingredient', 0),
(33, 15, 28, 0.20, 2, 'ingredient', 0),

-- 16 Pasta med kjøttdeig og tomater
(34, 16, 12, 0.50, 2, 'ingredient', 0),
(35, 16, 7, 0.40, 2, 'ingredient', 0),
(36, 16, 16, 0.40, 2, 'ingredient', 0),

-- 17 Hveteboller og kaffe
(37, 17, 30, 1.00, 4, 'ingredient', 0),
(38, 17, 22, 0.20, 2, 'ingredient', 0),

-- 18 Brød med hvitost
(39, 18, 5, 1.00, 4, 'ingredient', 0),
(40, 18, 3, 0.20, 2, 'ingredient', 0),

-- 19 Kylling med frosne grønnsaker
(41, 19, 8, 0.50, 2, 'ingredient', 0),
(42, 19, 33, 0.50, 2, 'ingredient', 0),

-- 20 Yoghurt med bringebær
(43, 20, 4, 0.50, 3, 'ingredient', 0),
(44, 20, 29, 0.20, 2, 'ingredient', 0),

-- 21 Ris med kjøttdeig
(45, 21, 14, 1.00, 2, 'ingredient', 0),
(46, 21, 7, 0.40, 2, 'ingredient', 0),

-- 22 Penne med kylling
(47, 22, 13, 0.50, 2, 'ingredient', 0),
(48, 22, 8, 0.50, 2, 'ingredient', 0),

-- 23 Brød med gulost
(49, 23, 5, 1.00, 4, 'ingredient', 0),
(50, 23, 2, 0.20, 2, 'ingredient', 0),

-- 24 Knekkebrød med skinke
(51, 24, 6, 0.20, 2, 'ingredient', 0),
(52, 24, 31, 0.10, 2, 'ingredient', 0),

-- 25 Nudler med grønnsaker
(53, 25, 34, 1.00, 4, 'ingredient', 0),
(54, 25, 33, 0.50, 2, 'ingredient', 0),

-- 26 Yoghurt med bærmix
(55, 26, 4, 0.50, 3, 'ingredient', 0),
(56, 26, 27, 0.10, 2, 'ingredient', 0),
(57, 26, 28, 0.10, 2, 'ingredient', 0),
(58, 26, 29, 0.10, 2, 'ingredient', 0),

-- 27 Spaghetti med pastasaus
(59, 27, 12, 0.50, 2, 'ingredient', 0),
(60, 27, 15, 0.50, 3, 'ingredient', 0),

-- 28 Pizza og cola
(61, 28, 17, 1.00, 4, 'ingredient', 0),
(62, 28, 20, 1.00, 3, 'tilbehor', 1),

-- 29 Brød med ost og skinke
(63, 29, 5, 1.00, 4, 'ingredient', 0),
(64, 29, 2, 0.20, 2, 'ingredient', 0),
(65, 29, 31, 0.10, 2, 'ingredient', 0),

-- 30 Pasta med kjøttsaus
(66, 30, 12, 0.50, 2, 'ingredient', 0),
(67, 30, 7, 0.40, 2, 'ingredient', 0),
(68, 30, 15, 0.50, 3, 'ingredient', 0),

-- 31 Penne med tomatsaus
(69, 31, 13, 0.50, 2, 'ingredient', 0),
(70, 31, 16, 0.40, 2, 'ingredient', 0),

-- 32 Kylling med frosne grønnsaker og ris
(71, 32, 8, 0.50, 2, 'ingredient', 0),
(72, 32, 33, 0.50, 2, 'ingredient', 0),
(73, 32, 14, 1.00, 2, 'ingredient', 0),

-- 33 Laks med ris og grønnsaker
(74, 33, 9, 0.50, 2, 'ingredient', 0),
(75, 33, 14, 1.00, 2, 'ingredient', 0),
(76, 33, 33, 0.50, 2, 'ingredient', 0),

-- 34 Brød med leverpostei og melk
(77, 34, 5, 1.00, 4, 'ingredient', 0),
(78, 34, 32, 0.20, 2, 'ingredient', 0),
(79, 34, 1, 0.30, 3, 'tilbehor', 1),

-- 35 Knekkebrød med hvitost
(80, 35, 6, 0.20, 2, 'ingredient', 0),
(81, 35, 3, 0.20, 2, 'ingredient', 0),

-- 36 Yoghurt med jordbær og blåbær
(82, 36, 4, 0.50, 3, 'ingredient', 0),
(83, 36, 27, 0.10, 2, 'ingredient', 0),
(84, 36, 28, 0.10, 2, 'ingredient', 0),

-- 37 Yoghurt med bringebær og nøtter
(85, 37, 4, 0.50, 3, 'ingredient', 0),
(86, 37, 29, 0.10, 2, 'ingredient', 0),
(87, 37, 38, 0.10, 2, 'ingredient', 0),

-- 38 Hveteboller med kaffe
(88, 38, 30, 1.00, 4, 'ingredient', 0),
(89, 38, 22, 0.20, 2, 'ingredient', 0),

-- 39 Kjeks og te
(90, 39, 39, 0.20, 2, 'ingredient', 0),
(91, 39, 35, 1.00, 4, 'ingredient', 0),

-- 40 Sjokolade og kaffe
(92, 40, 19, 0.20, 2, 'ingredient', 0),
(93, 40, 22, 0.20, 2, 'ingredient', 0),

-- 41 Chips og cola
(94, 41, 18, 0.20, 2, 'ingredient', 0),
(95, 41, 20, 1.00, 3, 'ingredient', 0),

-- 42 Pizza og energidrikk
(96, 42, 17, 1.00, 4, 'ingredient', 0),
(97, 42, 36, 0.25, 3, 'tilbehor', 1),

-- 43 Brød med gulost og melk
(98, 43, 5, 1.00, 4, 'ingredient', 0),
(99, 43, 2, 0.20, 2, 'ingredient', 0),
(100, 43, 1, 0.30, 3, 'tilbehor', 1),

-- 44 Knekkebrød med leverpostei og juice
(101, 44, 6, 0.20, 2, 'ingredient', 0),
(102, 44, 32, 0.20, 2, 'ingredient', 0),
(103, 44, 21, 0.30, 3, 'tilbehor', 1),

-- 45 Nudler med kjøttdeig
(104, 45, 34, 1.00, 4, 'ingredient', 0),
(105, 45, 7, 0.40, 2, 'ingredient', 0),

-- 46 Ris med kylling og tomater
(106, 46, 14, 1.00, 2, 'ingredient', 0),
(107, 46, 8, 0.50, 2, 'ingredient', 0),
(108, 46, 16, 0.40, 2, 'ingredient', 0),

-- 47 Pasta med ost og skinke
(109, 47, 12, 0.50, 2, 'ingredient', 0),
(110, 47, 2, 0.20, 2, 'ingredient', 0),
(111, 47, 31, 0.10, 2, 'ingredient', 0),

-- 48 Laks og cola
(112, 48, 9, 0.50, 2, 'ingredient', 0),
(113, 48, 20, 0.30, 3, 'tilbehor', 1),

-- 49 Brød med hvitost og skinke
(114, 49, 5, 1.00, 4, 'ingredient', 0),
(115, 49, 3, 0.20, 2, 'ingredient', 0),
(116, 49, 31, 0.10, 2, 'ingredient', 0),

-- 50 Yoghurt med alle bær
(117, 50, 4, 0.50, 3, 'ingredient', 0),
(118, 50, 27, 0.10, 2, 'ingredient', 0),
(119, 50, 28, 0.10, 2, 'ingredient', 0),
(120, 50, 29, 0.10, 2, 'ingredient', 0),

-- 51 Nøtter og te
(121, 51, 38, 0.10, 2, 'ingredient', 0),
(122, 51, 35, 1.00, 4, 'ingredient', 0),

-- 52 Kjeks og juice
(123, 52, 39, 0.20, 2, 'ingredient', 0),
(124, 52, 21, 0.30, 3, 'ingredient', 0),

-- 53 Godteri og cola
(125, 53, 40, 0.20, 2, 'ingredient', 0),
(126, 53, 20, 0.30, 3, 'ingredient', 0),

-- 54 Hundemat servering
(127, 54, 25, 0.50, 2, 'ingredient', 0),

-- 55 Kattefôr servering
(128, 55, 26, 0.30, 2, 'ingredient', 0),

-- 56 Toalettpapir påfylling
(129, 56, 23, 1.00, 4, 'ingredient', 0),

-- 57 Tannkrem klar til bruk
(130, 57, 24, 0.05, 3, 'ingredient', 0),

-- 58 Øl og nøtter
(131, 58, 37, 0.50, 3, 'ingredient', 0),
(132, 58, 38, 0.10, 2, 'ingredient', 0),

-- 59 Hjemmelaget rømmegrøt
(133, 59, 51, 5, 5, 'ingredient', 0),
(134, 59, 53, 120, 1, 'ingredient', 0),
(135, 59, 46, 5, 5, 'ingredient', 0),
(136, 59, 54, 3, 1, 'ingredient', 1),
(137, 59, 55, 85, 1, 'tilbehor', 1),
(138, 59, 56, 5, 1, 'tilbehor', 1),
(139, 59, 52, 8, 5, 'tilbehor', 1),
(140, 59, 57, 200, 1, 'tilbehor', 1),
(141, 59, 11, 30, 1, 'tilbehor', 1),

-- 60 Jordbær og fløte
(142, 60, 27, 200, 1, 'ingredient', 0),
(143, 60, 50, 1, 5, 'ingredient', 0);

