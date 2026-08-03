# US-003 — Test Cases: Treat Allocations Without a Date Range as Indefinite

## Preconditions

- User is on the Allocations page (`/allocations`).
- Members and projects exist in the system.

---

## TC-003-01: Indefinite allocation blocks any new dated allocation over 100%

| Field | Value |
|---|---|
| **Test Case ID** | TC-003-01 |
| **Priority** | High |
| **Description** | Verify that an allocation with no date range overlaps all date ranges and blocks over-allocation. |

### Steps

1. Create an allocation of `50%` for a member with **no start or end date**.
2. Start creating a new allocation for the same member.
3. Enter `60%` and any date range (e.g., `2026-08-01` to `2026-08-31`).
4. Click **Add Allocation**.

### Expected Result

- The form blocks submission.
- A conflict error is displayed showing the projected total of `110%`.

---

## TC-003-02: Indefinite allocation allows allocation under 100%

| Field | Value |
|---|---|
| **Test Case ID** | TC-003-02 |
| **Priority** | High |
| **Description** | Verify that allocations under 100% total are allowed even when one is indefinite. |

### Steps

1. Create an allocation of `50%` for a member with no date range.
2. Create another allocation for the same member with `40%` and any date range.

### Expected Result

- The second allocation is created successfully.
- The projected total is `90%`.

---

## TC-003-03: New indefinite allocation blocks if it would exceed 100%

| Field | Value |
|---|---|
| **Test Case ID** | TC-003-03 |
| **Priority** | High |
| **Description** | Verify that creating a new indefinite allocation is blocked if existing allocations already exceed capacity. |

### Steps

1. Ensure a member has an existing allocation of `60%` for `2026-08-01` to `2026-08-31`.
2. Create a new allocation for the same member with `50%` and **no date range**.
3. Click **Add Allocation**.

### Expected Result

- The form blocks submission.
- A conflict error is displayed.

---

## TC-003-04: Two indefinite allocations exceeding 100% are blocked

| Field | Value |
|---|---|
| **Test Case ID** | TC-003-04 |
| **Priority** | Medium |
| **Description** | Verify that two unbounded allocations for the same member cannot exceed 100% combined. |

### Steps

1. Create an allocation of `60%` for a member with no date range.
2. Create another allocation of `50%` for the same member with no date range.

### Expected Result

- The second allocation is blocked.
- The conflict error shows a projected total of `110%`.

---

## TC-003-05: Update existing allocation to indefinite triggers conflict

| Field | Value |
|---|---|
| **Test Case ID** | TC-003-05 |
| **Priority** | Medium |
| **Description** | Verify that changing an allocation to have no date range triggers indefinite overlap rules. |

### Steps

1. Ensure a member has an existing allocation of `60%` for `2026-08-01` to `2026-08-31`.
2. Edit another allocation of `50%` that previously had a non-overlapping date range.
3. Clear the start and end dates.
4. Click **Update Allocation**.

### Expected Result

- The update is blocked because the indefinite allocation now overlaps with the `60%` allocation.
- A conflict error is displayed.
