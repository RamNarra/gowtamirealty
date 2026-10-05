# KAVACH AI 2.0 — Audit Round 3: Engineering Assurance / Evidence Validation

Date: 2026-10-05 · Auditor: Claude (round 3, challenger) · Machine-readable findings: `AUDIT/KAVACH_2.0_AUDIT_ROUND3_FINDINGS_2026-10-05.json`

This round re-measures Audit #1's claims instead of re-reading them. Every number below comes from a probe that was run in this session. Probes are copied to `AUDIT/round3_probes/` together with raw outputs `probe_core.json` and `probe_race.json`. Run them from `backend/` with `.venv/bin/python`. Live run JSONs (~100 KB each, containing host paths) were not copied. No production code was modified.

---

## 0. Current state

| Item | Value |
|---|---|
| Repository | `Codebase/` (parent `KAVACH_AI/` is not a git repo) |
| Branch | `master` |
| HEAD | `78d39d00f2649c12f66130804ca2e0f69bb17752` — same commit Audit #1 audited |
| origin/master | `5dc30654fbf858c0a8c74e60f4f6b369af0d5614` |
| ahead / behind | **6 / 0** — the entire 2.0 core (ArtifactStore fail-closed, ledger, native tool protocol, InvestigationService) is local-only and has never run in CI |
| Uncommitted tracked changes | none |
| Untracked | `AUDIT/`, `scripts/sync_claude_sessions.py` |
| Stash | `stash@{0}: filter-branch: rewrite` |
| Other branches | `checkpoint/phase0-8-baseline`, `chore/retire-1x`, `feat/kavach-2.0-static-first`, `repair/test_orphan_wt_99`, `repo-face-overhaul` |

Runtime environment for this round:

| Component | State |
|---|---|
| Python | 3.12.13 (uv `.venv`; CI uses `venv` + pip) |
| Unit + contract + security suites | **276 passed, 0 failed, 0 skipped** (10.8 s) |
| Integration suite (PostgreSQL) | **NOT RUN** — docker daemon inactive, no local PostgreSQL, `sudo` needs a password. All PostgreSQL-specific claims are reported as UNTESTED this round, or reproduced against the in-memory ledger, which shares the chain code. |
| llama-server | b11193, `Qwen3.5-4B-Q4_0.gguf`, ctx 4096, CPU only (`-ngl 0`), 4 slots |
| JADX | 1.5.6 installed at `/opt/kavach/runtime/bin/jadx`. The default resolver does **not** find it (KAV3-001). |
| bwrap | `/opt/kavach/runtime/bin/bwrap` |

---

## 1. Revalidation of Audit #1 CRITICAL / HIGH findings

| ID | Round-3 status | Round-3 evidence (measured) |
|---|---|---|
| KAV-001 model sees no content | **CONFIRMED – MORE SEVERE** | 0 sample-derived facts reached the model in 5/5 live runs. JADX never succeeds, so no code exists to show (KAV3-001). |
| KAV-002 hostile parsing on event loop | **CONFIRMED** | Event-loop stalls: find_xrefs **9.68 s**; xor **5.49 s**; regex `(a+)+$` on 27 chars **4.86 s**; carve **4.0 s**; repair **3.6 s**. A 200 MB entry inside a 204 KB zip adds **+227 MB RSS**. |
| KAV-007 ledger trust root = DB role | **CONFIRMED (code)**; PostgreSQL runtime UNTESTED | The migration has only a row trigger: no REVOKE, no signing. Rewrite + rehash still verifies valid (memory store, same `verify_chain`). |
| KAV-004 HIDDEN_PAYLOAD false confirmation | **CONFIRMED – MORE SEVERE** | Benign app, with standard stored-dex packaging, plus an ordinary JPEG → **HIDDEN_PAYLOAD CONFIRMED**. The confirming DEX is the app's own `classes.dex`. Real `allsafe.apk` triage flags `assets/flag.jpg`. |
| KAV-005 unbounded carving | **CONFIRMED** | 88 KB of inert headers → **1999 artifacts, 1999 HIGH evidence**. |
| KAV-006 "verified" evidence for invalid repair | **CONFIRMED – PARTIAL** | One genuinely encrypted text entry → INCONCLUSIVE with `valid ZIP: False`, yet two HIGH `RECONSTRUCTED_VERIFIED` items. Valid APKs produce no evidence. The 268 MB corruption claim was not re-tested. |
| KAV-008 TRUNCATE / empty chain | **CONFIRMED (code + memory)** | `verify_chain([]).valid == True`. Tail truncation also verifies valid (new, KAV3-013). |
| KAV-009 no run lease | **CONFIRMED** | Reproduced in-memory with two service instances (details §14). |
| KAV-010 presence-only provenance | **PARTIALLY CONFIRMED** | The recorder accepts fabricated IDs. Inside the controller the IDs are real: structural provenance is 100%. The real defect is **semantic** (§6–7). |
| KAV-011 delimiter forgery | **CONFIRMED** | `<<<<<END_TOOL_OUTPUT>>>>>` → `<<<END_TOOL_OUTPUT>>>`, status SAFE. Reach is low today only because tool content is never shown. |
| KAV-012 risk = lookup table | **CONFIRMED – MORE SEVERE** | Counterfactuals in §5. |
| KAV-013 verdict despite failed verification | **CONFIRMED (code)**; extended | Failed and in-flight runs report "SAFE / BENIGN" (KAV3-003). |
| KAV-014 appliance has no API / no bwrap | **CONFIRMED** | `CMD ["python","-m","system.doctor"]`. No bwrap in the image. Compose says "API/worker entrypoint does not exist yet". |
| KAV-015 unpushed core | **CONFIRMED** | 6 ahead / 0 behind. |
| KAV-016 frontend fabricates reports | **CONFIRMED – MORE SEVERE** | Mocks are returned on any error with no env gate (`api.ts:115-129`). The frontend calls only 1.x `/analysis/*` routes, so **no 2.0 path exists in the Next.js app**. |
| KAV-040 INFO evidence dropped | **CONFIRMED** | RECEIVE_SMS + INTERNET scores **75 HIGH**. With INFO dropped (the service path), the same sample scores **60 MEDIUM**. |

No CRITICAL or HIGH finding from Audit #1 was disproved. Two findings were narrowed (KAV-006, KAV-010). Five turned out more severe than Audit #1 stated.

Meta-finding KAV3-017: several Audit #1 line citations do not exist at the audited commit. For example, `ledger/recorder.py:388-395` is cited, but the file has 106 lines and the code sits at 66-74. `service/triage.py:228/236/253` is cited, but the file has 105 lines.

