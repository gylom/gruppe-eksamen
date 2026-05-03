INSERT INTO Oppskrifter (id, navn, instruksjoner, porsjoner, user_id, kategori_id, bilde, created_at) VALUES
-- Admin eksisterende
(1, 'Spaghetti Bolognese', 'Stek kjøttdeig, tilsett saus, kok pasta.', 2, 4, 3, NULL, NOW()),
(2, 'Kylling og ris', 'Stek kylling, kok ris, server sammen.', 2, 4, 3, NULL, NOW()),
(3, 'Laks med grønnsaker', 'Stek laks, server med grønnsaker.', 2, 4, 3, NULL, NOW()),
(4, 'Omelett', 'Visp egg, stek i panne.', 1, 4, 1, NULL, NOW()),
(5, 'Yoghurt med bær', 'Bland yoghurt og bær.', 1, 4, 1, NULL, NOW()),

-- Ola
(6, 'Pasta med ostesaus', 'Kok pasta, varm ost og bland sammen.', 2, 1, 6, NULL, NOW()),
(7, 'Yoghurt med jordbær', 'Bland yoghurt med jordbær og server kaldt.', 1, 1, 1, NULL, NOW()),
(8, 'Knekkebrød med leverpostei', 'Smør leverpostei på knekkebrød.', 1, 1, 1, NULL, NOW()),
(9, 'Penne med pastasaus', 'Kok penne og bland med varm pastasaus.', 2, 1, 3, NULL, NOW()),
(10, 'Kyllingfilet med ris', 'Stek kyllingfilet og server med kokt ris.', 2, 1, 3, NULL, NOW()),
(11, 'Toast med hvitost og skinke', 'Legg ost og skinke på brød og varm i panne eller ovn.', 1, 1, 1, NULL, NOW()),
(12, 'Nudler med kylling', 'Kok nudler, stek kylling og bland sammen.', 2, 1, 3, NULL, NOW()),

-- Kari
(13, 'Laks med ris', 'Stek laks og server med kokt ris.', 2, 2, 3, NULL, NOW()),
(14, 'Brød med leverpostei', 'Smør leverpostei på brødskiver.', 1, 2, 1, NULL, NOW()),
(15, 'Yoghurt med blåbær', 'Bland yoghurt og blåbær i en skål.', 1, 2, 1, NULL, NOW()),
(16, 'Pasta med kjøttdeig og tomater', 'Stek kjøttdeig, tilsett hermetiske tomater og server med pasta.', 2, 2, 6, NULL, NOW()),
(17, 'Hveteboller og kaffe', 'Server hveteboller sammen med nytraktet kaffe.', 1, 2, 6, NULL, NOW()),
(18, 'Brød med hvitost', 'Skjær brød og legg på hvitost.', 1, 2, 1, NULL, NOW()),
(19, 'Kylling med frosne grønnsaker', 'Stek kylling og varm grønnsaker ved siden av.', 2, 2, 3, NULL, NOW()),
(20, 'Yoghurt med bringebær', 'Bland yoghurt og bringebær.', 1, 2, 1, NULL, NOW()),

-- Per
(21, 'Ris med kjøttdeig', 'Stek kjøttdeig og server med kokt ris.', 2, 3, 3, NULL, NOW()),
(22, 'Penne med kylling', 'Kok penne, stek kylling og bland sammen.', 2, 3, 3, NULL, NOW()),
(23, 'Brød med gulost', 'Legg gulost på brød og server.', 1, 3, 1, NULL, NOW()),
(24, 'Knekkebrød med skinke', 'Legg skinke på knekkebrød.', 1, 3, 1, NULL, NOW()),
(25, 'Nudler med grønnsaker', 'Kok nudler og bland inn varme grønnsaker.', 1, 3, 3, NULL, NOW()),
(26, 'Yoghurt med bærmix', 'Bland yoghurt med jordbær, blåbær og bringebær.', 1, 3, 1, NULL, NOW()),
(27, 'Spaghetti med pastasaus', 'Kok spaghetti og server med varm pastasaus.', 2, 3, 3, NULL, NOW()),
(28, 'Pizza og cola', 'Varm pizza i ovnen og server med cola.', 1, 3, 6, NULL, NOW()),

