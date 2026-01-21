program zk_cert_main.aleo;

record Certificate:
    owner as address.private;
    cert_id as u64.private;
    issuer as address.private;
    cert_hash as field.private;
    issue_date as u64.private;
    cert_type as u8.private;

record VerificationProof:
    owner as address.private;
    cert_id as u64.private;
    issuer as address.private;
    is_valid as boolean.private;
    verified_at as u64.private;

struct CertificateInfo:
    cert_id as u64;
    issuer as address;
    holder as address;
    cert_hash as field;
    issue_date as u64;
    cert_type as u8;
    is_revoked as boolean;

mapping certificates:
    key as u64.public;
    value as CertificateInfo.public;

mapping issuer_cert_count:
    key as address.public;
    value as u64.public;

mapping holder_cert_count:
    key as address.public;
    value as u64.public;

mapping verified_issuers:
    key as address.public;
    value as boolean.public;

function register_issuer:
    input r0 as address.public;
    async register_issuer r0 into r1;
    output r1 as zk_cert_main.aleo/register_issuer.future;

finalize register_issuer:
    input r0 as address.public;
    get.or_use verified_issuers[r0] false into r1;
    not r1 into r2;
    assert.eq r2 true;
    set true into verified_issuers[r0];
    set 0u64 into issuer_cert_count[r0];

function issue_certificate:
    input r0 as u64.public;
    input r1 as address.public;
    input r2 as field.public;
    input r3 as u64.public;
    input r4 as u8.public;
    cast r1 r0 self.caller r2 r3 r4 into r5 as Certificate.record;
    async issue_certificate self.caller r0 r1 r2 r3 r4 into r6;
    output r5 as Certificate.record;
    output r6 as zk_cert_main.aleo/issue_certificate.future;

finalize issue_certificate:
    input r0 as address.public;
    input r1 as u64.public;
    input r2 as address.public;
    input r3 as field.public;
    input r4 as u64.public;
    input r5 as u8.public;
    get.or_use verified_issuers[r0] false into r6;
    assert.eq r6 true;
    cast r1 r0 r2 r3 r4 r5 false into r7 as CertificateInfo;
    set r7 into certificates[r1];
    get.or_use issuer_cert_count[r0] 0u64 into r8;
    add r8 1u64 into r9;
    set r9 into issuer_cert_count[r0];
    get.or_use holder_cert_count[r2] 0u64 into r10;
    add r10 1u64 into r11;
    set r11 into holder_cert_count[r2];

function revoke_certificate:
    input r0 as u64.public;
    async revoke_certificate self.caller r0 into r1;
    output r1 as zk_cert_main.aleo/revoke_certificate.future;

finalize revoke_certificate:
    input r0 as address.public;
    input r1 as u64.public;
    get certificates[r1] into r2;
    assert.eq r2.issuer r0;
    not r2.is_revoked into r3;
    assert.eq r3 true;
    cast r2.cert_id r2.issuer r2.holder r2.cert_hash r2.issue_date r2.cert_type true into r4 as CertificateInfo;
    set r4 into certificates[r1];

function generate_proof:
    input r0 as Certificate.record;
    input r1 as u64.public;
    assert.eq r0.owner self.caller;
    cast r0.owner r0.cert_id r0.issuer true r1 into r2 as VerificationProof.record;
    async generate_proof r0.cert_id into r3;
    output r2 as VerificationProof.record;
    output r3 as zk_cert_main.aleo/generate_proof.future;

finalize generate_proof:
    input r0 as u64.public;
    get certificates[r0] into r1;
    not r1.is_revoked into r2;
    assert.eq r2 true;

function verify_proof:
    input r0 as VerificationProof.record;
    async verify_proof r0.cert_id into r1;
    output r1 as zk_cert_main.aleo/verify_proof.future;

finalize verify_proof:
    input r0 as u64.public;
    get certificates[r0] into r1;
    not r1.is_revoked into r2;
    assert.eq r2 true;

function check_certificate_status:
    input r0 as u64.public;
    async check_certificate_status r0 into r1;
    output r1 as zk_cert_main.aleo/check_certificate_status.future;

finalize check_certificate_status:
    input r0 as u64.public;
    get certificates[r0] into r1;
    not r1.is_revoked into r2;
    assert.eq r2 true;

constructor:
    assert.eq edition 0u16;
