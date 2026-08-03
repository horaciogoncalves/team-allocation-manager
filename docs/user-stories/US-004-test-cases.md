# US-004 — Test Cases: Provide Clear, Actionable Conflict Error Messages

## Preconditions

- A conflict scenario exists or can be created in the Allocations page.

---

## TC-004-01: UI error includes member name and projected total

| Field | Value |
|---|---|
| **Test Case ID** | TC-004-01 |
| **Priority** | High |
| **Description** | Verify that the UI conflict message includes the member name and total percentage. |

### Steps

1. Attempt to create an allocation that causes over-allocation for a member named `Alice`.
2. Observe the error message.

### Expected Result

- The error message includes the member name `Alice`.
- The error message includes the projected total percentage (e.g., `110%`).
- The error message mentions the maximum allowed (`100%`).

---

## TC-004-02: UI error is displayed near relevant fields

| Field | Value |
|---|---|
| **Test Case ID** | TC-004-02 |
| **Priority** | Medium |
| **Description** | Verify that the error appears close to the allocation form fields. |

### Steps

1. Trigger a conflict in the allocation form.

### Expected Result

- The error appears inside or directly below the allocation preview/summary area.
- The error is visually distinct (e.g., red background, warning icon).

---

## TC-004-03: API error returns machine-readable code

| Field | Value |
|---|---|
| **Test Case ID** | TC-004-03 |
| **Priority** | High |
| **Description** | Verify that the API returns a structured error with a machine-readable code. |

### Steps

1. Send a `POST /api/allocations` request that causes over-allocation.

### Expected Result

- Response status is `409 Conflict`.
- Response body includes:
  ```json
  {
    "error": "...",
    "code": "OVERALLOCATION_CONFLICT",
    "details": {
      "member_id": "...",
      "member_name": "...",
      "total_percentage": 110
    }
  }
  ```

---

## TC-004-04: Error message lists conflicting allocations

| Field | Value |
|---|---|
| **Test Case ID** | TC-004-04 |
| **Priority** | Medium |
| **Description** | Verify that the error includes details of the existing conflicting allocations. |

### Steps

1. Trigger a conflict involving multiple existing allocations.
2. Review the error details.

### Expected Result

- The error lists each conflicting allocation with project name, percentage, and date range.
- Indefinite allocations are labeled as `Indefinite` or `No date range`.

---

## TC-004-05: Error clears when conflict is resolved

| Field | Value |
|---|---|
| **Test Case ID** | TC-004-05 |
| **Priority** | Medium |
| **Description** | Verify that the error message disappears once the user fixes the input. |

### Steps

1. Trigger a conflict.
2. Adjust the percentage or dates to resolve it.

### Expected Result

- The error message is removed from the UI.
- The form can be submitted successfully.
