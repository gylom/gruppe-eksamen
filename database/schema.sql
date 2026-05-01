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
    navn VARCHAR(80) NOT NULL,
    created_at DATETIME NOT NULL
);

CREATE TABLE Medlemmer (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    husholdning_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    rolle ENUM('eier','medlem') NOT NULL,

    UNIQUE KEY uk_medlemmer_user_id (user_id),

    FOREIGN KEY (husholdning_id) REFERENCES Husholdning(id),
    FOREIGN KEY (user_id) REFERENCES Brukere(id)
);

CREATE TABLE HusholdningInvitasjon (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    husholdning_id BIGINT UNSIGNED NOT NULL,
    kode CHAR(6) NOT NULL,
    created_by_user_id BIGINT UNSIGNED NOT NULL,
    used_by_user_id BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME NULL,
    used_at DATETIME NULL,

    UNIQUE KEY uk_husholdning_invitasjon_kode (kode),
    KEY idx_husholdning_invitasjon_husholdning (husholdning_id),
    KEY idx_husholdning_invitasjon_active (husholdning_id, revoked_at, used_at, expires_at),

    FOREIGN KEY (husholdning_id) REFERENCES Husholdning(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES Brukere(id),
    FOREIGN KEY (used_by_user_id) REFERENCES Brukere(id)
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
    ean VARCHAR(255),
    user_id BIGINT UNSIGNED NULL,
    brukerdefinert BOOLEAN NOT NULL DEFAULT FALSE,

    FOREIGN KEY (varetype_id) REFERENCES Varetyper(id),
    FOREIGN KEY (maaleenhet_id) REFERENCES Maaleenheter(id),
    FOREIGN KEY (user_id) REFERENCES Brukere(id)
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
-- OPPSKRIFTSKATEGORIER
-- =========================
CREATE TABLE Oppskriftskategorier (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    navn VARCHAR(100) NOT NULL UNIQUE
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
    kategori_id BIGINT UNSIGNED,
    bilde VARCHAR(255),
    created_at DATETIME,

    FOREIGN KEY (user_id) REFERENCES Brukere(id),
    FOREIGN KEY (kategori_id) REFERENCES Oppskriftskategorier(id)
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

-- =========================
-- PLANLAGTE MÅLTIDER (Story 2.2)
-- =========================
CREATE TABLE PlanlagteMaaltider (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    husholdning_id BIGINT UNSIGNED NOT NULL,
    oppskrift_id BIGINT UNSIGNED NOT NULL,
    uke_start_dato DATE NOT NULL,
    dag INT NOT NULL,
    maaltidstype_id BIGINT UNSIGNED NOT NULL,
    porsjoner INT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    removed_from_plan_at DATETIME NULL,

    KEY idx_planlagte_slot (husholdning_id, uke_start_dato, dag, maaltidstype_id),

    FOREIGN KEY (husholdning_id) REFERENCES Husholdning(id),
    FOREIGN KEY (oppskrift_id) REFERENCES Oppskrifter(id) ON DELETE CASCADE,
    FOREIGN KEY (maaltidstype_id) REFERENCES Oppskriftskategorier(id)
);

-- =========================
-- PLANLAGT MÅLTID — EKSKLUDERT INGREDIENS (Story 2.3)
-- =========================
CREATE TABLE PlanlagteMaaltidEkskludertIngrediens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    planlagt_maaltid_id BIGINT UNSIGNED NOT NULL,
    ingrediens_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL,

    UNIQUE KEY uk_planlagt_maaltid_ingrediens (planlagt_maaltid_id, ingrediens_id),

    FOREIGN KEY (planlagt_maaltid_id) REFERENCES PlanlagteMaaltider(id) ON DELETE CASCADE,
    FOREIGN KEY (ingrediens_id) REFERENCES Ingredienser(id) ON DELETE CASCADE
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
    planlagt_maaltid_id BIGINT UNSIGNED NULL,
    purchased_at DATETIME NULL,
    archived_at DATETIME NULL,
    kilde VARCHAR(32) NOT NULL DEFAULT 'manual',

    KEY idx_handleliste_planlagt_maaltid (planlagt_maaltid_id),

    FOREIGN KEY (varetype_id) REFERENCES Varetyper(id),
    FOREIGN KEY (vare_id) REFERENCES Varer(id),
    FOREIGN KEY (user_id) REFERENCES Brukere(id),
    FOREIGN KEY (maaleenhet_id) REFERENCES Maaleenheter(id),
    FOREIGN KEY (planlagt_maaltid_id) REFERENCES PlanlagteMaaltider(id) ON DELETE SET NULL
);

CREATE TABLE HandlelistePlanlagteMaaltider (
    handleliste_id BIGINT UNSIGNED NOT NULL,
    planlagt_maaltid_id BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (handleliste_id, planlagt_maaltid_id),

    FOREIGN KEY (handleliste_id) REFERENCES Handleliste(id) ON DELETE CASCADE,
    FOREIGN KEY (planlagt_maaltid_id) REFERENCES PlanlagteMaaltider(id) ON DELETE CASCADE
);

CREATE TABLE Skjuloppskrift (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    oppskrift_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    begrunnelse VARCHAR(255),
    kommentar TEXT,
    skjul BOOLEAN NOT NULL DEFAULT TRUE,
    karakter INT NULL,

    UNIQUE (user_id, oppskrift_id),

    FOREIGN KEY (oppskrift_id) REFERENCES Oppskrifter(id),
    FOREIGN KEY (user_id) REFERENCES Brukere(id),

    CHECK (karakter IS NULL OR (karakter BETWEEN 1 AND 10))
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
