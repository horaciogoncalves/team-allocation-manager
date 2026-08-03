# US-001 — Test Cases: Block Over-Allocation When Creating a New Allocation (UI)

## Preconditions

- User is on the Allocations page (`/allocations`).
- At least one member and one project exist in the system.
- The user is creating a new allocation (not editing an existing one).

---

## TC-001-01: Create allocation without conflict

| Field | Value |
|---|---|
| **Test Case ID** | TC-001-01 |
| **Priority** | High |
| **Description** | Verify that a new allocation is created when the member has enough remaining capacity in the selected date range. |

### Steps

1. Navigate to `/allocations`.
2. Click **Add Allocation**.
3. Select a member with no existing allocations.
4. Select a project.
5. Enter `50` in **Allocation Percentage**.
6. Enter a start date and an end date (e.g., `2026-08-01` to `2026-08-31`).
7. Click **Add Allocation**.

### Expected Result

- The allocation is created successfully.
- The allocation appears in the list with the correct member, project, percentage, and date range.
- No error message is displayed.

---

## TC-001-02: Block creation when total exceeds 100%

| Field | Value |
|---|---|
| **Test Case ID** | TC-001-02 |
| **Priority** | High |
| **Description** | Verify that the form blocks a new allocation that would cause the member to exceed 100% capacity during an overlapping period. |

### Steps

1. Ensure the selected member has an existing allocation totaling `60%` for `2026-08-01` to `2026-08-31`.
2. Start creating a new allocation for the same member.
3. Select any project.
4. Enter `50` in **Allocation Percentage**.
5. Enter date range `2026-08-15` to `2026-08-20` (overlaps existing allocation).
6. Click **Add Allocation**.

### Expected Result

- The form does not submit.
- A conflict error is displayed, e.g.:  
  `Cannot create allocation: Alice would be allocated 110% across overlapping allocations (maximum 100%).`
- The **Add Allocation** button is disabled or the submission is prevented.

---

## TC-001-03: Conflict clears after reducing percentage

| Field | Value |
|---|---|
| **Test Case ID** | TC-001-03 |
| **Priority** | Medium |
| **Description** | Verify that the conflict error clears when the user adjusts input so the total no longer exceeds 100%. |

### Steps

1. Reproduce the conflict from TC-001-02.
2. Change the **Allocation Percentage** from `50` to `30`.

### Expected Result

- The conflict error disappears.
- The allocation preview shows a projected total of `90%`.
- The **Add Allocation** button becomes enabled.
- The allocation can be submitted successfully.

---

## TC-001-04: Conflict clears after changing date range to non-overlapping

| Field | Value |
|---|---|
| **Test Case ID** | TC-001-04 |
| **Priority** | Medium |
| **Description** | Verify that a conflict is resolved when the new allocation date range no longer overlaps existing allocations. |

### Steps

1. Reproduce the conflict from TC-001-02.
2. Change the date range to `2026-09-01` to `2026-09-30` (no overlap with existing allocation).

### Expected Result

- The conflict error disappears.
- The allocation preview shows a projected total of `50%`.
- The **Add Allocation** button becomes enabled.
- The allocation can be submitted successfully.

---

## TC-001-05: Server-side validation blocks bypassed client-side check

| Field | Value |
|---|---|
| **Test Case ID** | TC-001-05 |
| **Priority** | High |
| **Description** | Verify that the API rejects a conflicting allocation even if the client-side validation is bypassed. |

### Steps

1. Send a `POST` request directly to `/api/allocations` with a payload that would cause over-allocation:
   ```json
   {
     "member_id": "<existing-member-id>",
     "project_id": "<existing-project-id>",
     "allocation_percentage": 50,
     "start_date": "2026-08-15",
     "end_date": "2026-08-20"
   }
   ```
2. Ensure the member already has `60%` allocated in the overlapping range.

### Expected Result

- The API returns `409 Conflict`.
- The response body contains:
  ```json
  {
    "error": "Alice would be allocated 110% across overlapping allocations (maximum 100%).",
    "code": "OVERALLOCATION_CONFLICT",
    "details": {
      "member_id": "<member-id>",
      "member_name": "Alice",
      "total_percentage": 110
    }
  }
  ```
- No allocation is created in the database.

---

## TC-001-06: Create allocation at exactly 100%

| Field | Value |
|---|---|
| **Test Case ID** | TC-001-06 |
| **Priority** | Medium |
| **Description** | Verify that an allocation is allowed when the projected total equals exactly 100%. |

### Steps

1. Ensure the selected member has an existing allocation of `60%` for `2026-08-01` to `2026-08-31`.
2. Create a new allocation for the same member with `40%` for `2026-08-15` to `2026-08-20`.

### Expected Result

- The allocation is created successfully.
- The projected total is `100%`.
- No conflict error is shown.