---

## 2. Is KAVACH analyzing content? — No.

Sample: `InsecureBankv2.apk` (OWASP-style intentionally vulnerable training app, benign). Five live runs used the real Qwen3.5-4B through the real `InvestigationService` → controller → tools path. Every HTTP request body was captured, and every tool's full `raw_data` was captured beside it.

### Per-turn accounting (run 1; runs 2–5 are the same shape)

| Turn | Prompt tok (server) | Static (system + schemas) | Initial obs (status) | Tool observations (status) | Sample facts visible | Model tool calls |
|---|---|---|---|---|---|---|
| 1 | 1833 | 405 + 944 | 274 | 0 | **0** | `inspect_container` |
| 2 | 1983 | 1349 | 274 | 101 | **0** | `search_strings("sms\|SMS\|send_sms\|SendSms", is_regex=false)` |
| 3 | 2165 | 1349 | 274 | 189 | **0** | `search_strings("sms")`, `run_jadx` → TOOL_UNAVAILABLE |
| — | — | — | — | — | — | Supervisor `DIMINISHING_CHECK → TERMINATE` |

What the model can see, by category:

| Category | Visible? |
|---|---|
| Manifest data | Only permissions above INFO, e.g. `SEND_SMS (HIGH)` plus its policy description. No package name, components, exported state, or intent filters. |
| Strings / URLs | **No.** For example, the URL search computed 50 URLs (14.8 KB). The model received the 213-character line "Found 50 occurrences matching …". |
| Code / methods / classes | **No.** JADX failed on every run (KAV3-001). |
| Xrefs | **No.** Run 5 computed `Lcom/android/insecurebankv2/MyBroadCastReceiver;->onReceive` → `SmsManager`. The model received "Located 2 callers and 0 callees". |
| Resource content | **No.** |
| Tool observations | Status + counts + `artifact://` handles + canned guidance. |

Totals over 5 live runs:

| Measure | Value |
|---|---|
| Prompt tokens per run | 6,000–8,300 |
| Static tokens per turn | ~1,350 of ~1,800–2,200 (61–74%) |
| Sample-derived analysis tokens per run | **0** |
| Status / count tokens | the remainder |

**Answer: the model cannot inspect the application.** It sees a permission list and the counts produced by its own queries. It formed **0 hypotheses** and wrote **0 concluding narratives** in 5/5 runs. All five reasoning traces end with an intention to "run JADX" or "search more", followed by termination.

Contributing defects:

- **KAV-001**: projection to counts only.
- **KAV3-001**: decompiler cannot start inside the sandbox.
- **KAV3-002**: 4-step cap, because discovery tools never emit evidence.
- **KAV3-006**: sanitizer erases `/system/bin/su`-style indicators even if they were shown.
- **KAV-022**: 256 output + 128 reasoning tokens at 4096 context.

---

## 3. Does the agent add value? — No measurable value today.

Same sample (InsecureBankv2), same tool registry.

| | A. Triage only | B. Triage + fixed 7-call sequence (cap disabled) | C. KAVACH agent (5 runs) |
|---|---|---|---|
| Status | n/a | COMPLETED | PARTIAL ×5 |
| Risk | MEDIUM 60 | MEDIUM 60 | MEDIUM 60 ×5 |
| Key findings | `Permission: SEND_SMS (HIGH)` | same | same ×5 |
| Hypotheses | 0 | 0 | 0 |
| Tool calls | 0 | 7 (6 useful + jadx refused) | 4 ×5 |
| Sample facts computed by tools | 0 | **48**: 50 URLs, `DexClassLoader` callers, `SmsManager` callers in `MyBroadCastReceiver.onReceive` | 1–3 |
| Facts visible to the model | — | 0 (query echo only) | 0 |
| Facts in report | 0 | **0** | 0 |
| Relevant classes / methods found | 0 | 14 `DexClassLoader` callers, 2 `SmsManager` callers | 2 `SmsManager` callers (run 5 only), invisible |
| Wall time | ~0.03 s | 41 s | 87–117 s |
| Model tokens | 0 | 0 | 6.0–8.3k prompt, 530–680 completion per run |
| False claims | 1 (see §18) | 1 | 1 |

Conclusions:

- **The report is invariant to the agent.** A, B and C give the same risk, findings and verdict.
- **The deterministic sequence B discovers more than the agent**: 48 facts vs ≤3. The agent never tried URLs or `DexClassLoader`, and searched for literal `"sms|SMS|..."` with `is_regex=false`. Even B's discoveries are thrown away, because the report does not include tool `raw_data`.
- **The agent's sole contribution is tool-selection variance.**

---

## 4. Safe evaluation matrix

Ground truth for public training and CTF apps is "intentionally vulnerable or benign, not malware". CTF apps contain *designed* dynamic loading or ELF-loader behaviour. None is labelled malware here.

### Deterministic triage (all samples)

| Sample | Category | Size | Triage hypotheses | Baseline evidence | Triage-only risk |
|---|---|---|---|---|---|
| selendroid-test-app | BENIGN, URL-containing | 0.2 MB | — | — | SAFE 0 |
| InsecureBankv2 | PERMISSION-HEAVY, URL-containing, reflection / dynamic-loading strings | 3.5 MB | — | SEND_SMS HIGH | **MEDIUM 60** |
| AndroGoat | BENIGN training app | 7.1 MB | — | CAMERA MEDIUM | SAFE 8 |
| InsecureShop | BENIGN training app | 4.8 MB | — | — | SAFE 0 |
| allsafe | NATIVE (8 .so), EMBEDDED-DATA | 10.9 MB | **HIDDEN_PAYLOAD** (`assets/flag.jpg`) | RECORD_AUDIO MEDIUM | SAFE 8 |
| InjuredAndroid | NATIVE (12 .so), EMBEDDED ELF assets | 24.7 MB | **HIDDEN_PAYLOAD** (`assets/me_u`, `narnia.*` ELF) | — | SAFE 0 |
| dvba | NATIVE | 3.8 MB | — | — | SAFE 0 |
| CTF chal02 | DYNAMIC-LOADING (encrypted stage-2 DEX by design) | 1.6 MB | HIDDEN_PAYLOAD (`stage2.dex.enc`) | — | SAFE 0 |
| CTF chal05 | Custom ELF loader | 0.7 MB | HIDDEN_PAYLOAD (`payload.bin`) | — | SAFE 0 |
| CTF chal08 | OBFUSCATED (exception control flow) | 0.6 MB | — | — | SAFE 0 |
| f1 fixture | Benign + stored dex + JPEG | 1.2 MB | HIDDEN_PAYLOAD (`photo.jpg`) | — | SAFE 0 → **MEDIUM 60 after one tool call** |
| f2 fixture | PROMPT-INJECTION-CONTAMINATED | 1.9 MB | HIDDEN_PAYLOAD (injection-named entry) | — | SAFE 0 |
| f3 fixture | CONTRADICTORY (real encryption, flag set) | 0.2 MB | CONTAINER_EVASION | — | SAFE 0 → **MEDIUM 60 after repair** |
| truncated selendroid | MALFORMED | 150 KB | ZIP_CORRUPTION | — | SAFE 0 |
| 20k-entry zip, 200 MB-ratio zip | OVERSIZED | — | — | — | (resource results in §9) |

