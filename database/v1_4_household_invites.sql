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
