-- ========================================================================
-- MADHAV ENTERPRISES - B2B & B2C SALES, BILLING & INVENTORY DATABASE SCHEMA
-- Target Engine: PostgreSQL 14+ / Supabase
-- Features: Dual-Series Billing, 3-Way Inventory, 100m Geofencing, Ledgers,
--           Sales Returns (Credit Notes), Beat Routes, Payroll & Commissions.
-- ========================================================================

-- Enable PostGIS for GPS Geolocation & 100m distance calculation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance";

-- ========================================================================
-- 1. USERS & ROLES
-- ========================================================================
CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'SALES_REP', 'DISPATCH_MANAGER', 'ACCOUNTS');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    role user_role_enum NOT NULL DEFAULT 'SALES_REP',
    base_salary NUMERIC(12, 2) NOT NULL DEFAULT 20000.00,
    commission_percentage NUMERIC(5, 2) NOT NULL DEFAULT 2.00, -- Commission on collected payments
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================================
-- 2. FIELD SALES ATTENDANCE & LIVE GPS LOGS
-- ========================================================================
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    punch_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
    punch_in_lat NUMERIC(10, 7) NOT NULL,
    punch_in_lng NUMERIC(10, 7) NOT NULL,
    punch_in_address TEXT,
    punch_out_time TIMESTAMP WITH TIME ZONE,
    punch_out_lat NUMERIC(10, 7),
    punch_out_lng NUMERIC(10, 7),
    punch_out_address TEXT,
    total_working_hours NUMERIC(5, 2) DEFAULT 0,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_daily_attendance UNIQUE(user_id, attendance_date)
);

CREATE TABLE live_location_pings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    battery_level INTEGER,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_location_user_time ON live_location_pings(user_id, recorded_at DESC);

-- ========================================================================
-- 3. BEAT ROUTE PLANNING & SCHEDULES
-- ========================================================================
CREATE TABLE beat_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_name VARCHAR(150) NOT NULL, -- e.g., "MIDC Industrial Phase 1"
    assigned_rep_id UUID REFERENCES users(id) ON DELETE SET NULL,
    day_of_week VARCHAR(15) NOT NULL, -- "MONDAY", "TUESDAY", etc.
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================================
-- 4. CLIENTS / ACCOUNTS (B2B & B2C)
-- ========================================================================
CREATE TYPE client_type_enum AS ENUM ('B2B', 'B2C');

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_type client_type_enum NOT NULL DEFAULT 'B2B',
    company_name VARCHAR(200) NOT NULL, -- For B2C: Customer Full Name
    gstin VARCHAR(15),                  -- NULL for B2C or Unregistered
    state_code VARCHAR(2) NOT NULL DEFAULT '27', -- 27 = Maharashtra
    billing_address TEXT NOT NULL,
    shipping_address TEXT,
    primary_contact_name VARCHAR(120),
    primary_phone VARCHAR(20) NOT NULL,
    accounts_contact_name VARCHAR(120),
    accounts_phone VARCHAR(20),
    credit_days INTEGER NOT NULL DEFAULT 30,    -- 0 for B2C
    credit_limit NUMERIC(12, 2) NOT NULL DEFAULT 50000.00, -- Maximum balance allowed
    current_outstanding NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    assigned_beat_id UUID REFERENCES beat_routes(id) ON DELETE SET NULL,
    gps_lat NUMERIC(10, 7), -- Shop/Office Geotag
    gps_lng NUMERIC(10, 7),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_client_phone ON clients(primary_phone);
CREATE INDEX idx_client_beat ON clients(assigned_beat_id);

