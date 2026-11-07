# Product Requirements Document (PRD): ConnectTransit SA

| Field | Details |
| --- | --- |
| Product Name | ConnectTransit SA |
| Author(s) | Nyiko Vumani |
| Course Code & Cohort | SDQ Sep 2026 |
| Facilitator / Reviewer | Pending Assignment |
| Link to Original Idea | docs/TRANSITCONNECT_SA_appconcept.pdf |
| GitHub Repository | https://github.com/NyikoVumani/ConnectTransit-SA |
| Version | v1.1.0 |
| Status | **Draft: waiting for author approval** (Section 14 records the decisions; one item still needs confirming: the SAPS retention period, Section 14 item 12) |

## Change Log

| Version | Date | Section(s) Changed | What Changed | Regenerated? |
| --- | --- | --- | --- | --- |
| v0.1 | 28 Oct 2026 | All | Initial PRD skeleton derived from concept document | None |
| v1.0.0 | 28 Oct 2026 | All | Complete PRD populated with anonymous reporting, silent SOS, dual auth, and Supabase architecture | MASTER.md pending |
| v1.1.0 | 6 Nov 2026 | 1.4, 1.5, 1.7, 2.4, 2.5, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, new 14 | Adds web portals for Transport Admin, SAPS and System Admin; SA ID number at sign-up; plate lookup; in-app SOS trigger; new status list and rules BR6–BR11; updated data model and POPIA matrix; aligned with the Stitch designs and `docs/DESIGN.md`; English only in v1; biometric sign-in; "Request further evidence" defined (BR12); SAPS retention rule (BR13) | IMPLEMENTATION_PLAN.md v1.1 (aligned) |

Items marked **(v1.1)** are new or changed since v1.0.0.

---

## 1. Product Overview

### 1.1 Product Name
ConnectTransit SA

### 1.2 One-Line Pitch
ConnectTransit SA helps South African commuters to report transport incidents and track outcomes anonymously so that transport providers are held accountable.

### 1.3 Problem Statement
Over 70% of South African commuters rely daily on taxis, buses, rail, and e-hailing services, yet face high rates of reckless driving, overcharging, harassment, and assault. Passengers lack a centralised, transparent way to lodge grievances, leaving over 80% of complaints unaddressed or dismissed without explanation. Reporting channels are fragmented, and commuters have no mechanism to verify whether disciplinary action was taken or whether law enforcement was notified.

### 1.4 Solution (v1.1)
ConnectTransit SA provides a unified platform where commuters submit rich-media incident reports (registration plates, audio, video, photos) to registered transport organisations. The platform shows the exact decision and reasons to the commuter while masking the commuter's identity from transport organisations to prevent retaliation. High-severity incidents (sexual misconduct, physical assault) are automatically sent to SAPS. An in-app Silent SOS (three quick taps) sends the commuter's live location to SAPS. Transport Admins, SAPS and System Admins work in a web portal.

### 1.5 Platform (v1.1)
- **Commuter app:** Android and iOS built with React Native + Expo. First build target: Android (360px base width). iPhone build is deferred.
- **Web portals:** one Next.js web app on Vercel for Transport Admins, SAPS and System Admins.

### 1.6 Vision
To become South Africa's national standard accountability and safety network across all public and private transit systems, driving policy reforms through transparent safety intelligence.

### 1.7 Key Terms (v1.1)

| Term | Exact Meaning in This App |
| --- | --- |
| Commuter | A passenger using public or private transport who lodges reports or triggers SOS alerts. |
| Transport Admin | An authorised representative of one registered transport organisation (e.g. Taxi Association PRO, Bus Operator Manager) who reviews complaints and records decisions. |
| SAPS / Emergency Authority | A South African Police Service dispatcher who sees escalated cases and live SOS events in the SAPS portal. |
| System Admin | A platform operator who manages organisations and admin accounts and tags reports sent to "Other/Unregistered". |
| Incident Report | A structured formal complaint containing vehicle details, media proof, timestamp, location and incident category. |
| Case Reference Number | A unique auto-generated tracking identifier in the format `TC-YYYY-NNNN` (e.g. TC-2026-9812). It is a per-year counter, padded to at least 4 digits, and never contains any part of a personal ID number. |
| Silent SOS | An emergency feature activated by tapping the SOS control three times within 2.5 seconds. It sends live GPS location to SAPS until the commuter stops it. (v1.1: in-app trigger; the hardware power-button trigger is a later release.) |
| Identity Masking | The server-level process that removes commuter personal information before any report is shown to a Transport Admin or another commuter. |
| SA ID Number | The 13-digit South African identity number, collected at sign-up. It is stored privately and shared only with SAPS for escalated cases. (v1.1) |
| Oversight Queue | Reports submitted under "Other/Unregistered" that wait for a System Admin to tag the correct organisation. (v1.1) |

---

## 2. Users, Personas and Roles

### 2.1 Primary User
Daily South African commuter (ages 16–65) using minibus taxis, buses (e.g. Metrobus, Putco), e-hailing (e.g. Uber, Bolt), or rail. Tech comfort varies from low to high. Uses mid-to-entry-level Android devices on prepaid mobile data.

### 2.2 Secondary Users
1. Transport organisation administrators (Taxi Association PROs, Bus Depot Safety Officers, E-Hailing Fleet Managers).
2. SAPS / Emergency Control Dispatchers.
3. Platform System Admins. (v1.1)

### 2.3 Personas

