# US-005 — Test Cases: Enforce Over-Allocation Validation on `POST /api/allocations`

## Preconditions

- API is running locally or deployed.
- Valid `member_id` and `project_id` exist in the database.

---

## TC-005-01: Valid POST creates allocation

| Field | Value |
|---|---|
| **Test Case ID** | TC-005-01 |
| **Priority** | High |
| **Description** | Verify that a valid allocation payload is created successfully. |

### Steps

1. Send `POST /api/allocations` with:
   ```json
   {
     "member_id": "<valid-member-id>",
     "project_id": "<valid-project-id>",
     "allocation_percentage": 50,
     "start_date": "2026-08-01",
     "end_date": "2026-08-31"
   }
   ```

### Expected Result

- Response status is `201 Created`.
- Response body contains the created allocation with member and project details.
- The allocation exists in the database.

---

## TC-005-02: POST with over-allocation returns 409

| Field | Value |
|---|---|
| **Test Case ID** | TC-005-02 |
| **Priority** | High |
| **Description** | Verify that a conflicting allocation is rejected. |

### Steps

1. Ensure the member has `60%` allocated in the overlapping range.
2. Send `POST /api/allocations` with `50%` in the overlapping range.

### Expected Result

- Response status is `409 Conflict`.
- Response body includes `code: "OVERALLOCATION_CONFLICT"`.
- No allocation is created.

---

## TC-005-03: POST with omitted dates applies indefinite rule

| Field | Value |
|---|---|
| **Test Case ID** | TC-005-03 |
| **Priority** | High |
| **Description** | Verify that omitted start/end dates are treated as indefinite. |

### Steps

1. Ensure the member has an existing allocation of `60%` with any date range.
2. Send `POST /api/allocations` with `50%` and no `start_date` or `end_date`.

### Expected Result

- Response status is `409 Conflict`.
- The indefinite allocation overlaps the existing dated allocation.

---

## TC-005-04: POST with invalid percentage returns 400

| Field | Value |
|---|---|
| **Test Case ID** | TC-005-04 |
| **Priority** | Medium |
| **Description** | Verify that percentage validation runs before conflict detection. |

### Steps

1. Send `POST /api/allocations` with `allocation_percentage: 150`.

### Expected Result

- Response status is `400 Bad Request`.
- Response body includes an error about percentage range.
- Conflict detection is not executed.

---

## TC-005-05: POST with end date before start date returns 400

| Field | Value |
|---|---|
| **Test Case ID** | TC-005-05 |
| **Priority** | Medium |
| **Description** | Verify that invalid date ranges are rejected. |

### Steps

1. Send `POST /api/allocations` with `start_date: "2026-08-31"` and `end_date: "2026-08-01"`.

### Expected Result

- Response status is `400 Bad Request`.
- Response body includes: `End date must be on or after start date.`

---

## TC-005-06: POST with missing required fields returns 400

| Field | Value |
|---|---|
| **Test Case ID** | TC-005-06 |
| **Priority** | Medium |
| **Description** | Verify that missing member_id, project_id, or percentage is rejected. |

### Steps

1. Send `POST /api/allocations` with `{}`.

### Expected Result

- Response status is `400 Bad Request`.
- Response body indicates invalid request body.
