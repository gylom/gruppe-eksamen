CREATE DATABASE IF NOT EXISTS matlager_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE matlager_db;

CREATE TABLE varelager (
                           id BIGINT AUTO_INCREMENT PRIMARY KEY,
                           husholdning_id BIGINT,
                           vare_id BIGINT,
                           kvantitet DECIMAL,
                           utløpsdato DATE,
                           created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE handleliste (
                             id BIGINT AUTO_INCREMENT PRIMARY KEY,
                             husholdning_id BIGINT,
                             varetype_id BIGINT,
                             kvantitet DECIMAL,
                             fullført BOOLEAN DEFAULT FALSE
);