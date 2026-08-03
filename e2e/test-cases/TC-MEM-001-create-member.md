# Test Case: Create a New Member

## TC-MEM-001: Create a new member with all fields

### Objective
Verify that a user can create a new member with name, email, role, hourly cost, and billing rate, and that the member appears in the list with the correct margin calculated.

### Preconditions
- The application is running and accessible.
- The user is on the `/members` page.
- No member with the test email exists yet.

### Test Data
| Field | Value |
|-------|-------|
| Name | Jane Doe |
| Email | jane.doe.test@example.com |
| Role | QA Engineer |
| Hourly Cost (€) | 32,00 |
| Billing Rate (€) | 50,00 |
| Expected Margin | 36,00% |

### Steps
1. Navigate to `/members`.
2. Click the **Add Member** button.
3. Fill in **Name** with `Jane Doe`.
4. Fill in **Email** with `jane.doe.test@example.com`.
5. Fill in **Role** with `QA Engineer`.
6. Fill in **Hourly Cost (€)** with `32,00`.
7. Fill in **Billing Rate (€)** with `50,00`.
8. Verify the **Margin** field shows `36,00%`.
9. Click the **Add Member** submit button.
10. Verify the member appears in the Member List table.
11. Verify the table row contains:
    - Name: Jane Doe
    - Email: jane.doe.test@example.com
    - Role: QA Engineer
    - Hourly Cost: € 32,00
    - Billing Rate: € 50,00
    - Margin: 36,00%

### Expected Result
The member is created successfully and displayed in the list with all fields and the correct calculated margin.

### Cleanup
Delete the test member after the test run.
