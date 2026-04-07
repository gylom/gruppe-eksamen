-- =========================
-- BRUKERE
-- =========================
CREATE TABLE Brukere (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    brukernavn VARCHAR(255) NOT NULL UNIQUE,
    passord_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    rolle BOOLEAN NOT NULL,
    created_at DATETIME NOT NULL
);

-- =========================
-- HUSHOLDNING
-- =========================
CREATE TABLE Husholdning (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    navn VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL
);

CREATE TABLE Medlemmer (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    husholdning_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    rolle ENUM('eier','medlem') NOT NULL,

    UNIQUE (husholdning_id, user_id),

    FOREIGN KEY (husholdning_id) REFERENCES Husholdning(id),
    FOREIGN KEY (user_id) REFERENCES Brukere(id)
);

-- =========================
-- KATEGORI / VARE
-- =========================
CREATE TABLE Varekategori (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    kategorinavn VARCHAR(255) NOT NULL,
    parent_id BIGINT UNSIGNED,
    FOREIGN KEY (parent_id) REFERENCES Varekategori(id)
);

CREATE TABLE Varetyper (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    varetype VARCHAR(255) NOT NULL,
    kategori_id BIGINT UNSIGNED NOT NULL,
    FOREIGN KEY (kategori_id) REFERENCES Varekategori(id)
);

CREATE TABLE Maaleenheter (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    enhet VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL
);

CREATE TABLE Varer (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    varenavn VARCHAR(255) NOT NULL,
    varetype_id BIGINT UNSIGNED NOT NULL,
    merke VARCHAR(255) NOT NULL,
    kvantitet DECIMAL(8,2) NOT NULL,
    maaleenhet_id BIGINT UNSIGNED NOT NULL,
    ean VARCHAR(255) NOT NULL UNIQUE,

    FOREIGN KEY (varetype_id) REFERENCES Varetyper(id),
    FOREIGN KEY (maaleenhet_id) REFERENCES Maaleenheter(id)
);

-- =========================
-- BUTIKK
-- =========================
CREATE TABLE Butikker (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    butikknavn VARCHAR(255) NOT NULL
);

CREATE TABLE Butikkpriser (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    vare_id BIGINT UNSIGNED NOT NULL,
    butikk_id BIGINT UNSIGNED NOT NULL,
    pris DECIMAL(8,2) NOT NULL,
    datopris DATE NOT NULL,
    tilbudspris DECIMAL(8,2),
    tilbudfradato DATE,
    tilbudtildato DATE,

    UNIQUE (vare_id, butikk_id),

    FOREIGN KEY (vare_id) REFERENCES Varer(id),
    FOREIGN KEY (butikk_id) REFERENCES Butikker(id)
);

-- =========================
-- HUSHOLDNINGSINNSTILLINGER
-- =========================
CREATE TABLE Husholdningsinnstillinger (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    husholdning_id BIGINT UNSIGNED NOT NULL,
    varetype_id BIGINT UNSIGNED NOT NULL,
    minimumslager DECIMAL(8,2),
    beredskapslager BOOLEAN,

    UNIQUE (husholdning_id, varetype_id),

    FOREIGN KEY (husholdning_id) REFERENCES Husholdning(id),
    FOREIGN KEY (varetype_id) REFERENCES Varetyper(id)
);

-- =========================
-- PLASSERING
-- =========================
CREATE TABLE Plassering (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    husholdning_id BIGINT UNSIGNED NOT NULL,
    plassering VARCHAR(255) NOT NULL,

    FOREIGN KEY (husholdning_id) REFERENCES Husholdning(id)
);

-- =========================
-- VARELAGER
-- =========================
CREATE TABLE Varelager (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    vare_id BIGINT UNSIGNED NOT NULL,
    husholdning_id BIGINT UNSIGNED NOT NULL,
    pris DECIMAL(8,2),
    kvantitet DECIMAL(8,2) NOT NULL,
    bestfordato DATE,
    plassering_id BIGINT UNSIGNED,
    kjopsdato DATETIME,
    maaleenhet_id BIGINT UNSIGNED NOT NULL,

    FOREIGN KEY (vare_id) REFERENCES Varer(id),
    FOREIGN KEY (husholdning_id) REFERENCES Husholdning(id),
    FOREIGN KEY (plassering_id) REFERENCES Plassering(id),
    FOREIGN KEY (maaleenhet_id) REFERENCES Maaleenheter(id)
);

-- =========================
-- HANDLELISTE
-- =========================
CREATE TABLE Handleliste (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    varetype_id BIGINT UNSIGNED NOT NULL,
    vare_id BIGINT UNSIGNED NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    kvantitet DECIMAL(8,2),
    maaleenhet_id BIGINT UNSIGNED,
    opprettet DATETIME,
    endret DATETIME,

    FOREIGN KEY (varetype_id) REFERENCES Varetyper(id),
    FOREIGN KEY (vare_id) REFERENCES Varer(id),
    FOREIGN KEY (user_id) REFERENCES Brukere(id),
    FOREIGN KEY (maaleenhet_id) REFERENCES Maaleenheter(id)
);

-- =========================
-- FORBRUK
-- =========================
CREATE TABLE Forbruk (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    vare_id BIGINT UNSIGNED NOT NULL,
    forbruksdato DATETIME,
    innkjopspris DECIMAL(8,2),
    maaleenhet_id BIGINT UNSIGNED,
    kvantitet DECIMAL(8,2),

    FOREIGN KEY (user_id) REFERENCES Brukere(id),
    FOREIGN KEY (vare_id) REFERENCES Varer(id),
    FOREIGN KEY (maaleenhet_id) REFERENCES Maaleenheter(id)
);

-- =========================
-- OPPSKRIFTER
-- =========================
CREATE TABLE Oppskrifter (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    navn VARCHAR(255) NOT NULL,
    instruksjoner TEXT NOT NULL,
    porsjoner INT NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    bilde VARCHAR(255),
    created_at DATETIME,

    FOREIGN KEY (user_id) REFERENCES Brukere(id)
);

CREATE TABLE Ingredienser (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    oppskrift_id BIGINT UNSIGNED NOT NULL,
    varetype_id BIGINT UNSIGNED NOT NULL,
    kvantitet DECIMAL(8,2),
    maaleenhet_id BIGINT UNSIGNED,
    type ENUM('ingredient','tilbehor'),
    valgfritt BOOLEAN,

    FOREIGN KEY (oppskrift_id) REFERENCES Oppskrifter(id),
    FOREIGN KEY (varetype_id) REFERENCES Varetyper(id),
    FOREIGN KEY (maaleenhet_id) REFERENCES Maaleenheter(id)
);

CREATE TABLE Skjuloppskrift (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    oppskrift_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    begrunnelse VARCHAR(255),
    kommentar TEXT,

    FOREIGN KEY (oppskrift_id) REFERENCES Oppskrifter(id),
    FOREIGN KEY (user_id) REFERENCES Brukere(id)
);

-- =========================
-- SKJULVARE
-- =========================
CREATE TABLE Skjulvare (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    varetype_id BIGINT UNSIGNED NOT NULL,
    vare_id BIGINT UNSIGNED NULL,
    begrunnelse VARCHAR(255),
    kommentar TEXT,

    UNIQUE (user_id, varetype_id, vare_id),

    FOREIGN KEY (user_id) REFERENCES Brukere(id),
    FOREIGN KEY (varetype_id) REFERENCES Varetyper(id),
    FOREIGN KEY (vare_id) REFERENCES Varer(id)
);