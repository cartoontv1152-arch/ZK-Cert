program zk_cert_main.aleo {

    struct CertificateInfo {
        cert_id: u64,
        issuer: address,
        holder: address,
        cert_hash: field,
        issue_date: u64,
        cert_type: u8,
        is_revoked: bool
    }

    record Certificate {
        owner: address,
        cert_id: u64,
        issuer: address,
        cert_hash: field,
        issue_date: u64,
        cert_type: u8
    }

    record VerificationProof {
        owner: address,
        cert_id: u64,
        issuer: address,
        is_valid: bool,
        verified_at: u64
    }

    mapping certificates: u64 => CertificateInfo;
    mapping issuer_cert_count: address => u64;
    mapping holder_cert_count: address => u64;
    mapping verified_issuers: address => bool;

    @noupgrade
    async constructor() {}

    // One-time registration for an institution address.
    async transition register_issuer(public issuer: address) -> Future {
        return finalize_register_issuer(issuer);
    }

    async function finalize_register_issuer(issuer: address) {
        let is_registered: bool = Mapping::get_or_use(verified_issuers, issuer, false);
        assert(!is_registered);
        Mapping::set(verified_issuers, issuer, true);
        Mapping::set(issuer_cert_count, issuer, 0u64);
    }

    // Issues a private Certificate record to the holder.
    // cert_id is provided by the issuer (UI derives it deterministically).
    async transition issue_certificate(
        public cert_id: u64,
        public holder: address,
        public cert_hash: field,
        public issue_date: u64,
        public cert_type: u8
    ) -> (Certificate, Future) {
        let cert: Certificate = Certificate {
            owner: holder,
            cert_id,
            issuer: self.caller,
            cert_hash,
            issue_date,
            cert_type
        };

        return (
            cert,
            finalize_issue_certificate(self.caller, cert_id, holder, cert_hash, issue_date, cert_type)
        );
    }

    async function finalize_issue_certificate(
        issuer: address,
        cert_id: u64,
        holder: address,
        cert_hash: field,
        issue_date: u64,
        cert_type: u8
    ) {
        let is_verified_issuer: bool = Mapping::get_or_use(verified_issuers, issuer, false);
        assert(is_verified_issuer);

        let cert_info: CertificateInfo = CertificateInfo {
            cert_id,
            issuer,
            holder,
            cert_hash,
            issue_date,
            cert_type,
            is_revoked: false
        };

        Mapping::set(certificates, cert_id, cert_info);

        let issuer_count: u64 = Mapping::get_or_use(issuer_cert_count, issuer, 0u64);
        Mapping::set(issuer_cert_count, issuer, issuer_count + 1u64);

        let holder_count: u64 = Mapping::get_or_use(holder_cert_count, holder, 0u64);
        Mapping::set(holder_cert_count, holder, holder_count + 1u64);
    }

    // Revokes an issued certificate (issuer-only).
    async transition revoke_certificate(public cert_id: u64) -> Future {
        return finalize_revoke_certificate(self.caller, cert_id);
    }

    async function finalize_revoke_certificate(issuer: address, cert_id: u64) {
        let cert_info: CertificateInfo = Mapping::get(certificates, cert_id);
        assert_eq(cert_info.issuer, issuer);
        assert(!cert_info.is_revoked);

        let updated_cert: CertificateInfo = CertificateInfo {
            cert_id: cert_info.cert_id,
            issuer: cert_info.issuer,
            holder: cert_info.holder,
            cert_hash: cert_info.cert_hash,
            issue_date: cert_info.issue_date,
            cert_type: cert_info.cert_type,
            is_revoked: true
        };

        Mapping::set(certificates, cert_id, updated_cert);
    }

    // Holder generates a proof record (can be shared via transfer if needed).
    async transition generate_proof(
        cert: Certificate,
        public verification_time: u64
    ) -> (VerificationProof, Future) {
        assert_eq(cert.owner, self.caller);

        let proof: VerificationProof = VerificationProof {
            owner: cert.owner,
            cert_id: cert.cert_id,
            issuer: cert.issuer,
            is_valid: true,
            verified_at: verification_time
        };

        return (proof, finalize_generate_proof(cert.cert_id));
    }

    async function finalize_generate_proof(cert_id: u64) {
        let cert_info: CertificateInfo = Mapping::get(certificates, cert_id);
        assert(!cert_info.is_revoked);
    }

    // On-chain verification hook (checks revocation status).
    async transition verify_proof(proof: VerificationProof) -> Future {
        return finalize_verify_proof(proof.cert_id);
    }

    async function finalize_verify_proof(cert_id: u64) {
        let cert_info: CertificateInfo = Mapping::get(certificates, cert_id);
        assert(!cert_info.is_revoked);
    }

    async transition check_certificate_status(public cert_id: u64) -> Future {
        return finalize_check_status(cert_id);
    }

    async function finalize_check_status(cert_id: u64) {
        let cert_info: CertificateInfo = Mapping::get(certificates, cert_id);
        assert(!cert_info.is_revoked);
    }
}
