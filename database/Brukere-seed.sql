INSERT INTO Brukere (id, brukernavn, passord_hash, email, rolle, created_at) VALUES
(1, 'ola', 'AQAAAAIAAYagAAAAEDmnnVyTwwozjjHGkK8vEwoToXwZxDq2QQgbqZxxy/iJcDcDFnzCYBdSWbaPMmI/VA==', 'ola@example.com', 0, NOW()),
(2, 'kari', 'AQAAAAIAAYagAAAAENjXcQCkfSOmVzEgCl402HGVi8Iy8NXFMQ6j/xWSxOX+dS3uNteCHhASFtGlABL2uw==', 'kari@example.com', 0, NOW()),
(3, 'per', 'AQAAAAIAAYagAAAAEIOZPrdG8okb5GecVXINvea/Nl9uECvlj6B2QCl9bNk3zbM0YQwL14tsMR6Tjv2fzg==', 'per@example.com', 0, NOW()),
(4, 'admin', 'AQAAAAIAAYagAAAAEIWTLSl4ZIL1imSNDcNCvAAyFi9dtd5/6sOX44MZPScJo1PcTIFxKf7CzWkOxuCUdw==', 'admin@example.com', 1, NOW());

-- Seeded users and passwords:
-- - ola / ola123
-- - kari / kari123
-- - per / per123
-- - admin / admin123