-- ========================================================================
-- 5. PRODUCTS & LIVE 3-WAY INVENTORY
-- ========================================================================
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(60) NOT NULL UNIQUE,
    hsn_code VARCHAR(10) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'PCS', -- PCS, BOX, KG, LTR
    unit_price NUMERIC(12, 2) NOT NULL,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00, -- 0%, 5%, 12%, 18%, 28%
    
    -- 3-Way Inventory Core Metrics
    physical_stock INTEGER NOT NULL DEFAULT 0,  -- In warehouse
    booked_stock INTEGER NOT NULL DEFAULT 0,    -- Committed to unfulfilled orders
    -- available_stock is always = physical_stock - booked_stock
    
    damaged_stock INTEGER NOT NULL DEFAULT 0,   -- Quarantine/Damaged warehouse
    reorder_threshold INTEGER NOT NULL DEFAULT 10,
    
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Substitutes / Alternative Products Table (For Out-of-Stock handling)
CREATE TABLE product_substitutes (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    substitute_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    similarity_note VARCHAR(150),
    PRIMARY KEY (product_id, substitute_product_id)
);

-- ========================================================================
-- 6. DUAL-SERIES BILLING ENGINE & ORDERS
-- ========================================================================
CREATE TYPE invoice_series_enum AS ENUM ('GST_INVOICE', 'NON_GST_ESTIMATE');
CREATE TYPE order_status_enum AS ENUM ('DRAFT', 'CONFIRMED', 'DISPATCHED', 'DELIVERED', 'CANCELLED');
CREATE TYPE order_channel_enum AS ENUM ('FIELD_VISIT', 'PHONE_CALL');

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_series invoice_series_enum NOT NULL, -- GST vs Non-GST
    invoice_number VARCHAR(50) NOT NULL UNIQUE,  -- 'INV/26-27/0001' or 'EST/26-27/0001'
    client_id UUID NOT NULL REFERENCES clients(id),
    sales_rep_id UUID NOT NULL REFERENCES users(id),
    order_channel order_channel_enum NOT NULL DEFAULT 'FIELD_VISIT',
    is_geofence_verified BOOLEAN NOT NULL DEFAULT FALSE, -- Must be within 100m of client shop
    
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cgst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    sgst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    igst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_tax NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    current_order_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    
    -- Printed Ledger Calculation on Bill / WhatsApp:
    -- [Current Order Total] + [Previous Balance] - [Paid Today] = [Net Balance Due]
    previous_outstanding_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    paid_today NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    net_balance_due NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    
    status order_status_enum NOT NULL DEFAULT 'CONFIRMED',
    is_split_dispatch BOOLEAN NOT NULL DEFAULT FALSE,
    backorder_notes TEXT,
    whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    hsn_code VARCHAR(10) NOT NULL,
    quantity INTEGER NOT NULL,
    dispatched_quantity INTEGER NOT NULL DEFAULT 0,
    unit_price NUMERIC(12, 2) NOT NULL,
    discount_percent NUMERIC(5, 2) DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
    taxable_value NUMERIC(12, 2) NOT NULL,
    tax_amount NUMERIC(12, 2) NOT NULL,
    total_line_amount NUMERIC(12, 2) NOT NULL
);

-- ========================================================================
-- 7. 15-20 DAYS SALES RETURN FLOW & CREDIT NOTES
-- ========================================================================
CREATE TYPE return_type_enum AS ENUM ('GST_CREDIT_NOTE', 'NON_GST_RETURN_VOUCHER');
CREATE TYPE stock_condition_enum AS ENUM ('RESELLABLE', 'DAMAGED');

CREATE TABLE sales_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_type return_type_enum NOT NULL,
    return_document_number VARCHAR(50) NOT NULL UNIQUE, -- e.g. 'CN/26-27/0001'
    original_order_id UUID NOT NULL REFERENCES orders(id),
    original_invoice_number VARCHAR(50) NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id),
    created_by_rep_id UUID NOT NULL REFERENCES users(id),
    total_credit_amount NUMERIC(12, 2) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sales_return_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_return_id UUID NOT NULL REFERENCES sales_returns(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_refund_price NUMERIC(12, 2) NOT NULL,
    restock_destination stock_condition_enum NOT NULL DEFAULT 'RESELLABLE',
    line_total NUMERIC(12, 2) NOT NULL
);

-- ========================================================================
-- 8. PAYMENTS & CLIENT ACCOUNT LEDGER
-- ========================================================================
CREATE TYPE payment_mode_enum AS ENUM ('CASH', 'UPI', 'NEFT_RTGS', 'CHEQUE');

