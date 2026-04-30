-- Story 3.2: shopping row source (kilde) + many-to-many planned-meal provenance for aggregated rows.
-- Apply manually if your DB was created before this migration.

SET @schema_name = DATABASE();

SET @sql = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE Handleliste ADD COLUMN kilde VARCHAR(32) NOT NULL DEFAULT ''manual''',
        'SELECT 1')
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'Handleliste'
      AND COLUMN_NAME = 'kilde'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS HandlelistePlanlagteMaaltider (
    handleliste_id BIGINT UNSIGNED NOT NULL,
    planlagt_maaltid_id BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (handleliste_id, planlagt_maaltid_id),

    FOREIGN KEY (handleliste_id) REFERENCES Handleliste(id) ON DELETE CASCADE,
    FOREIGN KEY (planlagt_maaltid_id) REFERENCES PlanlagteMaaltider(id) ON DELETE CASCADE
);