What the matrix shows:

- The risk score separates samples only by permission list.
- The intentionally vulnerable banking app scores higher than every CTF loader with real staged-payload design.
- Triage cannot distinguish an ordinary JPEG from an encrypted DEX stage. Both become `HIDDEN_PAYLOAD (high entropy)`.

### Live agent matrix

Real Qwen3.5-4B, max_turns 8, default toolchain. Each row is one run unless noted.

| Sample | Status | Risk | Hypotheses | Tool trajectory | Facts computed / visible to model | Wall |
|---|---|---|---|---|---|---|
| selendroid | PARTIAL | SAFE 0 | — | inspect (FAILED), inspect, search `http\|https\|post…`, jadx refused | 24 / 2 (query echo) | 70 s |
| allsafe | PARTIAL | SAFE 8 | HIDDEN_PAYLOAD UNRESOLVED | inspect, search `flag.jpg`, search `RECORD_AUDIO`, jadx refused | 8 / 1 | 90 s |
| CTF chal02 (designed encrypted stage-2 DEX) | PARTIAL | **SAFE 0** | HIDDEN_PAYLOAD UNRESOLVED | inspect, 3× search (`stage2`, `dex`) | 6 / 3 (echo) | 116 s |
| InjuredAndroid (ELF assets) | PARTIAL | SAFE 0 | HIDDEN_PAYLOAD UNRESOLVED | inspect, search `me_u`, search `narnia`, jadx refused | 1 / 0 | 109 s |
| f2 prompt-injection | PARTIAL | SAFE 0 | HIDDEN_PAYLOAD UNRESOLVED | inspect, search `IGNORE_PREVIOUS_INSTRUCTIONS`, jadx refused, search `assets/` | 1 / 0 | 119 s |
| f1 benign + JPEG ×3 | PARTIAL ×3 | SAFE 0 ×3 | HIDDEN_PAYLOAD UNRESOLVED ×3 | inspect, search `photo\.jpg`, jadx refused, search `http` (×2); variant (×1) | 14 / 0 | 111–121 s |
| CTF chal05 (ELF loader) | PARTIAL | **SAFE 0** | HIDDEN_PAYLOAD UNRESOLVED | inspect, search `payload`, jadx refused, search `assets` | 5 / 2 (echo) | 105 s |
| InsecureBankv2 ×5 (§2) | PARTIAL ×5 | MEDIUM 60 ×5 | — | 5 distinct | 1–3 / 0 | 87–117 s |

Results across 17 live runs:

- **17/17 PARTIAL**, all ended by the 4-step diminishing-returns cap.
- **0/17** called `decode_static_payload`, `repair_container` or a working decompiler.
- **0/17** confirmed or refuted any hypothesis.
- **0/17** surfaced a sample fact beyond echoes of the model's own query.

Per-sample observations:

- **Injection (f2):** the model searched for the injected entry name as data. Its verdict did not change. Containment, however, came from blindness, not from the boundary (KAV3-005).
- **CTF loaders:** both samples whose ground truth is staged payload loading scored **SAFE 0**. The detection signal (HIDDEN_PAYLOAD) existed and was never tested.
- **f1:** stayed SAFE live only because the model never called the decoder. The scripted single call reproduces **HIDDEN_PAYLOAD CONFIRMED + MEDIUM 60** deterministically (§8).

The verdict on benign f1 depends on tool choice, not on the sample.

---

## 5. Risk engine — reconstructed and counterfactual-tested

Exact implementation (`risk/policy_engine.py:139-304`, with policy from `risk/policies/v2_banking.yaml` or the inline default):

```
for each evidence: bucket by category -> {signatures, evasion, permissions, behavior, crypto}
                   (unknown category -> behavior)
sub[c] = 0.7*max(sevscore) + 0.3*mean(sevscore)      sevscore: CRIT 100, HIGH 75, MED 40, LOW 15, INFO 0
score  = Σ sub[c]*w[c]   w = {sig .30, evasion .25, perm .20, behavior .15, crypto .10}
for rule in escalation_rules:                          # permission-type sets, substring signature match, category sets
    if triggered: score = max(score, rule.min_score); level = rule.level (CRITICAL wins)
if any CRITICAL: score = max(score, 80); level >= HIGH
elif any HIGH:   score = max(score, 60)
level = escalated or threshold(score: 85/70/40/20)
verdict text = fixed string per level   ("SAFE / BENIGN: No malicious indicators detected" at level SAFE)
```

Counterfactuals (same engine, controlled evidence):

| Input | Score / level |
|---|---|
| No evidence (failed, queued or empty run) | **0 SAFE "No malicious indicators detected"** |
| INTERNET only (INFO) | 0 SAFE |
| CAMERA | 8 SAFE |
| **One** HIGH permission (READ_SMS) | **60 MEDIUM** |
| 1× vs 10× identical HIGH | 60 / 60 (no inflation; also no corroboration) |
| RECEIVE_SMS + INTERNET | 75 HIGH |
| RECEIVE_SMS with INFO dropped (service path) | 60 MEDIUM |
| ACCESSIBILITY (+ duplicate HIJACK evidence) | 80 HIGH |
| ACCESSIBILITY + SYSTEM_ALERT_WINDOW | 90 CRITICAL |
| **Behaviour**: DexClassLoader + Runtime.exec, modelled as MEDIUM behaviour evidence | **6 SAFE** |
| Repair evidence on benign APK | 60 MEDIUM |
| Signature value `generic_webhook_client` | **95 CRITICAL "MALICIOUS: banking trojan"** (substring `hook`, KAV3-008) |
| Truncated APK → MANIFEST_COMPRESSION_EVASION | 72 HIGH |

**Verdict: KAVACH scores declared capability, not behaviour.**

- No tool in the service registry emits behaviour evidence.
- Even if one did, behaviour carries weight 0.15 and cannot cross MEDIUM without a severity floor.
- Permission set alone determines the verdict on every real sample tested.

