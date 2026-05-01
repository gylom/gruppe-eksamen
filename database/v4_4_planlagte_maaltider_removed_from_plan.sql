-- Allow planned meals with purchased/cookbook history to be removed from the active week plan
-- without deleting the historical row that cookbook reads from.
-- Apply manually if your DB was created before this migration.

SET @schema_name = DATABASE();

SET @sql = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE PlanlagteMaaltider ADD COLUMN removed_from_plan_at DATETIME NULL AFTER updated_at',
        'SELECT 1')
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'PlanlagteMaaltider'
      AND COLUMN_NAME = 'removed_from_plan_at'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(COUNT(*) = 0,
        'CREATE INDEX idx_planlagte_slot ON PlanlagteMaaltider (husholdning_id, uke_start_dato, dag, maaltidstype_id)',
        'SELECT 1')
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'PlanlagteMaaltider'
      AND INDEX_NAME = 'idx_planlagte_slot'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(COUNT(*) > 0,
        'ALTER TABLE PlanlagteMaaltider DROP INDEX uk_planlagte_slot',
        'SELECT 1')
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'PlanlagteMaaltider'
      AND INDEX_NAME = 'uk_planlagte_slot'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
