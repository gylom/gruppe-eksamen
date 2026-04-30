-- Story 1.4: household invite codes (single-use, time-limited, revocable)
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

    CONSTRAINT fk_hi_husholdning FOREIGN KEY (husholdning_id) REFERENCES Husholdning(id) ON DELETE CASCADE,
    CONSTRAINT fk_hi_created_by FOREIGN KEY (created_by_user_id) REFERENCES Brukere(id),
    CONSTRAINT fk_hi_used_by FOREIGN KEY (used_by_user_id) REFERENCES Brukere(id)
);

-- A user can only belong to ONE household. The legacy composite UNIQUE
-- (husholdning_id, user_id) allowed the same user to be a member of multiple
-- households, which contradicts the single-membership invariant the controller
-- enforces. Keep the legacy composite index because it also supports the
-- husholdning_id foreign key, and add a dedicated unique index on user_id so
-- concurrent join attempts cannot insert duplicate Medlem rows.
ALTER TABLE Medlemmer ADD UNIQUE KEY uk_medlemmer_user_id (user_id);

-- Cap household name length to match the API validation.
ALTER TABLE Husholdning MODIFY COLUMN navn VARCHAR(80) NOT NULL;