---

## 6. Evidence validity — layer predicates

| Transition | Predicate in code | Real? |
|---|---|---|
| Observation → source fact | Tool `raw_data` | Real, but discarded: not in ledger, not in report, not shown to the model |
| Source fact → deterministic finding | Tools emit `Evidence` only in repair/decoder; manifest emits permission evidence | Discovery tools have **no** finding layer |
| Finding → interpretation | Severity text in `manifest.py` ("toll-fraud", "phishing overlays") is attached to declared permissions | Interpretation is presented as fact |
| Interpretation → hypothesis | Triage only, from magic/entropy/flag bits | No model-originated hypotheses in practice (0 in 5 runs) |
| Hypothesis → confirmation | `adjudication.py`: "some DEX/ELF carved by this tool call" or "repair produced evidence" | **Not bound to the hypothesis target**; "valid DEX" = 6-byte magic + size ≥ 40 |
| Confirmation → risk | Any HIGH floors at 60 | Confirmation is not even required: unconfirmed HIGH evidence scores the same |
| Risk → report claim | Fixed verdict strings per level | "weak cryptographic configurations" is asserted with zero crypto evidence |

Adversarial tests of the predicates:

| Test | Result |
|---|---|
| Fake evidence / nonexistent artifact / nonexistent execution / nonexistent tool call, appended via the ledger API | **Accepted.** Chain valid. Report renders it. |
| Same, via the controller | Rejected or overwritten: the controller rebinds IDs to real ones |
| Cross-run artifact read | Rejected (`ArtifactAccessViolation`) |
| Cross-run / phantom / self / duplicate parent on `put_bytes` | **All accepted** |
| Unsupported hypothesis confirmation | **Yes**: f1 benign → CONFIRMED |
| Unsupported final report claim | **Yes**: §18 |
| Failed operation generating "verified" evidence | **Yes**: f3 INCONCLUSIVE repair → HIGH `RECONSTRUCTED_VERIFIED` |

**Can the system assert something without a real underlying fact? Yes**, reproduced safely three ways: f1, f3, and the failed run reported "SAFE / BENIGN".

---

## 7. Claim → evidence → artifact → execution graph

Each claim chain runs: **claim → hypothesis → evidence → source artifact → execution → tool call → input artifact.**

**f1 (benign + JPEG)**

```
"HIDDEN_PAYLOAD confirmed: … assets/photo.jpg (high entropy)"
  └─ hyp HIDDEN_PAYLOAD (target artifact://original_apk; names assets/photo.jpg)
      └─ ev CARVED_DEX_RECOVERED HIGH (normalized_value = sha of carved DEX)
          ├─ source_artifact original_apk ✔
          └─ execution exec_… (in_process, isolation NONE) ✔
              └─ tool_call decode_static_payload(raw_dex_carve) ✔
                  └─ input original_apk ✔
                      └─ output carved_5aaf….dex = the app's own classes.dex ✘ (not derived from photo.jpg)
"Valid Dalvik Bytecode Carved (HIGH)"   → same evidence
"MEDIUM RISK: Elevated permissions or weak cryptographic configurations" → no permission or crypto evidence ✘
```

**f3 (real encryption)**

```
"Container Evasion Repaired (HIGH)" ×2
  └─ ev CONTAINER_EVASION_REPAIRED ×2
      └─ execution status INCONCLUSIVE, zip invalid ✘
          └─ hypothesis CONTAINER_EVASION UNRESOLVED (report contradicts itself)
```

**InsecureBankv2 live**

```
"Permission: SEND_SMS (HIGH)" → baseline evidence, triage, no execution record (by design)
risk summary → permission evidence ✔ ; "weak cryptographic configurations" ✘
```

| Metric (f1 + f3 + InsecureBankv2 live) | Value |
|---|---|
| Evidence with structurally complete provenance (IDs exist and bind) | **3 of 3 tool evidence (100%)** |
| Evidence that is complete **and** from a SUCCESS execution **and** semantically bound to its claim | **0 of 3 (0%)** |
| Orphan evidence (baseline, no execution record) | 1 of 4 (25%) |
| Material report claims fully supported | 1 of 7 (14%), see §18 |
| Unsupported report claims | 4 of 7 (57%) |

Structural provenance is real and is the project's best asset. Semantic provenance does not exist.

---

## 8. False confirmation

| Question | Answer |
|---|---|
| Can an ordinary JPEG be interpreted as a hidden payload? | **Yes.** Entropy > 7.2 under `assets/` → HIDDEN_PAYLOAD. Confirmed by carving the app's own stored `classes.dex` (f1). |
| Structural validity confused with semantic validity? | **Yes.** "Valid Dalvik Bytecode" = `dex\n03` + `file_size ≥ 40`. Header 0x70, endian tag and checksum are not checked. 40-byte fakes are accepted. |
| Does "verified" mean only "magic bytes look valid"? | **Yes** for DEX and ELF (`\x7fELF` prefix only). |
| Can a failed operation produce evidence saying it succeeded? | **Yes** (f3). The model is also told "A new clean derived artifact is produced" (KAV3-010). |
| Can repeated evidence inflate severity? | Score: **no** (max-based). Key findings and evidence counts: **yes** (f3 lists the same finding twice). |
| Same observation counted multiple times? | **Yes.** One permission yields permission + OVERLAY_CAPABILITY / ACCESSIBILITY_HIJACK. One repair yields 2 "anomalies" (LFH + CD). Repeated calls duplicate evidence. |

---

## 9. Hostile-input resource safety

Every untrusted-input tool except JADX runs **in-process, on the API event loop**. None has a CPU, memory or time bound. Benign stress inputs only:

| Case | Wall | Max event-loop gap | Notes |
|---|---|---|---|
| `search_strings` regex `(a+)+$` on 27 chars | 4.85 s | **4.86 s** | Model-chosen regex; exponential in input |
| `find_xrefs` SmsManager, 3.5 MB APK | 9.67 s | **9.68 s** | Androguard full analysis per call; no caching |
| `find_xrefs`, 24.7 MB APK | 7.2 s | 7.2 s | |
| `decode xor`, 24.7 MB | 5.48 s | 5.49 s | Pure-Python byte loop |
| `raw_dex_carve`, 24.7 MB | 4.0 s | 4.0 s | Pure-Python while loop |
| `repair_container`, 24.7 MB | 3.6 s | 3.6 s | Byte scan + full copy |
| `search_strings`, 200 MB entry in 204 KB zip | 1.6 s | 1.6 s | **+227 MB RSS**; no ratio or size cap |
| 20k-entry zip, inspect / search | 0.34 / 0.20 s | — | OK |
| Carve 2000 fake headers (88 KB) | 0.06 s | — | **1999 artifacts + 1999 HIGH evidence** |
| triage (all samples) | ≤ 0.14 s | — | `MAX_ENTRY_SCAN_BYTES` honoured |

