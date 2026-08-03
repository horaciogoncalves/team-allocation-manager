# US-002 — Test Cases: Block Over-Allocation When Updating an Existing Allocation (UI)

## Preconditions

- User is on the Allocations page (`/allocations`).
- At least one member has multiple allocations with overlapping date ranges.
- The user is editing an existing allocation.

---

## TC-002-01: Update allocation without introducing conflict

| Field | Value |
|---|---|
| **Test Case ID** | TC-002-01 |
| **Priority** | High |
| **Description** | Verify that an allocation can be updated when the change does not cause over-allocation. |

### Steps

1. Navigate to `/allocations`.
2. Find an existing allocation for a member with capacity remaining in the date range.
3. Click **Edit**.
4. Change a non-conflicting field (e.g., select a different project).
5. Click **Update Allocation**.

### Expected Result

- The allocation is updated successfully.
- The change is reflected in the allocation list.
- No conflict error is displayed.

---

## TC-002-02: Block update that causes over-allocation

| Field | Value |
|---|---|
| **Test Case ID** | TC-002-02 |
| **Priority** | High |
| **Description** | Verify that updating an allocation to increase percentage is blocked if it would exceed 100%. |

### Steps

1. Ensure a member has two allocations of `50%` each, both for `2026-08-01` to `2026-08-31`.
2. Click **Edit** on one allocation.
3. Change **Allocation Percentage** from `50` to `60`.
4. Click **Update Allocation**.

### Expected Result

- The form blocks the update.
- A conflict error is displayed, e.g.:  
  `Cannot update allocation: Alice would be allocated 110% across overlapping allocations (maximum 100%).`
- The allocation is not updated in the database.

---

## TC-002-03: Exclude current allocation from overlap total

| Field | Value |
|---|---|
| **Test Case ID** | TC-002-03 |
| **Priority** | High |
| **Description** | Verify that the allocation being edited is not counted against itself. |

### Steps

1. Ensure a member has a single allocation of `80%` for `2026-08-01` to `2026-08-31`.
2. Click **Edit** on that allocation.
3. Change the percentage from `80` to `90`.
4. Click **Update Allocation**.

### Expected Result

- The update succeeds.
- The system excludes the original `80%` from the overlap calculation, so the projected total is `90%`.
- No conflict error is shown.

---

## TC-002-04: Conflict clears after adjusting updated allocation

| Field | Value |
|---|---|
| **Test Case ID** | TC-002-04 |
| **Priority** | Medium |
| **Description** | Verify that the conflict error clears after the user adjusts the updated allocation to a valid state. |

### Steps

1. Reproduce the conflict from TC-002-02.
2. Change **Allocation Percentage** from `60` back to `50`.

### Expected Result

- The conflict error disappears.
- The **Update Allocation** button becomes enabled.
- The allocation is updated successfully.

---

## TC-002-05: Update date range to non-overlapping period

| Field | Value |
|---|---|
| **Test Case ID** | TC-002-05 |
| **Priority** | Medium |
| **Description** | Verify that moving an allocation to a non-overlapping date range resolves a conflict. |

### Steps

1. Ensure a member has two allocations of `50%` each for `2026-08-01` to `2026-08-31`.
2. Edit one allocation.
3. Change the date range to `2026-09-01` to `2026-09-30`.
4. Click **Update Allocation**.

### Expected Result

- The update succeeds.
- No conflict error is shown.
- The allocation now appears in the new date range.

---

## TC-002-06: Server-side validation blocks bypassed update

| Field | Value |
|---|---|
| **Test Case ID** | TC-002-06 |
| **Priority** | High |
| **Description** | Verify that the API rejects a conflicting update even if the client-side validation is bypassed. |

### Steps

1. Ensure a member has two allocations of `50%` each for `2026-08-01` to `2026-08-31`.
2. Send a `PUT` request directly to `/api/allocations` with:
   ```json
   {
     "id": "<allocation-id>",
     "allocation_percentage": 60
   }
   ```

### Expected Result

- The API returns `409 Conflict` with code `OVERALLOCATION_CONFLICT`.
- The allocation is not updated.
