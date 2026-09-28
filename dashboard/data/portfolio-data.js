/*
 * ITIS — CONTRACTOR PORTFOLIO INGEST (v0.2) — researched 2026-09-28
 *
 * For every company in the sample, a search of its India road / bridge /
 * tunnel / expressway track record was run and each project found was
 * ingested with its own source. Loaded after sample-data.js; it appends
 * sources, companies, authorities and projects, and adds packages to
 * corridors already in the sample.
 *
 * Same rules as sample-data.js: nothing is filled from memory — a field
 * without a captured source is null. Status is only as current as its
 * as-of date; old statuses are left old (they surface as stale).
 * Rail and metro work is out of scope and was excluded.
 */
(function () {
  const D = window.ITIS_DATA;
  const A = "2026-09-28";

  // ------------------------------------------------------------- SOURCES
  const S = (id, tier, type, publisher, title, url, pub_date) => ({ id, tier, type, publisher, title, url, pub_date: pub_date || null, access_date: A });
  D.sources.push(
    S("S050", 3, "Credit rating rationale", "ICRA", "L&T Infrastructure Development Projects Ltd — rating rationale", "https://www.icra.in/Rating/ShowRationalReportFilePdf/35482", "2017-01-11"),
    S("S051", 2, "Company website", "L&T IDPL", "Vadodara–Bharuch (Gujarat) — operational projects", "https://www.lntidpl.com/businesses/roads/gallery/operational-projects/vadodara-bharuch-gujarat/"),
    S("S052", 2, "Company website", "L&T IDPL", "Rajkot–Jamnagar–Vadinar (Gujarat) — operational projects", "https://www.lntidpl.com/businesses/roads/gallery/operational-projects/rajkot-jamnagar-vadinar-gujarat/"),
    S("S053", 2, "Company website", "L&T IDPL", "Coimbatore By-pass (Tamil Nadu) — operational projects", "https://www.lntidpl.com/businesses/roads/gallery/operational-projects/coimbatore-by-pass-tamil-nadu/"),
    S("S054", 2, "Company website", "L&T IDPL", "Chennai–Tada (Tamil Nadu) — operational projects", "https://www.lntidpl.com/businesses/roads/gallery/operational-projects/chennai-tada-tamil-nadu/"),
    S("S055", 3, "News", "Business Standard", "NHAI awards Rs 1,047 cr Dwarka EWay package to L&T under Bharatmala", "https://www.business-standard.com/article/companies/nhai-awards-rs-1-047-cr-dwarka-eway-package-to-l-t-under-bharatnmala-118031300932_1.html", "2018-03-13"),
    S("S056", 3, "Trade publication", "NBM&CW", "L&T Construction secures road & rail projects (Delhi–Vadodara Expressway packages 11 & 22)", "https://www.nbmcw.com/news/roads-highways/l-t-construction-secures-road-rail-projects.html"),
    S("S057", 3, "News", "Business Standard", "L&T gains after winning orders (MSRDC Samruddhi package 10, ₹2,095 cr)", "https://www.business-standard.com/article/news-cm/l-t-gains-after-winning-orders-118090300165_1.html", "2018-09-03"),
    S("S058", 4, "Encyclopedia", "Wikipedia", "Atal Setu, Goa", "https://en.wikipedia.org/wiki/Atal_Setu,_Goa"),
    S("S059", 3, "News", "Business Standard", "Cable-stayed 'Atal Setu' inaugurated on Mandovi river in Goa", "https://www.business-standard.com/article/pti-stories/cable-stayed-atal-setu-inaugurated-on-mandovi-river-in-goa-119012700643_1.html", "2019-01-27"),
    S("S060", 2, "Company website", "Larsen & Toubro", "Atal Setu | Larsen & Toubro", "https://www.larsentoubro.com/atal-setu"),
    S("S061", 4, "Encyclopedia", "Wikipedia", "Nivedita Setu", "https://en.wikipedia.org/wiki/Nivedita_Setu"),
    S("S062", 4, "Encyclopedia", "Wikipedia", "Second Ishwar Gupta Setu", "https://en.wikipedia.org/wiki/Second_Ishwar_Gupta_Setu"),
    S("S063", 4, "Encyclopedia", "Wikipedia", "Bandra–Worli Sea Link", "https://en.wikipedia.org/wiki/Bandra%E2%80%93Worli_Sea_Link"),
    S("S064", 1, "Authority website", "MSRDC", "Bandra Worli Sea Link — project details", "https://msrdc.in/Site/Common/ProjectListDetails.aspx?ID=66&MainId=18"),
    S("S065", 3, "News", "Domain-b", "Bandra-Worli Sea Link: cost rose 6-fold to Rs 1,600 crore", "https://www.domain-b.com/economy/infrastructure/roads/bandra-worli-sea-link-cost-rose-6-fold-to-rs1-600-crore"),
    S("S066", 2, "Company website", "HCC", "Highways, roads & bridges — HCC", "https://www.hccindia.com/markets/highways-roads-bridges"),
    S("S067", 4, "Encyclopedia", "Wikipedia", "Hindustan Construction Company", "https://en.wikipedia.org/wiki/Hindustan_Construction_Company"),
    S("S068", 2, "Company website", "IRB Infrastructure Developers", "Mumbai–Pune Expressway & Old Mumbai–Pune (NH-48) Projects (TOT)", "https://www.irb.co.in/home/tot-project/mumbai-pune-expressway-old-mumbai-pune-nh-48-projects-2/"),
    S("S069", 2, "Company website", "IRB Infrastructure Developers", "IRB Milestones", "https://www.irb.co.in/home/milestones/"),
    S("S070", 2, "Company press release", "IRB Infrastructure Developers", "IRB Infra's Pathankot–Amritsar highway project set to be transferred to IRB InvIT", "https://www.irb.co.in/home/2017/09/29/irb-infras-pathankot-amritsar-highway-project-set-to-be-transferred-to-irb-invit-fund-by-end-of-the-month/", "2017-09-29"),
    S("S071", 2, "Company website", "IRB Infrastructure Developers", "Ahmedabad – Vadodara NH 8 (ongoing concessions)", "https://www.irb.co.in/home/ongoing-concessions/ahmedabad-vadodara-national-highway-8/"),
    S("S072", 3, "News", "Business Standard", "Adani Enterprises bags Rs 1,169 cr highway project from NHAI in Odisha", "https://www.business-standard.com/article/companies/adani-enterprises-bags-rs-1-169-cr-highway-project-from-nhai-in-odisha-121040201050_1.html", "2021-04-02"),
    S("S073", 3, "News", "Business Standard", "Adani Transport bags two NHAI road projects in Telangana", "https://www.business-standard.com/article/news-cm/adani-transport-bags-two-nhai-road-projects-in-telangana-119031200272_1.html", "2019-03-12"),
    S("S074", 2, "Company press release", "Adani Enterprises", "Adani Enterprises bags India's largest expressway project", "https://www.adanienterprises.com/newsroom/media-releases/adani-enterprises-bags-indias-largest-expressway-project"),
    S("S075", 2, "Company website", "Adani Enterprises", "Road, Metro and Rail Infra — Adani Enterprises", "https://www.adanienterprises.com/businesses/road-metro-and-rail"),
    S("S076", 3, "News", "Business Today", "All about Navayuga Engineering Company, makers of the Silkyara tunnel", "https://www.businesstoday.in/latest/corporate/story/all-about-navayuga-engineering-company-makers-of-the-silkyara-tunnel-where-41-workers-were-stuck-407911-2023-12-01", "2023-12-01"),
    S("S077", 4, "Encyclopedia", "Wikipedia", "Dhola–Sadiya Bridge", "https://en.wikipedia.org/wiki/Dhola%E2%80%93Sadiya_Bridge"),
    S("S078", 4, "Encyclopedia", "Wikipedia", "Banihal Qazigund Road Tunnel", "https://en.wikipedia.org/wiki/Banihal_Qazigund_Road_Tunnel"),
    S("S079", 3, "News", "Swarajya", "NIIF invests Rs 3,036 crore in Navayuga Quazigund-Banihal Expressway tunnel road", "https://swarajyamag.com/infrastructure/niif-invests-rs-3036-crore-in-navayuga-quazigund-banihal-expressway-tunnel-road-in-jammu-and-kashmir"),
    S("S080", 3, "Trade publication", "Indian Infrastructure", "Himalayan landmark: Asia's longest road tunnel inaugurated in Jammu & Kashmir", "https://indianinfrastructure.com/2017/04/01/himalayan-landmark/", "2017-04-01"),
    S("S081", 3, "News", "ThePrint", "Chenani-Nashri — a tunnel at the end of a struggle", "https://theprint.in/theprint-primer/chenani-nashri-a-tunnel-at-the-end-of-a-struggle/91/"),
    S("S082", 3, "News", "Business Standard", "Tata Projects wins Rs 2,100 cr Chennai Peripheral Ring Road project phase-1", "https://www.business-standard.com/article/companies/tata-projects-wins-rs-2-100-cr-chennai-peripheral-ring-road-project-phase-1-121092700779_1.html", "2021-09-27"),
    S("S083", 3, "News", "The Korea Times", "Daewoo E&C completes construction project of India's major sea bridge in Mumbai", "https://www.koreatimes.co.kr/business/companies/20240123/daewoo-ec-completes-construction-project-of-indias-major-sea-bridge-in-mumbai", "2024-01-23"),
    S("S084", 4, "Encyclopedia", "Wikipedia", "Kacchi Dargah–Bidupur Bridge", "https://en.wikipedia.org/wiki/Kacchi_Dargah%E2%80%93Bidupur_Bridge"),
    S("S085", 3, "News", "Swarajya", "Bihar: Nitish Kumar inaugurates 6-lane Kacchi Dargah-Bidupur Ganga bridge, connecting Patna to Raghopur", "https://swarajyamag.com/news-brief/bihar-nitish-kumar-inaugurates-6-lane-kacchi-dargah-bidupur-ganga-bridge-connecting-patna-to-raghopur"),
    S("S086", 3, "News", "The Korea Herald", "Bridging hope: Daewoo E&C wins large-scale bridge projects in India, Africa", "https://www.koreaherald.com/article/3390042", "2024-05-10"),
    S("S087", 3, "Trade publication", "Tunnels & Tunnelling", "Strabag JV wins Rohtang job", "https://www.tunnelsandtunnelling.com/news/strabag-jv-wins-rohtang-job/"),
    S("S088", 2, "Company website", "STRABAG", "Rohtang (Atal) Highway Tunnel", "https://international.strabag.com/en/projects/rohtang-atal-highway-tunnel"),
    S("S089", 2, "Company website", "Afcons Infrastructure", "Surface Transport — Afcons", "https://www.afcons.com/en/bu/surface-transport"),
    S("S090", 3, "News", "Business Standard", "UP selects developers for Agra-Lucknow expressway project", "https://www.business-standard.com/article/economy-policy/up-selects-developers-for-agra-lucknow-expressway-project-114081300597_1.html", "2014-08-13"),
    S("S091", 4, "Encyclopedia", "Wikipedia", "Agra–Lucknow Expressway", "https://en.wikipedia.org/wiki/Agra%E2%80%93Lucknow_Expressway"),
    S("S092", 3, "News", "Free Press Journal", "13 lowest bidders named for Samruddhi Mahamarg E-way", "https://www.freepressjournal.in/business/13-lowest-bidders-named-for-samruddhi-mahamarg-e-way"),
    S("S093", 3, "Trade publication", "InfraStory", "Contracts awarded for India's longest expressway — the 701 km Mumbai Nagpur Samruddhi Mahamarg", "https://infrastory.com/2018/09/04/contracts-awarded-for-indias-longest-expressway-the-701km-mumbai-nagpur-samruddhi-mahamarg/", "2018-09-04"),
    S("S094", 3, "Trade publication", "NBM&CW", "UP awards 8 phases of ₹23,000-cr Purvanchal e-way", "https://www.nbmcw.com/news/up-awards-8-phases-of-23-000-cr-purvanchal-e-way.html"),
    S("S095", 1, "Government press release", "PIB", "PM inaugurates Purvanchal Expressway", "https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=1772308&reg=48&lang=2", "2021-11-16"),
    S("S096", 3, "News", "Swarajya", "Apco, Ashoka Buildcon, Gawar Construction, Dilip Buildcon to execute UP's 296-km Bundelkhand Expressway", "https://swarajyamag.com/insta/apco-ashoka-buildcon-gawar-constructiondilip-buildcon-to-execute-ups-ambitious-296-km-bundelkhand-expressway"),
    S("S097", 3, "News", "The Hawk", "UP Cabinet gives its nod for construction companies for 2 expressways", "https://www.thehawk.in/news/states-and-uts/up-cabinet-gives-its-nod-for-construction-companies-for-2-expressways", "2019-11"),
    S("S098", 3, "News", "Swarajya", "PM Modi to inaugurate Bundelkhand Expressway on 16 July", "https://swarajyamag.com/infrastructure/pm-modi-to-inaugurate-bundelkhand-expressway-on-16-july-uttar-pradeshs-expressway-network-to-cross-1200-km-mark", "2022-07"),
    S("S099", 4, "Encyclopedia", "Wikipedia", "Awadh Expressway", "https://en.wikipedia.org/wiki/Awadh_Expressway"),
    S("S100", 4, "Specialist portal", "The Metro Rail Guy", "APCO wins Delhi–Katra Expressway's Package 17 in J&K", "https://themetrorailguy.com/2022/08/02/apco-wins-delhi-katra-expressways-package-17-in-jk/", "2022-08-02"),
    S("S101", 4, "Specialist portal", "The Metro Rail Guy", "APCO wins Jewar Airport's link with Delhi–Mumbai Expressway", "https://themetrorailguy.com/2022/08/01/apco-wins-jewar-airports-link-with-delhi-mumbai-expressway/", "2022-08-01"),
    S("S102", 1, "Authority website", "UPEIDA", "Gorakhpur Link Expressway", "https://upeida.up.gov.in/en/page/gorakhpur-link-expressway"),
    S("S103", 3, "News", "Swarajya", "Rs 7,283 crore Gorakhpur Link Expressway inaugurated by CM Yogi", "https://swarajyamag.com/news-brief/rs-7283-crore-gorakhpur-link-expressway-inaugurated-by-cm-yogi-to-connect-four-up-districts", "2025-06"),
    S("S104", 3, "News", "Business Standard", "G R Infraprojects secures LoA for 5 NHAI road projects", "https://www.business-standard.com/article/news-cm/g-r-infraprojects-secures-loa-for-5-nhai-road-projects-122033000861_1.html", "2022-03-30"),
    S("S105", 3, "News", "Business Standard", "G R Infraprojects wins Rs 1,454-cr NHAI contract for highway upgrade in Gujarat", "https://www.business-standard.com/amp/markets/capital-market-news/g-r-infraprojects-wins-rs-1-454-cr-nhai-contract-for-highway-upgrade-in-gujarat-126033100156_1.html", "2026-03-31"),
    S("S106", 4, "Specialist portal", "Megaproject", "Agra-Gwalior to Guwahati Ring Road: 12 upcoming highway projects", "https://megaproject.com/news/roadandbridge/agra-gwalior-to-guwahati-ring-road-12-upcoming-highway-projects-that-could-reshape-travel"),
    S("S107", 3, "News", "DeshGujarat", "Delhi-Mumbai Expressway: RSIIL among nine bidders for Vadodara–Virar Package 8 despite earlier contract termination", "https://deshgujarat.com/2026/05/06/delhi-mumbai-expressway-rsiil-among-nine-bidders-for-vadodara-virar-package-8-despite-earlier-contract-termination/", "2026-05-06"),
    S("S108", 3, "News", "DeshGujarat", "Delhi-Mumbai Expressway: NHAI invites fresh bids for pending work on Package 9 of Vadodara–Virar section", "https://deshgujarat.com/2026/05/28/delhi-mumbai-expressway-nhai-invites-fresh-bids-for-pending-work-on-package-9-of-vadodara-virar-section/", "2026-05-28"),
    S("S109", 3, "News", "Business Today", "Delhi Mumbai Expressway completion pushed to 2027-28 as delays hit Gujarat stretches", "https://www.businesstoday.in/india/story/delhi-mumbai-expressway-completion-pushed-to-2027-28-as-delays-hit-gujarat-stretches-507463-2025-12-19", "2025-12-19"),
    S("S110", 3, "News", "Business Standard", "J Kumar Infra rises on securing LoA for road project in Thane", "https://www.business-standard.com/markets/capital-market-news/j-kumar-infra-rises-on-securing-loa-for-road-project-in-thane-124100300369_1.html", "2024-10-03"),
    S("S111", 2, "Company brochure", "J. Kumar Infraprojects", "J. Kumar Infraprojects Ltd — company brochure", "https://www.jkumar.com/brochure.pdf"),
    S("S112", 2, "Company website", "Patel Engineering", "Patel Engineering — Infrastructure", "https://pateleng.com/infrastructure.php"),
    S("S113", 2, "Company press release", "Astaldi (Webuild)", "Astaldi to carry out the Versova–Bandra Sea Link project in Mumbai — contract value EUR 780 million", "https://www.astaldi.com/en/press-releases/astaldi-carry-out-versova-bandra-sea-link-project-mumbai-total-contract-value"),
    S("S114", 3, "News", "Business Standard", "Versova-Bandra Sealink project cost up by whopping 60% to Rs 11,333 cr", "https://www.business-standard.com/article/economy-policy/versova-bandra-sealink-project-cost-up-by-whopping-60-to-rs-11-333-cr-123031601072_1.html", "2023-03-16"),
    S("S115", 3, "Trade publication", "Construction World", "APCO to merge with Webuild in constructing Versova Bandra Sea Link", "https://www.constructionworld.in/transport-infrastructure/highways-and-roads-infrastructure/apco-to-merge-with-webuild-in-constructing-versova-bandra-sea-link/32159"),
    S("S116", 3, "News", "ThePrint", "Bandra-Versova sea link crawls to sight; bridging reality-deadlines gap still a challenge", "https://theprint.in/india/bandra-versova-sea-link-crawls-to-sight-bridging-reality-deadlines-gap-still-a-challenge/2857255/", "2026"),
    S("S117", 2, "Company website", "MEIL", "Transportation | MEIL", "https://meil.in/transportation"),
    S("S118", 3, "News", "Swarajya", "Megha Engineering wins Rs 14,400 crore tender for Thane-Borivali twin tunnel project", "https://swarajyamag.com/infrastructure/hyderabad-based-megha-engineering-wins-rs-14400-cr-tender-for-thane-borivali-twin-tunnel-project"),
    S("S119", 4, "Encyclopedia", "Wikipedia", "Purvanchal Expressway", "https://en.wikipedia.org/wiki/Purvanchal_Expressway"),
    S("S120", 4, "Encyclopedia", "Wikipedia", "Bundelkhand Expressway", "https://en.wikipedia.org/wiki/Bundelkhand_Expressway"),
    S("S121", 4, "Encyclopedia", "Wikipedia", "Gorakhpur Link Expressway", "https://en.wikipedia.org/wiki/Gorakhpur_Link_Expressway"),
    S("S122", 1, "Authority website", "NHIDCL", "Silkyara Bend–Barkot Tunnel", "https://www.nhidcl.com/en/uttarakhand/Project/silkyara-bend-barkot-tunnel"),
    S("S123", 3, "News", "The Week (PTI)", "Silkyara tunnel achieves breakthrough", "https://www.theweek.in/wire-updates/national/2025/04/16/des25-ukd-silkyara-breakthrough.html", "2025-04-16"),
    S("S124", 3, "News", "ThePrint", "In Silkyara breakthrough, some closure", "https://theprint.in/india/this-tunnel-took-something-from-me-i-came-back-to-take-it-back-in-silkyara-breakthrough-some-closure/2593583/", "2025-04"),
    S("S125", 3, "News", "The Quint", "India's longest expressway connecting Agra-Lucknow open for public", "https://www.thequint.com/news/politics/akhilesh-yadav-india-longest-expressway-agra-lucknow-open-mulayam-singh-yadav-uttar-pradesh-jets-iaf-mirage-delhi", "2016-11"),
    S("S126", 3, "News", "Business Standard", "Adani Enterprises gains 2% on winning Ganga Expressway project", "https://www.business-standard.com/article/markets/adani-enterprises-gains-2-on-winning-ganga-expressway-project-121122100224_1.html", "2021-12-21"),
    S("S127", 1, "Authority website", "UPEIDA", "The Purvanchal Expressway", "https://upeida.up.gov.in/en/page/the-purvanchal-expressway"),
    S("S128", 1, "Authority website", "UPEIDA", "Agra-Lucknow Expressway", "https://upeida.up.gov.in/en/article/agra-lucknow-expressway"),
    S("S129", 1, "Authority website", "UPEIDA", "Bundelkhand Expressway", "https://upeida.up.gov.in/hi/page/bundelkhand-expressway"),
  );

  // ----------------------------------------------------------- AUTHORITIES
  D.authorities.push(
    { id: "A-BSRDC", short: "BSRDC", name: "Bihar State Road Development Corporation Ltd", level: "State (Bihar)", parent: null, website: null },
  );

  // ------------------------------------------------------------- COMPANIES
  const C = (id, name, aliases, o = {}) => Object.assign({ id, name, aliases, parent: null, listed: null, country: "India", hq: null, website: null, kind: "EPC contractor" }, o);
  D.companies.push(
    C("C-LTIDPL", "L&T Infrastructure Development Projects Ltd", ["L&T IDPL", "IDPL"], { parent: "Larsen & Toubro (C-LT)", listed: false, hq: "Chennai", website: "https://www.lntidpl.com", kind: "Road concessionaire (BOT)" }),
    C("C-ARTL", "Adani Road Transport Ltd", ["ARTL", "Adani Transport Ltd", "Adani Transport"], { parent: "Adani Enterprises (C-ADANI)", listed: false, kind: "Road developer (HAM/BOT/TOT)" }),
    C("C-DSI", "DSI-Bridgecon", ["DSI Bridgecon"], { country: null, kind: "Specialist (stay-cable / post-tensioning)" }),
    C("C-NCC", "NCC Ltd", ["Nagarjuna Construction Company", "NCC", "Nagarjuna Construction"], { listed: true, hq: "Hyderabad" }),
    C("C-SADBHAV", "Sadbhav Engineering Ltd", ["Sadbhav Engineering", "Sadbhav"], { listed: true }),
    C("C-RINFRA", "Reliance Infrastructure Ltd", ["Reliance Infrastructure", "RInfra", "Reliance Infra"], { listed: true, hq: "Mumbai" }),
    C("C-MONTE", "Montecarlo Ltd", ["MonteCarlo", "Montecarlo"], {}),
    C("C-GAYATRI", "Gayatri Projects Ltd", ["Gayatri Projects"], { listed: true, hq: "Hyderabad" }),
    C("C-DBL", "Dilip Buildcon Ltd", ["Dilip Buildcon", "DBL", "DilipBuildcon"], { listed: true, hq: "Bhopal" }),
    C("C-BSCPL", "BSCPL Infrastructure Ltd", ["BSCPL"], {}),
    C("C-ASHOKA", "Ashoka Buildcon Ltd", ["Ashoka Buildcon"], { listed: true, hq: "Nashik" }),
    C("C-GAWAR", "Gawar Construction Ltd", ["Gawar Construction", "Gawar Constructions Limited"], {}),
    C("C-OSE", "Oriental Structural Engineers Pvt Ltd", ["Oriental Structural Engineering", "Oriental Structural Engineers", "OSE"], { listed: false }),
    C("C-KPCL", "KPCL (as named in source)", ["KPCL"], { kind: "Consortium member — full legal name not captured" }),
    C("C-LEIGHTON", "Leighton India", ["Leighton India Contractors", "Leighton"], { parent: "CIMIC Group (formerly Leighton Holdings)", kind: "EPC contractor" }),
    C("C-WEBUILD", "Webuild S.p.A.", ["Astaldi", "Astaldi S.p.A.", "Webuild"], { listed: true, country: "Italy", kind: "EPC contractor" }),
  );
  const coById = Object.fromEntries(D.companies.map((c) => [c.id, c]));
  // Lifetime footprint statements, as published (not computed from ITIS rows).
  const profile = (id, text, source) => (coById[id].profile = { text, source });
  profile("C-HCC", "Over 3,800 lane-km of expressways & highways, 364 km of complex tunnelling (204 km in the Himalaya) and 383+ major bridges.", "S067");
  profile("C-MEIL", "Road portfolio of over 8,821 lane-km across states incl. AP, Telangana, Kerala, Maharashtra, MP, Punjab, Bihar.", "S117");
  profile("C-IRB", "28 road projects — 18 BOT, 6 TOT, 4 HAM (incl. 2 InvITs); ~12,800 lane-km under BOT and HAM.", "S069");
  profile("C-ARTL", "20 projects, 5,500+ lane-km since entering roads in 2018 (HAM, BOT, TOT).", "S075");
  profile("C-NECL", "Built Dhola–Sadiya (9.15 km, Brahmaputra), Silkyara–Barkot tunnel, Quazigund–Banihal tunnel.", "S076");
  coById["C-ILFS"].aliases.push("IL&FS Transportation Networks Ltd", "IL&FS Transportation Network Limited");

  // ------------------------------------------------------------- HELPERS
  const line = (basis, ...coords) => ({ kind: "line", precision: "APPROXIMATE", basis, coords });
  const pt = (basis, lat, lng) => ({ kind: "point", precision: "APPROXIMATE", basis, coords: [[lat, lng]] });
  // K(no, name, km, ₹cr, awardDate, status, [[company, role, share]], source, confidence, note)
  const K = (no, name, length_km, value_cr, award_date, status, members, source, confidence, note) => ({
    no, name, length_km, value_cr, award_date, status, source, confidence: confidence || "REPORTED", note: note || undefined,
    contractor: members ? { kind: members.length > 1 ? "JV" : "Single", members: members.map(([company, role, share]) => ({ company, role: role || (members.length > 1 ? "JV member" : "EPC contractor"), share: share == null ? null : share })) } : null,
  });
  const V = (value_cr, type, source, date, confidence, ref) => ({ value_cr, type, source, date: date || null, confidence: confidence || "REPORTED", ref: !!ref });
  const E = (date, precision, status, event, source) => ({ date, precision, status, event, source });
  let seq = 17;
  const P = (o) => {
    const p = Object.assign({
      id: "ITI-P-" + String(seq++).padStart(4, "0"), aliases: [], category: o.type, corridor: o.name, highway_no: null, program: null,
      primary_state: o.states[0], origin: null, destination: null, length_km: null, length_note: "", lanes: null, terrain: null, strategic: null,
      authority_id: null, nodal_ministry: null, confidence: "REPORTED", values: [], packages: [], events: [], risks: [], tech: [],
      dates: { planned_completion: null, revised_completion: null, actual_completion: null }, last_verified: A, ingest: "contractor-portfolio",
    }, o);
    p.progress = p.progress || { physical_pct: null, note: "", asof: p.status_asof };
    p.packages_summary = p.packages_summary || { count: null, ingested: p.packages.length, note: "" };
    if (!p.length_note && p.length_km != null) p.length_note = `${p.length_km} km (${p.status_source})`;
    D.projects.push(p);
    return p;
  };
  const addPkgs = (id, pkgs, note, count) => {
    const p = D.projects.find((x) => x.id === id);
    p.packages.push(...pkgs);
    p.packages_summary.ingested = p.packages.length;
    if (count != null) p.packages_summary.count = count;
    p.packages_summary.note = note;
    return p;
  };

  // ============================================ packages on existing corridors
  // Samruddhi — 13 of 16 packages (S092/S093)
  addPkgs("ITI-P-0002", [
    K("Pkg 1", "Nagpur", null, null, "2018", "COMPLETED", [["C-MEIL"]], "S092"),
    K("Pkg 2", "Wardha", null, null, "2018", "COMPLETED", [["C-AFCONS"]], "S092"),
    K("Pkg 3", "Amravati", null, null, "2018", "COMPLETED", [["C-NCC"]], "S092"),
    K("Pkg 4", "Washim East", null, null, "2018", "COMPLETED", [["C-PNC"]], "S092"),
    K("Pkg 5", "Washim West", null, null, "2018", "COMPLETED", [["C-SADBHAV"]], "S092"),
    K("Pkg 6", "Buldana East", null, null, "2018", "COMPLETED", [["C-APCO"]], "S092"),
    K("Pkg 7", "Buldana West", null, null, "2018", "COMPLETED", [["C-RINFRA"]], "S092"),
    K("Pkg 8", "Jalna", null, null, "2018", "COMPLETED", [["C-MONTE"]], "S092"),
    K("Pkg 9", "Aurangabad East", null, null, "2018", "COMPLETED", [["C-MEIL"]], "S092"),
    K("Pkg 10", "Aurangabad West", null, 2095, "2018-09", "COMPLETED", [["C-LT"]], "S057", "CROSS_VERIFIED", "Contractor per S092 list; value per S057"),
    K("Pkg 11", "Ahmednagar", null, null, "2018", "COMPLETED", [["C-GAYATRI"]], "S092"),
    K("Pkg 12", "Nashik East", null, null, "2018", "COMPLETED", [["C-DBL"]], "S092"),
    K("Pkg 13", "Nashik West", null, null, "2018", "COMPLETED", [["C-BSCPL"]], "S092"),
  ], "13 of 16 packages mapped to L1 contractors named in 2018 (S092, S093). Packages 14–16 not ingested. Package status inferred from full corridor opening (5 Jun 2025).", 16).events.push(
    E("2018-09-04", "day", "AWARDED", "Contracts awarded to 13 contractors for 13 of 16 packages", "S093"));

  // Delhi–Mumbai Expressway — L&T, RSIIL, GR Infra, APCO packages
  const dme = addPkgs("ITI-P-0001", [
    K("Pkgs 11 & 22", "Delhi–Vadodara section (two packages, 36 km combined)", 36, null, null, "UNKNOWN", [["C-LT"]], "S056", "REPORTED", "Combined length reported; per-package split and status not captured"),
    K("Vadodara–Virar Pkg 8", "Jujuwa–Gandeva", null, null, "2021", "TERMINATED", [["C-RSIIL"]], "S107", "REPORTED", "Awarded 2021; cancelled Mar-2023; re-awarded to RSIIL Nov-2023; terminated for delays; fresh tender — nine bidders incl. RSIIL (May-2026)"),
    K("Vadodara–Virar Pkg 9", "Karvad–Jujuwa", null, null, "2021", "TERMINATED", [["C-RSIIL"]], "S108", "REPORTED", "Contract terminated for slow progress; NHAI invited fresh bids for pending work (28 May 2026)"),
    K("Vadodara–Virar Pkg 10", "Talsari–Karvad", null, null, "2021", "UNKNOWN", [["C-RSIIL"]], "S107", "REPORTED"),
    K("Jewar Airport link", "~30 km link from Noida International Airport to DME", 30, null, null, "BID_EVALUATION", [["C-APCO", "L1 bidder"]], "S101", "REPORTED", "Declared L1 (Aug-2022); award not captured"),
    K("Bandikui–Jaipur spur", "4-lane greenfield spur (HAM)", null, 1368, "2022-03-30", "LOA_ISSUED", [["C-GRIL", "Concessionaire (HAM)"]], "S104", "REPORTED", "Bid project cost ₹1,368 cr"),
  ], "54 construction packages reported (S002). 6 ingested from contractor research; remaining package contractors not yet mapped.", 54);
  dme.events.push(
    E("2023-03", "month", null, "NHAI cancelled two RSIIL Vadodara–Virar packages for delays; fresh tenders floated", "S107"),
    E("2023-11", "month", null, "RSIIL again L1; packages re-awarded", "S107"),
    E("2025-12-19", "day", null, "Completion pushed to 2027–28 as delays hit Gujarat stretches", "S109"),
    E("2026-05-06", "day", null, "Vadodara–Virar Pkg 8 re-tender: nine bidders incl. RSIIL after earlier termination", "S107"),
    E("2026-05-28", "day", null, "Fresh bids invited for pending work on Pkg 9", "S108"));
  dme.risks.push({ category: "Contractor performance", text: "NHAI terminated RSIIL's Vadodara–Virar Pkg 8 and Pkg 9 contracts for delays / slow progress", source: "S108" });
  dme.opportunity = { category: "RE_TENDER", signal: "Vadodara–Virar Pkg 8 (nine bids, May-2026) and Pkg 9 (fresh bids invited 28 May 2026) back in procurement after RSIIL terminations", source: "S108", asof: "2026-05-28" };

  // Delhi–Amritsar–Katra — APCO Pkg 17
  addPkgs("ITI-P-0014", [K("Pkg 17", "J&K section", 28.92, null, null, "BID_EVALUATION", [["C-APCO", "L1 bidder"]], "S100", "REPORTED", "Declared L1 (Aug-2022); award not captured")],
    "Package contractors largely not ingested; APCO Pkg 17 captured. ~30 km Amritsar-spur tender cancelled over land (S036).");

  // Ganga — Adani scope detail
  const ganga = D.projects.find((x) => x.id === "ITI-P-0007");
  ganga.packages[1].length_km = 464;
  ganga.packages[1].name = "Budaun–Prayagraj (Groups 2–4)";
  ganga.packages[1].note = "464 km Budaun–Prayagraj built by Adani Enterprises on DBFOT (S074)";
  ganga.packages[1].confidence = "CROSS_VERIFIED";
  ganga.events.unshift(E("2021-12-21", "day", "AWARDED", "Adani Enterprises wins Ganga Expressway groups (Budaun–Prayagraj)", "S126"));

  // Atal Tunnel — STRABAG cross-verification
  const atal = D.projects.find((x) => x.id === "ITI-P-0013");
  atal.packages[0].confidence = "CROSS_VERIFIED";
  atal.packages[0].award_date = "2009-09";
  atal.packages[0].note = "Afcons–STRABAG JV awarded Sep-2009; reported contract €250 M for ~8.8 km (S087) — EUR value not converted";
  atal.events.splice(1, 0, E("2009-09", "month", "AWARDED", "Tunnel contract awarded to Afcons–STRABAG JV", "S087"));

  // Thane–Borivali — second source
  D.projects.find((x) => x.id === "ITI-P-0011").packages.forEach((k) => (k.note = "Also reported by S118 (₹14,400 cr combined)"));

  // ====================================================== NEW PROJECTS
  // ---------------- L&T / L&T IDPL
  // Authority is left blank unless the source names it (only KWTL is tied to NHDP Phase V → NHAI).
  const idpl = (name, states, geom, src, extra) => P(Object.assign({ name, type: "National Highway", category: "BOT toll road (concession)", states, authority_id: null,
    status: "OPERATIONAL", status_asof: src === "S050" ? "2017-01" : null, status_source: src, confidence: "REPORTED", geom,
    packages: [K("Concession", name, null, null, null, "COMPLETED", [["C-LTIDPL", "Concessionaire (BOT)"]], src, "REPORTED")],
    events: [E(src === "S050" ? "2017-01-11" : null, src === "S050" ? "day" : "unknown", "OPERATIONAL", "Listed as an operational L&T IDPL road project", src)] }, extra || {}));
  idpl("Krishnagiri–Walajahpet (NH-46)", ["Tamil Nadu"], line("Town-to-town schematic", [12.52, 78.21], [12.92, 79.13], [12.92, 79.37]), "S050",
    { values: [V(1370, "Project cost (INR 13.70 bn)", "S050", "2017-01", "REPORTED", true)], program: "NHDP Phase V", authority_id: "A-NHAI", origin: "Krishnagiri", destination: "Walajahpet" });
  idpl("Panipat Elevated Corridor", ["Haryana"], pt("Panipat city centroid", 29.39, 76.97), "S050", { type: "Elevated corridor", category: "Elevated corridor (BOT)" });
  idpl("Samakhiali–Gandhidham", ["Gujarat"], line("Town-to-town schematic", [23.30, 70.51], [23.08, 70.13]), "S050", { origin: "Samakhiali", destination: "Gandhidham" });
  idpl("Beawar–Pali–Pindwara", ["Rajasthan"], line("Town-to-town schematic", [26.10, 74.32], [25.77, 73.32], [24.79, 73.06]), "S050", { origin: "Beawar", destination: "Pindwara" });
  idpl("Palanpur–Swaroopganj", ["Gujarat", "Rajasthan"], line("Town-to-town schematic", [24.17, 72.43], [24.68, 73.03]), "S050", { origin: "Palanpur", destination: "Swaroopganj" });
  idpl("Pimpalgaon–Nashik–Gonde", ["Maharashtra"], line("Town-to-town schematic", [20.17, 73.99], [20.00, 73.79], [19.78, 73.63]), "S050", { origin: "Pimpalgaon", destination: "Gonde" });
  idpl("Rajkot–Jamnagar–Vadinar", ["Gujarat"], line("Town-to-town schematic", [22.30, 70.80], [22.47, 70.06], [22.46, 69.70]), "S052", { origin: "Rajkot", destination: "Vadinar", authority_id: null });
  idpl("Vadodara–Bharuch", ["Gujarat"], line("Town-to-town schematic", [22.31, 73.18], [21.70, 72.98]), "S051", { origin: "Vadodara", destination: "Bharuch", authority_id: null });
  idpl("Coimbatore Bypass", ["Tamil Nadu"], pt("Coimbatore city centroid", 11.00, 76.96), "S053", { type: "Bypass", category: "Bypass (BOT)", authority_id: null });
  idpl("Chennai–Tada", ["Tamil Nadu", "Andhra Pradesh"], line("Town-to-town schematic", [13.08, 80.27], [13.59, 80.05]), "S054", { origin: "Chennai", destination: "Tada", authority_id: null });

  P({ name: "Atal Setu (Goa) — Mandovi cable-stayed bridge", aliases: ["Atal Setu Goa", "New Mandovi Bridge"], type: "Bridge", category: "Cable-stayed bridge", states: ["Goa"],
    length_km: 3.2, status: "OPERATIONAL", status_asof: "2019-01-27", status_source: "S059", confidence: "CROSS_VERIFIED",
    geom: pt("Panaji (Mandovi crossing) — approximate", 15.50, 73.83), dates: { planned_completion: null, revised_completion: null, actual_completion: "2019-01-27" },
    packages: [K("EPC", "Cable-stayed bridge", 3.2, null, null, "COMPLETED", [["C-LT", "EPC contractor"], ["C-DSI", "Specialist contractor"]], "S058", "CROSS_VERIFIED", "L&T with DSI-Bridgecon (S058); L&T project page (S060)")],
    events: [E("2014-07-27", "day", "UNDER_CONSTRUCTION", "Construction started", "S058"), E("2019-01-27", "day", "OPEN_TO_TRAFFIC", "Bridge inaugurated", "S059")] });
  P({ name: "Nivedita Setu (Second Vivekananda Bridge)", aliases: ["Second Vivekananda Setu", "Nivedita Setu"], type: "Bridge", category: "River bridge (Hooghly)", states: ["West Bengal"],
    status: "OPERATIONAL", status_asof: "2007-07", status_source: "S061", geom: pt("Dakshineswar, Kolkata — approximate", 22.65, 88.35),
    dates: { planned_completion: null, revised_completion: null, actual_completion: "2007-07" },
    packages: [K("EPC", "Bridge", null, null, null, "COMPLETED", [["C-LT"]], "S061")],
    events: [E("2004-04", "month", "UNDER_CONSTRUCTION", "Construction started", "S061"), E("2007-07", "month", "OPEN_TO_TRAFFIC", "Opened to traffic", "S061")] });
  P({ name: "Second Ishwar Gupta Setu", type: "Bridge", category: "River bridge (Hooghly)", states: ["West Bengal"], status: "UNKNOWN", status_asof: null, status_source: "S062",
    geom: pt("Kalyani–Bansberia crossing — approximate", 22.97, 88.43), packages: [K("EPC", "Bridge", null, null, "2018", "UNKNOWN", [["C-LT"]], "S062")],
    events: [E("2018", "year", "UNDER_CONSTRUCTION", "Construction by L&T started", "S062")],
    packages_summary: { count: 1, ingested: 1, note: "Current status not captured — requires verification" } });
  P({ name: "Kacchi Dargah–Bidupur Ganga Bridge", aliases: ["Kachchi Dargah–Bidupur bridge"], type: "Bridge", category: "Extra-dosed cable-stayed river bridge", states: ["Bihar"],
    origin: "Kacchi Dargah (Patna)", destination: "Bidupur (Vaishali)", length_km: 19.76, length_note: "19.76 km greenfield project incl. 9.75 km bridge (S084)", authority_id: "A-BSRDC",
    status: "PARTIALLY_OPERATIONAL", status_asof: null, status_source: "S085", confidence: "REPORTED",
    values: [V(4988, "Project cost", "S084", null, "REPORTED", true)],
    geom: line("Endpoint localities — approximate", [25.58, 85.28], [25.62, 85.31], [25.65, 85.33]),
    packages: [K("EPC", "6-lane extra-dosed bridge", 9.75, null, "2017", "UNDER_CONSTRUCTION", [["C-LT", "JV member"], ["C-DAEWOO", "JV member"]], "S084", "CROSS_VERIFIED", "L&T–Daewoo E&C (S084, S086)")],
    events: [E("2017-07", "month", "UNDER_CONSTRUCTION", "Construction started", "S084"), E(null, "unknown", "PARTIALLY_OPERATIONAL", "Patna–Raghopur stretch inaugurated by CM on 23 June (year not captured in source summary)", "S085")] });
  P({ name: "Agra–Lucknow Expressway", type: "Expressway", category: "Greenfield access-controlled expressway", states: ["Uttar Pradesh"], authority_id: "A-UPEIDA",
    origin: "Agra", destination: "Lucknow", length_km: 302, status: "OPERATIONAL", status_asof: "2016-11-21", status_source: "S091", confidence: "CROSS_VERIFIED",
    values: [V(15000, "Estimated cost ('nearly ₹15,000 cr')", "S090", "2014-08", "REPORTED", true)],
    dates: { planned_completion: null, revised_completion: null, actual_completion: "2016-11-21" },
    geom: line("Town-to-town schematic", [27.18, 78.01], [27.15, 78.40], [26.78, 79.02], [27.05, 79.92], [26.55, 80.49], [26.85, 80.95]),
    packages_summary: { count: 5, ingested: 5, note: "Afcons Pkgs 2 & 4 = 126 km of 302 km (matches Afcons disclosure S089)" },
    packages: [
      K("Pkg 1", "Agra–Firozabad", 56, null, "2014-08", "COMPLETED", [["C-PNC"]], "S090"),
      K("Pkg 2", "Firozabad–Etawah", 62, null, "2014-08", "COMPLETED", [["C-AFCONS"]], "S090", "CROSS_VERIFIED"),
      K("Pkg 3", "Etawah–Kannauj", 57, null, "2014-08", "COMPLETED", [["C-NCC"]], "S090", "REPORTED", "Named 'Nagarjuna Construction Company' in source → resolved to NCC Ltd"),
      K("Pkg 4", "Kannauj–Unnao", 64, null, "2014-08", "COMPLETED", [["C-AFCONS"]], "S090", "CROSS_VERIFIED"),
      K("Pkg 5", "Unnao–Lucknow", 63, null, "2014-08", "COMPLETED", [["C-LT"]], "S090"),
    ],
    events: [E("2014-08-13", "day", "AWARDED", "UP selects developers for five packages", "S090"), E("2016-11-21", "day", "OPEN_TO_TRAFFIC", "Expressway inaugurated", "S125")], authority_source: "S128" });

  // ---------------- HCC / IRB / MSRDC Mumbai
  P({ name: "Bandra–Worli Sea Link", aliases: ["Rajiv Gandhi Sea Link", "BWSL"], type: "Bridge", category: "Cable-stayed sea bridge", states: ["Maharashtra"], authority_id: "A-MSRDC",
    origin: "Bandra", destination: "Worli", length_km: 5.6, status: "OPERATIONAL", status_asof: "2010", status_source: "S063", confidence: "CROSS_VERIFIED",
    values: [V(600, "Original estimate", "S063", null, "REPORTED"), V(1634, "Final cost", "S063", "2010", "CROSS_VERIFIED", true)],
    value_conflict: "₹600 cr original estimate vs ₹1,634 cr final cost — cost overrun, not a conflict (S063, S065 '6-fold to ₹1,600 cr').",
    dates: { planned_completion: null, revised_completion: null, actual_completion: "2010" },
    geom: line("Landmark endpoints", [19.045, 72.818], [19.030, 72.812], [19.018, 72.815]),
    packages: [K("EPC", "Sea link", 5.6, null, null, "COMPLETED", [["C-HCC"]], "S064", "CROSS_VERIFIED", "HCC per MSRDC (S064) and HCC (S067)")],
    events: [E("1999", "year", "UNDER_CONSTRUCTION", "Construction began", "S067"), E("2009-06-30", "day", "PARTIALLY_OPERATIONAL", "First four of eight lanes opened", "S063"), E("2010", "year", "COMPLETED", "Fully completed", "S063")],
    risks: [{ category: "Environmental clearance", text: "10-year build with delays from environmental clearances and shifting design parameters", source: "S063" }] });
  P({ name: "Versova–Bandra Sea Link", aliases: ["VBSL", "Bandra–Versova Sea Link"], type: "Bridge", category: "Sea link", states: ["Maharashtra"], authority_id: "A-MSRDC",
    origin: "Versova", destination: "Bandra", length_km: 17.7, status: "DELAYED", status_asof: "2026", status_source: "S116", confidence: "REPORTED",
    values: [V(6993.99, "Original consortium bid", "S114", "2018", "REPORTED"), V(11332.8, "Revised cost (2018)", "S114", "2018", "REPORTED"), V(18120.96, "Revised cost (2024)", "S116", "2024", "REPORTED", true)],
    value_conflict: "Three values are successive revisions (bid → 2018 revision → 2024 revision). Latest is reference.",
    dates: { planned_completion: null, revised_completion: "2028-05", actual_completion: null },
    geom: line("Coastal schematic between localities", [19.135, 72.812], [19.09, 72.815], [19.05, 72.818]),
    packages: [K("EPC", "Sea link", 17.7, null, "2018", "UNDER_CONSTRUCTION", [["C-WEBUILD", "JV member"], ["C-APCO", "JV member"]], "S115", "REPORTED", "Astaldi (now Webuild) JV; Reliance Infra exited Jan-2022 and transferred its stake to APCO with MSRDC approval")],
    prior_contractors: [{ company: "C-RINFRA", role: "Former JV partner — exited Jan-2022", source: "S115", confidence: "REPORTED" }],
    events: [E("2018", "year", "AWARDED", "EPC awarded to Astaldi–Reliance Infrastructure JV", "S113"), E("2022-01", "month", null, "Reliance Infrastructure exits JV; stake to APCO Infratech", "S115"), E("2024", "year", null, "Cost revised to ₹18,120.96 cr", "S116"), E("2026", "year", "DELAYED", "Construction completion revised to May 2028", "S116")],
    tech: [{ domain: "Tolling / ITS / surveillance", kind: "potential", basis: "Tolled urban sea link" }],
    opportunity: { category: "CONSTRUCTION", signal: "Civil works under way to May-2028; systems packages would follow", source: "S116", asof: "2026" } });
  P({ name: "Mumbai–Pune Expressway", aliases: ["Yashwantrao Chavan Expressway", "MPEW"], type: "Expressway", category: "Access-controlled expressway", states: ["Maharashtra"], authority_id: "A-MSRDC",
    origin: "Mumbai (Kalamboli)", destination: "Pune (Kiwale)", status: "OPERATIONAL", status_asof: "2020-02", status_source: "S068", confidence: "CROSS_VERIFIED",
    values: [V(8262, "TOT upfront + staggered concession payment by IRB to MSRDC (not construction cost)", "S068", "2020-02", "VERIFIED")],
    geom: line("Town-to-town schematic", [19.03, 73.10], [18.83, 73.28], [18.75, 73.41], [18.66, 73.73]),
    packages: [
      K("Construction (section)", "Section of the expressway", null, null, null, "COMPLETED", [["C-HCC"]], "S067", "REPORTED", "HCC built a section of India's first six-lane concrete expressway (2002)"),
      K("TOT concession", "Mumbai–Pune Expressway + old NH-48 (TOT)", null, 8262, "2020-02", "OPERATIONAL", [["C-IRB", "Concessionaire (TOT)"]], "S068", "VERIFIED", "Operating toll concession"),
    ],
    events: [E("2002", "year", "OPERATIONAL", "Expressway completed (HCC section)", "S066"), E("2020-02", "month", "AWARDED", "TOT concession awarded to IRB by MSRDC", "S068")] });
  P({ name: "Hyderabad Outer Ring Road (TOT)", aliases: ["Hyderabad ORR"], type: "Ring road", category: "Ring road — TOT concession", states: ["Telangana"],
    length_km: 158, status: "OPERATIONAL", status_asof: null, status_source: "S069", values: [V(7380, "TOT upfront payment (not construction cost)", "S069", null, "VERIFIED")],
    geom: pt("Hyderabad centroid — ring alignment not ingested", 17.39, 78.49),
    packages: [K("TOT concession", "158 km, 30-year revenue-linked concession", 158, 7380, null, "OPERATIONAL", [["C-IRB", "Concessionaire (TOT)"]], "S069", "VERIFIED", "Operating toll concession")],
    events: [E(null, "unknown", "AWARDED", "TOT concession awarded to IRB (award date not captured)", "S069")] });
  const irbBot = (name, states, geom, extra) => P(Object.assign({ name, type: "National Highway", category: "BOT toll road", states, authority_id: "A-NHAI", status: "UNKNOWN", status_asof: null, status_source: "S069", confidence: "REPORTED", geom,
    packages: [K("BOT concession", name, null, null, "2009", "UNKNOWN", [["C-IRB", "Concessionaire (BOT)"]], "S069")],
    events: [E("2009", "year", "AWARDED", "Won by IRB (per IRB milestones)", "S069")],
    packages_summary: { count: 1, ingested: 1, note: "Only the 2009 award is sourced; current status requires verification (not presented as current)." } }, extra || {}));
  irbBot("Surat–Dahisar (NH-8)", ["Gujarat", "Maharashtra"], line("Town-to-town schematic", [21.17, 72.83], [20.37, 72.90], [19.25, 72.86]), { origin: "Surat", destination: "Dahisar", authority_id: null });
  irbBot("Jaipur–Deoli", ["Rajasthan"], line("Town-to-town schematic", [26.91, 75.79], [26.17, 75.79], [25.76, 75.38]), { origin: "Jaipur", destination: "Deoli" });
  irbBot("Talegaon–Amravati", ["Maharashtra"], pt("Amravati centroid — alignment not ingested", 20.93, 77.75), { origin: "Talegaon", destination: "Amravati" });
  P({ name: "Pathankot–Amritsar (NH-15)", type: "National Highway", category: "BOT toll road", states: ["Punjab"], authority_id: "A-NHAI", origin: "Pathankot", destination: "Amritsar",
    length_km: 102.42, status: "OPERATIONAL", status_asof: "2017-09-29", status_source: "S070", confidence: "VERIFIED",
    geom: line("Town-to-town schematic", [32.27, 75.65], [32.04, 75.40], [31.63, 74.87]),
    packages: [K("BOT concession", "102.42 km, 20-year concession from 2010", 102.42, null, "2009", "COMPLETED", [["C-IRB", "Concessionaire (BOT)"]], "S070", "VERIFIED")],
    events: [E("2009", "year", "AWARDED", "Won by IRB", "S069"), E("2017-09-29", "day", null, "Asset set to transfer to IRB InvIT Fund", "S070")] });
  P({ name: "Ahmedabad–Vadodara (NH-8 six-laning + Expressway)", type: "National Highway", category: "DBFOT toll concession", states: ["Gujarat"], authority_id: "A-NHAI",
    origin: "Ahmedabad", destination: "Vadodara", length_km: 195.6, length_note: "102.3 km NH-8 six-laning + 93.302 km expressway improvement (S071)",
    status: "OPERATIONAL", status_asof: null, status_source: "S071", confidence: "REPORTED",
    geom: line("Town-to-town schematic", [23.02, 72.57], [22.69, 72.86], [22.31, 73.18]),
    packages: [K("DBFOT concession", "NH-8 six-laning + expressway", 195.6, null, "2011-07", "OPERATIONAL", [["C-IRB", "Concessionaire (DBFOT)"]], "S071", "VERIFIED", "Listed under IRB 'ongoing concessions'")],
    events: [E("2011-07", "month", "AWARDED", "Concession agreement signed — NHAI's first 'ultra mega' BOT project", "S069")] });

  // ---------------- Navayuga / ITNL tunnels & bridges
  P({ name: "Dhola–Sadiya Bridge (Bhupen Hazarika Setu)", aliases: ["Bhupen Hazarika Setu", "Dhola Sadiya Bridge"], type: "Bridge", category: "River bridge (Brahmaputra/Lohit)", states: ["Assam"],
    origin: "Dhola", destination: "Sadiya", length_km: 9.15, status: "OPERATIONAL", status_asof: "2017", status_source: "S077", confidence: "CROSS_VERIFIED",
    geom: line("Village endpoints — approximate", [27.73, 95.47], [27.80, 95.60]),
    packages: [K("EPC", "Bridge", 9.15, null, null, "COMPLETED", [["C-NECL"]], "S076", "REPORTED")],
    events: [E("2017", "year", "OPEN_TO_TRAFFIC", "Inaugurated by the Prime Minister", "S077")], tech: [], dates: { planned_completion: null, revised_completion: null, actual_completion: "2017" } });
  P({ name: "Silkyara Bend–Barkot Tunnel", aliases: ["Silkyara tunnel", "Baba Baukhnag tunnel"], type: "Tunnel", category: "Mountain road tunnel (Char Dham)", states: ["Uttarakhand"], authority_id: "A-NHIDCL",
    program: "Char Dham Mahamarg Vikas Pariyojana", length_km: 4.53, status: "UNDER_CONSTRUCTION", status_asof: "2025-04-16", status_source: "S123", confidence: "CROSS_VERIFIED",
    values: [V(853.8, "Construction cost", "S076", "2023-12", "REPORTED", true)],
    dates: { planned_completion: null, revised_completion: "2026 (commissioning; officials also cited 15–18 more months)", actual_completion: null },
    geom: line("Portal localities — approximate", [30.80, 78.39], [30.81, 78.21]),
    packages: [K("EPC", "4.5 km bi-directional tunnel", 4.53, 853.8, null, "UNDER_CONSTRUCTION", [["C-NECL"]], "S076", "CROSS_VERIFIED", "Navayuga per S076; NHIDCL project page S122")],
    events: [E("2023-11", "month", "STALLED", "Tunnel collapse trapped 41 workers; works halted during rescue", "S076"), E("2025-04-16", "day", null, "Milestone: excavation breakthrough of 4.53 km tunnel", "S123")],
    risks: [{ category: "Geological conditions", text: "Nov-2023 collapse during construction trapped 41 workers", source: "S076" }],
    tech: [{ domain: "Tunnel systems (ventilation/SCADA/fire/CCTV)", kind: "potential", basis: "4.5 km road tunnel entering final phase" }],
    opportunity: { category: "CONSTRUCTION", signal: "Excavation complete Apr-2025; final phase / commissioning ahead", source: "S123", asof: "2025-04-16" } });
  P({ name: "Banihal–Qazigund Road Tunnel", aliases: ["Navyug Tunnel", "Quazigund–Banihal tunnel"], type: "Tunnel", category: "Twin-tube highway tunnel", states: ["Jammu & Kashmir"], authority_id: "A-NHAI",
    highway_no: "NH-44 (old NH-1A)", length_km: 16.3, length_note: "16.3 km 4-lane section incl. 8.5 km twin-tube tunnel (S078)", status: "OPERATIONAL", status_asof: "2021-08-04", status_source: "S078", confidence: "REPORTED",
    values: [V(2100, "Tunnel cost", "S078", "2021-08", "REPORTED", true)], funding: "NIIF invested ₹3,036 cr in the Navayuga Quazigund–Banihal expressway SPV (S079)",
    dates: { planned_completion: null, revised_completion: null, actual_completion: "2021-08-04" },
    geom: line("Town-to-town schematic", [33.59, 75.16], [33.50, 75.18], [33.43, 75.19]),
    packages: [K("Concession / EPC", "Qazigund–Banihal section of NH-1A", 16.3, null, "2010-04-30", "COMPLETED", [["C-NECL", "Consortium member"], ["C-KPCL", "Consortium member"]], "S078", "REPORTED", "NHAI letter of award to NECL–KPCL consortium dated 30 Apr 2010")],
    events: [E("2010-04-30", "day", "AWARDED", "Letter of award to NECL–KPCL consortium", "S078"), E("2011-06", "month", "UNDER_CONSTRUCTION", "Works started", "S078"), E("2021-08-04", "day", "OPEN_TO_TRAFFIC", "Tunnel opened", "S078")] });
  P({ name: "Chenani–Nashri Tunnel (Dr Syama Prasad Mookerjee Tunnel)", aliases: ["Chenani Nashri tunnel", "Patnitop tunnel"], type: "Tunnel", category: "Highway tunnel", states: ["Jammu & Kashmir"], authority_id: "A-NHAI",
    length_km: 9.28, status: "OPERATIONAL", status_asof: "2017-04-02", status_source: "S080", confidence: "CROSS_VERIFIED",
    values: [V(2500, "Reported cost", "S080", "2017-04", "REPORTED"), V(3700, "Escalated total cost (from ~₹2,500 cr estimate)", "S081", null, "REPORTED")],
    value_conflict: "Multiple publicly reported values exist; ₹2,500 cr appears to be the original estimate and ₹3,700 cr the escalated cost — requires primary verification.",
    dates: { planned_completion: null, revised_completion: null, actual_completion: "2017-04-02" },
    geom: line("Portal localities — approximate", [33.03, 75.28], [33.13, 75.25]),
    packages: [
      K("Concession", "Tunnel concession", 9.28, null, null, "COMPLETED", [["C-ILFS", "Concessionaire"]], "S080", "REPORTED", "IL&FS Transportation Networks (ITNL)"),
      K("Design & execution", "EPC sub-contract from ITNL", 9.28, null, "2010", "COMPLETED", [["C-LEIGHTON", "Subcontractor"]], "S080", "REPORTED"),
    ],
    events: [E("2010", "year", "AWARDED", "ITNL contracted Leighton India for design & execution", "S080"), E("2017-04-02", "day", "OPEN_TO_TRAFFIC", "Tunnel inaugurated", "S080")],
    tech: [{ domain: "Integrated tunnel control system", kind: "documented", basis: "Fully integrated tunnel control system — first of its kind in India", source: "S080" }] });

  // ---------------- UP expressways (APCO, PNC, GR, Afcons…)
  P({ name: "Purvanchal Expressway", type: "Expressway", category: "Greenfield access-controlled expressway", states: ["Uttar Pradesh"], authority_id: "A-UPEIDA",
    origin: "Chand Saray (Lucknow)", destination: "Haydaria (Ghazipur)", length_km: 340.824, length_note: "340.824 km per UPEIDA (S127); 8 packages sum to 340.7 km (S094); '354 km' also reported in S094",
    status: "OPEN_TO_TRAFFIC", status_asof: "2021-11-16", status_source: "S095", confidence: "VERIFIED",
    values: [V(23000, "Headline project value ('₹23,000-cr')", "S094", null, "REPORTED", true)],
    dates: { planned_completion: null, revised_completion: null, actual_completion: "2021-11-16" },
    geom: line("Town-to-town schematic", [26.78, 81.05], [26.26, 82.07], [26.07, 83.18], [25.58, 83.57]),
    packages_summary: { count: 8, ingested: 8, note: "" },
    packages: [
      K("Pkg 1", "Chand Saray–Sansara", 40.4, null, "2018", "COMPLETED", [["C-GAYATRI"]], "S094"),
      K("Pkg 2", "Sansara–Jarai Kalan", 39.7, null, "2018", "COMPLETED", [["C-GAYATRI"]], "S094"),
      K("Pkg 3", "Jarai Kalan–Siddhi Ganeshpur", 41.7, null, "2018", "COMPLETED", [["C-APCO"]], "S094", "CROSS_VERIFIED"),
      K("Pkg 4", "Siddhi Ganeshpur–Sansarpur", 42.7, null, "2018", "COMPLETED", [["C-GRIL"]], "S094"),
      K("Pkg 5", "Sansarpur–Govindpur", 54.0, null, "2018", "COMPLETED", [["C-PNC"]], "S094", "CROSS_VERIFIED"),
      K("Pkg 6", "Govindpur–Mojrapur", 28.2, null, "2018", "COMPLETED", [["C-PNC"]], "S094", "CROSS_VERIFIED"),
      K("Pkg 7", "Mojrapur–Bijaura", 46.0, null, "2018", "COMPLETED", [["C-GRIL"]], "S094"),
      K("Pkg 8", "Bijaura–Haydaria", 48.0, null, "2018", "COMPLETED", [["C-OSE"]], "S094"),
    ],
    events: [E("2018-10-10", "day", "UNDER_CONSTRUCTION", "Construction started", "S119"), E("2021-11-16", "day", "OPEN_TO_TRAFFIC", "Inaugurated by the Prime Minister", "S095")], authority_source: "S127" });
  P({ name: "Bundelkhand Expressway", type: "Expressway", category: "Greenfield access-controlled expressway", states: ["Uttar Pradesh"], authority_id: "A-UPEIDA",
    origin: "Gonda (Chitrakoot)", destination: "Kudrail (Etawah)", length_km: 296.1, length_note: "Sum of 6 packages = 296.1 km (computed from S096)",
    status: "OPEN_TO_TRAFFIC", status_asof: "2022-07-16", status_source: "S120", confidence: "CROSS_VERIFIED",
    values: [V(7786.81, "Construction cost", "S097", "2019-11", "REPORTED", true), V(2202.38, "Land acquisition cost", "S097", "2019-11", "REPORTED")],
    dates: { planned_completion: null, revised_completion: null, actual_completion: "2022-07-16" },
    geom: line("Town-to-town schematic", [25.20, 80.90], [25.48, 80.33], [25.29, 79.87], [25.95, 80.15], [26.14, 79.33], [26.78, 79.02]),
    packages_summary: { count: 6, ingested: 6, note: "" },
    packages: [
      K("Pkg 1", "Gonda (Chitrakoot)–Mahokhar (Banda)", 50.5, null, "2019-11", "COMPLETED", [["C-APCO"]], "S096", "CROSS_VERIFIED"),
      K("Pkg 2", "Mahokhar (Banda)–Kaohari (Mahoba)", 50.3, null, "2019-11", "COMPLETED", [["C-APCO"]], "S096", "CROSS_VERIFIED"),
      K("Pkg 3", "Kaohari (Mahoba)–Baroli Kharka (Hamirpur)", 49.0, null, "2019-11", "COMPLETED", [["C-ASHOKA"]], "S096"),
      K("Pkg 4", "Baroli Kharka (Hamirpur)–Salabad (Jalaun)", 51.0, null, "2019-11", "COMPLETED", [["C-GAWAR"]], "S096"),
      K("Pkg 5", "Salabad (Jalaun)–Bakhariya (Auraiya)", 50.0, null, "2019-11", "COMPLETED", [["C-GAWAR"]], "S096"),
      K("Pkg 6", "Bakhariya (Auraiya)–Kudrail (Etawah)", 45.3, null, "2019-11", "COMPLETED", [["C-DBL"]], "S096"),
    ],
    events: [E("2019-11", "month", "AWARDED", "UP Cabinet approved contractors for six packages", "S097"), E("2022-07-16", "day", "OPEN_TO_TRAFFIC", "Inaugurated by the Prime Minister", "S120")], authority_source: "S129" });
  P({ name: "Gorakhpur Link Expressway", type: "Expressway", category: "Greenfield access-controlled expressway", states: ["Uttar Pradesh"], authority_id: "A-UPEIDA",
    origin: "Jaitpur (Gorakhpur)", destination: "Salarpur (Azamgarh) — Purvanchal Expressway", length_km: 91.35, status: "OPEN_TO_TRAFFIC", status_asof: "2025-06-20", status_source: "S103", confidence: "CROSS_VERIFIED",
    values: [V(7283.28, "Project cost", "S103", "2025-06", "REPORTED", true)], dates: { planned_completion: null, revised_completion: null, actual_completion: "2025-06-20" },
    geom: line("Town-to-town schematic", [26.76, 83.37], [26.40, 83.25], [26.07, 83.18]),
    packages_summary: { count: null, ingested: 1, note: "Other package contractors not ingested" },
    packages: [K("Jaitpur–Phulwaria", "Jaitpur–Phulwaria section", 48.317, null, null, "COMPLETED", [["C-APCO"]], "S121")],
    events: [E("2025-06-20", "day", "OPEN_TO_TRAFFIC", "Inaugurated by the Chief Minister", "S103")], authority_source: "S102" });
  P({ name: "Awadh Expressway (Lucknow–Kanpur)", aliases: ["Lucknow–Kanpur Expressway", "NE-6"], type: "Expressway", category: "Access-controlled expressway (HAM)", states: ["Uttar Pradesh"], authority_id: "A-NHAI",
    highway_no: "NE-6", origin: "Lucknow", destination: "Kanpur", length_km: 63, status: "OPERATIONAL", status_asof: "2026-07-13", status_source: "S099", confidence: "REPORTED",
    values: [V(4700, "Project cost (approx.)", "S099", null, "REPORTED", true)],
    geom: line("Town-to-town schematic", [26.85, 80.95], [26.62, 80.62], [26.45, 80.33]),
    packages_summary: { count: 2, ingested: 2, note: "PNC L1 for both HAM packages (Feb-2022)" },
    packages: [K("Pkg 1", "HAM package 1", null, null, "2022-02", "COMPLETED", [["C-PNC", "Concessionaire (HAM)"]], "S099"), K("Pkg 2", "HAM package 2", null, null, "2022-02", "COMPLETED", [["C-PNC", "Concessionaire (HAM)"]], "S099")],
    events: [E("2022-02", "month", "BID_EVALUATION", "PNC Infratech L1 for both HAM packages", "S099"), E("2026-07-13", "day", "OPERATIONAL", "Expressway operational (tier-4 source — verify)", "S099")] });

  // ---------------- Afcons
  P({ name: "Jammu–Udhampur four-laning (NH-1A)", type: "National Highway", category: "Hill highway four-laning", states: ["Jammu & Kashmir"], authority_id: "A-NHAI",
    origin: "Jammu", destination: "Udhampur", status: "COMPLETED", status_asof: null, status_source: "S089",
    geom: line("Town-to-town schematic", [32.73, 74.86], [32.93, 75.14]),
    packages: [K("EPC", "Four-laning", null, null, null, "COMPLETED", [["C-AFCONS"]], "S089", "REPORTED", "Afcons: 'fastest hill-road project completion in NHAI's history'")],
    events: [E(null, "unknown", "COMPLETED", "Completed ahead of schedule (date not captured)", "S089")] });

  // ---------------- Adani (ARTL)
  const artl = (name, states, geom, extra) => P(Object.assign({ name, type: "National Highway", category: "HAM road project", states, authority_id: "A-NHAI", status: "LOA_ISSUED", confidence: "REPORTED", geom }, extra));
  artl("Badakumari–Karki (NH-130CD, Raipur–Visakhapatnam EC)", ["Odisha"], pt("Odisha state centroid — package location not captured", 20.5, 84.4), {
    program: "Raipur–Visakhapatnam Economic Corridor", status_asof: "2021-04-02", status_source: "S072", values: [V(1169.1, "Bid project cost", "S072", "2021-04", "REPORTED", true)],
    packages: [K("HAM", "Six-lane section", null, 1169.1, "2021-04", "LOA_ISSUED", [["C-ARTL", "Concessionaire (HAM)"]], "S072")],
    events: [E("2021-04-02", "day", "LOA_ISSUED", "LoA to Adani Road Transport; 2-year construction period", "S072")] });
  artl("Suryapet–Khammam (NH-365BB)", ["Telangana"], line("Town-to-town schematic", [17.14, 79.62], [17.25, 80.15]), {
    program: "Bharatmala Pariyojana", length_km: 58.626, status_asof: "2019-03-12", status_source: "S073",
    packages: [K("HAM", "Four-laning", 58.626, null, "2019-03", "LOA_ISSUED", [["C-ARTL", "Concessionaire (HAM)"]], "S073")],
    events: [E("2019-03-12", "day", "LOA_ISSUED", "LoA received", "S073")] });
  artl("Mancherial–Repallewada (NH-363)", ["Telangana"], pt("Mancherial centroid — alignment not ingested", 18.87, 79.44), {
    program: "NHDP Phase IV", length_km: 42, status_asof: "2019-03-12", status_source: "S073",
    packages: [K("HAM", "Four-laning", 42, null, "2019-03", "LOA_ISSUED", [["C-ARTL", "Concessionaire (HAM)"]], "S073")],
    events: [E("2019-03-12", "day", "LOA_ISSUED", "LoA received", "S073")] });

  // ---------------- Tata Projects
  P({ name: "Chennai Peripheral Ring Road — Phase 1 (Northern Port Access Road)", aliases: ["Chennai PRR Phase 1"], type: "Ring road", category: "Ring road / port access", states: ["Tamil Nadu"],
    origin: "Ennore Port", destination: "Thatchur", length_km: 25.38, status: "AWARDED", status_asof: "2021-09-27", status_source: "S082",
    values: [V(2100, "Order value (approx.)", "S082", "2021-09", "REPORTED", true)],
    geom: line("Endpoint localities — approximate", [13.23, 80.32], [13.30, 80.24], [13.38, 80.18]),
    structures: "Includes 1.4 km bridge over Buckingham Canal (S082)",
    packages: [K("Phase 1", "Six-lane road incl. Buckingham Canal bridge", 25.38, 2100, "2021-09", "AWARDED", [["C-TPL"]], "S082")],
    events: [E("2021-09-27", "day", "AWARDED", "Order won by Tata Projects", "S082")] });

  // ---------------- J Kumar
  P({ name: "Thane Elevated Road (Anand Nagar–Saket, EEH)", type: "Elevated corridor", category: "Urban elevated road", states: ["Maharashtra"],
    origin: "Anand Nagar", destination: "Saket", status: "LOA_ISSUED", status_asof: "2024-10-03", status_source: "S110",
    values: [V(1847.72, "Contract value", "S110", "2024-10", "REPORTED", true)], geom: pt("Thane (Eastern Express Highway) — approximate", 19.20, 72.97),
    packages: [K("D&C", "Elevated road on Eastern Express Highway", null, 1847.72, "2024-10", "LOA_ISSUED", [["C-JKUMAR"]], "S110")],
    events: [E("2024-10-03", "day", "LOA_ISSUED", "LoA received by J Kumar Infraprojects", "S110")],
    opportunity: { category: "RECENTLY_AWARDED", signal: "Elevated urban road LoA Oct-2024 — construction-phase procurement window", source: "S110", asof: "2024-10-03" } });
  P({ name: "Eastern Freeway — Panjarpole to Chembur–Mankhurd Link Road section", type: "Urban road", category: "Urban freeway section", states: ["Maharashtra"],
    status: "COMPLETED", status_asof: null, status_source: "S111", geom: pt("Chembur — approximate", 19.05, 72.92),
    packages: [K("Section", "Panjarpole–CMLR", null, null, null, "COMPLETED", [["C-JKUMAR"]], "S111")],
    events: [E(null, "unknown", "COMPLETED", "Listed in J Kumar executed works", "S111")] });

  // ---------------- Patel Engineering
  P({ name: "East–West Corridor (Assam) — Patel Engineering section", type: "National Highway", category: "Highway section", states: ["Assam"], length_km: 25,
    status: "COMPLETED", status_asof: null, status_source: "S112", values: [V(238.73, "Contract cost (Rs 2,387.25 million)", "S112", null, "REPORTED", true)],
    geom: pt("Assam state centroid — section location not captured", 26.2, 92.9),
    packages: [K("Section", "25 km East–West Corridor section", 25, 238.73, null, "COMPLETED", [["C-PATEL"]], "S112")],
    events: [E(null, "unknown", "COMPLETED", "Constructed by Patel Engineering", "S112")] });
  P({ name: "Surat–Manor Tollway", type: "National Highway", category: "Toll road", states: ["Gujarat", "Maharashtra"], origin: "Surat", destination: "Manor", length_km: 38,
    status: "COMPLETED", status_asof: null, status_source: "S112", values: [V(255, "Project cost (Rs 2,550 million)", "S112", null, "REPORTED", true)],
    geom: pt("Location along Surat–Manor corridor not captured — Surat reference point", 21.17, 72.83),
    packages: [K("Tollway", "38 km tollway works", 38, 255, null, "COMPLETED", [["C-PATEL"]], "S112")],
    events: [E(null, "unknown", "COMPLETED", "Constructed by Patel Engineering", "S112")] });
  P({ name: "Varanasi–Shaktinagar Road four-laning (SH-5A)", type: "State Highway", category: "State highway four-laning", states: ["Uttar Pradesh"], highway_no: "SH-5A",
    origin: "Varanasi", destination: "Shaktinagar", status: "UNKNOWN", status_asof: null, status_source: "S112",
    geom: line("Town-to-town schematic", [25.32, 82.97], [24.08, 82.95]),
    packages: [K("EPC", "Four-laning with paved shoulder", null, null, null, "UNKNOWN", [["C-PATEL"]], "S112")],
    events: [E(null, "unknown", null, "Listed among Patel Engineering infrastructure works; status not stated", "S112")] });

  // ---------------- G R Infraprojects
  P({ name: "Bhimasar–Anjar–Bhuj (NH-341)", type: "National Highway", category: "HAM four-laning", states: ["Gujarat"], authority_id: "A-NHAI", origin: "Bhimasar", destination: "Bhuj airport junction",
    status: "LOA_ISSUED", status_asof: "2022-03-30", status_source: "S104", values: [V(1085, "Bid project cost", "S104", "2022-03", "REPORTED", true)],
    geom: line("Town-to-town schematic", [23.11, 70.03], [23.25, 69.67]),
    packages: [K("HAM", "Four-laning with paved shoulder", null, 1085, "2022-03-30", "LOA_ISSUED", [["C-GRIL", "Concessionaire (HAM)"]], "S104")],
    events: [E("2022-03-30", "day", "LOA_ISSUED", "Letter of award from NHAI", "S104")] });
  P({ name: "Agra–Gwalior Greenfield Expressway", type: "Expressway", category: "Greenfield access-controlled expressway", states: ["Uttar Pradesh", "Madhya Pradesh", "Rajasthan"],
    origin: "Deori (Agra)", destination: "Susera (Gwalior)", length_km: 88, status: "AWARDED", status_asof: "2025-04", status_source: "S106", confidence: "REPORTED",
    values: [V(4613, "Total capital cost", "S106", "2025-04", "REPORTED", true)],
    geom: line("Town-to-town schematic", [27.18, 78.01], [26.75, 78.10], [26.22, 78.18]),
    packages: [K("Main", "88 km six-lane greenfield expressway", 88, null, "2025-04", "AWARDED", [["C-GRIL"]], "S106", "REPORTED", "Tier-4 source — verify with NHAI / GR filing")],
    events: [E("2025-04", "month", "AWARDED", "Awarded to G R Infraprojects", "S106")],
    opportunity: { category: "RECENTLY_AWARDED", signal: "88 km greenfield expressway awarded Apr-2025 — construction-phase procurement", source: "S106", asof: "2025-04" } });
  P({ name: "NH-56 four-laning, Gujarat (Package VI)", type: "National Highway", category: "HAM four-laning", states: ["Gujarat"], authority_id: "A-NHAI", highway_no: "NH-56",
    length_km: 60.21, status: "LOA_ISSUED", status_asof: "2026-03-31", status_source: "S105", confidence: "REPORTED",
    values: [V(1453.57, "Contract value", "S105", "2026-03", "REPORTED", true)],
    geom: pt("Gujarat state centroid — package location not captured", 22.3, 72.6),
    packages: [K("Pkg VI", "Two-lane to four-lane divided highway", 60.21, 1453.57, "2026-03", "LOA_ISSUED", [["C-GRIL", "Concessionaire (HAM)"]], "S105")],
    events: [E("2026-03-31", "day", "LOA_ISSUED", "LoA from NHAI", "S105")],
    opportunity: { category: "RECENTLY_AWARDED", signal: "LoA Mar-2026 — pre-construction / mobilisation", source: "S105", asof: "2026-03-31" } });
})();