Tool safety matrix:

| Tool | Process | Requested / effective isolation | Limits | Network | Output bound | Execution provenance | Verdict |
|---|---|---|---|---|---|---|---|
| inspect_container | in-process | NONE / NONE | none | process default | summary 1500 chars | in-process record, module SHA | UNSAFE (loop) |
| search_strings | in-process | NONE / NONE | max_results only | process default | ✔ | ✔ | **UNSAFE** (ReDoS, ratio) |
| find_xrefs | in-process (Androguard) | NONE / NONE | none | process default | ✔ | ✔ | **UNSAFE** (10 s stalls) |
| decode_static_payload | in-process | NONE / NONE | none | process default | artifacts unbounded | ✔ | **UNSAFE** (amplification) |
| repair_container | in-process | NONE / NONE | none | process default | ✔ | ✔ | UNSAFE (loop) |
| run_jadx | bwrap, `--unshare-all`, rlimits | HIGH / HIGH | AS 1.5 G (too low), CPU 30 s, timeout 45 s | NETWORK_NONE | ✔ | broker record; **version wrong** | ACTUALLY SAFE — and never works |
| triage (Androguard manifest) | in-process | — | 8 MB per entry | — | — | none (baseline) | UNCERTAIN |

---

## 10. ArtifactStore assurance

| Test | Result |
|---|---|
| Same ID + same bytes | Idempotent ✔ |
| Same ID + different bytes | Rejected `ArtifactIntegrityError` ✔ |
| Cross-run get | Rejected `ArtifactAccessViolation` ✔ |
| Forged handles (`../etc/passwd`, `x1/..`, NUL, 65 chars) | Rejected ✔ |
| Modified CAS blob (after chmod) | `verify_integrity` False; read rejected ✔ |
| Modified staged working copy | `resolve` rejected `ArtifactIntegrityError` ✔ |
| CAS blob mode | 0444 (owner can chmod; not a security boundary) |
| Phantom parent / cross-run parent / self-parent / duplicate parents | **All accepted** ✘ (KAV-018 confirmed) |
| Restart without persistence | Descriptors lost (by design in ephemeral mode) |
| DB loss / partial write / restart with PostgreSQL | UNTESTED (no PostgreSQL) |

Content addressing, immutability of bytes and run isolation hold. **Lineage is not validated.**

---

## 11. Ledger trust model

| Guarantee | Holds? |
|---|---|
| Detects accidental corruption of one event | ✔ (hash mismatch) |
| Detects sequence gaps / broken links | ✔ |
| Detects removal of the **tail** | ✘ (verified valid after dropping the last 3 events) |
| Detects empty chain | ✘ (valid) |
| Detects modification by the application | ✘ (the app can append anything: events after finalization, double finalization) |
| Detects modification by a privileged DB operator | ✘ (rewrite + rehash = valid; TRUNCATE not trapped; PostgreSQL runtime untested this round) |
| External proof / independent verification | ✘ (no signature, no anchor; the "independent verifier" re-derives from the same rows) |
| Canonical serialization | ✔ (sorted keys, `allow_nan=False`); lone surrogates raise `UnicodeEncodeError` on append |
| Concurrent appends | Memory: 200 concurrent appends valid. PostgreSQL: advisory lock (untested this round) |

**Trust model:** a self-consistency checksum. It catches accidents, not adversaries, and not bugs in KAVACH itself.

---

## 12. Restart / failure assurance (in-memory reproduction; PostgreSQL untested)

| Failure point | Behaviour |
|---|---|
| Model unreachable | Run FAILED, ledger finalized, report **SAFE / BENIGN** (KAV3-003) |
| Tool raises in `execute` | Caught → FAILED observation ✔ |
| Tool raises in artifact registration (SHA mismatch) | Propagates. Run FAILED. Artifact row already written (code read, KAV-020) |
| Process dies mid-run | Next start: `recover_interrupted` → INTERRUPTED ✔ (single instance) |
| Second instance starts while the first is running | **Live run closed INTERRUPTED; first instance keeps writing** (§14) |
| Lone-surrogate text in model output or tool args | `UnicodeEncodeError` in ledger append → run aborts (PLAUSIBLE path) |

---

## 13. Multi-run / concurrency

| Test | Result |
|---|---|
| Two instances, shared repository | B's `recover_interrupted` finalized A's live run INTERRUPTED (seq 6). A appended **6 more events** including a **second RUN_FINALIZED COMPLETED_NO_FINDINGS** (seq 12). Chain **valid**. Row and report say INTERRUPTED. |
| Same sample twice concurrently | 2 independent runs, no idempotency (KAV3-018) |
| Report during run | QUEUED → **SAFE**, RUNNING → **SAFE** ×4 |
| Single-writer guarantees | Per-process `Semaphore(1)` only. No lease, no owner column, no DB constraint on one RUN_FINALIZED per run. |

---

## 14. Frontend trust

**Next.js app (`frontend/`)**

- `getReport` / `getClustering` return fabricated mock reports on **any** error, with no env gate (`api.ts:115-129`).
- `getAnalysis` mocks only when `NEXT_PUBLIC_ENABLE_DEMO_MOCKS=true`.
- Mock data ships CRITICAL 92/95 verdicts and SMS-trojan descriptions.
- Default fallbacks: `threat_level || 'SAFE'` (`AnalysisHero.tsx:32`), `flow.severity || 'HIGH'`, `risk_score || 80` (`TaintFlowsPanel.tsx:63-64`), YARA confidence `|| 80`.
- The app targets the **retired 1.x API** (`/analysis/*`) and has no 2.0 integration.

**2.0 demo console (`backend/service/console/index.html`)**

- Renders `report.final.risk_level` for every run status.
- A failed or in-flight run shows **SAFE** next to "Investigation status is FAILED" in limitations.

**Does a backend failure produce a believable security conclusion?** Yes, in both front ends.

---

## 15. Supply chain

