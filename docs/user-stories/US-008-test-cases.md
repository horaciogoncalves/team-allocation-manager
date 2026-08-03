# US-008 — Test Cases: Allow Manager/Admin Override with Warning

## Preconditions

- Authentication and role-based access control are implemented.
- Users with `manager` or `admin` role exist, as well as regular users.

---

## TC-008-01: Manager sees override option on conflict

| Field | Value |
|---|---|
| **Test Case ID** | TC-008-01 |
| **Priority** | High |
| **Description** | Verify that a manager can override the over-allocation block. |

### Steps

1. Log in as a user with `manager` role.
2. Navigate to `/allocations`.
3. Create an allocation that causes over-allocation.

### Expected Result

- A warning is displayed instead of a hard block.
- An **Override and save** option is shown.
- Clicking it saves the allocation.

---

## TC-008-02: Regular user sees hard block

| Field | Value |
|---|---|
| **Test Case ID** | TC-008-02 |
| **Priority** | High |
| **Description** | Verify that non-manager users cannot override conflicts. |

### Steps

1. Log in as a regular user.
2. Attempt to create an allocation that causes over-allocation.

### Expected Result

- A hard block is shown.
- No override option is available.
- The allocation cannot be saved.

---

## TC-008-03: Overridden allocation is visually flagged

| Field | Value |
|---|---|
| **Test Case ID** | TC-008-03 |
| **Priority** | Medium |
| **Description** | Verify that overridden allocations are marked in the UI. |

### Steps

1. As a manager, override and save an over-allocation.
2. View the allocation list.

### Expected Result

- The allocation has a warning badge or highlight (e.g., `Over-allocated`).
- It appears in any over-allocation summary or dashboard widget.

---

## TC-008-04: API rejects override for non-manager

| Field | Value |
|---|---|
| **Test Case ID** | TC-008-04 |
| **Priority** | High |
| **Description** | Verify that the API does not allow override unless the user has manager/admin role. |

### Steps

1. Authenticate as a regular user.
2. Send a `POST /api/allocations` request that includes an override flag.

### Expected Result

- Response status is `403 Forbidden`.
- The allocation is not created.

---

## TC-008-05: API allows override for manager

| Field | Value |
|---|---|
| **Test Case ID** | TC-008-05 |
| **Priority** | High |
| **Description** | Verify that the API accepts override requests from managers. |

### Steps

1. Authenticate as a manager.
2. Send a `POST /api/allocations` request that includes an override flag and causes over-allocation.

### Expected Result

- Response status is `201 Created`.
- The allocation is created and flagged as over-allocated.

---

## TC-008-06: Over-allocated allocations appear on report/dashboard

| Field | Value |
|---|---|
| **Test Case ID** | TC-008-06 |
| **Priority** | Low |
| **Description** | Verify that overridden over-allocations are visible for review. |

### Steps

1. Create one or more overridden over-allocations.
2. Navigate to the dashboard or over-allocation report.

### Expected Result

- A widget or report lists all members with over-allocated assignments.
- Each entry shows the member name, total percentage, and conflicting projects.
