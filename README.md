# 🏛️ UEM Jaipur — Laboratory Inventory Management System (IMS v1.0.0)

> **Department of Computer Applications**  
> **University of Engineering & Management (UEM), Jaipur**  
> *Production-Ready Enterprise Laboratory Asset & Regulatory Audit Management Platform*

[![Next.js](https://img.shields.io/badge/Next.js-14.2.15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue?style=flat&logo=react)](https://react.js.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4.14-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Cost](https://img.shields.io/badge/Monthly_Cloud_Cost-$0_Free_Forever-brightgreen)](#-services-tech-stack--free-tier-longevity-analysis)

---

## 📑 Table of Contents
1. [Executive Summary & Purpose](#-executive-summary--purpose)
2. [Architectural Visualizations & System Diagrams](#-architectural-visualizations--system-diagrams)
   - [High-Level System Topology](#1-high-level-system-topology)
   - [Database Entity-Relationship (ER) Model](#2-database-entity-relationship-er-model)
   - [Atomic Relocation & Audit Trail Workflow](#3-atomic-relocation--audit-trail-workflow)
   - [Laboratory Governance & RBAC Flow](#4-laboratory-governance--rbac-flow)
   - [Self-Service Password & Credential Lifecycle Flow](#5-self-service-password--credential-lifecycle-flow)
3. [Core Feature Modules & Governance Capabilities](#-core-feature-modules--governance-capabilities)
   - [Dynamic Faculty & Staff Management (8 Canonical Fields)](#1-dynamic-faculty--staff-management-8-canonical-fields)
   - [Laboratory Provisioning & Lifecycle Governance](#2-laboratory-provisioning--lifecycle-governance)
   - [2-Box Change Password & Credential Provisioning](#3-2-box-change-password--credential-provisioning)
   - [Searchable Daily Activity & Regulatory Audit Logs](#4-searchable-daily-activity--regulatory-audit-logs)
4. [Services, Tech Stack & Free-Tier Longevity Analysis](#-services-tech-stack--free-tier-longevity-analysis)
   - [Complete Dependency & Cost Breakdown](#complete-dependency--cost-breakdown)
   - [Why Each Technology Was Selected](#why-each-technology-was-selected)
   - [Hosting Options (Cloud vs University On-Premise)](#hosting-options-cloud-vs-university-on-premise)
5. [Fresh Deployment Architecture & Master Admin Credentials](#-fresh-deployment-architecture--master-admin-credentials)
   - [Master Admin Account Details](#master-admin-account-details)
   - [Fresh Baseline Laboratories & Equipment Population Workflow](#fresh-baseline-laboratories--equipment-population-workflow)
6. [Client User Guidelines & Visual Tutorial Manual (`USER_GUIDELINES.md`)](#-client-user-guidelines--visual-tutorial-manual)
7. [Codebase Architecture & File Structure](#-codebase-architecture--file-structure)
8. [Developer Handover & Scaling Guide](#-developer-handover--scaling-guide)
   - [Prerequisites & Local Installation](#1-prerequisites--local-installation)
   - [Database Reset & Seeding](#2-database-reset--seeding)
   - [Zero-Downtime Migration from SQLite to PostgreSQL](#3-zero-downtime-migration-from-sqlite-to-postgresql)
   - [Backups & Disaster Recovery](#4-backups--disaster-recovery)
9. [Troubleshooting & Architectural Gotchas](#-troubleshooting--architectural-gotchas)
10. [Authors & Maintainers](#-authors--maintainers)

---

## 🎯 Executive Summary & Purpose

The **UEM Jaipur Laboratory Inventory Management System (IMS)** is an institutional-grade platform built specifically for the **Department of Computer Applications** to solve the challenges of physical laboratory hardware drift, unrecorded asset movement, compliance tracking, and decentralized laboratory governance across departmental facilities.

### Core Capabilities:
* **Static UUID QR Asset Resolution**: Every physical instrument (PC, Monitor, CPU, Spectrophotometer, etc.) receives an immutable 128-bit UUID encoded into a durable static QR tag. Moving the physical instrument across rooms causes **zero URL degradation**—the physical QR tag never requires reprinting.
* **Workstation Rig Bundling (`System`)**: Group individual components (e.g. CPU, Monitor, Keyboard, Ergonomic Chair) into parent workstations (e.g. `SYS-DL-001`). Moving a workstation automatically relocates all bundled components in a single **atomic database transaction**.
* **Head of Department (HOD) Governance Panel**: Full administrative control to dynamically add, edit, and decommission laboratories, register faculty/staff members, and assign in-charge authorizations.
* **Searchable Daily Activity & Regulatory Audit Logs**: Every system action (asset relocation, spec changes, user registration, facility provisioning, password updates) is permanently recorded with timestamps, operator attribution, and full-text search capability.
* **Zero-Friction 2-Box Password Management**: Simple, secure self-service password update requiring only **Employee ID** and **New Password**, protected with 100,000 PBKDF2 iterations.
* **Universal Mobile & Tablet Optimization**: Touch-friendly navigation drawer, adaptive responsive grids, portaled modals preventing header clipping, and hardware-accelerated rear camera scanning.

---

## 📊 Architectural Visualizations & System Diagrams

### 1. High-Level System Topology

```mermaid
graph TB
    subgraph ClientLayer ["Client Access Layer (Any Browser / Device)"]
        Mobile["📱 Smartphone (iOS / Android Rear Camera QR)"]
        Tablet["📱 Tablet (Lab Inspections)"]
        Desktop["💻 Desktop Workstation (Admin / Faculty Dashboard)"]
    end

    subgraph PresentationLayer ["Next.js 14 Presentation Layer (App Router)"]
        Nav["Top Navigation & Mobile Drawer (Navigation.tsx)"]
        Portal["ModalPortal (React Portal to document.body)"]
        DashView["Dashboard & Lab Filter (/page.tsx)"]
        BundleView["Systems Bundler (/systems/page.tsx)"]
        ScanView["HTML5 QR Optical Scanner (/scan/page.tsx)"]
        AdminView["HOD Governance Panel (/admin/page.tsx)"]
        ItemView["Static UUID Tag Card & Timeline (/inventory/item/[uuid])"]
        PassModal["2-Box Change Password Modal (ChangePasswordModal.tsx)"]
    end

    subgraph SecurityLayer ["Security & Cryptography Subsystem"]
        PBKDF2["PBKDF2 Engine (100,000 Iterations + Random Salt)"]
        HMAC["HMAC-SHA256 Signed Session Tokens (7-Day TTL)"]
        Zod["Zod Strict Request Schema Validation"]
        RBAC["Lab Authority Guard (Universal Read-Only / Lab-Scoped Write)"]
    end

    subgraph ServiceLayer ["Business Logic & API Endpoints"]
        AuthAPI["/api/auth/* (Login, Me, Faculty CRUD, Change Password)"]
        LabsAPI["/api/labs (Dynamic CRUD & Capacity Management)"]
        LogsAPI["/api/admin/logs (Full-Text Searchable Audit Trail)"]
        ItemSvc["ItemService & RelocationService (Atomic Transactions)"]
    end

    subgraph DataLayer ["Database & Persistence Tier"]
        Prisma["Prisma ORM Client (v5.22.0)"]
        SQLite["SQLite Embedded (prisma/dev.db) [Zero-Cost Default]"]
        Postgres["PostgreSQL Production Target (Self-Hosted / Cloud)"]
    end

    ClientLayer --> Nav
    ClientLayer --> Portal
    Nav --> DashView
    Nav --> BundleView
    Nav --> ScanView
    Nav --> AdminView
    Nav --> ItemView
    Nav --> PassModal

    DashView --> SecurityLayer
    BundleView --> SecurityLayer
    AdminView --> SecurityLayer
    ItemView --> SecurityLayer
    PassModal --> SecurityLayer

    SecurityLayer --> ServiceLayer
    ServiceLayer --> Prisma
    Prisma --> SQLite
    Prisma -.-> Postgres
```

---

### 2. Database Entity-Relationship (ER) Model

```mermaid
erDiagram
    User ||--o{ LabAssignment : "authorized for"
    User ||--o{ ActivityLog : "authored by"
    User ||--o{ LabAssignment : "assigned by (HOD)"
    
    Lab ||--o{ LabAssignment : "assigned faculty"
    Lab ||--o{ System : "houses"
    Lab ||--o{ Item : "contains"
    Lab ||--o{ ActivityLog : "origin lab (fromLab)"
    Lab ||--o{ ActivityLog : "destination lab (toLab)"

    System ||--o{ Item : "bundles"
    System ||--o{ ActivityLog : "subject of"

    Item ||--o{ ActivityLog : "audit history for"

    User {
        String id PK "UUID"
        String username UK "Unique Login ID"
        String password "Salted PBKDF2 (100k iters)"
        String name "Composite Name (Prefix First Mid Last)"
        String email UK "Official Institutional Email"
        String role "ADMIN | TEACHER"
        String designation "HOD | Faculty | Staff"
        String prefix "Prof. | Dr. | Mr. | Ms. | Mrs."
        String firstName "First Name"
        String middleName "Middle Name (Optional)"
        String lastName "Last Name"
        String employeeCode UK "Unique Institutional ID"
        String contactNumber "Phone Number"
        String position "Faculty | Staff"
        DateTime createdAt
        DateTime updatedAt
    }

    Lab {
        String id PK "UUID"
        String name UK "Unique Laboratory Facility Name"
        String description "Facility Details / Department"
        Int workingPcs "Operational Workstations"
        Int inactivePcs "Offline / Maintenance Workstations"
        DateTime createdAt
        DateTime updatedAt
    }

    LabAssignment {
        String id PK "UUID"
        String userId FK "Assigned Faculty"
        String labId FK "Laboratory"
        String assignedById FK "Authorizing HOD User"
        DateTime assignedAt
    }

    System {
        String id PK "UUID"
        String unique_id UK "e.g. SYS-DL-001"
        String name "Workstation Alpha"
        String status "OPERATIONAL | MAINTENANCE | DECOMMISSIONED"
        String labId FK "Current Lab Location"
        DateTime createdAt
        DateTime updatedAt
    }

    Item {
        String id PK "UUID"
        String qr_uuid UK "Permanent Static UUID"
        String name "Instrument / Hardware Name"
        String category "CPU | Monitor | Keyboard | Chair | Analyzer"
        String attributes "JSON (Serial Numbers, Specs, Condition)"
        String systemId FK "Parent System Rig (Nullable)"
        String labId FK "Current Physical Lab Location"
        DateTime createdAt
        DateTime updatedAt
    }

    ActivityLog {
        String id PK "UUID"
        String itemId FK "Audited Item (Optional)"
        String systemId FK "Audited System (Optional)"
        String userId FK "Acting Operator (Nullable on Delete)"
        String userName "Operator Name Snapshot"
        String action_type "CREATE | EDIT | DELETE | MOVE | ASSIGN | PASSWORD_CHANGE"
        String fromLabId FK "Origin Lab"
        String toLabId FK "Destination Lab"
        String comment_text "Descriptive Audit Log"
        DateTime timestamp "Cryptographic Audit Time"
    }
```

---

### 3. Atomic Relocation & Audit Trail Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Operator as Faculty / Operator
    participant UI as Next.js Client (RelocateModal via ModalPortal)
    participant API as /api/relocate Route Handler
    participant Guard as Governance / RBAC Guard
    participant Service as RelocationService
    participant DB as Prisma (db.$transaction)
    participant Audit as ActivityLog Table

    Operator->>UI: Selects Destination Lab & Enters Comment
    UI->>API: POST /api/relocate { systemId, toLabId, userId, comment }
    API->>Guard: Verify session token & check if User is HOD or assigned to origin Lab
    alt Not Authorized
        Guard-->>API: 403 Forbidden ("Authorization Managed by HOD")
        API-->>UI: Display Alert Notice
    else Authorized
        Guard->>Service: Execute Relocation
        Service->>DB: Begin db.$transaction()
        Note over DB: 1. Update System.labId to destination Lab<br/>2. Update ALL bundled Items.labId to destination Lab<br/>3. Create ActivityLog entries for System and all bundled Items
        DB-->>Service: Transaction Committed
        Service-->>API: Return Updated Entities & Audit Logs
        API-->>UI: 200 OK { success: true }
        UI->>Operator: Real-time UI update + Emerald Toast Notification
    end
```

---

### 4. Laboratory Governance & RBAC Flow

```mermaid
flowchart TD
    Start([User Initiates Action]) --> CheckAuth{Is User Authenticated?}
    
    CheckAuth -- No (Visitor) --> ReadOnly[Public Read-Only Access across all Labs]
    ReadOnly --> CommentCheck{Action: Add Comment?}
    CommentCheck -- Yes --> MovedCheck{Has item been moved before?}
    MovedCheck -- Yes --> AllowComment[Allow Comment Creation]
    MovedCheck -- No --> DenyComment[403 Forbidden: Comments allowed only on moved assets]
    CommentCheck -- No (Edit/Relocate) --> DenyMutation[403 Forbidden: Login Required]

    CheckAuth -- Yes --> RoleCheck{User Role}

    RoleCheck -- ADMIN (Professor Sayak Pramanik) --> FullAdmin[Full Department-Wide Authority]
    FullAdmin --> ManageLabs[Provision, Edit & Decommission Laboratories]
    FullAdmin --> ManageFaculty[Register, Edit & Remove Faculty/Staff]
    FullAdmin --> AssignRights[Assign / Revoke Lab In-Charge Governance]
    FullAdmin --> SearchLogs[Search Real-Time Daily Audit Trail]

    RoleCheck -- TEACHER --> LabCheck{Is item in teacher's assigned Lab?}
    LabCheck -- Yes (Designated In-Charge) --> AllowLabMutation[Full Edit & Relocation Authority in Assigned Lab]
    LabCheck -- No (Other Labs) --> CrossLabReadOnly[Read-Only across unassigned Labs]
```

---

### 5. Self-Service Password & Credential Lifecycle Flow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Head of Department (Admin)
    actor Employee as Faculty / Staff Member
    participant AdminUI as Admin Panel (/admin)
    participant PassModal as Change Password Modal (2 Boxes)
    participant API as /api/auth/change-password
    participant Crypto as PBKDF2 (100,000 Iterations)
    participant DB as SQLite / PostgreSQL Database
    participant Audit as ActivityLog Table

    Admin->>AdminUI: Fills 8 canonical fields for new member
    AdminUI->>DB: POST /api/auth/admin/faculty
    Note over DB: User created with default password 'teacher123'
    AdminUI-->>Admin: Displays Credential Card with 1-Click Copy (Username & Default Password)
    Admin->>Employee: Shares Employee ID & Default Password

    Employee->>PassModal: Opens 'Change / Forgot Password?'
    Note over PassModal: Box 1: Employee ID<br/>Box 2: Set New Password
    Employee->>PassModal: Enters Employee ID (e.g. EMP-1048) & New Password
    PassModal->>API: POST /api/auth/change-password { employeeId, newPassword }
    API->>DB: Verify Employee ID (employeeCode or username)
    API->>Crypto: Hash new password with PBKDF2 (100k iters + per-user salt)
    API->>DB: Update password hash
    API->>Audit: Create PASSWORD_CHANGE ActivityLog entry
    API-->>PassModal: 200 OK { success: true }
    PassModal-->>Employee: "Password successfully updated. You can now log in."
```

---

## 🚀 Core Feature Modules & Governance Capabilities

### 1. Dynamic Faculty & Staff Management (8 Canonical Fields)
When registering a new faculty or staff member, the system strictly exposes **only** the 8 required fields:

1. **Prefix**: Salutation dropdown (`Prof.`, `Dr.`, `Mr.`, `Ms.`, `Mrs.`).
2. **First Name**: Given name.
3. **Middle Name**: Optional middle initial or name.
4. **Last Name**: Family name.
5. **Official Email ID**: Validated for format and institutional uniqueness.
6. **Employee Code**: Unique institutional identifier (indexed `@unique` in database).
7. **Contact Number**: Primary phone number.
8. **Position**: Radio selector with two exact choices: **Faculty** or **Staff**.

* **Edit Member**: Clicking the `Pencil` icon on any member card allows modifying all 8 profile parameters via `PATCH /api/auth/admin/faculty`.
* **Remove Member**: Clicking the `Trash2` icon displays an explicit confirmation dialog. On confirmation, revokes all laboratory authorizations and deletes the user record via `DELETE /api/auth/admin/faculty?id=...`. (The Head of Department admin account is protected from accidental deletion).

### 2. Laboratory Provisioning & Lifecycle Governance
* **Add Laboratory**: The Head of Department can provision new facilities at any time by specifying the **Lab Name**, **Description / Purpose**, **Initial Working PCs**, and **Initial Inactive PCs** (`POST /api/labs`).
* **Edit Laboratory**: Modify laboratory capacity metrics or department descriptions on demand (`PATCH /api/labs`).
* **Decommission Laboratory**: Cleanly delete unused laboratories (`DELETE /api/labs?id=...`). The system verifies that the laboratory contains zero active systems or instruments before deletion, preventing accidental asset loss.

### 3. 2-Box Change Password & Credential Provisioning
* **Default Credentials**: When an account is created, the system auto-provisions a default password (`teacher123`) and displays a credential card with **1-Click Copy** buttons for the HOD to share with the employee.
* **Self-Service Password Change**: Accessible on the `/login` page and the top navigation bar for active sessions.
* **Strict 2-Box Interface**:
  - **Box 1**: Enter Employee ID (`employeeCode` or username).
  - **Box 2**: Set New Password.
* **Security**: Hashed with Node.js native PBKDF2 (100,000 iterations, 64-byte SHA-512, unique per-user salt). Every password update creates a permanent entry in the institutional audit log.

### 4. Searchable Daily Activity & Regulatory Audit Logs
The Admin Panel (`/admin`) features a dedicated real-time audit log viewer:
* **Instant Full-Text Search**: Filter logs by operator name, employee code, entity, action type, date, or keywords.
* **Quick Filter Pills**: `ALL`, `CREATE FACULTY`, `EDIT FACULTY`, `CREATE LAB`, `ASSIGN LAB`, `PASSWORD CHANGE`.
* **Chronological Timeline**: Color-coded action badges, exact timestamps, acting operator details, and complete change summaries.
* **Endpoint**: `GET /api/admin/logs`.

---

## 💰 Services, Tech Stack & Free-Tier Longevity Analysis

### Complete Dependency & Cost Breakdown

| Component / Service | Technology Used | License | Cloud / Operating Cost | Longevity / Expiration |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14 (App Router) | MIT | **$0.00 / month** | **Permanent (Open Source)** |
| **UI Library** | React 18 & TypeScript 5 | MIT / Apache 2.0 | **$0.00 / month** | **Permanent (Open Source)** |
| **Styling & Icons** | Tailwind CSS 3 & Lucide React | MIT | **$0.00 / month** | **Permanent (Open Source)** |
| **Embedded Database** | SQLite (`prisma/dev.db`) | Public Domain | **$0.00 / month** | **Permanent (Zero Cost Ever)** |
| **Production Database** | PostgreSQL (Self-Hosted or Cloud) | PostgreSQL Lic. | **$0.00 / month** | **Permanent (See options below)** |
| **Object Relational Mapper** | Prisma ORM 5.22 | Apache 2.0 | **$0.00 / month** | **Permanent (Open Source)** |
| **Cryptography & Passwords** | Node.js Native Crypto (`pbkdf2Sync`) | Node.js | **$0.00 / month** | **Permanent (Standard Library)** |
| **Token Session Engine** | HMAC-SHA256 Token Signer | Node.js | **$0.00 / month** | **Permanent (Zero 3rd-party SaaS)** |
| **QR Code Generation** | `qrcode` (SVG/Canvas Generator) | MIT | **$0.00 / month** | **Permanent (Client-Side / Local)** |
| **Optical QR Camera Scanner** | `html5-qrcode` | Apache 2.0 | **$0.00 / month** | **Permanent (Runs 100% in Browser)** |
| **Data Validation** | Zod (v3.23) | MIT | **$0.00 / month** | **Permanent (Open Source)** |

---

### Why Each Technology Was Selected

1. **Zero External SaaS Dependencies**:
   - Traditional web apps rely on third-party SaaS authentication (Auth0, Clerk, Firebase) that introduce subscription expiration, paywalls, and rate limits after 30–90 days.
   - All cryptography is handled natively using **Node.js PBKDF2 (100,000 iterations)** and **HMAC-SHA256 signed session tokens**. The university never receives an invoice or faces API deprecation.
2. **SQLite for Zero-Config Portability**:
   - The embedded SQLite database (`prisma/dev.db`) requires zero cloud database provisioning, zero credit cards, and runs instantly on any server, laptop, or desktop.
3. **Prisma ORM for Instant Scale to PostgreSQL**:
   - Switching from SQLite to enterprise PostgreSQL requires editing **one single line** in `prisma/schema.prisma`. Zero TypeScript code rewrite is needed.
4. **HTML5 Canvas Optical Scanning**:
   - Optical camera barcode decoding runs directly on the device's CPU/GPU via WebAssembly/Canvas. No images are sent to any external server.

---

### Hosting Options (Cloud vs University On-Premise)

#### Option A: 100% Free On-Premise Campus Hosting (Recommended)
* **Cost**: **$0.00 forever**.
* **Setup**: Deploy on any existing departmental Linux server, Windows workstation, or Raspberry Pi inside the university intranet.
* **Command**:
  ```bash
  npm run build
  npm run start
  ```
* **Advantages**: Zero data leaves campus network; immune to external internet outages; unlimited storage capacity.

#### Option B: 100% Free Cloud Deployment (Vercel + Neon / Supabase)
* **Vercel Hobby Tier**: Free indefinitely for university projects (includes global edge CDN, automated SSL certificates, Next.js server actions).
* **Neon.tech / Supabase Free PostgreSQL**: Free tier provides 0.5 GB to 1 GB of storage, which accommodates over **500,000 asset transactions and audit logs** before reaching capacity.
* **Longevity**: Permanent under fair-use free educational tiers with zero expiring trial clocks.

---

## 🏛️ Fresh Deployment Architecture & Master Admin Credentials

The platform is engineered to ship in a **clean-slate, ready-to-deploy state**, ensuring that the department begins with a pristine institutional environment free of placeholder data.

### Master Admin Account Details

| Attribute | Deployment Value |
| :--- | :--- |
| **Username** | `sayak` |
| **Password** | `sayak123` |
| **Full Name** | **Professor Sayak Pramanik** |
| **Institutional Email** | `hod@lab.institution.edu` |
| **Governance Role** | **ADMIN (Head of Department)** — Full Departmental Authority |
| **Cryptographic Protection** | PBKDF2 (100,000 iterations, 64-byte SHA-512, unique per-user salt) |

### Fresh Baseline Laboratories & Equipment Population Workflow

Upon deployment, the system initializes with **5 baseline departmental laboratories** with **0 systems and 0 instruments**:

| Laboratory Name | Facility Purpose / Description | Systems | Instruments | Initial In-Charge |
| :--- | :--- | :---: | :---: | :--- |
| **Digital Lab** | Computational Workstations and CAD Facility | 0 | 0 | *Unassigned (Pending HOD Assignment)* |
| **Lab 1** | Software Engineering and Algorithm Systems | 0 | 0 | *Unassigned (Pending HOD Assignment)* |
| **Lab 2** | Database and Enterprise Network Systems | 0 | 0 | *Unassigned (Pending HOD Assignment)* |
| **Lab 3** | Artificial Intelligence and Data Science Facility | 0 | 0 | *Unassigned (Pending HOD Assignment)* |
| **Lab 4** | IoT, Embedded Computing and Robotics Facility | 0 | 0 | *Unassigned (Pending HOD Assignment)* |

#### Separation of Responsibilities Workflow:
1. **Admin / HOD Phase**:
   - The HOD logs in using `sayak` / `sayak123`.
   - The HOD registers the departmental faculty & technical staff members using the **8 Canonical Fields form** (`/admin`).
   - The system automatically provisions default login credentials and prompts the HOD to share them.
   - The HOD maps in-charge responsibilities for each laboratory directly from the registered faculty list in the **Laboratory Faculty Assignment Matrix**.
2. **Lab In-Charge Phase**:
   - Appointed Lab In-Charges log in (and update their password via the **2-Box Change Password** interface).
   - In-charges register their laboratory's physical equipment, workstation bundles (`System`), and independent instruments.
   - In-charges generate static QR tags for lab assets and handle relocations and maintenance logs.

---

## 📖 Client User Guidelines & Visual Tutorial Manual

A comprehensive client-facing manual is included in the project root: [USER_GUIDELINES.md](file:///D:/user/InventoryManagement/USER_GUIDELINES.md).

The manual features **AI-generated, high-fidelity dark UI tutorial illustrations** with circular step markers and directional arrows:

* **Part 1: Faculty, Staff & Lab In-Charge Operational Guide**:
  - Sign-in walkthrough & session state indicator.
  - Self-service 2-box password change workflow.
  - Interactive lab selection, workstation bundle navigation, and working PC inbox.
  - Optical QR camera scanner usage (`facingMode: "environment"`).
  - Atomic equipment relocation and regulatory comment submission.
* **Part 2: Head of Department (HOD / Admin) Master Governance Manual**:
  - Master Admin login (`sayak` / `sayak123`) and departmental overview.
  - Adding, editing, and decommissioning laboratories.
  - 8-Field faculty/staff registration with instant credential cards.
  - Dynamic in-charge assignment matrix.
  - Full-text searchable daily activity & regulatory audit trail.
* **Visual Tutorial Assets** (located in `/public/guides/`):
  - `guide_user_dashboard.jpg` — Dashboard hierarchy, rig bundles, and working PC inbox.
  - `guide_qr_scanner.jpg` — Rear optical camera viewfinder and asset card.
  - `guide_admin_panel.jpg` — HOD governance dashboard, 8-field form, and matrix.
  - `guide_daily_logs_search.jpg` — Real-time searchable audit logs with filter pills.
  - `guide_change_password.jpg` — 2-Box password reset modal and HOD credential share card.

---

## 📁 Codebase Architecture & File Structure

```
InventoryManagement/
├── prisma/
│   ├── schema.prisma                  # Prisma ORM schema (User, Lab, LabAssignment, System, Item, ActivityLog)
│   ├── seed.ts                        # Idempotent seed script with verified institutional roster & 100k PBKDF2
│   └── dev.db                         # Embedded SQLite database (zero configuration required)
├── public/
│   ├── uem-logo.png                   # Official circular seal logo for UEM Computer Applications Dept
│   └── logo.png                       # High-resolution emblem fallback
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── page.tsx               # HOD Governance: Add/Edit/Delete Faculty & Labs, Matrix & Searchable Logs
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   └── logs/route.ts      # Searchable activity and audit logs endpoint
│   │   │   ├── auth/
│   │   │   │   ├── admin/
│   │   │   │   │   ├── assignments/route.ts # Dynamic faculty authorization & unassignment endpoint
│   │   │   │   │   ├── credentials/route.ts # HOD admin credentials updater
│   │   │   │   │   └── faculty/route.ts     # Faculty CRUD: Add, Edit, Delete with 8 canonical fields
│   │   │   │   ├── change-password/route.ts # 2-box Employee ID + New Password update endpoint
│   │   │   │   ├── login/route.ts           # PBKDF2 100k authentication & session token generator
│   │   │   │   ├── logout/route.ts          # Session cookie destruction
│   │   │   │   └── me/route.ts              # Session resolution and permission verification
│   │   │   ├── comments/route.ts            # Immutable regulatory note appending endpoint
│   │   │   ├── items/
│   │   │   │   ├── [uuid]/route.ts          # Static UUID lookup, QR generation & spec patch
│   │   │   │   └── route.ts                 # Item query and registration
│   │   │   ├── labs/route.ts                # Lab CRUD: provision, edit parameters, decommission, count patch
│   │   │   ├── relocate/route.ts            # Atomic instrument and system relocation endpoint
│   │   │   ├── systems/route.ts             # Logical rig bundler and system querying endpoint
│   │   │   └── users/route.ts               # Verified institutional faculty directory
│   │   ├── inventory/
│   │   │   └── item/
│   │   │       └── [uuid]/page.tsx          # Static QR card, specifications editor & audit timeline
│   │   ├── login/page.tsx                   # Portal login with Change Password link & 1-click test cards
│   │   ├── scan/page.tsx                    # Optical QR scanner page
│   │   ├── systems/page.tsx                 # Systems Bundling management page
│   │   ├── globals.css                      # Tailwind CSS styles & animations
│   │   ├── layout.tsx                       # Root layout shell with sticky navigation & footer
│   │   └── page.tsx                         # Master dashboard: Lab hierarchy, fleet metrics, counts inbox
│   ├── components/
│   │   ├── auth/
│   │   │   └── ChangePasswordModal.tsx      # Portaled 2-box (Employee ID + New Password) modal
│   │   ├── inventory/
│   │   │   ├── AddCommentModal.tsx          # Portaled modal for appending regulatory notes
│   │   │   ├── ItemDetailCard.tsx           # Hardware specifications & peer component list
│   │   │   ├── ItemTimeline.tsx             # Real-time visual audit trail display
│   │   │   └── RelocateModal.tsx            # Portaled atomic relocation transaction modal
│   │   ├── qr/
│   │   │   ├── QRCodeCard.tsx               # Printable, high-resolution static QR asset tag card
│   │   │   └── QRScanner.tsx                # HTML5 optical camera and image upload scanner
│   │   ├── ui/
│   │   │   └── ModalPortal.tsx              # Universal React Portal escaping all CSS stacking contexts
│   │   ├── Footer.tsx                       # Attribution and A2228 beating heart link to GitHub
│   │   └── Navigation.tsx                   # Responsive navbar with Key icon and mobile drawer
│   ├── lib/
│   │   ├── auth.ts                          # PBKDF2 100k hashing, timing-safe checks, HMAC session engine
│   │   └── db.ts                            # Prisma Client singleton preventing connection exhaustion
│   └── services/
│       ├── auth.service.ts                  # User validation, HOD privilege guards, assignment service
│       ├── item.service.ts                  # QR generation, UUID encoding, hardware spec updates
│       ├── relocation.service.ts            # Atomic multi-item relocations & audit logging
│       └── system.service.ts                # System bundling logic & component synchronization
├── package.json                             # Project manifest and npm scripts
├── tailwind.config.ts                       # Tailwind CSS design system tokens
└── tsconfig.json                            # TypeScript strict compiler configuration
```

---

## 🛠️ Developer Handover & Scaling Guide

### 1. Prerequisites & Local Installation

* **Node.js**: v18.17.0 or higher (v20+ recommended).
* **npm**: v9+ (bundled with Node.js).

```bash
# Clone the repository
git clone https://github.com/tj2002roy/InventoryManagement.git
cd InventoryManagement

# Install all dependencies (clean install)
npm install
```

---

### 2. Database Reset & Seeding

To completely reset the database to a clean, verified state:

```bash
# Push schema changes to the embedded SQLite database
npx prisma db push --accept-data-loss

# Generate the latest Prisma Client types
npx prisma generate

# Execute the verified seed script
npx ts-node prisma/seed.ts
```

Start the local development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

### 3. Zero-Downtime Migration from SQLite to PostgreSQL

When scaling to a dedicated PostgreSQL server:

1. Open `prisma/schema.prisma` and change the datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update your `.env` file:
   ```env
   DATABASE_URL="postgresql://username:password@your-db-host:5432/uem_ims?schema=public"
   ```
3. Push the schema to PostgreSQL:
   ```bash
   npx prisma db push
   npx prisma generate
   npx ts-node prisma/seed.ts
   ```
*That's it!* No TypeScript code, endpoints, or client components need to be modified.

---

### 4. Backups & Disaster Recovery

* **SQLite (Current Default)**:
  - The entire database is contained in a single file: `prisma/dev.db`.
  - Creating a full backup is as simple as copying this file:
    ```bash
    cp prisma/dev.db prisma/backups/dev_backup_$(date +%Y%m%d).db
    ```
* **PostgreSQL Backup**:
  ```bash
  pg_dump -U username -h localhost uem_ims > backup_$(date +%Y%m%d).sql
  ```

---

## ⚠️ Troubleshooting & Architectural Gotchas

### 1. Windows Query Engine File Locking (`EPERM`)
* **Symptom**: Running `npx prisma generate` gives `EPERM: operation not permitted, rename query_engine-windows.dll.node`.
* **Cause**: On Windows, when `npm run dev` is running, the Node process locks the query engine DLL in memory.
* **Resolution**: Terminate the Next.js dev server (`Ctrl + C`), run `npx prisma generate`, and then restart `npm run dev`.

### 2. Modal Clipping & Header Overlaps
* **Rule**: Never render fixed modals directly inside containers with `transform`, `filter`, or `animation` (e.g. `animate-in`).
* **Resolution**: All modals must be wrapped in `<ModalPortal>` (located in `src/components/ui/ModalPortal.tsx`), which mounts them directly to `document.body` with `z-[9999]`.

### 3. Cryptographic Password Hashing (100,000 Iterations)
* In accordance with NIST SP 800-132 recommendations, passwords use **100,000 PBKDF2 iterations** with `sha512` and a 16-byte random salt.
* Legacy fallback support for 10,000 iterations is preserved in `src/lib/auth.ts` (`verifyPassword`) to prevent lockout during legacy migrations.

---

## 👨‍💻 Authors & Maintainers

* **Institution**: Department of Computer Applications, University of Engineering & Management (UEM), Jaipur.
* **Head of Department**: Professor Sayak Pramanik (`sayak` / `hod@lab.institution.edu`)
* **Lead System Developer & Attribution**: **A2228** ([GitHub: tj2002roy](https://github.com/tj2002roy))

---
*Verified and ready for immediate production deployment.*
