-- =============================================================================
-- ITIS — India Transport Infrastructure Intelligence System
-- Relational + geospatial schema  (PostgreSQL 16 + PostGIS 3)
--
-- Design rules enforced here (see docs/spec/03-database-architecture.md):
--   R1  Every factual row points to a source (source_id NOT NULL) unless the
--       column is explicitly an inference (technology_requirements.kind='potential').
--   R2  Status history is append-only (project_events has no UPDATE/DELETE).
--   R3  Conflicting values are stored side by side (project_values), never overwritten.
--   R4  JV / consortium members are rows in contract_parties — never a concatenated name.
--   R5  Geometry always carries a precision flag; APPROXIMATE is never shown as surveyed.
--   R6  Canonical entities keep every source spelling (…_aliases, original_name_in_source).
-- Money: INR crore, numeric(14,2). Lengths: km, numeric(9,3). Dates: date + precision.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE SCHEMA IF NOT EXISTS itis;
SET search_path = itis, public;

-- -----------------------------------------------------------------------------
-- 0. Enumerations
-- -----------------------------------------------------------------------------
CREATE TYPE confidence_level AS ENUM ('VERIFIED', 'CROSS_VERIFIED', 'REPORTED', 'INFERRED', 'UNKNOWN');
CREATE TYPE date_precision   AS ENUM ('day', 'month', 'quarter', 'year', 'unknown');
CREATE TYPE geom_precision   AS ENUM ('SURVEYED', 'OFFICIAL_MAP', 'DIGITISED', 'APPROXIMATE');
CREATE TYPE tech_req_kind    AS ENUM ('documented', 'potential');
CREATE TYPE lifecycle_phase  AS ENUM ('PRE', 'CON', 'DONE', 'OTHER');

-- -----------------------------------------------------------------------------
-- 1. Reference data
-- -----------------------------------------------------------------------------
CREATE TABLE lifecycle_status (
    code            text PRIMARY KEY,                 -- e.g. 'UNDER_CONSTRUCTION'
    seq             smallint NOT NULL UNIQUE,         -- 1..28, taxonomy order
    label           text NOT NULL,
    phase           lifecycle_phase NOT NULL,
    pipeline_stage  text CHECK (pipeline_stage IN ('PROPOSED','DPR','APPROVED','TENDERED','AWARDED','CONSTRUCTION','COMPLETED','OPERATIONAL'))
);

CREATE TABLE sources (
    source_id           text PRIMARY KEY,             -- 'S000001'
    url                 text NOT NULL,
    url_normalised      text NOT NULL UNIQUE,         -- lower-cased, tracking params stripped
    title               text NOT NULL,
    publisher           text NOT NULL,
    source_type         text NOT NULL,                -- 'Government press release', 'Tender notice', 'Annual report', …
    tier                smallint NOT NULL CHECK (tier BETWEEN 1 AND 4),  -- 1 official · 2 company · 3 publication · 4 other
    pub_date            date,
    pub_date_precision  date_precision NOT NULL DEFAULT 'unknown',
    access_date         date NOT NULL,
    archive_url         text,                         -- web archive snapshot
    content_sha256      text,                         -- hash of captured document
    language            text DEFAULT 'en',
    notes               text
);

CREATE TABLE states (
    state_code  text PRIMARY KEY,                     -- ISO 3166-2:IN (e.g. 'IN-MH'); LGD code kept in lgd_code
    lgd_code    text UNIQUE,
    name        text NOT NULL UNIQUE,
    kind        text NOT NULL CHECK (kind IN ('State','Union Territory')),
    region      text,                                 -- North, South, East, West, Central, North-East
    geom        geometry(MultiPolygon, 4326)          -- Survey of India–compliant boundary
);

CREATE TABLE districts (
    district_code text PRIMARY KEY,                   -- LGD code
    state_code    text NOT NULL REFERENCES states,
    name          text NOT NULL,
    geom          geometry(MultiPolygon, 4326),
    UNIQUE (state_code, name)
);

