# US-007 — Test Cases: Show Allocation Capacity Preview Before Saving

## Preconditions

- User is on the Allocations page (`/allocations`).
- Members and projects exist.

---

## TC-007-01: Preview shows existing allocation total

| Field | Value |
|---|---|
| **Test Case ID** | TC-007-01 |
| **Priority** | High |
| **Description** | Verify that selecting a member and date range shows the existing overlapping allocation total. |

### Steps

1. Ensure a member has an existing allocation of `60%` for `2026-08-01` to `2026-08-31`.
2. Start creating a new allocation.
3. Select that member.
4. Enter date range `2026-08-15` to `2026-08-20`.

### Expected Result

- The preview shows `Member allocation: 60% overlapping → would become 60%` (before entering percentage).
- After entering `30%`, the preview shows `90%`.

---

## TC-007-02: Preview shows remaining capacity

| Field | Value |
|---|---|
| **Test Case ID** | TC-007-02 |
| **Priority** | High |
| **Description** | Verify that the preview makes remaining capacity clear. |

### Steps

1. Ensure a member has `60%` allocated in a date range.
2. Start creating a new allocation in the same range.

### Expected Result

- The preview indicates that `40%` capacity remains.
- The styling is neutral when capacity is available.

---

## TC-007-03: Preview styled as error when over-allocated

| Field | Value |
|---|---|
| **Test Case ID** | TC-007-03 |
| **Priority** | High |
| **Description** | Verify that the preview turns red when projected total exceeds 100%. |

### Steps

1. Ensure a member has `60%` allocated in a date range.
2. Start creating a new allocation with `50%` in the same range.

### Expected Result

- The preview has red/error styling.
- The projected total `110%` is emphasized.
- A conflict message is displayed.

---

## TC-007-04: Indefinite date range shows lifetime total

| Field | Value |
|---|---|
| **Test Case ID** | TC-007-04 |
| **Priority** | Medium |
| **Description** | Verify that no date range entered shows the member’s lifetime total allocation. |

### Steps

1. Ensure a member has multiple allocations totaling `90%` across various date ranges.
2. Start creating a new allocation for that member.
3. Leave start and end dates empty.

### Expected Result

- The preview shows `90% overlapping → would become 90%`.
- Any additional percentage triggers the over-allocation warning.

---

## TC-007-05: Preview updates live when changing member

| Field | Value |
|---|---|
| **Test Case ID** | TC-007-05 |
| **Priority** | Medium |
| **Description** | Verify that changing the selected member updates the preview immediately. |

### Steps

1. Select a member with `60%` allocated.
2. Observe the preview.
3. Change to a member with `0%` allocated.

### Expected Result

- The preview updates to show `0% overlapping`.
- The error styling is removed if it was previously shown.
