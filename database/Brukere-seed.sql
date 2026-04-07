INSERT INTO Brukere (brukernavn, passord_hash, email, rolle, created_at) VALUES
('ola', 'hash1', 'ola@example.com', 0, NOW()),
('kari', 'hash2', 'kari@example.com', 0, NOW()),
('per', 'hash3', 'per@example.com', 0, NOW()),
('admin', 'adminhash', 'admin@example.com', 1, NOW());