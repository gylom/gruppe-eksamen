-- Story 4.3: archive completed shopping trip rows in-place (no deletes).
-- Apply manually if your DB was created before this migration.

SET @schema_name = DATABASE();

SET @sql = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE Handleliste ADD COLUMN archived_at DATETIME NULL AFTER purchased_at',
        'SELECT 1')
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'Handleliste'
      AND COLUMN_NAME = 'archived_at'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