CREATE TABLE payment_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    client_id UUID NOT NULL REFERENCES clients(id),
    collected_by_rep_id UUID NOT NULL REFERENCES users(id),
    order_id UUID REFERENCES orders(id),
    amount NUMERIC(12, 2) NOT NULL,
    payment_mode payment_mode_enum NOT NULL DEFAULT 'UPI',
    transaction_reference VARCHAR(100), -- UPI UTR / Cheque No
    is_deposited_with_accounts BOOLEAN NOT NULL DEFAULT FALSE,
    collection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================================
-- 9. SALES REP PAYROLL & COMMISSION
-- ========================================================================
CREATE TABLE rep_payroll_monthly (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    payroll_month VARCHAR(7) NOT NULL, -- '2026-11'
    working_days_verified INTEGER NOT NULL DEFAULT 26,
    basic_salary NUMERIC(12, 2) NOT NULL,
    total_collections_made NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    commission_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 2.00,
    earned_commission NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    
    -- Deductions
    cash_in_hand_deductions NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    salary_advances NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    other_deductions NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    
    net_payout NUMERIC(12, 2) NOT NULL,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    paid_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_rep_month_payroll UNIQUE(user_id, payroll_month)
);

-- ========================================================================
-- 10. SEQUENTIAL NUMBERING COUNTERS (DUAL-SERIES)
-- ========================================================================
CREATE TABLE document_series_counters (
    series_key VARCHAR(50) PRIMARY KEY, -- 'GST_INVOICE_26_27', 'ESTIMATE_26_27', 'CREDIT_NOTE_26_27'
    prefix VARCHAR(20) NOT NULL,
    financial_year VARCHAR(10) NOT NULL,
    last_number INTEGER NOT NULL DEFAULT 0
);

INSERT INTO document_series_counters (series_key, prefix, financial_year, last_number) VALUES
('GST_INVOICE_26_27', 'INV/26-27/', '26-27', 0),
('ESTIMATE_26_27', 'EST/26-27/', '26-27', 0),
('CREDIT_NOTE_26_27', 'CN/26-27/', '26-27', 0),
('PAYMENT_RECEIPT_26_27', 'RCP/26-27/', '26-27', 0)
ON CONFLICT DO NOTHING;

-- ========================================================================
-- 11. INVENTORY 3-WAY CONSISTENCY TRIGGER & VIEW
-- ========================================================================
CREATE OR REPLACE VIEW view_inventory_3way AS
SELECT 
    p.id,
    p.sku,
    p.name,
    p.hsn_code,
    p.unit,
    p.unit_price,
    p.physical_stock,
    p.booked_stock,
    (p.physical_stock - p.booked_stock) AS available_for_sale,
    p.damaged_stock,
    p.reorder_threshold,
    CASE 
        WHEN (p.physical_stock - p.booked_stock) <= 0 THEN 'OUT_OF_STOCK'
        WHEN (p.physical_stock - p.booked_stock) <= p.reorder_threshold THEN 'LOW_STOCK'
        ELSE 'IN_STOCK'
    END AS stock_status
FROM products p;

-- Trigger: Ensure Sales Rep cannot book stock exceeding 'Available for Sale'
CREATE OR REPLACE FUNCTION check_stock_availability_before_order()
RETURNS TRIGGER AS $$
DECLARE
    curr_physical INT;
    curr_booked INT;
    curr_available INT;
BEGIN
    SELECT physical_stock, booked_stock INTO curr_physical, curr_booked
    FROM products WHERE id = NEW.product_id;

    curr_available := curr_physical - curr_booked;

    IF NEW.quantity > curr_available THEN
        RAISE EXCEPTION 'Stock Exceeded: Only % units available for sale of product % (Attempted %)', 
            curr_available, NEW.product_id, NEW.quantity;
    END IF;

    -- Update Booked Stock on confirmation
    UPDATE products 
    SET booked_stock = booked_stock + NEW.quantity 
    WHERE id = NEW.product_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_stock_order_item
BEFORE INSERT ON order_items
FOR EACH ROW EXECUTE FUNCTION check_stock_availability_before_order();