-- -----------------------------------------------------------------------------
-- 2. Organisations
-- -----------------------------------------------------------------------------
CREATE TABLE authorities (
    authority_id        text PRIMARY KEY,             -- 'A-NHAI'
    short_name          text NOT NULL,
    legal_name          text NOT NULL,
    level               text NOT NULL,                -- Central / State / Municipal / SPV
    parent_authority_id text REFERENCES authorities,
    state_code          text REFERENCES states,
    website             text
);
CREATE TABLE authority_aliases (
    authority_id text NOT NULL REFERENCES authorities ON DELETE CASCADE,
    alias        text NOT NULL,
    alias_norm   text NOT NULL,
    PRIMARY KEY (authority_id, alias_norm)
);

CREATE TABLE companies (
    company_id        text PRIMARY KEY,               -- 'C-LT'
    canonical_name    text NOT NULL,
    legal_name        text,
    parent_company_id text REFERENCES companies,
    listed            boolean,                        -- NULL = not verified
    exchange_codes    text[],
    country           text,
    hq_city           text,
    website           text,
    cin               text UNIQUE,                    -- MCA corporate identity number where Indian
    kind              text,                           -- EPC, developer, consultant, OEM, financier …
    capabilities      text[],                         -- roads, bridges, tunnels, ITS …
    merged_into       text REFERENCES companies,      -- entity-resolution tombstone
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE company_aliases (
    company_id  text NOT NULL REFERENCES companies ON DELETE CASCADE,
    alias       text NOT NULL,                        -- exactly as seen in a source
    alias_norm  text NOT NULL,                        -- normalised key used for matching
    source_id   text REFERENCES sources,
    PRIMARY KEY (company_id, alias_norm)
);
CREATE INDEX company_alias_trgm ON company_aliases USING gin (alias_norm gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- 3. Corridors, projects, packages
-- -----------------------------------------------------------------------------
CREATE TABLE corridors (
    corridor_id  text PRIMARY KEY,                    -- 'CR-DELHI-MUMBAI'
    name         text NOT NULL UNIQUE,
    programme    text,                                -- Bharatmala, state programme …
    description  text
);

CREATE TABLE projects (
    project_id                 text PRIMARY KEY,      -- 'ITI-P-0001'
    canonical_name             text NOT NULL,
    project_type               text NOT NULL CHECK (project_type IN ('Expressway','National Highway','State Highway','Urban road','Ring road','Bypass','Bridge','Tunnel','Flyover / grade separator','Elevated corridor','Interchange','Corridor development','ITS / systems','Other')),
    category                   text,                  -- 'Sea bridge', 'Greenfield access-controlled expressway' …
    corridor_id                text REFERENCES corridors,
    highway_no                 text,
    programme                  text,
    origin                     text,
    destination                text,
    length_km                  numeric(9,3) CHECK (length_km >= 0),
    length_basis               text,                  -- how length was derived / which source
    lanes                      text,
    structure_type             text,
    terrain                    text,
    strategic_importance       text,
    nodal_ministry_id          text REFERENCES authorities,
    implementing_authority_id  text REFERENCES authorities,
    sponsoring_authority_id    text REFERENCES authorities,
    executing_agency_id        text REFERENCES authorities,
    concessioning_authority_id text REFERENCES authorities,
    government_level           text CHECK (government_level IN ('Central','State','Municipal','Joint','Unknown')),
    record_confidence          confidence_level NOT NULL DEFAULT 'UNKNOWN',
    last_verified              date,
    merged_into                text REFERENCES projects,   -- dedup tombstone; never hard-delete
    created_at                 timestamptz NOT NULL DEFAULT now(),
    updated_at                 timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX projects_name_trgm ON projects USING gin (canonical_name gin_trgm_ops);

CREATE TABLE project_aliases (
    project_id text NOT NULL REFERENCES projects ON DELETE CASCADE,
    alias      text NOT NULL,
    alias_norm text NOT NULL,
    source_id  text REFERENCES sources,
    PRIMARY KEY (project_id, alias_norm)
);
CREATE INDEX project_alias_trgm ON project_aliases USING gin (alias_norm gin_trgm_ops);

CREATE TABLE project_states (
    project_id        text NOT NULL REFERENCES projects ON DELETE CASCADE,
    state_code        text NOT NULL REFERENCES states,
    is_primary        boolean NOT NULL DEFAULT false,
    length_km_in_state numeric(9,3),                  -- only when a source gives the split
    source_id         text REFERENCES sources,
    PRIMARY KEY (project_id, state_code)
);
CREATE TABLE project_districts (
    project_id    text NOT NULL REFERENCES projects ON DELETE CASCADE,
    district_code text NOT NULL REFERENCES districts,
    source_id     text REFERENCES sources,
    PRIMARY KEY (project_id, district_code)
);
CREATE TABLE project_cities (
    project_id text NOT NULL REFERENCES projects ON DELETE CASCADE,
    city       text NOT NULL,
    role       text CHECK (role IN ('origin','destination','via','nearest_major_city')),
    PRIMARY KEY (project_id, city, role)
);

CREATE TABLE packages (
    package_id           bigserial PRIMARY KEY,
    project_id           text NOT NULL REFERENCES projects ON DELETE CASCADE,
    package_no           text NOT NULL,               -- as published: 'Pkg 1', 'PRR-W1'
    name                 text,
    start_location       text,
    end_location         text,
    length_km            numeric(9,3),
    scheduled_completion date,
    actual_completion    date,
    progress_pct         numeric(5,2) CHECK (progress_pct BETWEEN 0 AND 100),
    progress_asof        date,
    record_confidence    confidence_level NOT NULL DEFAULT 'UNKNOWN',
    source_id            text REFERENCES sources,
    UNIQUE (project_id, package_no)
);

-- -----------------------------------------------------------------------------
-- 4. Procurement: tenders → bids → contracts → parties
-- -----------------------------------------------------------------------------
CREATE TABLE tender_records (
    tender_id              bigserial PRIMARY KEY,
    project_id             text NOT NULL REFERENCES projects,
    package_id             bigint REFERENCES packages,
    authority_id           text REFERENCES authorities,
    portal                 text,                       -- CPPP / eProcure / state portal / GeM
    portal_tender_ref      text,                       -- published tender ID
    title                  text NOT NULL,
    notice_date            date,
    bid_due_date           date,
    estimated_value_cr     numeric(14,2),
    tender_type            text,                       -- open / limited / two-stage
    procurement_model      text CHECK (procurement_model IN ('EPC','HAM','BOT-Toll','BOT-Annuity','DBFOT','TOT','InvIT','Item-rate','Consultancy','Supply','O&M','Other')),
    min_turnover_cr        numeric(14,2),
    similar_work_criteria  text,
    qualification_other    jsonb,                      -- equipment, experience, net-worth …
    tender_status          text CHECK (tender_status IN ('expected','issued','bid_evaluation','awarded','cancelled','re_tendered')),
    source_id              text NOT NULL REFERENCES sources,
    UNIQUE (portal, portal_tender_ref)
);

CREATE TABLE tender_bids (
    tender_id           bigint NOT NULL REFERENCES tender_records ON DELETE CASCADE,
    bidder_label        text NOT NULL,                 -- as published (may be a JV)
    lead_company_id     text REFERENCES companies,
    bid_value_cr        numeric(14,2),
    rank                smallint,                      -- L1, L2 …
    technically_qualified boolean,
    source_id           text NOT NULL REFERENCES sources,
    PRIMARY KEY (tender_id, bidder_label)
);

CREATE TABLE contracts (
    contract_id            bigserial PRIMARY KEY,
    package_id             bigint NOT NULL REFERENCES packages,
    tender_id              bigint REFERENCES tender_records,
    contract_type          text NOT NULL CHECK (contract_type IN ('EPC','HAM','BOT-Toll','BOT-Annuity','DBFOT','TOT','O&M','Consultancy','Supply','Subcontract','Other','Unknown')),
    jv_name                text,                        -- registered JV / SPV name if any
    award_date             date,                        -- as reported when LOA/agreement not distinguished
    award_date_precision   date_precision NOT NULL DEFAULT 'unknown',
    loa_date               date,
    agreement_date         date,
    appointed_date         date,
    award_value_cr         numeric(14,2),
    duration_months        smallint,
    concession_years       numeric(5,2),
    contract_status        text CHECK (contract_status IN ('active','completed','terminated','foreclosed','disputed')),
    record_confidence      confidence_level NOT NULL,
    source_id              text NOT NULL REFERENCES sources
);

-- R4: one row per JV / consortium member (or sole contractor).
CREATE TABLE contract_parties (
    contract_id             bigint NOT NULL REFERENCES contracts ON DELETE CASCADE,
    company_id              text NOT NULL REFERENCES companies,
    role                    text NOT NULL CHECK (role IN ('Sole contractor','JV lead','JV member','Consortium member','Concessionaire','Subcontractor','Specialist contractor')),
    share_pct               numeric(5,2) CHECK (share_pct BETWEEN 0 AND 100),
    scope                   text,
    original_name_in_source text NOT NULL,             -- R6
    record_confidence       confidence_level NOT NULL,
    source_id               text NOT NULL REFERENCES sources,
    PRIMARY KEY (contract_id, company_id, role)
);

-- Non-contract relationships: consultants, AE/IE/PMC, designers, technology providers, financiers, O&M.
CREATE TABLE project_participants (
    participant_id          bigserial PRIMARY KEY,
    project_id              text NOT NULL REFERENCES projects,
    package_id              bigint REFERENCES packages,
    company_id              text NOT NULL REFERENCES companies,
    role_group              text NOT NULL CHECK (role_group IN ('Construction','Engineering','Project management','Specialist vendor','Technology','Financing','Operations & maintenance')),
    role                    text NOT NULL,             -- 'Authority Engineer', 'DPR consultant', 'ATMS provider' …
    period_from             date,
    period_to               date,
    original_name_in_source text NOT NULL,
    record_confidence       confidence_level NOT NULL CHECK (record_confidence <> 'INFERRED'),  -- inferred suppliers never become participants
    source_id               text NOT NULL REFERENCES sources
);

-- -----------------------------------------------------------------------------
-- 5. Money
-- -----------------------------------------------------------------------------
CREATE TABLE project_values (
    value_id          bigserial PRIMARY KEY,
    project_id        text NOT NULL REFERENCES projects,
    package_id        bigint REFERENCES packages,
    value_cr          numeric(14,2) NOT NULL,
    value_type        text NOT NULL CHECK (value_type IN ('estimated','approved','sanctioned','revised','tender_estimate','award','epc','ham','bot','dbfot','om','land_acquisition','expenditure_to_date','budget_allocation','headline','reported_cost','cost_variation','computed_sum','other')),
    value_type_detail text,                            -- as described in source
    includes_land     boolean,
    includes_gst      boolean,
    as_of_date        date,
    as_of_precision   date_precision NOT NULL DEFAULT 'unknown',
    is_reference      boolean NOT NULL DEFAULT false,  -- analyst-chosen display value, with reason
    reference_reason  text,
    discrepancy_note  text,
    record_confidence confidence_level NOT NULL,
    source_id         text NOT NULL REFERENCES sources,
    CHECK (NOT is_reference OR reference_reason IS NOT NULL)
);
CREATE UNIQUE INDEX one_reference_value_per_project ON project_values (project_id) WHERE is_reference AND package_id IS NULL;

CREATE TABLE funding (
    funding_id        bigserial PRIMARY KEY,
    project_id        text NOT NULL REFERENCES projects,
    funder_type       text NOT NULL CHECK (funder_type IN ('Central government','State government','Multilateral','Bilateral','Private equity','Bank debt','Bonds','InvIT','Other')),
    funder_company_id text REFERENCES companies,
    funder_name       text NOT NULL,
    instrument        text,
    amount_cr         numeric(14,2),
    as_of_date        date,
    source_id         text NOT NULL REFERENCES sources
);

-- -----------------------------------------------------------------------------
-- 6. History, progress, risk (R2 append-only)
-- -----------------------------------------------------------------------------
CREATE TABLE project_events (
    event_id        bigserial PRIMARY KEY,
    project_id      text NOT NULL REFERENCES projects,
    package_id      bigint REFERENCES packages,
    event_date      date,                              -- NULL allowed when undated (kept, not plotted)
    date_precision  date_precision NOT NULL,
    event_type      text NOT NULL CHECK (event_type IN ('status_change','concept','dpr','approval','clearance','tender','award','financial_closure','construction_start','milestone','opening','completion','cost_revision','delay','cancellation','re_tender','dispute','other')),
    status_code     text REFERENCES lifecycle_status,  -- status asserted by this event, if any
    description     text NOT NULL,
    record_confidence confidence_level NOT NULL,
    source_id       text NOT NULL REFERENCES sources,
    recorded_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX project_events_by_project ON project_events (project_id, event_date DESC NULLS LAST);

CREATE FUNCTION forbid_event_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'project_events is append-only; insert a correcting event instead';
END $$;
CREATE TRIGGER project_events_append_only BEFORE UPDATE OR DELETE ON project_events
  FOR EACH ROW EXECUTE FUNCTION forbid_event_mutation();

CREATE TABLE project_updates (
    update_id        bigserial PRIMARY KEY,
    project_id       text NOT NULL REFERENCES projects,
    package_id       bigint REFERENCES packages,
    as_of_date       date NOT NULL,
    as_of_precision  date_precision NOT NULL,
    physical_pct     numeric(5,2) CHECK (physical_pct BETWEEN 0 AND 100),
    financial_pct    numeric(5,2) CHECK (financial_pct BETWEEN 0 AND 100),
    km_operational   numeric(9,3),
    note             text,
    source_id        text NOT NULL REFERENCES sources
);

CREATE TABLE delay_risks (
    risk_id              bigserial PRIMARY KEY,
    project_id           text NOT NULL REFERENCES projects,
    package_id           bigint REFERENCES packages,
    category             text NOT NULL CHECK (category IN ('Land acquisition','Utility shifting','Environmental clearance','Forest clearance','Litigation','Contractor financial stress','Contractor performance','Funding issues','Design changes','Geological conditions','Weather','Force majeure','Authority-related issues','Local opposition','Other')),
    description          text NOT NULL,                -- documented cause only, never speculation
    original_completion  date,
    revised_completion   date,
    delay_months         numeric(6,1),
    documented_on        date,
    source_id            text NOT NULL REFERENCES sources
);

-- -----------------------------------------------------------------------------
-- 7. Geography (R5)
-- -----------------------------------------------------------------------------
CREATE TABLE project_locations (
    location_id  bigserial PRIMARY KEY,
    project_id   text NOT NULL REFERENCES projects,
    package_id   bigint REFERENCES packages,
    role         text NOT NULL CHECK (role IN ('centroid','start','end','alignment','schematic','portal','structure','toll_plaza','influence_area','construction_zone')),
    geom         geometry(Geometry, 4326) NOT NULL,
    precision    geom_precision NOT NULL,
    basis        text NOT NULL,                        -- how it was derived
    is_planned   boolean NOT NULL DEFAULT false,
    source_id    text REFERENCES sources,
    CHECK (precision = 'APPROXIMATE' OR source_id IS NOT NULL)
);
CREATE INDEX project_locations_gix ON project_locations USING gist (geom);

-- -----------------------------------------------------------------------------
-- 8. Commercial intelligence layer
-- -----------------------------------------------------------------------------
CREATE TABLE technology_requirements (
    req_id      bigserial PRIMARY KEY,
    project_id  text NOT NULL REFERENCES projects,
    domain      text NOT NULL,                         -- 'Tunnel management', 'ATMS', 'Tolling', 'Data centre' …
    kind        tech_req_kind NOT NULL,
    basis       text NOT NULL,                         -- document clause, or characteristic used for inference
    source_id   text REFERENCES sources,
    CHECK (kind = 'potential' OR source_id IS NOT NULL)
);

CREATE TABLE opportunity_signals (
    signal_id            bigserial PRIMARY KEY,
    project_id           text NOT NULL REFERENCES projects,
    package_id           bigint REFERENCES packages,
    category             text NOT NULL CHECK (category IN ('TENDER_EXPECTED','TENDER_ISSUED','RECENTLY_AWARDED','CONSTRUCTION','UPCOMING_PHASE','RE_TENDER')),
    signal_type          text NOT NULL CHECK (signal_type IN ('DPR completion','Cabinet approval','Budget allocation','Tender notice','Annual plan','Authority announcement','Land acquisition progress','Award','Construction milestone','Tender cancellation','Other')),
    signal_date          date,
    expected_stage       text,
    expected_timing_text text,                         -- only when a source states timing
    description          text NOT NULL,
    source_id            text NOT NULL REFERENCES sources,
    last_verified        date NOT NULL
);

CREATE TABLE stakeholders (
    stakeholder_id  bigserial PRIMARY KEY,
    full_name       text NOT NULL,
    designation     text NOT NULL,                     -- 'Project Director', 'CGM (Tech)', 'CIO' …
    authority_id    text REFERENCES authorities,
    company_id      text REFERENCES companies,
    project_id      text REFERENCES projects,
    public_profile_url text,                           -- professional, public only; no personal contact data
    valid_from      date,
    valid_to        date,
    source_id       text NOT NULL REFERENCES sources,
    CHECK (authority_id IS NOT NULL OR company_id IS NOT NULL)
);

-- -----------------------------------------------------------------------------
-- 9. Evidence ledger, conflicts, ingestion
-- -----------------------------------------------------------------------------
CREATE TABLE claims (                                 -- field-level provenance for any attribute
    claim_id        bigserial PRIMARY KEY,
    entity_table    text NOT NULL,
    entity_id       text NOT NULL,
    field_name      text NOT NULL,
    value_text      text NOT NULL,
    excerpt         text,                              -- supporting passage from the source
    source_id       text NOT NULL REFERENCES sources,
    confidence      confidence_level NOT NULL,
    extracted_by    text NOT NULL,                     -- 'agent:research-v1' | 'analyst:<id>'
    extracted_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX claims_entity ON claims (entity_table, entity_id, field_name);

CREATE TABLE data_conflicts (
    conflict_id     bigserial PRIMARY KEY,
    entity_table    text NOT NULL,
    entity_id       text NOT NULL,
    field_name      text NOT NULL,
    claim_ids       bigint[] NOT NULL,
    status          text NOT NULL DEFAULT 'open' CHECK (status IN ('open','explained','resolved')),
    explanation     text,                              -- e.g. 'initial vs revised estimate'
    opened_at       timestamptz NOT NULL DEFAULT now(),
    resolved_at     timestamptz
);

CREATE TABLE raw_documents (
    doc_id          bigserial PRIMARY KEY,
    source_id       text NOT NULL REFERENCES sources,
    storage_uri     text NOT NULL,                     -- object-store path of captured HTML/PDF
    mime_type       text NOT NULL,
    sha256          text NOT NULL UNIQUE,
    fetched_at      timestamptz NOT NULL,
    text_uri        text                               -- extracted text
);

CREATE TABLE ingestion_runs (
    run_id          bigserial PRIMARY KEY,
    pipeline_stage  text NOT NULL,                     -- discovery, extraction, resolution …
    started_at      timestamptz NOT NULL DEFAULT now(),
    finished_at     timestamptz,
    stats           jsonb,
    status          text NOT NULL DEFAULT 'running' CHECK (status IN ('running','succeeded','failed'))
);

-- -----------------------------------------------------------------------------
-- 10. Read models used by the dashboard
-- -----------------------------------------------------------------------------
-- Current status = latest dated status-bearing event (undated events never win).
CREATE VIEW v_project_current_status AS
SELECT DISTINCT ON (e.project_id)
       e.project_id, e.status_code, e.event_date AS status_asof, e.date_precision, e.source_id
FROM project_events e
WHERE e.status_code IS NOT NULL AND e.package_id IS NULL AND e.event_date IS NOT NULL
ORDER BY e.project_id, e.event_date DESC, e.event_id DESC;

CREATE VIEW v_contractor_metrics AS
SELECT cp.company_id,
       count(DISTINCT pk.project_id)                               AS projects,
       count(DISTINCT pk.package_id)                               AS packages,
       sum(c.award_value_cr)                                       AS attributed_award_value_cr,   -- JV value counted in full per member
       sum(c.award_value_cr * cp.share_pct / 100)                  AS share_weighted_value_cr,      -- only where share disclosed
       sum(pk.length_km)                                           AS package_km,
       count(*) FILTER (WHERE c.contract_status = 'active')        AS active_contracts,
       count(*) FILTER (WHERE c.contract_status = 'completed')     AS completed_contracts,
       array_agg(DISTINCT p.implementing_authority_id)             AS authorities
FROM contract_parties cp
JOIN contracts c  ON c.contract_id = cp.contract_id
JOIN packages pk  ON pk.package_id = c.package_id
JOIN projects p   ON p.project_id = pk.project_id
GROUP BY cp.company_id;