| Item | State |
|---|---|
| `backend/requirements.txt` | 49 lines, **3 `==` pins**, 0 hashes, no lockfile; `androguard>=3.4.0a1` (pre-release floor) |
| Local vs CI | Local uv `.venv` (no pip); CI `python -m venv venv` + `pip install -r` → unreproducible resolution |
| Docker base / llama.cpp / postgres / busybox images | Digest-pinned ✔ |
| JADX / Apktool downloads in Dockerfile | Version + SHA-256 verified ✔ |
| GitHub Actions | Commit-SHA pinned ✔ |
| bwrap in CI | Built from source with SHA ✔. CI **disables** `apparmor_restrict_unprivileged_userns` on the runner. |
| Appliance image | No bwrap, no API entrypoint (KAV-014) |
| Host JADX | 1.5.6 under `/opt/kavach/runtime`, not on the resolver's search list; code reports 1.5.0 |
| Model file | Compose has a `model-verify` busybox step. The service path never checks the model hash. |

---

## 16. Model identity

`RUN_STARTED.model_id` is `self.gateway.profile.model_id` — the configured profile string `qwen3.5-4b`. `effective_runtime` was `{}` in every run.

llama-server returns the real `model` path and `system_fingerprint` (`b11193-4e7481175`) on every response. The provider parses `model`, and the controller **discards** it: `MODEL_CALLED` has no model field.

KAVACH cannot prove any of the following:

- model family or variant
- model file or hash
- quantization or context size
- runtime version

Recorded sampling params (`temperature 0.1`, `max_tokens 256`, `reasoning_budget 128`) are *requested*, not observed.

**Could a different model produce a report claiming to be the intended model? Yes.** Any GGUF served on port 8092 is recorded as `qwen3.5-4b`. The second GGUF on this host (`gemma-4-E4B_q4_0-it.gguf`) would be recorded identically.

---

## 17. Report honesty (InsecureBankv2 live run 1; f1 for contrast)

