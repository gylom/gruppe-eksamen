-- Story 2.3: Per-planned-meal ingredient exclusions + Handleliste source columns for delete protection
-- Apply manually if your DB was created before this migration.

CREATE TABLE IF NOT EXISTS PlanlagteMaaltidEkskludertIngrediens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    planlagt_maaltid_id BIGINT UNSIGNED NOT NULL,
    ingrediens_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL,

    UNIQUE KEY uk_planlagt_maaltid_ingrediens (planlagt_maaltid_id, ingrediens_id),

    FOREIGN KEY (planlagt_maaltid_id) REFERENCES PlanlagteMaaltider(id) ON DELETE CASCADE,
    FOREIGN KEY (ingrediens_id) REFERENCES Ingredienser(id) ON DELETE CASCADE
);

-- Nullable columns on Handleliste. Each ALTER is guarded so the migration can be re-run safely.
SET @schema_name = DATABASE();

SET @sql = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE Handleliste ADD COLUMN planlagt_maaltid_id BIGINT UNSIGNED NULL',
        'SELECT 1')
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'Handleliste'
      AND COLUMN_NAME = 'planlagt_maaltid_id'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE Handleliste ADD COLUMN purchased_at DATETIME NULL',
        'SELECT 1')
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'Handleliste'
      AND COLUMN_NAME = 'purchased_at'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE Handleliste ADD KEY idx_handleliste_planlagt_maaltid (planlagt_maaltid_id)',
        'SELECT 1')
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'Handleliste'
      AND INDEX_NAME = 'idx_handleliste_planlagt_maaltid'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE Handleliste ADD CONSTRAINT fk_handleliste_planlagt_maaltid FOREIGN KEY (planlagt_maaltid_id) REFERENCES PlanlagteMaaltider(id) ON DELETE SET NULL',
        'SELECT 1')
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'Handleliste'
      AND COLUMN_NAME = 'planlagt_maaltid_id'
      AND REFERENCED_TABLE_NAME = 'PlanlagteMaaltider'
      AND REFERENCED_COLUMN_NAME = 'id'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