| Field | Persona 1 (Commuter) | Persona 2 (Transport Admin) |
| --- | --- | --- |
| Name and Age | Thabo Mokoena, 24 | Sipho Dlamini, 48 |
| Role | Commuter | Transport Admin |
| Occupation / Situation | University student commuting daily from Soweto to Johannesburg CBD | Public Relations Officer (PRO) at a local Taxi Association |
| Device & Connectivity | Samsung Galaxy A12, prepaid data | Lenovo laptop and Galaxy A54, office Wi-Fi |
| Tech Comfort | Medium | Medium |
| Language(s) | isiZulu, English, Sesotho | isiZulu, English |
| Goal | Wants unsafe drivers held accountable without fearing personal retaliation or harassment. | Wants clear, verifiable evidence on reported drivers to take swift disciplinary action and preserve association reputation. |
| Frustrations Today | Complaints sent to taxi ranks are ignored; no feedback is ever given when drivers act recklessly. | Receives vague verbal complaints without registration numbers or photo proof, making investigations impossible. |
| How the App Helps | Provides an easy way to upload voice notes and photos anonymously while tracking resolution progress. | Receives structured, evidence-backed digital reports linked directly to registered vehicle plates. |
| Quote | "I just want to know that when a driver puts our lives at risk, someone actually does something about it." | "Give me the vehicle registration plate and photo proof, and we will deal with the driver according to our constitution." |

### 2.4 Roles and Permissions (v1.1)

