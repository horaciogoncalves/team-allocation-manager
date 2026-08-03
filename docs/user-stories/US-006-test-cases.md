# US-006 — Test Cases: Enforce Over-Allocation Validation on `PUT /api/allocations`

## Preconditions

- API is running locally or deployed.
- At least one allocation exists in the database.

---

## TC-006-01: Valid PUT updates allocation

| Field | Value |
|---|---|
| **Test Case ID** | TC-006-01 |
| **Priority** | High |
| **Description** | Verify that a valid update is applied successfully. |

### Steps

1. Send `PUT /api/allocations` with:
   ```json
   {
     "id": "<valid-allocation-id>",
     "allocation_percentage": 50
   }
   ```

### Expected Result

- Response status is `200 OK`.
- Response body contains the updated allocation.
- The database reflects the change.

---

## TC-006-02: PUT causing over-allocation returns 409

| Field | Value |
|---|---|
| **Test Case ID** | TC-006-02 |
| **Priority** | High |
| **Description** | Verify that a conflicting update is rejected. |

### Steps

1. Ensure a member has two allocations of `50%` each for `2026-08-01` to `2026-08-31`.
2. Send `PUT /api/allocations` to change one allocation to `60%`.

### Expected Result

- Response status is `409 Conflict`.
- Response body includes `code: "OVERALLOCATION_CONFLICT"`.
- The allocation is not updated.

---

## TC-006-03: Excluded allocation from overlap total

| Field | Value |
|---|---|
| **Test Case ID** | TC-006-03 |
| **Priority** | High |
| **Description** | Verify that the allocation being updated is excluded from the overlap calculation. |

### Steps

1. Ensure a member has a single allocation of `80%`.
2. Send `PUT /api/allocations` to change it to `90%`.

### Expected Result

- Response status is `200 OK`.
- The update succeeds because the original `80%` is excluded.

---

## TC-006-04: PUT changes allocation to indefinite and triggers conflict

| Field | Value |
|---|---|
| **Test Case ID** | TC-006-04 |
| **Priority** | Medium |
| **Description** | Verify that updating an allocation to have no date range applies indefinite overlap rules. |

### Steps

1. Ensure a member has an existing allocation of `60%` with a date range.
2. Send `PUT /api/allocations` to update another allocation, removing `start_date` and `end_date`, with `50%`.

### Expected Result

- Response status is `409 Conflict`.
- The update is blocked because the indefinite allocation overlaps.

---

## TC-006-05: PUT with invalid percentage returns 400

| Field | Value |
|---|---|
| **Test Case ID** | TC-006-05 |
| **Priority** | Medium |
| **Description** | Verify that invalid percentage values are rejected. |

### Steps

1. Send `PUT /api/allocations` with `allocation_percentage: -10`.

### Expected Result

- Response status is `400 Bad Request`.
- Response body includes an error about percentage range.

---

## TC-006-06: PUT with missing id returns 400

| Field | Value |
|---|---|
| **Test Case ID** | TC-006-06 |
| **Priority** | Medium |
| **Description** | Verify that the allocation id is required. |

### Steps

1. Send `PUT /api/allocations` with `{}`.

### Expected Result

- Response status is `400 Bad Request`.
- Response body includes: `Allocation id is required.`
