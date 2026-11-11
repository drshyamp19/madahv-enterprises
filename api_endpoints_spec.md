# Madhav Enterprises - REST & Firebase API Endpoints Specification

This document outlines the API endpoints and Firebase Cloud Functions supporting the PWA & Web Dashboard.

---

## 1. Authentication & Attendance API

### `POST /api/v1/auth/login`
- **Description:** Login sales reps and admins via Phone + OTP or Password.
- **Request Body:** `{ phone: string, otp?: string, password?: string }`
- **Response:** `{ token: string, user: { id, name, role, base_salary, commission_rate } }`

### `POST /api/v1/attendance/punch-in`
- **Description:** GPS Punch-in at start of day.
- **Request Body:** `{ rep_id: string, lat: number, lng: number, address: string }`
- **Validation:** Captures GPS coordinates and timestamp.
- **Response:** `{ success: true, attendance_id: string, punch_in_time: string }`

### `POST /api/v1/attendance/punch-out`
- **Description:** GPS Punch-out at end of shift.
- **Request Body:** `{ attendance_id: string, lat: number, lng: number }`
- **Response:** `{ success: true, total_hours: number }`

### `GET /api/v1/attendance/today`
- **Description:** Returns today's attendance status for all reps (Admin view).

---

## 2. Beat Route & Visit Verification API

### `GET /api/v1/beats/today?rep_id={rep_id}&day={MONDAY}`
- **Description:** Fetches assigned beat route and scheduled client visit list for today.
- **Response:**
  ```json
  {
    "route_name": "MIDC Industrial Phase 1",
    "clients": [
      {
        "id": "c-101",
        "company_name": "Shree Ganesh Hardware",
        "type": "B2B",
        "gps_lat": 18.5204,
        "gps_lng": 73.8567,
        "credit_limit": 100000,
        "outstanding": 32000
      }
    ]
  }
  ```

### `POST /api/v1/visits/verify-geofence`
- **Description:** Verifies if the field sales rep is within 100m of the client's shop.
- **Request Body:** `{ client_id: string, current_lat: number, current_lng: number }`
- **Response:** 
  ```json
  {
    "distance_meters": 42.5,
    "is_within_100m": true,
    "verified_channel": "FIELD_VISIT"
  }
  ```

---

## 3. Client & Ledger Management API

### `GET /api/v1/clients`
- **Description:** Fetch list of B2B and B2C clients with outstanding balances and credit status.

### `POST /api/v1/clients`
- **Description:** Create a new B2B or B2C client.
- **Request Body:**
  ```json
  {
    "client_type": "B2B",
    "company_name": "Omkar Industrial Supplies",
    "gstin": "27AAFCO1234F1Z5",
    "primary_phone": "9876543210",
    "credit_days": 30,
    "credit_limit": 150000,
    "billing_address": "Plot 45, MIDC, Pune",
    "gps_lat": 18.5200,
    "gps_lng": 73.8550
  }
  ```

### `GET /api/v1/clients/{id}/ledger`
- **Description:** Complete customer account ledger showing invoices, payments, credit notes, and running balance.

---

## 4. Live 3-Way Inventory API

### `GET /api/v1/inventory`
- **Description:** Returns live product inventory with all 3 stock metrics.
- **Response:**
  ```json
  [
    {
      "id": "prod-01",
      "name": "Industrial Ball Bearing 6205-2RS",
      "sku": "BRG-6205",
      "hsn_code": "8482",
      "unit_price": 450,
      "tax_rate": 18,
      "physical_stock": 120,
      "booked_stock": 35,
      "available_for_sale": 85,
      "damaged_stock": 2,
      "substitutes": [
        { "id": "prod-02", "name": "Heavy Duty Bearing 6205-ZZ", "available_for_sale": 50 }
      ]
    }
  ]
  ```

### `GET /api/v1/inventory/substitutes/{product_id}`
- **Description:** Returns alternative in-stock products if requested item is out of stock.

---

## 5. Dual-Series Billing & Order Engine API

### `POST /api/v1/orders/create`
- **Description:** Books an order with dual-series numbering (GST or Non-GST) and 3-way inventory deduction.
- **Request Body:**
  ```json
  {
    "invoice_series": "GST_INVOICE", 
    "client_id": "c-101",
    "rep_id": "u-01",
    "order_channel": "FIELD_VISIT",
    "is_geofence_verified": true,
    "items": [
      { "product_id": "prod-01", "quantity": 10, "unit_price": 450, "tax_rate": 18 }
    ],
    "paid_today": 2000,
    "payment_mode": "UPI"
  }
  ```
- **Execution Workflow:**
  1. Validates that `quantity <= available_for_sale`.
  2. Increments sequential counter: `INV/26-27/0045` (or `EST/26-27/0012`).
  3. Computes:
     - `Current Order Total = Taxable Subtotal + CGST/SGST/IGST`
     - `Net Balance Due = Current Order Total + Client.outstanding - Paid Today`
  4. Increases `booked_stock` by 10.
  5. Updates `client.current_outstanding = Net Balance Due`.
  6. Returns order object with WhatsApp formatted string and PDF receipt data.

---

## 6. Sales Return & Credit Notes API (15-20 Days Flow)

### `POST /api/v1/returns/create`
- **Description:** Processes sales return against an existing invoice.
- **Request Body:**
  ```json
  {
    "original_invoice_number": "INV/26-27/0045",
    "client_id": "c-101",
    "items": [
      {
        "product_id": "prod-01",
        "quantity": 2,
        "unit_refund_price": 450,
        "restock_destination": "RESELLABLE" 
      }
    ],
    "reason": "Client ordered wrong bore size"
  }
  ```
- **Execution Workflow:**
  1. Checks if return is within 20 days of invoice date.
  2. Generates Credit Note number `CN/26-27/0009`.
  3. If `restock_destination == 'RESELLABLE'`, adds +2 to `physical_stock`.
  4. If `restock_destination == 'DAMAGED'`, adds +2 to `damaged_stock`.
  5. Deducts credit amount from `client.current_outstanding`.

---

## 7. Payments Collection API

### `POST /api/v1/payments/collect`
- **Description:** Sales rep records payment received from client.
- **Request Body:**
  ```json
  {
    "client_id": "c-101",
    "rep_id": "u-01",
    "amount": 10000,
    "payment_mode": "CASH",
    "transaction_reference": "Handover to Sales Exec"
  }
  ```
- **Outcome:** Generates receipt `RCP/26-27/0118`, updates customer ledger, and adds to rep's cash-in-hand liability.

---

## 8. Payroll & Commission Engine API

### `GET /api/v1/payroll/summary?month=2026-11&rep_id={rep_id}`
- **Calculations:**
  - `Basic Salary = (base_salary / 26) * verified_working_days`
  - `Collections Commission = total_collections_made * (commission_percentage / 100)`
  - `Net Payout = Basic Salary + Collections Commission - cash_collected_in_hand - advances`

### `POST /api/v1/payroll/generate-payslip`
- **Description:** Generates approved PDF salary slip and marks month as settled.