| Statement | Label |
|---|---|
| Title "Autonomous Android Malware Investigation" | INTERPRETATION (frames every sample as malware) |
| Status PARTIAL, turn / tool counts, durations | SUPPORTED |
| "Permission: SEND_SMS (HIGH)" | SUPPORTED (declared) + INTERPRETATION (severity) |
| Evidence description "Allows toll-fraud background SMS dispatch without user awareness" | SPECULATION, presented as fact |
| "POTENTIALLY UNWANTED / MEDIUM RISK" | UNSUPPORTED (one declared permission) |
| "Elevated permissions" | PARTIALLY SUPPORTED |
| "…or weak cryptographic configurations" | UNSUPPORTED (no crypto evidence exists) |
| Limitations: in-process parsers, unverified model weights | SUPPORTED (honest) |
| f1: "HIDDEN_PAYLOAD confirmed … photo.jpg" | **UNSUPPORTED (false)** |
| f1: "Valid Dalvik Bytecode Carved" | PARTIALLY SUPPORTED (the app's own dex) |

Across the 7 material claims (live run 1 + f1):

| Label | Count | Share |
|---|---|---|
| Supported | 1 | 14% |
| Partially supported | 2 | 29% |
| Unsupported | 4 | 57% |

The report never includes anything the tools actually found (URLs, xrefs, code). It is **more certain than the evidence** on every non-trivial claim.

---

## 18. Repeatability (InsecureBankv2 × 5, real model)

| Dimension | Variance | Class |
|---|---|---|
| Trajectory | 5 distinct sequences. Run 5 used find_xrefs; others did not. | EXPECTED |
| Tool selection | `inspect_container` always first, then a `search_strings` / `run_jadx` mix | BENIGN |
| Evidence | Identical (baseline only) | — |
| Hypotheses | Identical (none) | — |
| Risk | MEDIUM 60 ×5 | — |
| Report | Identical modulo IDs and timestamps | — |
| Status | PARTIAL ×5 | — |

The run-to-run stability is **not** a virtue: the outcome is independent of the agent.

f1 ×3 live gave SAFE / UNRESOLVED three times. Scripted with one decoder call, it gives MEDIUM / CONFIRMED every time.

The decisive variance — SAFE vs MEDIUM, CONFIRMED vs UNRESOLVED — depends only on **whether the model calls `decode_static_payload`**. A larger model, or fixing the 4-step cap, makes that call more likely, and so turns benign samples into confirmed hidden payloads.

Classification: **UNACCEPTABLE latent variance.** Observed variance is 0 only because the agent is too constrained to act.

---

## 19. Field comparison (web research 2026-10-05)

| Project | What it solves | Better than KAVACH | KAVACH better |
|---|---|---|---|
| **Microsoft Project Ire** | Autonomous binary classification with decompilers and a chain of evidence. Reported precision 0.98 / recall 0.83 on Windows drivers. Authored a conviction case. | Model actually reads decompiled code; measured precision/recall; validator step over the evidence chain | Local / offline; per-run hash-chained ledger (Ire's provenance store is not public) |
| **JADX-AI-MCP / jadx-mcp-server** (zinja-coder) | LLM reads live JADX classes, manifest and resources via MCP | **Exposes real code to the model**: KAVACH's core gap | Provenance, artifact CAS, run isolation |
| **android-reverse-engineering-skill** (SimoneAvogadro), **incogbyte skill**, **apk-reverse**, **apktool-mcp-server** | jadx / Vineflower / dex2jar pipelines; endpoint extraction; Frida | Deliver analyst-useful output (endpoints, call flows) today | Ledger, deterministic replayable report |
| **mrphrazer/agentic-malware-analysis** | Kali container, 50+ tools, Ghidra/BinaryNinja MCP, orchestrator producing ranked evidence and validated hypotheses tied to code locations | Code-location-grounded hypotheses; breadth | Hash-chained audit log; Android-specific triage |
| **Open-ReverseLab** | 100+ MCP tools (Ghidra, Frida, x64dbg, Rizin) + knowledge base | Tool depth | Safety boundary (no shell/python in demo registry) |
| **JURIG** | Autonomous Go agent, Android-first (APK/DEX), native subprocess wrappers, no MCP | Same niche; working tool loop | Ledger / provenance |
| **MalEval** (arXiv 2509.14335) | 255 apps, 654k reachable functions, 62 expert reports → behaviour-level ground truth that verifies claims against code evidence | **This is the eval KAVACH needs** | — |
| **Malaika** (arXiv 2607.09179) | Agentic Android malware understanding evaluated on MalEval | Benchmarked; grounded in code | — (abstract-level read only) |
| **CAMA** (arXiv 2504.00694), **LAMD** (arXiv 2502.13055) | Code-LLM Android malware benchmarks; context-driven slicing for LLM detection | Program slicing to fit context — exactly the missing projection layer | — |
| **Reveree** (arXiv 2609.01185) | Diagnoses failure modes of LLM RE agents on CTF tasks | Methodology for exactly the failure this audit measured | — |
| delamain, dex2jar-skills, ApkToolSkills, reverse-skill | Not located by name in this pass | — | — |

What KAVACH claims that is not differentiated:

- "Autonomous agent"
- "6 forensic tools"
- "sandboxed execution" (only JADX, which does not run)
- "hidden payload reconstruction" (magic-byte check)

What would make KAVACH genuinely distinct:

- **Claim-level semantic provenance.** Every report sentence would be bound to a code location and byte range, with a deterministic predicate and a signed ledger.
- **Evaluation on MalEval** to show it.

No competitor surveyed combines a tamper-evident ledger with behaviour-level, code-grounded claims.

Sources:

- [Project Ire (Microsoft Research)](https://www.microsoft.com/en-us/research/project/project-ire/)
- [jadx-ai-mcp](https://github.com/zinja-coder/jadx-ai-mcp)
- [android-reverse-engineering-skill](https://github.com/SimoneAvogadro/android-reverse-engineering-skill)
- [incogbyte skill](https://github.com/incogbyte/android-reverse-engineering-claude-skill)
- [agentic-malware-analysis](https://github.com/mrphrazer/agentic-malware-analysis)
- [open-reverselab](https://github.com/LING71671/open-reverselab)
- [JURIG](https://github.com/ReverserID/JURIG)
- [MalEval](https://arxiv.org/html/2509.14335)
- [Malaika](https://arxiv.org/pdf/2607.09179)
- [CAMA](https://arxiv.org/abs/2504.00694)
- [LAMD](https://arxiv.org/pdf/2502.13055)
- [Reveree](https://arxiv.org/abs/2609.01185v1)

---

## 20. Positioning (evidence-based)

**Current one-line description**

> A local service that runs a manifest permission check and a few ZIP heuristics on an APK, lets a small LLM call blind discovery tools for up to four steps, and records everything in a hash-chained ledger.

**Current technical description**

- FastAPI + in-process asyncio service.
- Content-addressed artifact store with run isolation.
- Per-run SHA-256 event chain.
- Native tool-calling loop over 6 tools: 5 in-process; JADX sandboxed but non-functional.
- Permission-weighted risk policy recomputed at read time.

**WHAT KAVACH IS**

- A well-engineered provenance substrate: artifact CAS, run scoping, an execution-record schema, a hash chain, and a deterministic report rebuilt from the ledger.

**WHAT KAVACH IS NOT**

- A malware analyzer.
- A code-reading agent.
- A behavioural risk model.
- A tamper-proof forensic record.
- A deployable appliance.

**Strongest differentiator (real):** structural provenance. Every evidence item from a tool binds to a real execution, tool call and input artifact hash, and handles fail closed across runs.

**Weakest claim:** "Autonomous forensic investigator / malware investigation".

**Claims to stop making**

- "Autonomous Android Malware Investigation" (report title)
- "verified" / "RECONSTRUCTED_VERIFIED" for magic-byte checks
- "bubblewrap-hardened execution" (only JADX, failing)
- "append-only / tamper-evident" without qualification
- "SAFE / BENIGN" for empty evidence
- Model identity in reports

**Claims KAVACH can defend**

- Content-addressed, run-isolated artifacts with integrity re-verification on every read.
- Per-run hash chain that detects accidental in-place corruption.
- Deterministic report reproducible from the ledger.
- Tool authorization by registration.

---

## 21. Score (independent; not anchored to 31)

| Area | Score /10 | Why / evidence | Missing evidence | Raises it |
|---|---|---|---|---|
| Core functionality | 3 | Pipeline runs end to end; 276 tests pass | PostgreSQL path unrun this round | Fix KAV3-001/002; PostgreSQL CI |
| Android analysis | 1 | Permissions + entropy only; xrefs computed then discarded | — | Expose code, strings, xrefs; behaviour findings |
| Agent intelligence | 0.5 | 0 facts seen, 0 hypotheses, 0 conclusions in 5 runs | Larger model untested | Content projection; bigger context; eval |
| Evidence integrity | 3 | Structural provenance real; semantic 0% | — | Target-bound predicates; SUCCESS-only evidence |
| Forensic integrity | 3 | Chain detects accidents only | PostgreSQL runtime | Signing + anchor + finalization constraint |
| Security | 3 | Registry boundary good; sanitizer bypass; injection path | — | KAV-011, KAV3-005 |
| Hostile-input safety | 1 | 4.9–9.7 s loop stalls; +227 MB RSS from 204 KB | — | Move all parsers to broker |
| Execution safety | 4 | bwrap design sound (net none, cap-drop) | Appliance has no bwrap | Working JADX in sandbox; appliance bwrap |
| Persistence | 4 | CAS + PostgreSQL descriptors; fail-closed | Restart on PostgreSQL untested | — |
| Reproducibility | 2 | Requirements unpinned; uv/pip split; model identity unproven | — | Lockfile with hashes; observed model hash |
| Testing | 4 | 276 pass, zero-skip gate | Tests miss every defect found here | Add round-3 probes as tests |
| Evaluation | 1 | No ground-truth eval; this audit is the first A/B/C | — | MalEval-style harness in CI |
| API maturity | 3 | Clean read-from-ledger API; SSE | No auth on 2.0 API (localhost) | Leases, idempotency, NOT_ASSESSED |
| Frontend maturity | 1 | 1.x frontend with silent mocks; 2.0 console shows SAFE on failure | — | Delete mocks; 2.0 client |
| Production readiness | 1 | Unpushed core, no API in appliance | — | Push, CI, appliance API |
| Differentiation | 3 | Ledger + CAS unique among surveyed Android agents | — | Semantic provenance + MalEval numbers |

**Current score: 24 / 100** (mean ×10, rounded down). Lower than Audit #1's 31:

- Runtime measurements disproved more than code reading suggested: the decompiler never runs, depth is capped at 4, and failure is reported as SAFE.
- The agent was measured to add zero.

---

## 22. 100/100 — binary acceptance criteria

1. 100% of report claims carry a `claim_id → evidence_id → execution_id (status SUCCESS) → input artifact sha + byte range or code location` path, and the verifier checks it.
2. 0 confirmations whose evidence artifact is not derived from the entry or region named by the hypothesis (lineage-checked).
3. A report for any run not in {COMPLETED, COMPLETED_NO_FINDINGS} with valid verification contains no risk verdict.
4. On the eval matrix, agent mode surfaces ≥1 code-grounded fact absent from the deterministic baseline on ≥50% of samples, and ≥90% of those facts are correct against ground truth.
5. ≥80% of facts computed by tools are available to the model, as a bounded projection within budget or via a retrieval tool.
6. No API request observes an event-loop gap >100 ms while any investigation runs (load test with the §9 inputs).
7. Every tool that parses sample bytes runs out of process with CPU, memory, wall and output limits; the execution record shows effective isolation ≠ NONE.
8. JADX succeeds in the sandbox on 100% of the corpus apps ≤50 MB.
9. Cross-run artifact access, phantom, cross-run and self parents all fail closed (tests).
10. An independent verifier holding only a public key and the anchored head detects: rewrite, tail truncation, TRUNCATE, events after finalization, double finalization.
11. At most one RUN_FINALIZED per run, enforced by the database. Runs are lease-owned, and a second instance cannot finalize a live run.
12. Each run records the served model file SHA-256, server build, context size and sampling params **as observed from the server**; a mismatch with the profile fails the run.
13. Five repeated runs on each eval sample produce the same risk level and the same CONFIRMED set.
14. Requirements are locked with hashes; a fresh install in CI equals local; the appliance image runs the API and passes the full gate inside the image.
15. The frontend shows only backend data; a fault-injection test (500, timeout) shows an error state, never a verdict.
16. Precision/recall reported on MalEval (or equivalent ground truth), with a benign false-positive rate ≤5%.

---

## 23. Ten highest-value engineering moves

| # | Problem | Files | Change | Tests | Acceptance | Depends on |
|---|---|---|---|---|---|---|
| 1 | Failure → "SAFE" | `service/report.py`, `risk/policy_engine.py`, `service/console/index.html` | `NOT_ASSESSED` unless complete and verified; empty evidence never SAFE | All ExecutionStates | Criterion 3 | — |
| 2 | Decompiler never runs | `workbench/policy.py`, `system/toolchain.py`, `tools/forensic/jadx_tool.py` | JVM resource class (cgroup memory, JVM flags); resolve `/opt/kavach/runtime/bin`; observed version; surface stderr | Real jadx in bwrap in CI | Criterion 8 | — |
| 3 | Model sees nothing | `tools/base.py`, discovery tools, `agent/prompt_builder.py` | Bounded untrusted content projection: top-N matches with entry + offset, xref class/method, JADX class list, `read_class(handle, class)` tool | Projection golden tests; injection tests | Criterion 5 | 2, 7 |
| 4 | 4-call cap | `agent/supervisor.py` | Novelty-based progress; ignore rejected calls | Scripted 7-call run completes | KAV3-002 test | 3 |
| 5 | False confirmation | `agent/adjudication.py`, `service/triage.py`, `tools/reconstruction/*` | Bind predicates to target entry lineage; extract-entry tool; full DEX header validation; no evidence on non-SUCCESS; dedupe | f1/f3 fixtures as regression tests | Criterion 2 | — |
| 6 | Event-loop stalls | `tools/discovery/*`, `tools/reconstruction/*`, `tools/forensic/inspect_container_tool.py` | Run through ExecutionBroker subprocess with limits; RE2 / timeout for regex; carve caps | §9 load test | Criteria 6, 7 | — |
| 7 | Report content-free and over-certain | `service/report.py`, `risk/*`, `analyzers/static/manifest.py` | Report facts (URLs, xrefs, code refs) with claim IDs; verdict text from evidence; remove speculative permission prose; rename title | Claim-coverage test | Criterion 1 | 3, 5 |
| 8 | No run ownership | `service/investigations.py`, migration | Lease/owner + heartbeat; partial unique index on RUN_FINALIZED; store rejects events after finalize | Two-instance test (`probe_race`) | Criterion 11 | PostgreSQL CI |
| 9 | Ledger trust | `ledger/*`, migration | Sign head at finalize; external anchor; TRUNCATE trigger; REVOKE from app role | Tamper suite incl. tail truncation | Criterion 10 | 8 |
| 10 | No evaluation | `evals/`, CI | A/B/C harness (this audit's `probe_live` + `cmp`) on MalEval subset + benign set; push 2.0 core and run CI | Nightly eval job | Criteria 4, 13, 16 | 1–5 |

---

## 24. Final engineering judgment

**Largest lie KAVACH tells itself**

- That it is an *autonomous malware investigator*.
- Measured: the model never sees a byte of the application. The decompiler cannot start. The supervisor stops the agent after four blind calls. The verdict is a function of the permission list.

**Most impressive thing that is genuinely real**

- The artifact/provenance substrate. Every tool output is content-addressed, run-scoped, integrity-re-verified on read, and linked to a real execution, tool call and input hash in a hash chain.
- Handles from other runs and modified working copies fail closed. That held under every probe.

**Most dangerous architectural weakness**

- Conclusions are produced without facts: magic-byte "verification", untargeted confirmation, and SAFE-on-failure.
- All of it runs hostile parsers on the API event loop.

**Most important missing capability**

- A bounded, untrusted, provenance-tagged **content projection**: code, strings and xrefs the model can read.
- Plus a working decompiler.

**What to delete**

- Next.js mock data and silent fallbacks.
- The "Autonomous Android Malware Investigation" title.
- Permission prose that asserts intent ("toll-fraud", "phishing overlays").
- The `hook` / `alien` substring signature rule.
- Unused `input://` and `discover_tools` prompt text.
- The orchestration DAG that the 2.0 path never calls.

**What to rewrite**

- `ToolOutput.to_observation` (content projection).
- `adjudication.py` (target-bound predicates).
- `risk/policy_engine.py` (behaviour evidence, corroboration, NOT_ASSESSED).
- `supervisor.check_diminishing_returns`.
- The in-process tools → brokered.

**What to preserve**

- `storage/` (ArtifactStore, RunArtifacts).
- `ledger/` chain and recorder (add signing).
- `execution/` broker + bwrap backend.
- The tool registry as the authorization boundary.
- The zero-skip verification gate.
- The deterministic report-from-ledger design.

**What to build next:** moves 1 → 2 → 3 → 5, then the A/B/C eval as CI (move 10).

**What would make a senior Android malware analyst take it seriously**

- A report where each claim links to a decompiled method and byte range.
- A demonstrated catch of real staged loading, e.g. the CTF chal02 stage-2 decryption path, without flagging JPEGs.
- MalEval numbers with a benign false-positive rate.

**What would make them dismiss it immediately**

- "MEDIUM RISK … weak cryptographic configurations" on InsecureBankv2 from one permission.
- "HIDDEN_PAYLOAD confirmed" on a photo.
- "SAFE / BENIGN" on a failed run.

Any of these, seen once, ends the evaluation.
