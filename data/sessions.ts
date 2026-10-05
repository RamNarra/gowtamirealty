export interface SessionRecord {
  id: string;
  sessionId: string;
  remoteBridgeId?: string;
  title: string;
  category: 'AUDIT' | 'IMPLEMENTATION' | 'STORAGE' | 'RESEARCH';
  badgeColor: string;
  timestamp: string;
  formattedDate: string;
  timeAgo: string;
  model: string;
  workingDir: string;
  stepCount: number;
  thinkingBlocksCount: number;
  fileSize: string;
  downloadUrl: string;
  summary: string;
  highlights: string[];
  verificationStats?: {
    suite: string;
    passed?: number;
    failed?: number;
    notes?: string;
  }[];
  finalOutputText: string;
}

export const CLAUDE_SESSIONS: SessionRecord[] = [
  {
    "id": "kavach-brutal-audit",
    "sessionId": "d496e9f3-cbd8-4084-bc87-2a931f4503ee",
    "remoteBridgeId": "cse_01EmLtG1EyKA3tREek2VSM2d",
    "title": "KAVACH 2.0 Adversarial Engineering Audit & Security Hardening Probe",
    "category": "AUDIT",
    "badgeColor": "rose",
    "timestamp": "2026-10-05T05:54:49.017Z",
    "formattedDate": "Oct 5, 2026 \u2022 12:16 PM IST",
    "timeAgo": "Latest (Today)",
    "model": "claude-opus-5-5",
    "workingDir": "/home/p4cketsn1ff3r/Projects/Active/KAVACH_AI",
    "stepCount": 233,
    "thinkingBlocksCount": 79,
    "fileSize": "891 KB",
    "downloadUrl": "/claude2_audit_session.txt",
    "summary": "Full adversarial audit across source code, tests, runtime behavior, bwrap sandbox, and PostgreSQL append-only ledger. Executed 12 general probes, 6 PostgreSQL tamper probes, and live Qwen 3.5 4B runs. Score: 31/100 (projected 62/100 with blockers resolved). Identified 37 findings (KAV-001 through KAV-037).",
    "highlights": [
      "Model Code Blindness (KAV-001): Tools only return count of occurrences; model never inspects raw decompiled code.",
      "Ledger Tamper Vulnerability (KAV-004): Superuser DB credentials allow chain rewrite and TRUNCATE bypass.",
      "Hostile Input Event-Loop Stall (KAV-005): Regex & xref scans freeze server and balloon memory to 8.7 GB.",
      "False Evidence Injection (KAV-003): Benign JPEGs falsely confirmed as HIDDEN_PAYLOAD."
    ],
    "verificationStats": [
      {
        "suite": "UNIT & CONTRACT",
        "passed": 200,
        "failed": 0,
        "notes": "Clean passes on core schemas"
      },
      {
        "suite": "SECURITY",
        "passed": 76,
        "failed": 0,
        "notes": "Real bwrap 0.12.0 isolation"
      },
      {
        "suite": "INTEGRATION",
        "passed": 21,
        "failed": 0,
        "notes": "Tested against PostgreSQL 17"
      }
    ],
    "finalOutputText": "I finished the audit. Score: **31/100** now, about **62/100** if the critical blockers are closed. That second number needs no new features, but getting past 80 needs real code-level analysis plus a proper evaluation. I didn't change any production code. The only addition is an untracked `AUDIT/` directory, and nothing was committed.\n\n**Files**\n- [KAVACH_2.0_BRUTAL_AUDIT_2026-10-05.md](AUDIT/KAVACH_2.0_BRUTAL_AUDIT_2026-10-05.md): all 24 sections, the final question, probe evidence and a standards mapping.\n- [KAVACH_2.0_FINDINGS_2026-10-05.json](AUDIT/KAVACH_2.0_FINDINGS_2026-10-05.json): 37 findings with stable IDs (`KAV-001`\u2026).\n\n**What I ran**\n- **Test suites:** unit and contract 200 passed, security 76 passed (real bwrap 0.12.0), integration 21 passed against a separate throwaway PostgreSQL 17. `alembic check` showed zero drift.\n- **Adversarial probes:** 12 general probes plus 6 PostgreSQL tamper probes.\n- **Live end-to-end runs:** real Qwen3.5-4B on llama-server through the production wiring, on three samples. Everything was static analysis; no sample was executed.\n\n**What would sink a demo**\n1. **The model never sees the code (KAV-001).** Every tool hands it only a count, like `\"Found 37 occurrences matching 'camera'\"`. On a live run against AndroGoat, the agent stopped at turn 5 having learned nothing.\n2. **The verdict can't tell harmless from suspicious (KAV-012/040).** The repo's own harmless demo sample scored MEDIUM 60, and so did a suspected SMS-stealer sample. The SMS-stealer rule can never fire on this path because triage throws away the `INTERNET` permission it needs.\n3. **The evidence can say things that aren't true.**\n   - A benign APK (one JPEG in `assets/`, a normal `classes.dex`) gets `HIDDEN_PAYLOAD` CONFIRMED.\n   - An 80 KB file produces 2,000 HIGH evidence items.\n   - A failed repair still records \"verified\" evidence.\n4. **The ledger can be rewritten.**\n   - The app's database user owns the ledger table, and with the Docker defaults it is a superuser. Rewriting and re-hashing the chain still passes `/verify`, and the report flips MEDIUM to SAFE.\n   - `TRUNCATE` gets past the append-only trigger, and an empty chain verifies as valid.\n   - A second service instance can produce two conflicting `RUN_FINALIZED` events that still verify.\n5. **Hostile input freezes the service.**\n   - A model-chosen regex blocked the server for 4.6 s with zero event-loop ticks.\n   - `find_xrefs` on a 7 MB APK: 14.5 s and 970 MB of memory.\n   - On a 268 MB APK, `find_xrefs` passed 8.7 GB of memory before I killed it to stop the machine running out of memory.\n6. **Neither the core nor the shipped packaging is ready.**\n   - The six commits with the 2.0 core (4,019 lines) are local only and CI has never run them.\n   - The appliance image has no API service and no bwrap, so the sandbox can't run in it.\n   - The old 1.x frontend quietly shows a made-up \"MALICIOUS 92/100\" report whenever a backend call fails.\n\n**What holds up:** opaque artifact handles, fail-closed tool schemas, a sandbox policy that never downgrades, the model being unable to write evidence directly, the native tool-calling protocol, and a README that is honest about its limits.\n\n**Next moves, in order:**\n1. Push the commits.\n2. Lock down the ledger: separate DB roles, block `TRUNCATE`, reject any event after a run is finalized.\n3. Add run leases so a second instance can't close a live run.\n4. Move hostile-file parsing off the event loop and cap its size.\n5. Fix the false evidence.\n6. Check that evidence provenance references actually exist.\n7. Fix the sanitizer bypass: `<<<<<` collapses into the real closing marker.\n8. Let tools return actual code content to the model.\n9. Make the verdict honest about what was really found.\n10. Remove the mock fallbacks from the old frontend.\n\n**Cleanup:** I stopped llama-server, deleted the audit database container and stopped docker again, as it was before. I restored `frontend/tsconfig.tsbuildinfo`, which the frontend build had modified. `backend/.env` still holds old 1.x API keys. They are not tracked and not in git history, but they should be rotated.\n\nI can publish the audit as a private, shareable page if you want to send it to reviewers.\n\nSources: [Open-ReverseLab](https://github.com/LING71671/open-reverselab), [JURIG](https://github.com/ReverserID/JURIG), [agentic-malware-analysis](https://github.com/mrphrazer/agentic-malware-analysis), [delamain](https://github.com/xjoker/delamain), [jadx-ai-mcp](https://github.com/zinja-coder/jadx-ai-mcp), [Android RE skill](https://github.com/SimoneAvogadro/android-reverse-engineering-skill), [Malaika](https://arxiv.org/abs/2607.09179), [Project Ire](https://www.microsoft.com/en-us/research/blog/project-ire-autonomously-identifies-malware-at-scale/), [MASTG releases](https://github.com/OWASP/mastg/releases), [NowSecure MASWE/MASTG](https://www.nowsecure.com/blog/2026/09/30/how-to-use-owasp-maswe-and-mastg-for-mobile-app-security-testing/), [OWASP Agentic Top 10](https://www.giskard.ai/knowledge/owasp-top-10-for-agentic-application-2026)"
  },
  {
    "id": "kavach-demo-lock",
    "sessionId": "d182d209-a11f-4e2e-abfb-6b69a2e34a99",
    "remoteBridgeId": "cse_01EmLtG1EyKA3tREek2VSM2d",
    "title": "KAVACH 2.0 Demo-Lock Vertical Slice & Qwen Live Run",
    "category": "IMPLEMENTATION",
    "badgeColor": "emerald",
    "timestamp": "2026-10-05T05:02:47.720Z",
    "formattedDate": "Oct 5, 2026 \u2022 10:56 AM IST",
    "timeAgo": "Today morning",
    "model": "claude-opus-5-5",
    "workingDir": "/home/p4cketsn1ff3r/Projects/Active/KAVACH_AI",
    "stepCount": 191,
    "thinkingBlocksCount": 70,
    "fileSize": "731 KB",
    "downloadUrl": "/claude2_demo_lock_session.txt",
    "summary": "Built and locked the end-to-end demo slice: run status state machine, upload ordering, timeout & interruption handling, native tool-calling protocol, single-file demo console UI, and successful 76-second live test run with Qwen3.5-4B on llama-server.",
    "highlights": [
      "Native Tool Calls: Removed old [Actions ...] plain text parsing; standardized on model tool format with context budget truncator.",
      "Run State Consistency: Enforced QUEUED -> RUNNING -> COMPLETED/FAILED/TIMEOUT across DB, ledger, and HTTP API.",
      "Live Qwen Verification: 76-second autonomous run resolved CONTAINER_EVASION hypothesis and verified ledger head hash.",
      "Standalone Console: Built zero-dependency service/console/index.html with live timeline, graph, and ledger status."
    ],
    "verificationStats": [
      {
        "suite": "UNIT",
        "passed": 162,
        "failed": 0
      },
      {
        "suite": "CONTRACT",
        "passed": 38,
        "failed": 0
      },
      {
        "suite": "SECURITY",
        "passed": 76,
        "failed": 0
      },
      {
        "suite": "REPAIR",
        "passed": 11,
        "failed": 0
      },
      {
        "suite": "INTEGRATION",
        "passed": 0,
        "failed": 13,
        "notes": "Failed due to local Docker service stopped"
      }
    ],
    "finalOutputText": "I've done the demo-lock work on the code side: the full flow works with the real model, but none of it is pushed. Nothing touching Postgres (run rows, ledger, restart) has run yet, because Docker is stopped and no tests can reach the database. I won't type your sudo password, since entering passwords to log in is off-limits for me. Please start Docker yourself, and change that password, because it's now in the chat log:\n\n```bash\nsudo systemctl start docker\n```\n\n**Local commits (7 ahead of `origin/master`):** your three earlier ones (`9390574`, `25c5833`, `123d610`) plus `32e0c8e`, `ee3f49a`, `78d39d0`. The working tree is clean.\n\n**The 6 fixes:**\n1. **Run status:** a run is now QUEUED, then RUNNING, then one of COMPLETED, COMPLETED_NO_FINDINGS, PARTIAL, FAILED, TIMEOUT or INTERRUPTED. The run row, the API and the ledger's final event now record the same final status. Unknown or unfinished states raise an error instead of being turned into FAILED. A test covers every final state.\n2. **Upload ordering:** the run is created as QUEUED, then the APK is stored, then the investigation starts. If storing fails, the run is closed as FAILED in both the ledger and the run row, and the upload returns an error with the `run_id`. I also added:\n   - a time limit per run, which records TIMEOUT;\n   - shutdown records INTERRUPTED;\n   - on startup, runs left open by a crash are closed, and run rows that disagree with the ledger are corrected.\n3. **Dependencies:** `fastapi`, `uvicorn` and `python-multipart` are now in `requirements.txt`.\n4. **Clean environment:** a fresh Python 3.12 environment built only from `requirements.txt` imports the service and passes the tests.\n5. **Native tool calls:** the agent now sends the model's tool calls back in the standard tool-call format, and each call gets one reply. The old `[Actions ...]` text is gone. Reading tool calls out of plain text only happens if you switch on `legacy_text_tool_calls=True`. When a prompt would overflow the 4096-token window, the oldest tool results are shortened; full results stay in the ledger.\n6. **Demo fixture:** `service/demo_fixture.py` builds a harmless APK. It has a real binary manifest (package `com.kavach.demo.fixture`, INTERNET and READ_SMS permissions) and one file falsely marked as encrypted. Triage proposes a CONTAINER_EVASION hypothesis. The fixture is described as non-malware everywhere.\n\n**Also built:**\n- **Console:** `service/console/index.html` is one file with no external downloads. It shows the live timeline, hypotheses, evidence, artifact lineage, the report, and a \"LEDGER VERIFIED\" panel with the head hash. I checked it in the browser preview and there were no errors.\n- **Production startup:** `service/main.py` connects everything to Postgres; the run command is in the README. `run_jadx` is only offered to the model when JADX is installed, and it isn't on this machine.\n- **README:** updated to describe the demo slice and its current limits.\n\n**Live run with Qwen3.5-4B (memory storage, real model):** the model chose `inspect_container`, then `repair_container`. The hypothesis was confirmed only after the repair succeeded, not after the inspection. The model then concluded, the run ended COMPLETED, and the ledger verified, in 76 seconds.\n\nThe first live attempt ended PARTIAL: the model kept running `search_strings` until the stop for unproductive turns kicked in. To fix it, the supervisor now sends the model one message once every hypothesis is resolved. This is guidance only; the existing finalization check still decides whether the run can end.\n\nThe last model reply hit the 256-token limit and was cut short, so the conclusion text may end mid-sentence on screen.\n\n**Verification (`verify_all.sh`):**\n\n| Suite | Result |\n|---|---|\n| UNIT | 162 passed |\n| CONTRACT | 38 passed |\n| SECURITY | 76 passed |\n| REPAIR | 11 passed |\n| INTEGRATION | 13 failed, all `Connection refused` on port 5432 |\n\nThe 13 failures include the new Postgres tests: run status in the database, and the golden run surviving a full service restart.\n\n**After Docker is up, I will:**\n1. Run `alembic upgrade head`.\n2. Re-run `verify_all.sh`.\n3. Fix anything the Postgres tests find.\n4. Fetch and push, then check CI on the pushed commit.\n\n**Decision for you:** the demo sample. The synthetic fixture is safe to show. For a real benign APK, there are open-source practice apps on your machine (`selendroid-test-app.apk`, `AndroGoat.apk`, `InsecureShop.apk`). Pick one only if you're comfortable with its license for a public demo."
  },
  {
    "id": "kavach-ledger-storage",
    "sessionId": "16aaed4b-f815-4f09-a0ec-19a3ea228950",
    "title": "KAVACH 2.0 ArtifactStore & Append-Only Hash Ledger Migration",
    "category": "STORAGE",
    "badgeColor": "blue",
    "timestamp": "2026-10-04T18:43:16.099Z",
    "formattedDate": "Oct 5, 2026 \u2022 00:37 AM IST",
    "timeAgo": "Yesterday midnight",
    "model": "claude-opus-5-5",
    "workingDir": "/home/p4cketsn1ff3r/Projects/Active/KAVACH_AI",
    "stepCount": 119,
    "thinkingBlocksCount": 74,
    "fileSize": "539 KB",
    "downloadUrl": "/claude2_ledger_storage_session.txt",
    "summary": "Migrated agent controller from host-path maps to ArtifactStore source-of-truth. Built PostgreSQL hash-chained append-only event ledger with immutable DB trigger, independent chain validator, and sandboxed execution records.",
    "highlights": [
      "ArtifactStore Integration: Eliminated known_artifacts host-path mapping; all tools resolve strictly via artifact:// handles.",
      "Hash-Chained Event Ledger: Immutable PostgreSQL event log with trigger rejecting UPDATE and DELETE.",
      "Execution Provenance: Evidence without parent artifact, execution ID, and tool call ID is strictly rejected.",
      "Deterministic ZIP Archiving: JADX output directories stored as bit-for-bit deterministic ZIP archives."
    ],
    "verificationStats": [
      {
        "suite": "UNIT, CONTRACT, SECURITY, REPAIR",
        "passed": 85,
        "failed": 0
      },
      {
        "suite": "INTEGRATION",
        "passed": 0,
        "failed": 4,
        "notes": "Port 5432 stopped"
      }
    ],
    "finalOutputText": "I've stopped the golden demo fixture (Task 11). I'm not going to write a synthetic APK that imitates malware behaviour, and I deleted the partial generator file. Days 1 and part of 2 are done otherwise, but nothing in this session has been pushed, and the database tests have not run because Docker is stopped.\n\n**Committed on `master` (3 commits, not pushed):**\n\n1. **`9390574` ArtifactStore fixes (Task 2):**\n   - Database write and lookup errors now fail the operation instead of being logged as success.\n   - Listing a run's artifacts reads PostgreSQL, so artifacts survive a restart.\n   - Artifact IDs are scoped to one run (new migration), and stored artifacts can't be changed.\n   - The path check uses real path ancestry instead of a string prefix, and staging always copies instead of hardlinking.\n   - JADX output folders are stored as deterministic ZIPs.\n   - 10 new tests cover these, and the Postgres lifecycle test now includes a restart.\n2. **`25c5833` ArtifactStore drives the agent (Task 1):** the controller no longer uses the `known_artifacts` host-path map. Tools resolve `artifact://` handles only through the store for the current run. Every artifact a tool produces is registered with its parent, execution ID and tool call ID.\n3. **`123d610` Ledger and execution records (Tasks 3\u20134):**\n   - Each run gets a hash-chained, append-only event log in Postgres; a database trigger refuses UPDATE and DELETE.\n   - An independent checker catches tampering and gaps in the sequence.\n   - The controller logs all 11 event types with causal links.\n   - Every executed tool call produces an execution record. External tools use the sandbox's record; in-process parsers are recorded honestly with isolation `NONE`.\n   - Evidence without a source artifact, execution and tool call is rejected before it reaches the ledger or can confirm a hypothesis.\n\n**Not committed yet (in the working tree):**\n- **InvestigationService:** `service/` holds the run records, static triage, the report built from the ledger, the service itself and the FastAPI routes (upload, status, events, live event stream, artifacts, verify, report).\n- **Demo tool registry:** only the 6 demo tools are registered.\n- **Offered-tools rule:** the controller now refuses any tool that wasn't offered to the model that turn, even if it's registered. I updated one existing test for this.\n- **New dependencies:** I installed `fastapi`, `uvicorn` and `python-multipart` into `.venv`. They are not in `requirements.txt` yet.\n- No tests exist for the service yet; it has not been run.\n\n**Verification:**\n- **Last full gate run (after the first two commits):** UNIT, CONTRACT, SECURITY and REPAIR passed.\n  - INTEGRATION failed on 4 tests, all because nothing is listening on Postgres port 5432.\n- **Ledger commit:** the ledger tests and affected suites passed (85 tests), but I did not rerun the full gate.\n- **Never run:** the new Postgres tests for artifact restart and for the ledger trigger.\n\n**Still to do:** the native tool-call protocol, the context budget, service tests and wiring, the demo console, the golden fixture, and the push.\n\n**Decisions for you:**\n1. **Demo sample.** Pick one:\n   - You supply a benign APK you're licensed to use.\n   - I build a plain test APK in the style of the existing `_benign_apk` helper: harmless strings, one stored entry and a normal manifest. That exercises triage, tool calls, artifacts and evidence, but makes no malware-style claims.\n2. **Postgres.** Run `sudo systemctl start docker` so the Postgres tests can run locally and the pre-push hook passes. Then I'll push.\n\nTell me which sample option you want, and I'll continue with the service tests and the native protocol."
  }
];
