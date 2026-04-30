-- Story 2.2: Planned meals per household week slots
-- Apply manually if your DB was created before this migration.

CREATE TABLE IF NOT EXISTS PlanlagteMaaltider (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    husholdning_id BIGINT UNSIGNED NOT NULL,
    oppskrift_id BIGINT UNSIGNED NOT NULL,
    uke_start_dato DATE NOT NULL,
    dag INT NOT NULL,
    maaltidstype_id BIGINT UNSIGNED NOT NULL,
    porsjoner INT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,

    UNIQUE KEY uk_planlagte_slot (husholdning_id, uke_start_dato, dag, maaltidstype_id),

    FOREIGN KEY (husholdning_id) REFERENCES Husholdning(id),
    FOREIGN KEY (oppskrift_id) REFERENCES Oppskrifter(id) ON DELETE CASCADE,
    FOREIGN KEY (maaltidstype_id) REFERENCES Oppskriftskategorier(id)
);