-- Admin ekstra
(29, 'Brød med ost og skinke', 'Legg ost og skinke på brød og server.', 1, 4, 1, NULL, NOW()),
(30, 'Pasta med kjøttsaus', 'Stek kjøttdeig, bland med saus og server over pasta.', 2, 4, 3, NULL, NOW()),
(31, 'Penne med tomatsaus', 'Kok penne og bland med hermetiske tomater eller saus.', 2, 4, 3, NULL, NOW()),
(32, 'Kylling med frosne grønnsaker og ris', 'Stek kylling, kok ris og varm grønnsaker.', 2, 4, 3, NULL, NOW()),
(33, 'Laks med ris og grønnsaker', 'Stek laks og server med ris og grønnsaker.', 2, 4, 3, NULL, NOW()),
(34, 'Brød med leverpostei og melk', 'Server brød med leverpostei og et glass melk.', 1, 4, 1, NULL, NOW()),
(35, 'Knekkebrød med hvitost', 'Legg hvitost på knekkebrød.', 1, 4, 1, NULL, NOW()),
(36, 'Yoghurt med jordbær og blåbær', 'Bland yoghurt med jordbær og blåbær.', 1, 4, 1, NULL, NOW()),
(37, 'Yoghurt med bringebær og nøtter', 'Bland yoghurt med bringebær og nøtter.', 1, 4, 1, NULL, NOW()),
(38, 'Hveteboller med kaffe', 'Server hveteboller med kaffe.', 1, 4, 6, NULL, NOW()),
(39, 'Kjeks og te', 'Server kjeks sammen med te.', 1, 4, 6, NULL, NOW()),
(40, 'Sjokolade og kaffe', 'Server sjokolade ved siden av kaffe.', 1, 4, 6, NULL, NOW()),
(41, 'Chips og cola', 'Server chips med cola.', 1, 4, 6, NULL, NOW()),
(42, 'Pizza og energidrikk', 'Varm pizza og server med energidrikk.', 1, 4, 3, NULL, NOW()),
(43, 'Brød med gulost og melk', 'Legg gulost på brød og server med melk.', 1, 4, 1, NULL, NOW()),
(44, 'Knekkebrød med leverpostei og juice', 'Smør leverpostei på knekkebrød og server med juice.', 1, 4, 1, NULL, NOW()),
(45, 'Nudler med kjøttdeig', 'Kok nudler, stek kjøttdeig og bland sammen.', 2, 4, 3, NULL, NOW()),
(46, 'Ris med kylling og tomater', 'Kok ris, stek kylling og server med tomater.', 2, 4, 6, NULL, NOW()),
(47, 'Pasta med ost og skinke', 'Kok pasta og bland med ost og skinke.', 2, 4, 3, NULL, NOW()),
(48, 'Laks og cola', 'Stek laks og server med drikke ved siden av.', 1, 4, 6, NULL, NOW()),
(49, 'Brød med hvitost og skinke', 'Legg hvitost og skinke på brød.', 1, 4, 1, NULL, NOW()),
(50, 'Yoghurt med alle bær', 'Bland yoghurt med jordbær, blåbær og bringebær.', 1, 4, 1, NULL, NOW()),
(51, 'Nøtter og te', 'Server nøtter sammen med te.', 1, 4, 6, NULL, NOW()),
(52, 'Kjeks og juice', 'Server kjeks sammen med juice.', 1, 4, 6, NULL, NOW()),
(53, 'Godteri og cola', 'Server godteri med cola.', 1, 4, 6, NULL, NOW()),
(54, 'Hundemat servering', 'Åpne hundemat og server til hund.', 1, 4, 3, NULL, NOW()),
(55, 'Kattefôr servering', 'Åpne kattefôr og server til katt.', 1, 4, 6, NULL, NOW()),
(56, 'Toalettpapir påfylling', 'Sett fram ny rull toalettpapir.', 1, 4, 3, NULL, NOW()),
(57, 'Tannkrem klar til bruk', 'Legg fram tannkrem på badet.', 1, 4, 3, NULL, NOW()),
(58, 'Øl og nøtter', 'Server øl sammen med nøtter.', 1, 4, 6, NULL, NOW()),

-- Oppskrifter for å demonstrere kampanje og sesong til anbefalte oppskrifter
(59, 'Hjemmelaget rømmegrøt', '1. La rømme koke under lokk i ca. 2 minutter. 
Dryss i halvparten av melet mens du rører hele tiden. Da vil det piple frem smør. 2. 
Ta ut smøret med en spiseskje og hold det varmt i en liten skål, slik at du kan servere det på grøten til slutt. 
Dryss i resten av melet og rør godt. Spe med melk under røring til grøten er jevn og passe tykk. Smak til med 
salt like før servering. 3. Blir grøten stående en stund før servering, vil den tykne mer. Spe da med mer melk 
til passe konsistens. Server grøten med smørøye, sukker og kanel. (ts og ss omregnet til gram)', 4, 4, 3, 'https://www.tine.no/oppskrifter/_next/image?url=https%3A%2F%2Fwww.tine.no%2F_%2Frecipeimage%2Fw_1200%2Ch_675%2Cc_fill%2Cx_3056%2Cy_1719%2Cg_xy_center%2Frecipeimage%2Fuknvgljau2oclmqufvch.jpg&w=1200&q=75', NOW()),
(60, 'Jordbær med fløte', 'Vask og rens bærene. Legg i en skål og hell fløte over.', 2, 4, 5, 'https://www.tine.no/oppskrifter/_next/image?url=https%3A%2F%2Fwww.tine.no%2F_%2Frecipeimage%2Fw_1200%2Ch_675%2Cc_fill%2Cx_1500%2Cy_1300%2Cg_xy_center%2Frecipeimage%2F455722.jpg&w=1200&q=75', NOW());
