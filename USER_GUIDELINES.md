# 📘 Laboratory Inventory Management System — Client User Guidelines
### University of Engineering & Management (UEM), Jaipur • Department of Computer Applications

Welcome to the **Laboratory Inventory Management System (IMS)**. This comprehensive manual provides detailed, self-contained operational instructions with annotated visual guides for **Faculty / Lab In-Charges** and the **Head of Department (Admin)**.

---

# 📑 Manual Table of Contents

* [PART 1: Faculty, Staff & Lab In-Charge Operational Guide](#part-1-faculty-staff--lab-in-charge-operational-guide)
  * [1.1 Accessing the Portal & Signing In](#11-accessing-the-portal--signing-in)
  * [1.2 Self-Service 2-Box Password Update](#12-self-service-2-box-password-update)
  * [1.3 Navigating Laboratories & Workstation Rigs](#13-navigating-laboratories--workstation-rigs)
  * [1.4 Scanning Physical QR Tags with Camera](#14-scanning-physical-qr-tags-with-camera)
  * [1.5 Registering New Laboratory Equipment & Workstations](#15-registering-new-laboratory-equipment--workstations)
  * [1.6 Atomic Workstation Relocations & Audit Notes](#16-atomic-workstation-relocations--audit-notes)
* [PART 2: Head of Department (Admin / HOD) Master Governance Manual](#part-2-head-of-department-admin--hod-master-governance-manual)
  * [2.1 Master Admin Credentials & Security Clearance](#21-master-admin-credentials--security-clearance)
  * [2.2 Laboratory Facility Provisioning & Capacity Settings](#22-laboratory-facility-provisioning--capacity-settings)
  * [2.3 Registering Faculty & Staff (8 Canonical Fields)](#23-registering-faculty--staff-8-canonical-fields)
  * [2.4 Laboratory In-Charge Authorization Matrix](#24-laboratory-in-charge-authorization-matrix)
  * [2.5 Editing & Decommissioning Facilities / Members](#25-editing--decommissioning-facilities--members)
  * [2.6 Real-Time Searchable Daily Audit Trail](#26-real-time-searchable-daily-audit-trail)
  * [2.7 Updating HOD Admin ID & Password](#27-updating-hod-admin-id--password)

---

# PART 1: Faculty, Staff & Lab In-Charge Operational Guide

This section is dedicated to faculty members, instructors, technical staff, and designated laboratory in-charges.

---

## 1.1 Accessing the Portal & Signing In

1. Open your desktop, laptop, or mobile browser and navigate to:
   ```
   http://localhost:3000/login
   ```
2. Enter your **Login ID / Username** provided by the Head of Department.
3. Enter your **Password**.
4. Click **Sign In to Laboratory**.

---

## 1.2 Self-Service 2-Box Password Update

When the Head of Department registers your account, an initial temporary password (e.g., `teacher123`) is assigned. You can change your password at any time without asking the administrator:

![Change Password & Credential Lifecycle](/guides/guide_change_password.jpg)

### Step-by-Step Instructions:
1. On the Login screen (`/login`) or the top navigation bar, click **"Change / Forgot Password?"** (or click the Key icon in the top right).
2. A glassmorphic modal will appear with **strictly two boxes**:
   * **Box 1 (Marker 1)**: Enter your unique **Employee ID** (e.g. `EMP-1048` or your username).
   * **Box 2 (Marker 2)**: Enter your **New Secure Password** (minimum 4 characters).
3. Click **Update Password** (**Marker 3**).
4. A green confirmation banner will appear. You can now immediately sign in using your new password.

---

## 1.3 Navigating Laboratories & Workstation Rigs

The master dashboard gives you an instant, high-contrast overview of all institutional laboratory facilities:

![User Dashboard & Laboratory Hierarchy](/guides/guide_user_dashboard.jpg)

### Key Dashboard Areas:
* **Laboratory Selector (Marker 1)**: Click any tab (e.g. *Digital Lab*, *Lab 1*, *Lab 2*, *Lab 3*, *Lab 4*) to view the workstation rigs and equipment located physically inside that room.
* **Workstation Rig Bundle (Marker 2)**: Rather than tracking disconnected parts, related hardware components (CPU tower, monitor, keyboard, ergonomic task chair) are logically bundled under a parent workstation ID (e.g., `SYS-DL-001`).
* **Working PC Counts Inbox (Marker 3)**: Live summary showing operational workstations versus machines marked for maintenance.
* **Atomic Relocate Action (Marker 3)**: If you are the authorized in-charge of this room, you can click **Atomic Relocate Rig** to transfer the entire workstation bundle to another room with zero orphaned components.

---

## 1.4 Scanning Physical QR Tags with Camera

Every physical asset in the department has a durable static QR tag affixed to its chassis:

![Optical QR Scanning & Asset History](/guides/guide_qr_scanner.jpg)

### How to Scan:
1. Click **QR Scanner** in the top navigation bar or navigate to `/scan`.
2. Allow camera access in your mobile or laptop browser.
3. Align the camera viewfinder (**Marker 1**) with the physical asset tag barcode (**Marker 2**).
4. The scanner immediately resolves the permanent static UUID (**Marker 3**) and loads the **Hardware Specifications** and **Regulatory Audit Trail** (**Marker 4**).
5. *Note*: Moving a physical asset to a new room never degrades or invalidates the physical tag. The static URL remains permanent forever.

---

## 1.5 Registering New Laboratory Equipment & Workstations

*(Available to Authorized In-Charges and HOD)*

1. On the Master Dashboard (`/`), click the **`+ Register Instrument`** button.
2. Enter the instrument attributes:
   * **Instrument / Hardware Name** (e.g. `Dell OptiPlex 7090 Tower`)
   * **Category** (`CPU`, `Monitor`, `Keyboard`, `Chair`, `Analyzer`, `Network Switch`, etc.)
   * **Target Laboratory Room**
   * **Serial Number & Dynamic Specs**
   * **Optional Workstation Rig Association**: Assign to an existing bundle (e.g., `SYS-DL-001`) or leave as a standalone asset.
3. Click **Register Asset into Department Inventory**.
4. The system automatically creates a static UUID, generates a printable QR tag, and logs the registration to the daily audit trail.

---

## 1.6 Atomic Workstation Relocations & Audit Notes

When physical lab redesigns or hardware transfers occur:

1. Click **Relocate** on any instrument card or **Atomic Relocate Rig** on a workstation bundle.
2. In the modal, select the **Destination Laboratory**.
3. Enter an **Operator Justification Comment** (e.g. *"Transferred for AI research semester laboratory sessions"*).
4. Click **Confirm Relocation**.
5. In a single atomic transaction:
   * The workstation's location updates.
   * Every bundled component's location updates synchronously.
   * An immutable audit log entry is written recording your name, the source lab, destination lab, and timestamp.

---

# PART 2: Head of Department (Admin / HOD) Master Governance Manual

This section is strictly reserved for the **Head of the Department (Professor Sayak Pramanik)**.

---

## 2.1 Master Admin Credentials & Security Clearance

The application is deployed with the master administrator credentials:

| Parameter | Value | Notes |
| :--- | :--- | :--- |
| **Login URL** | `http://localhost:3000/login` | Portal Login |
| **Admin ID / Username** | `sayak` | Permanent master identifier |
| **Password** | `sayak123` | PBKDF2 100,000 iterations |
| **Clearance Level** | **HEAD OF THE DEPARTMENT ONLY** | Global read/write authority across all rooms |

> 💡 *On the `/login` page, you can use the **1-Click Sign In** card labeled "Head of Department Master Access" for instant authentication.*

---

## 2.2 Laboratory Facility Provisioning & Capacity Settings

As the Head of Department, you can dynamically provision new laboratories and configure their operational metrics:

![Admin Governance Panel](/guides/guide_admin_panel.jpg)

### Adding a New Laboratory:
1. Navigate to the Admin Governance Panel (`/admin`) or click **Admin Governance Panel** in the top navigation.
2. In the top banner, click **`+ Add New Laboratory`** (**Marker 1**).
3. Fill out the provisioning form:
   * **Laboratory Name**: e.g., `Cybersecurity & Cloud Simulation Lab`.
   * **Description / Purpose**: e.g., `Advanced penetration testing and virtualization facility`.
   * **Initial Working PCs**: Number of operational computer units (e.g. `30`).
   * **Initial Inactive / Faulty PCs**: Number of offline units (e.g. `2`).
4. Click **Provision Laboratory**. The new room will immediately appear across all navigation tabs, dashboard cards, and the assignment matrix.

---

## 2.3 Registering Faculty & Staff (8 Canonical Fields)

To add a new teacher, faculty member, or technical staff:

1. On the `/admin` page, click **`+ Add Faculty / Staff`** (**Marker 1**).
2. The registration form presents **strictly only** the 8 canonical fields:
   * **1. Prefix**: `Prof.`, `Dr.`, `Mr.`, `Ms.`, or `Mrs.`
   * **2. First Name**: e.g. `Arun`
   * **3. Middle Name**: e.g. `Kumar` *(Optional)*
   * **4. Last Name**: e.g. `Sharma`
   * **5. Official Email ID**: e.g. `arun.sharma@uem.edu.in` *(Must be unique)*
   * **6. Employee Code**: e.g. `EMP-2041` *(Must be unique)*
   * **7. Contact Number**: e.g. `+91 9876543210`
   * **8. Position**: Selector with two exact choices: **Faculty** or **Staff**
3. Click **Register Faculty / Staff**.
4. The system auto-generates a clean institutional username (e.g., `faculty.sharma`) and provisions default password `teacher123`.
5. Use the **Copy Username** and **Copy Password** buttons on the green credential card to share with the new employee.

---

## 2.4 Laboratory In-Charge Authorization Matrix

Faculty members have read-only visibility across all departmental facilities by default. They can only modify equipment, register assets, or relocate items in laboratories explicitly authorized by you:

1. Locate the target room card in the **Laboratory Faculty Assignment Matrix** (**Marker 2**).
2. Under **Authorize Faculty**, select the faculty member from the dropdown.
3. Click **Authorize**.
4. The faculty member is now the official In-Charge of that laboratory and can manage its equipment and workstation rigs.
5. To revoke authority, click the **User Minus (`UserMinus`)** icon next to their name.

---

## 2.5 Editing & Decommissioning Facilities / Members

* **Edit Laboratory Parameters (Marker 3)**: Click the **Pencil icon** on any laboratory card to update its name, description, working PC count, or inactive count.
* **Decommission Laboratory (Marker 3)**: Click the **Trash icon** on a laboratory card. The system verifies that the room contains 0 systems and 0 items before allowing deletion, protecting against accidental loss.
* **Edit Faculty Member (Marker 4)**: Click the **Pencil icon** next to any member in the *Faculty & Staff Overview* to update their contact info, salutation, or position.
* **Remove Faculty Member (Marker 4)**: Click the **Trash icon** next to any member to revoke all their lab in-charge rights and remove them from the system. (Your master `sayak` account is protected from deletion).

---

## 2.6 Real-Time Searchable Daily Audit Trail

Every transaction across the entire system is automatically logged and searchable:

![Real-Time Searchable Daily Audit Logs](/guides/guide_daily_logs_search.jpg)

### How to Search and Filter:
1. Scroll to the **Institutional Activity & Daily Audit Logs** section at the bottom of `/admin`.
2. **Search Bar (Marker 1)**: Type any operator name (e.g. `Sayak`, `Mandal`), employee code (e.g. `EMP-1048`), asset name, or keyword. Results filter in real-time.
3. **Quick Filter Tabs (Marker 2)**: Click filter pills to view specific action categories:
   * `ALL`: Complete audit history.
   * `CREATE FACULTY`: New member registrations.
   * `EDIT FACULTY`: Profile updates.
   * `CREATE LAB`: Facility additions.
   * `ASSIGN LAB`: In-charge governance appointments.
   * `PASSWORD CHANGE`: Security credential updates.
4. **Event Details & Badges (Markers 3 & 4)**: Review color-coded action tags (Emerald, Amber, Rose, Cyan) with exact timestamps and human-readable descriptions.

---

## 2.7 Updating HOD Admin ID & Password

To customize your master administrator login ID or password:

1. Locate the **Admin Login Credentials** card on the right side of `/admin`.
2. Enter your new **Unique Admin Login ID / Username**.
3. Enter your **New Password** and **Confirm Password**.
4. Click **Update Admin Credentials**.
5. The credentials will be immediately re-hashed using PBKDF2 (100,000 iterations) and saved.

---

### Quick Troubleshooting Reference

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **"Access Denied: You are not authorized to modify this lab"** | User is not designated as in-charge of this room. | Log in as HOD (`sayak`) and authorize the teacher for that room in `/admin`. |
| **"Cannot delete laboratory: Houses active assets"** | Lab contains rigs or items. | Relocate all systems and items to another lab before decommissioning. |
| **Employee forgot password** | Needs password reset. | Employee enters their **Employee ID** and **New Password** in the 2-box Change Password modal. |
| **Modal cut off by browser header** | Stacking context bug in older code. | Fixed via universal `<ModalPortal>`. Clear browser cache if viewing an old build. |

---

*Department of Computer Applications • University of Engineering & Management (UEM), Jaipur*  
*Lead System Developer Attribution: A2228 ([GitHub: tj2002roy](https://github.com/tj2002roy))*