| Role | How Someone Gets This Role | Can Do | Cannot Do |
| --- | --- | --- | --- |
| Commuter | Registers in the app with phone OTP or email and password; must give a valid SA ID number | Submit incident reports, upload media evidence, view their own cases, look up public case information by vehicle plate, trigger Silent SOS | Open any web portal, see another commuter's identity, see another commuter's media, edit submitted cases |
| Transport Admin | Created by a System Admin (or by seed data in development) and linked to one organisation | Review cases routed to their organisation, update status, publish official decisions with a written reason, ask the commuter for further evidence without seeing who they are (BR12) | See any commuter name, phone, email, ID number or address; change media; delete cases; see other organisations' cases |
| SAPS / Emergency Authority | Created by a System Admin | See escalated cases (including the commuter's name and ID number for those cases only), acknowledge them, see live SOS events | Change organisation decisions or settings |
| System Admin | Created manually in the database in v1 | Manage organisations, create admin accounts, tag Oversight Queue reports | See commuter ID numbers or report media |

### 2.5 Admin Approach (v1.1)
Admin work is done in the web portal (Next.js on Vercel), not in the mobile app. Screens: A7 Portal Login, A1 Admin Case Dashboard, A2 Case Resolution, A3 SAPS Escalation Queue, A4 SAPS Live SOS, A5 Organisations and Admin Accounts, A6 Oversight Queue. A public page P1 shows an active SOS location.

---

## 3. Goals, Success Metrics and Non-Goals

### 3.1 Goals

| # | Goal | Metric (What You Count) | Target | How You Will Check It |
| --- | --- | --- | --- | --- |
| G1 | Transparent decision feedback | Percentage of submitted complaints that receive an official decision and written rationale | 100% of non-dismissed cases within 5 business days | Count in the reports table where status = 'Resolved' and decision_reasoning is not null |
| G2 | Swift emergency dispatch (v1.1) | Time from the third SOS tap to the SOS event being saved and visible to SAPS | Under 2.0 seconds | `sos_events.dispatch_ms` logged for every SOS; checked on mobile data before release |
| G3 | Passenger safety and POPIA adherence | Commuter identity leaks to transport organisations or other commuters | 0 incidents | Automated audit of every Transport Admin and public endpoint proving no commuter fields are returned |

### 3.2 Non-Goals
1. **In-app payment / ticket booking:** no fares, top-ups or trip bookings in v1.
2. **Direct driver-passenger live chat:** prevents intimidation risks.
3. **Automated legal convictions:** the platform routes complaints and evidence; it does not replace SAPS proceedings.
4. **More than English (v1.1):** other official languages are deferred.
5. **Hardware power-button SOS (v1.1):** deferred to a later release.
6. **SOS emergency contacts and SOS cancel PIN (v1.1):** not in v1.

---

## 4. Features, Business Rules and Notifications

### 4.1 Feature List (v1.1)

| ID | Feature Name | What the User Can Do | Priority | Goal | Stories | Screens |
| --- | --- | --- | --- | --- | --- | --- |
| F1 | Incident Reporting and Evidence Upload | Pick a transport organisation, enter the vehicle registration, choose a category, describe the incident, attach photos, video and audio, enter an optional SAPS case number | Must | G1 | US1 | S3, S7 |
| F2 | Anonymous Routing Engine | System routes the report to the right Transport Admin with all commuter personal information removed; severe cases are escalated to SAPS | Must | G1, G3 | US2 | Backend, A1, A3 |
| F3 | Case Status and Rationale Tracker | See my own cases and their progress (Submitted, Under Review, Escalated, Decision Published) with the decision and reasons; look cases up by reference number or vehicle plate; answer an admin's request for further evidence | Must | G1 | US3, US8 | S4 |
| F4 | Silent SOS | Tap the SOS control three times to send live GPS to SAPS; stop by pressing and holding | Must | G2 | US4 | S2, S8, A4, P1 |
| F5 | Admin Disciplinary Portal (priority raised to Must) | Transport Admins review evidence, update case status, request further evidence from the commuter, and issue official decisions with reasons | Must | G1 | US5, US8 | A7, A1, A2 |
| F6 | Multi-Language Localisation | Switch the app across all 11 official languages | Deferred | G1 | — | S5 (selector shows English only) |
| F7 | SAPS and System Admin Portals (new) | SAPS sees and acknowledges escalated cases and live SOS events; System Admins manage organisations, admin accounts and the Oversight Queue | Must | G1, G2 | US6, US7 | A3, A4, A5, A6 |

### 4.2 MVP Definition (v1.1)
The smallest version of ConnectTransit SA is an Android app where verified commuters submit media-backed transport complaints anonymously to verified organisations, track decisions by reference number or vehicle plate, and send an in-app Silent SOS with live location, plus a web portal where Transport Admins, SAPS and System Admins do their work.

### 4.3 Future Features
- F8: Hardware power-button trigger for Silent SOS (native module).
- F9: Offline Bluetooth mesh incident sync for underground and low-coverage transit areas.
- F10: Public safety heatmaps showing high-incident routes and ranks.
- F11: Additional official South African languages.
- F12: SOS emergency contacts and cancel PIN.

(The numbers F7 and F8 in v1.0.0 for mesh sync and heatmaps are now F9 and F10, because F7 is now the SAPS and System Admin portals.)

### 4.4 Business Rules (v1.1)

| ID | Rule (Exact Logic and Limits) | Used By |
| --- | --- | --- |
| BR1 | **PII stripping:** any response returning case data to a Transport Admin, to another commuter, or to the public live page MUST leave out `reporter_id`, full name, phone number, email, home address and SA ID number. | F2, A1, A2, S4 |
| BR2 | **Emergency escalation:** any report in the category Sexual Misconduct or Physical Assault MUST be created with status Escalated and automatically added to the SAPS queue, and sent to the configured SAPS webhook (signed, retried up to 5 times). The SAPS copy is the only place the commuter's name and SA ID number leave the system. | F1, F2 |
| BR3 | **Retired in v1.1** (hardware SOS debounce). Replaced by BR11. | — |
| BR4 | **Media upload limits:** maximum 3 photos (5 MB each), 1 video (25 MB, 30 seconds), 1 audio note (10 MB, 60 seconds) per report. | F1, S3 |
| BR5 | **Decision mandatory rationale:** a Transport Admin cannot set a report to Resolved or Dismissed without a written reason of at least 20 characters. | F5, A2 |
| BR6 | **SA ID number (new):** must be 13 digits, begin with a valid date of birth (YYMMDD), have 0 or 1 as the 11th digit, pass the standard check-digit calculation, and show a holder aged 16 or older at sign-up. Users with no SA ID number cannot register in v1. | US-ACC |
| BR7 | **Case reference (new):** `TC-YYYY-NNNN`, YYYY is the year of submission and NNNN a per-year counter starting at 0001, padded to at least 4 digits (it grows to 5 digits after 9,999 in one year). | F1 |
| BR8 | **Plate lookup (new):** a commuter can search by vehicle registration (ignoring case, spaces and dashes, at least 3 characters). Results show only: category, vehicle plate, organisation, status, incident date, description, and the decision summary and reasons. Results never show media, location, SAPS case number or anything about the reporter. Dismissed cases are hidden from other commuters. A commuter may search at most 30 times per hour. | F3 |
| BR9 | **Rate limits (new, proposed numbers):** at most 5 reports per hour and 20 per day per commuter. | F1 |
| BR10 | **Status changes (new):** Submitted → Under Review; Escalated → Under Review; Under Review or Escalated → Resolved or Dismissed (needs BR5). Resolved and Dismissed are final. Any other change is rejected. | F5 |
| BR12 | **Request further evidence (new):** a Transport Admin can send a written request (20 to 500 characters) on a case that is Under Review or Escalated. A case can have only one open request at a time and at most 3 requests in total. The commuter is notified (4.5) and can reply from S4 with a note (up to 500 characters) and extra media within the BR4 limits (counted separately from the original report). The case status does not change; it shows an "Evidence requested" tag while a request is open. A request closes when the commuter replies, when the admin cancels it, or when the case is Resolved or Dismissed. The admin never sees who the commuter is (BR1). There is no deadline in v1. | F5, F3 |
| BR13 | **SAPS copy retention (new):** the name and SA ID number held in the SAPS copy of an escalated report or SOS event are kept while the commuter's account is active. When the account is deleted they are removed after 12 months (proposed; author to confirm, Section 14 item 12). A daily job does the removal. The rest of the SAPS record stays. | F2, F4 |
| BR11 | **Silent SOS (new):** three taps within 2.5 seconds start an SOS. The event is saved within 2.0 seconds. Location updates repeat every 10 seconds until the commuter stops the SOS by pressing and holding "Stop sharing" for 3 seconds. If location permission is off, the last known position is sent with a warning. If offline, the SOS is queued and sent when the connection returns. Location points are deleted after 24 hours. | F4 |

### 4.5 Notifications (v1.1)

| Trigger | Who Receives It | Channel | Exact Text | Tapping It Opens |
| --- | --- | --- | --- | --- |
| Admin updates case status | Commuter (reporter) | Push (Expo) and SMS (Clickatell) | "Update on Case #[ref]: Status changed to [Status]. Tap to view formal decision." | S4 (Track Cases) |
| Admin requests further evidence | Commuter (reporter) | Push (Expo) and SMS (Clickatell) | "Update on Case #[ref]: Further evidence requested. Tap to respond." | S4 (Track Cases), the open request |
| Commuter replies to an evidence request | Transport Admin | Shown on A1 and A2 (tag "Evidence received"); no push in v1 | — | A2 (Case Resolution) |
| Severe case logged | SAPS | SAPS portal and signed webhook | "CRITICAL: High-severity transit incident logged for Vehicle [Plate]." | A3 (SAPS Escalation Queue) |
| Silent SOS activated | SAPS | SAPS portal (live map) | Name and live location of the commuter | A4 (SAPS Live SOS) |

(The v1.0.0 SMS to a commuter's emergency contact is removed because emergency contacts are not in v1.)

---

## 5. Accounts and Sign-In (v1.1)

| Decision | Your Answer |
| --- | --- |
| Sign-up methods | Dual: phone number with SMS OTP, or email with password. Both ask for full name and SA ID number. |
| Who may sign up | Anyone with a valid South African phone number (+27) or email address **and** a valid SA ID number showing age 16 or older (BR6). |
| Minimum age | 16 years old, checked from the SA ID number. |
| Email or phone verification | Required. Users enter a 6-digit OTP sent by SMS or email before submitting reports. |
| Password rules | Minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter and 1 digit. |
| Forgot password | A 6-digit code sent by SMS or email leads to S6 (Password / OTP Reset). The code expires in 10 minutes. |
| Failed log-in attempts | Supabase's built-in sign-in rate limit applies; the app shows "Too many attempts. Try again in 15 minutes." (v1.0.0 said "locked for 15 minutes after 5 failed attempts"; the platform has no per-account lock.) |
| Stay logged in | Session token stored securely on the device (Keystore). The app signs the user out on start-up if the session is older than 30 days. |
| Phone sign-up and password (v1.1) | Every account has a password. A new phone user verifies the SMS code, then sets a password in the create-account step. An existing phone user can sign in with a code, or with the password. |
| Biometric sign-in (v1.1) | If the phone has a fingerprint or face unlock set up, the commuter can turn on "Use biometrics to sign in" (offered after the first successful sign-in, and in S5). Biometrics only unlock the saved session on that phone; they never replace the password. If biometrics fail, are changed, or the session is older than 30 days, the commuter signs in with the password or an SMS code. Logging out removes the saved session, so the next sign-in needs the password or an SMS code. Message when it fails: "Biometric sign-in failed. Use your password." |
| Log out / Delete account | Both on S5 (Settings). Delete account clears the commuter's name, phone, email and SA ID number and keeps the report text and media in anonymised form, because other people may need them. |
| Admin accounts | Transport Admin, SAPS and System Admin accounts use the web portal only. Using one on the mobile app shows "Admin accounts use the web dashboard." and signs the user out. |

---

## 6. User Stories, Acceptance Criteria and Edge Cases

### 6.1 Stories (v1.1)

| Story | Feature | User Story | Acceptance Criteria |
| --- | --- | --- | --- |
| US-ACC | Accounts | As a commuter, I want to register and sign in with my phone or email, so that I can report safely. | **T-ACC-1:** valid name, SA ID number, email and password → 6-digit code → correct code opens S2. **T-ACC-2:** valid phone → SMS code → S2. **T-ACC-3:** invalid ID → "Enter a valid South African ID number."; holder under 16 → "You must be 16 or older to use this app."; existing email → "This email already has an account. Log in instead?"; wrong password → "Incorrect email or password."; wrong code → "That code is incorrect or has expired." **T-ACC-4:** password reset by code on S6 → "If an account exists for this email, we've sent a reset code." and a new valid password signs the user in. |
| US1 | F1 | As a commuter, I want to submit an incident report with vehicle plate, media proof and category, so that my grievance is formally documented. | **T-US1-1:** given a logged-in verified user, when a valid organisation, plate, category, description and photo are submitted, then return a unique Case Reference Number (TC-YYYY-NNNN) and show the success screen S7. **T-US1-2:** given a missing vehicle plate, when the user taps submit, then show a red border error "Vehicle registration plate is required". **T-US1-3:** category "Other" needs a short custom description; every report needs a description of up to 2,000 characters. |
| US2 | F2 | As a Transport Admin, I want to view routed incident reports without seeing commuter identity, so that cases can be investigated objectively without safety risks to passengers. | **T-US2-1:** given a routed report on A1, when the admin opens it, then they see vehicle plate, incident media and timestamp, and every commuter field shows "Anonymized Commuter". **T-US2-2:** given a network drop during an admin fetch, then show an offline alert banner. |
| US3 | F3 | As a commuter, I want to check my case status using my reference number or look up a vehicle plate, so that I can read the decision and explanation. | **T-US3-1:** given a valid reference number of my own case on S4, then show the status timeline and decision. **T-US3-2:** given an invalid reference number, then show "Case reference number not found. Please check and try again." **T-US3-3:** when an admin changes a status, the reporter receives the push (and SMS) text from 4.5. **T-US3-4:** searching a plate shows only the public fields in BR8. **T-US3-5:** fewer than 3 characters shows nothing; more than 30 searches per hour shows "You're searching too quickly. Try again later." |
| US4 | F4 | As a commuter in danger, I want to tap the SOS control three times, so that my live location is sent to emergency services quickly and discreetly. | **T-US4-1:** three taps within 2.5 seconds → SOS saved within 2.0 seconds and shown to SAPS; S8 opens. **T-US4-2:** location permission off → last known position sent with a warning banner. **T-US4-3:** while active, a location is saved every 10 seconds. **T-US4-4:** offline → the SOS is queued and sent on reconnect. **T-US4-5:** SAPS sees the active SOS on A4 and the public link shows the live location. |
| US5 | F5 | As a Transport Admin, I want to record an official decision with reasons, so that the commuter receives a clear outcome. | **T-US5-1:** admin moves a case to Under Review then Resolved with a decision summary (max 200 characters) and a reason of 20 or more characters; the commuter sees it on S4. |
| US8 | F5, F3 | As a Transport Admin, I want to ask the commuter for more evidence without learning who they are, so that I can decide the case fairly. | **T-US8-1:** admin sends a request of 20 or more characters on an Under Review case → the commuter gets the notification text in 4.5 and sees the request and an "Evidence requested" tag on S4. **T-US8-2:** the commuter replies with a note and a photo → the request closes and A2 shows "Evidence received" with the new media; no commuter details are shown. **T-US8-3:** a request under 20 characters is rejected; a second request while one is open is rejected; a 4th request on one case is rejected. **T-US8-4:** deciding the case (Resolved or Dismissed) closes any open request. **T-US8-5:** admin can cancel an open request. |
| US6 | F7 | As a SAPS dispatcher, I want to see severe cases and live SOS events, so that I can respond quickly. | **T-US6-1:** escalated reports appear on A3 with plate, category, description, location, SAPS case number and the reporter's name and ID number. **T-US6-2:** "Acknowledge" marks an item acknowledged. |
| US7 | F7 | As a System Admin, I want to manage organisations and admin accounts and fix unlisted entities, so that reports reach the right people. | **T-US7-1:** add and edit organisations. **T-US7-2:** create a Transport Admin linked to an organisation. **T-US7-3:** tag an Oversight Queue report to a real organisation; its reference and status do not change. |

### 6.2 Edge Cases (v1.1)

| Situation | What the User Sees | What the App Does |
| --- | --- | --- |
| Internet connection drops while submitting media evidence | "Network connection lost. Your report draft has been saved locally." | Saves the report to the device cache and retries when the connection returns |
| Transport entity not listed | "Entity not listed? Select 'Other/Unregistered' and type name." | Routes the report to the Oversight Queue for a System Admin to tag |
| User taps SOS by accident | Tap counter on the SOS control; one or two taps do nothing | An SOS only starts after three taps within 2.5 seconds |
| Media exceeds limits | "File too large. Video must be under 25MB." | Blocks the submit button until the file is removed or replaced |
| Account deleted while a case is pending | Confirmation dialog warning | Clears the commuter's personal details; sets reporter_id to empty; keeps the anonymised report and media |
| Login expires while writing a report | "Please log in again." | Keeps the draft on the device and restores it after login |
| Location permission refused while reporting | The report can still be sent | Sent without coordinates |
| Rate limit reached | "You're sending reports too quickly. Try again later." | Rejects the new report |
| Biometrics fail or are changed on the phone | "Biometric sign-in failed. Use your password." | Turns biometric sign-in off until the commuter signs in with a password and turns it on again |
| Commuter has no biometrics set up | The "Use biometrics" option is not shown | Password or SMS code only |
| Commuter deletes the account while an evidence request is open | Confirmation dialog warning | The request is closed; the anonymised report stays |

---

## 7. User Flows and Navigation Map

### 7.1 Core Flows

**Flow 1: Submit Incident Report (Must, F1)**
- Starts when: the commuter opens the app on Home (S2) and taps "Report Incident".
- Steps:
  1. S2 → "Report Incident" → S3.
  2. S3: choose the transport organisation, enter the vehicle plate, choose one category, describe the incident, attach photo, video or audio, optionally enter a SAPS case number.
  3. Tap "Submit Formal Report".
  4. If required fields are missing → validation errors; otherwise the report is saved, routed (BR1, BR2) and S7 shows the case reference.
- Ends when: the commuter taps "Done" and returns to S2.

**Flow 2: Track Case Progress and Decision (Must, F3)**
- Starts when: the commuter opens "Track Cases" (S4).
- Steps: open one of "Your Cases", or type a Case Reference Number, or search a vehicle plate → the app shows the status timeline (Submitted → Under Review → Decision Published) with the decision and reasons.
- Ends when: the commuter reads the published decision.

**Flow 3: Silent SOS (Must, F4)**
- Starts when: the commuter taps the SOS control three times on S2.
- Steps: the SOS is saved and sent to SAPS → S8 shows that sharing is active → location updates every 10 seconds → the commuter presses and holds "Stop sharing".
- Ends when: the SOS is stopped and the commuter returns to S2.

**Flow 4: Admin decision (Must, F5)**
- A Transport Admin signs in (A7) → A1 lists routed cases → opens one (A2) → sets Under Review → later Resolved or Dismissed with a decision summary and reason → the commuter is notified.

**Flow 5: SAPS escalation (Must, F7)**
- A severe report or SOS arrives → A3 or A4 shows it → SAPS acknowledges it.

**Flow 6: Oversight tagging (Must, F7)**
- A System Admin opens A6 → picks a report from "Other/Unregistered" → tags the right organisation → the report appears on that organisation's A1.

---

## 8. Screens Specification

### 8.1 Screen Inventory (v1.1)

| ID | Screen Name | Type | Who Can Open It | Purpose | Tab Bar? | Stories | Design |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | Auth / Onboarding | Full screen | Logged out | Phone OTP or email sign-in; biometric sign-in button when enabled; "Create account" step (name, SA ID number, password, privacy agreement, OTP) | No | US-ACC | Sign-in designed; Create account step and biometric button **not designed** |
| S2 | Home Dashboard | Tab | Commuter | Report button, SOS, active cases | Yes (Home) | US1, US4 | Designed (SOS card to be updated, see 14) |
| S3 | Report Incident | Full screen | Commuter | Capture incident details and media | No | US1 | Designed |
| S4 | Case Tracker | Tab ("Track Cases") | Commuter | My cases, reference search, plate search, decisions, answering an evidence request | Yes | US3 | Designed (plate search and evidence request not yet in the design) |
| S5 | Settings and Profile | Tab | Commuter | Profile, language, biometric sign-in switch, privacy, log out, delete account | Yes | US-ACC | Designed |
| S6 | Password / OTP Reset | Modal | Logged out | Account recovery by SMS or email code | No | US-ACC | Designed |
| S7 | Report Success | Modal | Commuter | Shows the Case Reference Number | No | US1 | Designed |
| S8 | SOS Active (new) | Full screen | Commuter with an active SOS | Shows sharing is active; press and hold to stop | No | US4 | **Not designed** |
| A7 | Portal Login (new) | Web | Logged out | Admin sign-in | No | US5 | **Not designed** |
| A1 | Admin Case Dashboard | Web | Transport Admin | List complaints for the organisation | No | US2, US5 | Designed |
| A2 | Admin Case Resolution | Web | Transport Admin | Review evidence, request further evidence, record the decision | No | US5, US8 | Designed (the "Request Further Evidence" button is in the design; the request form and received-evidence view are not) |
| A3 | SAPS Escalation Queue (new) | Web | SAPS | Escalated cases | No | US6 | **Not designed** |
| A4 | SAPS Live SOS (new) | Web | SAPS | Active SOS events on a map | No | US4, US6 | **Not designed** |
| A5 | Organisations and Admin Accounts (new) | Web | System Admin | Manage organisations and admin accounts | No | US7 | **Not designed** |
| A6 | Oversight Queue (new) | Web | System Admin | Tag unlisted entities | No | US7 | **Not designed** |
| P1 | Live Location (new) | Public web | Anyone with the link while the SOS is active | Shows the live location only | No | US4 | **Not designed** |

### 8.2 Notes on the Stitch designs
- Every Stitch screen includes a dark or tinted "QA state inspector" panel at the bottom. These are prototyping aids. **They must not be built.** The states they show (Normal, Empty, Loading, Error, Offline, Success) are the states each screen must support.
- Screen text shown in Stitch is the source for labels and wording unless Section 14 says otherwise. South African English spelling is used (for example "organisation").
- Sample data in the designs (for example CRN-2025-08491, Golden Arrow Fleet #714, R 12,500 penalty) is placeholder content only.

---

## 9. Design Direction

Source of truth for tokens: `docs/DESIGN.md`. Where its colour list at the top of the file and its written palette disagree, the written palette is used (it matches this PRD).

### 9.1 Look and Brand

| Item | Your Choice |
| --- | --- |
| Look and feel | Authoritative, secure, clear |
| Primary colour | Deep Safety Green `#0B7A6B` |
| Secondary / warning colour | Warning Amber `#D97706` (text on amber buttons is dark `#0F172A` so it passes contrast; see Section 14, item 14) |
| Info colour | Deep Cyan `#0E7490` |
| Success colour | Emerald `#059669` |
| Background colour | Clean Light Grey `#F8FAFC`; cards `#FFFFFF` |
| Main text colour | Slate Dark `#0F172A`; muted text `#64748B` |
| Borders | `#E2E8F0` (cards, inputs); `#CBD5E1` (dropdowns, sheets) |
| Error / danger colour | Alert Red `#DC2626` (SOS and errors only) |
| Font | Inter |
| Spacing unit | 8px grid (8, 16, 24, 32, 48) |
| Corner radius | 8px (cards, inputs); 24px (pill buttons and chips) |
| Button height | 48px minimum (SOS trigger 56px) |
| Touch targets | 48 × 48px minimum |

### 9.2 Tone of Voice
Direct, supportive and clear: "Your incident report has been securely lodged. Your identity remains strictly confidential."

---

## 10. Data Model (v1.1)

### 10.1 Entities and Fields

**users** (all accounts)

| Field | Type | Required? | Rules | Delete Behaviour |
| --- | --- | --- | --- | --- |
| id | ID | Yes | Primary key, same as the sign-in account | — |
| role | Choice | Yes | commuter, transport_admin, saps, system_admin | Cannot be deleted by the user |
| full_name | Text (100) | Yes | 1–100 characters | Replaced with "Deleted user" |
| email | Email | No | Unique, valid | Cleared |
| phone_number | Phone (+27) | No | Unique, +27 and 9 digits | Cleared |
| preferred_language | Choice | Yes | 'en' only in v1 | — |
| created_at | Date-time | Yes | UTC | — |

**user_private** (never readable through the app; only SAPS escalation and system functions use it)

| Field | Type | Required? | Rules | Delete Behaviour |
| --- | --- | --- | --- | --- |
| user_id | ID | Yes | Primary key | Deleted with the account |
| id_number | Text (13) | Yes | Unique, passes BR6 | Deleted with the account |

**organizations**

| Field | Type | Required? | Rules | Delete Behaviour |
| --- | --- | --- | --- | --- |
| id | ID | Yes | Primary key | Block delete |
| name | Text (150) | Yes | Unique, e.g. DORLJOTA | Block delete |
| type | Choice | Yes | Taxi, Bus, E-Hailing | — |
| is_verified | Yes/No | Yes | True for every real organisation | — |
| is_oversight | Yes/No | Yes | True for the single "Other/Unregistered" entry | — |

**org_admins**: links one Transport Admin to one organisation.

**reports**

| Field | Type | Required? | Rules | Delete Behaviour |
| --- | --- | --- | --- | --- |
| id | ID | Yes | Primary key | — |
| case_ref | Text (20) | Yes | Unique, BR7 | — |
| reporter_id | Link to users | No | Never shown except to the reporter | Set empty |
| organization_id | Link to organizations | Yes | Foreign key | Block delete |
| unlisted_entity_name | Text (150) | No | Required when the organisation is "Other/Unregistered" | — |
| vehicle_plate | Text (15) | Yes | As typed; searched without case, spaces or dashes | — |
| category | Choice | Yes | See 10.2 | — |
| custom_category_text | Text (100) | No | Required when the category is "Other" | — |
| description | Long text | Yes | 1–2,000 characters | — |
| incident_at | Date-time | Yes | Set automatically at submission | — |
| location | Coordinates | No | Taken automatically from the phone when permitted | — |
| saps_case_number | Text (30) | No | Optional, entered by the reporter | — |
| status | Choice | Yes | Submitted, Under Review, Escalated, Resolved, Dismissed (BR10) | — |
| is_escalated | Yes/No | Yes | True for severe categories (BR2) | — |
| admin_decision | Text (200) | No | Decision summary | — |
| decision_reasoning | Long text | No | At least 20 characters when Resolved or Dismissed (BR5) | — |
| decided_at, created_at, updated_at | Date-time | Yes / No | UTC | — |

**report_media** (replaces the old `media_urls` list): report, kind (photo, video, audio), file path, size, duration. Limits in BR4.

**evidence_requests** (new, BR12): id, report, message (20 to 500 characters), status (open, answered, cancelled, closed by decision), requested by (admin; never shown to the commuter), commuter's reply note (up to 500 characters), created, answered. `report_media` has an optional link to the request it answers.

**sos_events**: user, status (active, stopped), started and stopped time, last location, whether a cached location was used, dispatch time in milliseconds, public share token.
**sos_locations**: SOS event, latitude, longitude, time. Deleted after 24 hours.
**saps_queue**: type (report or SOS), the report or SOS, the SAPS payload, status (new, acknowledged), webhook status, and a "remove personal details after" date that is set when the commuter deletes the account (BR13).
**notification_outbox, push_tokens, rate_events**: support notifications and rate limits.

### 10.2 Incident Categories (v1.1)
Sexual Misconduct (severe) · Physical Assault (severe) · Reckless & Negligent Driving · Overcrowding & Safety Hazard · Extortion & Fare Intimidation · Overcharging · Harassment · Drunk or Impaired Driving · Unroadworthy Vehicle · Refusal of Service or Route Deviation · Other (needs a short custom description).

The first five are shown in the Stitch design for S3; the others were added at the author's request and the design needs updating (Section 14, item 4).

---

## 11. Tech Stack and Architecture (v1.1)

### 11.1 Stack

| Layer | Choice | Reason |
| --- | --- | --- |
| Commuter app | React Native with Expo (latest stable SDK; PRD v1.0.0 said v51+) | One codebase for Android and iOS |
| Web portals | Next.js (App Router) on Vercel | Admin, SAPS and System Admin work on a desktop |
| Styling | NativeWind (app), Tailwind CSS (web) | Same design tokens, 8px grid |
| Backend and database | Supabase (PostgreSQL 15), hosted in AWS Cape Town (af-south-1) | Row-level security, instant APIs, storage, scheduled jobs |
| Authentication | Supabase Auth with a custom SMS hook | Phone OTP and email flows |
| SMS | Clickatell | OTP and case update SMS |
| Push notifications | Expo Push | Case updates |
| File storage | Supabase Storage (private bucket) | Evidence files |
| Server functions | Supabase Edge Functions | SMS hook, notifications, SAPS webhook, account deletion, admin account creation, SOS start |
| Maps | Leaflet with OpenStreetMap | No API key |
| Offline drafts | SQLite on the device | Saves reports when offline |
| Biometric sign-in | expo-local-authentication | Fingerprint or face unlock of the saved session |
| Hosting | Vercel (web), Expo EAS (Android APK) | Automated deployment |

### 11.2 Permissions and Row-Level Security (v1.1)

| Entity | Action | Who Allowed | Extra Rule |
| --- | --- | --- | --- |
| reports | Create | Verified commuter | reporter is the signed-in user; BR9 limits |
| reports | Read (own) | The reporter | Through a view of their own cases |
| reports | Read (admin) | Transport Admin of that organisation | Only through a view that has no commuter fields (BR1) |
| reports | Update | Transport Admin of that organisation | Only status, decision and reasoning, through one function that enforces BR5 and BR10 |
| reports | Read (plate lookup) | Any signed-in commuter | Only the fields in BR8 |
| user_private | Any | Nobody through the app | Only SAPS escalation and system functions |
| saps_queue | Read, acknowledge | SAPS | Escalated reports and SOS events only |
| organizations, org_admins | Write | System Admin | Through the portal |
| sos_events, sos_locations | Create, update | The commuter, own SOS only | SAPS reads; the public page shows coordinates only |
| Evidence files | Upload | The reporter, for their own report | JPEG/PNG, MP4, M4A/AAC; 25 MB maximum |
| Evidence files | Read | Reporter; Transport Admin of that organisation; SAPS for escalated reports | Temporary signed links (10 minutes) |

---

## 12. Quality, Security and POPIA Compliance (v1.1)

### 12.1 POPIA Privacy Matrix

| Personal Info | Why Needed | Who Can See It | Storage Location | Retention | Deletion Method |
| --- | --- | --- | --- | --- | --- |
| Full name | Account verification; SAPS escalations | The commuter; SAPS for escalated cases and SOS only | Supabase Postgres (AWS Cape Town) | Duration of active account; the SAPS copy is kept for 12 months after the account is deleted (BR13) | Replaced on account delete (S5); SAPS copy removed after 12 months |
| Phone number | Sign-in and SMS | The commuter; system functions | Supabase Postgres (AWS Cape Town) | Duration of active account | Cleared on account delete |
| Email | Sign-in | The commuter; system functions | Supabase Postgres (AWS Cape Town) | Duration of active account | Cleared on account delete |
| SA ID number | Age check; identifying the person when a case is sent to SAPS | SAPS for escalated cases only | Supabase Postgres, private table | Duration of active account; the SAPS copy is kept for 12 months after the account is deleted (BR13) | Deleted from the private table on account delete; SAPS copy removed by a daily job after 12 months |
| Incident report text and media | Investigation | Transport Admin of that organisation; SAPS if escalated; plate lookup shows text only | Supabase Postgres and Storage | Kept after the account is deleted, with no link to a person | Not deleted with the account |
| Live GPS (SOS) | Emergency response | SAPS; the public link shows the location only | Supabase Postgres | 24 hours | Automatic hourly clean-up |

### 12.2 Quality requirements
- **Offline:** every logged-in screen shows an offline banner and blocks saving while offline; Home and Track Cases keep showing the last loaded data.
- **Errors:** every message in Sections 4–6 is shown in the right situation; raw error codes never show.
- **Accessibility:** every icon-only button has a label; touch targets are 48px or more; text passes 4.5:1 contrast.
- **Speed:** Home shows data or placeholders within 3 seconds on mobile data.
- **Photos:** photos posted in reports contain no GPS data in the file.
- **Security:** no secret keys in the apps; passwords, codes, tokens, ID numbers and emails are never written to logs; every permission rule is enforced by the database and tested.

---

## 13. Milestones

| Milestone | Target Date | Output |
| --- | --- | --- |
| M1: PRD Approved | 28 Oct 2026 | docs/PRD.md v1.0.0 completed and verified |
| M1b: PRD v1.1 Approved | To be set by the author | docs/PRD.md v1.1.0 approved (this document) |
| M2: Implementation plan generated | 6 Nov 2026 | IMPLEMENTATION_PLAN.md v1.0 |
| M3: MVP Build Complete | 15 Nov 2026 (unchanged, author's decision) | Core flows (F1–F5, F7) functional |
| M4: Final Testing and Demo | 30 Nov 2026 (unchanged, author's decision) | Test cases validated; demo ready |

---

## 14. Decisions on the v1.1 and Stitch design points

Items 5, 8, 12 and 17 were answered by the author on 6 Nov 2026. The author did not comment on the others, so they are recorded as **agreed** as written. Please correct any that are wrong.

| # | Point | Decision | Status |
| --- | --- | --- | --- |
| 1 | Product name | "ConnectTransit SA" everywhere (the PRD, repo and designs use it) | Agreed |
| 2 | Case reference format | `TC-YYYY-NNNN`. The S2 and S4 designs show `CRN-2025-…` and must be changed to `TC-`. | Agreed; **design change needed** |
| 3 | Sign-up screen | "Create account" step with name, SA ID number, password, privacy agreement and OTP | Agreed; **design needed** |
| 4 | Categories | 11 categories (10.2). The S3 design shows 5. | Agreed; **design change needed** |
| 5 | Phone accounts and passwords | Every account has a password. Phone users can sign in with an SMS code or the password. If the phone has biometrics, the commuter can use them to unlock the saved session (Section 5, BR in 6.2). | **Answered by the author** |
| 6 | SOS on S2 | In-app SOS control with tap counter; hardware card removed from S2; S8 designed | Agreed; **design change needed** |
| 7 | Plate lookup on S4 | Add a plate search | Agreed; **design change needed** |
| 8 | "Request Further Evidence" on A2 | **Defined as a v1 feature (BR12, US8, T-US8-1…5).** Needs a request form on A2, a received-evidence view on A2, and a request panel on S4. | **Answered by the author** |
| 9 | Admin status labels | "Routed to Operator" is only the admin label for Submitted. A2 disables options BR10 does not allow. | Agreed |
| 10 | Extra fields in S4 (penalty reference, fine amount, jurisdiction, fleet number) | Remove from the design; not in the data model | Agreed; **design change needed** |
| 11 | Incident time and location on S3 | Taken automatically | Agreed |
| 12 | SAPS copy of name and ID after account deletion | Removed after a number of months. The author wrote "months" without a number; **12 months is used as a proposal (BR13).** | **Needs the author to confirm the number** |
| 13 | Privacy wording | Add that SAPS receives name and ID for severe cases to S1 and S3; have the privacy notice reviewed | Agreed; **design change needed** |
| 14 | Amber button text | Dark text on `#D97706` | Agreed |
| 15 | Language selector on S5 | Show English only in v1 | Agreed; **design change needed** |
| 16 | Implementation plan alignment | Done: plan v1.1 matches this PRD | Done |
| 17 | Milestone dates | M3 (15 Nov 2026) and M4 (30 Nov 2026) are unchanged | **Answered by the author** |
| 18 | Description privacy | Helper text on S3: "Do not include your name or contact details." | Agreed; **design change needed** |

**Design changes still needed in Stitch:** S1 (create account step, biometric button, privacy wording), S2 (SOS card, `TC-` references), S3 (11 categories, helper text, privacy wording), S4 (plate search, evidence request panel, remove extra fields, `TC-` references), S5 (biometric switch, English-only language selector), S8 (new), A2 (request form, received-evidence view), and A3–A7 and P1 (new).
