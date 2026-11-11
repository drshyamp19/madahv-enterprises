// Initial Mock & Seed Data for Madhav Enterprises
export const INITIAL_DATA = {
  company: {
    name: "MADHAV ENTERPRISES",
    tagline: "Industrial Hardware, Bearings & Engineering Supplies",
    gstin: "27AABCM4589K1ZP",
    state_code: "27", // Maharashtra
    state_name: "Maharashtra",
    address: "Plot No. 42, MIDC Industrial Area, Phase II, Bhosari, Pune - 411026",
    phone: "+91 98220 12345",
    email: "billing@madhaventerprises.in",
    bank_details: {
      bank_name: "HDFC Bank",
      account_no: "50200012345678",
      ifsc: "HDFC0000123",
      branch: "Bhosari, Pune",
      upi_id: "madhaventerprises@hdfcbank"
    }
  },

  currentUser: {
    id: "rep-001",
    name: "Ramesh Patil",
    role: "SALES_REP", // 'SALES_REP' or 'ADMIN'
    phone: "+91 98811 54321",
    base_salary: 22000,
    commission_rate: 2.0, // 2% on payment collections
    cash_in_hand: 8500, // Collected cash not yet deposited to accounts
    assigned_beat: "MIDC Industrial Belt - Monday Beat"
  },

  beatRoutes: [
    {
      id: "beat-1",
      name: "MIDC Bhosari Industrial Belt",
      day: "Monday",
      client_ids: ["c-101", "c-102", "c-103", "c-104"]
    },
    {
      id: "beat-2",
      name: "City Market & Hardware Gali",
      day: "Tuesday",
      client_ids: ["c-105", "c-106"]
    },
    {
      id: "beat-3",
      name: "Chakan Auto Engineering Hub",
      day: "Wednesday",
      client_ids: ["c-101", "c-104"]
    }
  ],

  clients: [
    {
      id: "c-101",
      type: "B2B",
      company_name: "Kirloskar Precision Tools Pvt Ltd",
      gstin: "27AAECK3921Q1Z3",
      state_code: "27",
      billing_address: "Plot 18, MIDC Sector 7, Bhosari, Pune",
      shipping_address: "Plot 18, MIDC Sector 7, Bhosari, Pune",
      primary_contact: "Ajay Kulkarni (Purchase Head)",
      phone: "+91 98220 99887",
      accounts_contact: "Sunil Deshpande (Accounts)",
      accounts_phone: "+91 98220 99888",
      credit_days: 30,
      credit_limit: 150000,
      outstanding_balance: 38500,
      gps_lat: 18.6272,
      gps_lng: 73.8436
    },
    {
      id: "c-102",
      type: "B2B",
      company_name: "Shree Ganesh Machine Tools",
      gstin: "27BBSPK8942R1Z8",
      state_code: "27",
      billing_address: "Gala No 5, Ganesh Industrial Estate, Pune",
      shipping_address: "Gala No 5, Ganesh Industrial Estate, Pune",
      primary_contact: "Ganesh Shinde (Proprietor)",
      phone: "+91 94220 44556",
      accounts_contact: "Ganesh Shinde",
      accounts_phone: "+91 94220 44556",
      credit_days: 15,
      credit_limit: 60000,
      outstanding_balance: 52000, // Near credit limit alert
      gps_lat: 18.6290,
      gps_lng: 73.8450
    },
    {
      id: "c-103",
      type: "B2B",
      company_name: "Mahindra Ancillary Works",
      gstin: "27AACCM1122P1Z0",
      state_code: "27",
      billing_address: "Phase II, MIDC, Bhosari, Pune",
      shipping_address: "Phase II, MIDC, Bhosari, Pune",
      primary_contact: "Mahesh Jadhav",
      phone: "+91 97654 32190",
      credit_days: 45,
      credit_limit: 250000,
      outstanding_balance: 14500,
      gps_lat: 18.6260,
      gps_lng: 73.8410
    },
    {
      id: "c-104",
      type: "B2B",
      company_name: "Apex Engineering Solutions (Gujarat Branch)",
      gstin: "24AAPCA6543M1Z2", // Interstate GST (IGST applicable)
      state_code: "24", // Gujarat
      billing_address: "GIDC Industrial Estate, Vapi, Gujarat",
      shipping_address: "GIDC Industrial Estate, Vapi, Gujarat",
      primary_contact: "Bhavin Patel",
      phone: "+91 98980 11223",
      credit_days: 30,
      credit_limit: 100000,
      outstanding_balance: 0,
      gps_lat: 20.3893,
      gps_lng: 72.9106
    },
    {
      id: "c-105",
      type: "B2C",
      company_name: "Santosh Pawar (Retail Workshop)",
      gstin: "",
      state_code: "27",
      billing_address: "City Market, Pune",
      primary_contact: "Santosh Pawar",
      phone: "+91 99210 33445",
      credit_days: 0,
      credit_limit: 5000,
      outstanding_balance: 0,
      gps_lat: 18.5204,
      gps_lng: 73.8567
    }
  ],

  products: [
    {
      id: "p-001",
      name: "SKF Deep Groove Ball Bearing 6205-2RS",
      sku: "BRG-SKF-6205",
      category: "Bearings",
      hsn_code: "8482",
      unit: "PCS",
      unit_price: 380,
      tax_rate: 18,
      physical_stock: 140,
      booked_stock: 45,
      available_stock: 95, // 140 - 45
      damaged_stock: 3,
      reorder_level: 25,
      substitute_ids: ["p-002", "p-003"]
    },
    {
      id: "p-002",
      name: "FAG High Performance Bearing 6205-2RSR",
      sku: "BRG-FAG-6205",
      category: "Bearings",
      hsn_code: "8482",
      unit: "PCS",
      unit_price: 395,
      tax_rate: 18,
      physical_stock: 80,
      booked_stock: 10,
      available_stock: 70,
      damaged_stock: 0,
      reorder_level: 20,
      substitute_ids: ["p-001"]
    },
    {
      id: "p-003",
      name: "NBC Heavy Duty Bearing 6205-ZZ (Metal Shield)",
      sku: "BRG-NBC-6205M",
      category: "Bearings",
      hsn_code: "8482",
      unit: "PCS",
      unit_price: 340,
      tax_rate: 18,
      physical_stock: 5,
      booked_stock: 5,
      available_stock: 0, // OUT OF STOCK test
      damaged_stock: 1,
      reorder_level: 15,
      substitute_ids: ["p-001", "p-002"]
    },
    {
      id: "p-004",
      name: "Bosch Professional Angle Grinder GWS 600 (100mm)",
      sku: "TOOL-BSH-GWS600",
      category: "Power Tools",
      hsn_code: "8467",
      unit: "PCS",
      unit_price: 2650,
      tax_rate: 18,
      physical_stock: 35,
      booked_stock: 8,
      available_stock: 27,
      damaged_stock: 0,
      reorder_level: 8,
      substitute_ids: []
    },
    {
      id: "p-005",
      name: "Castrol Industrial Heavy Grease AP3 (5 Kg Bucket)",
      sku: "LUB-CAS-AP3-5KG",
      category: "Lubricants",
      hsn_code: "2710",
      unit: "BUCKET",
      unit_price: 1850,
      tax_rate: 18,
      physical_stock: 25,
      booked_stock: 6,
      available_stock: 19,
      damaged_stock: 0,
      reorder_level: 5,
      substitute_ids: []
    },
    {
      id: "p-006",
      name: "High Tensile Hex Bolt M12 x 50mm (Grade 8.8)",
      sku: "FST-BLT-M12-50",
      category: "Fasteners",
      hsn_code: "7318",
      unit: "BOX (100)",
      unit_price: 850,
      tax_rate: 18,
      physical_stock: 50,
      booked_stock: 12,
      available_stock: 38,
      damaged_stock: 0,
      reorder_level: 10,
      substitute_ids: []
    }
  ],

  initialOrders: [
    {
      id: "ord-1001",
      invoice_series: "GST_INVOICE",
      invoice_number: "INV/26-27/0041",
      client_id: "c-101",
      client_name: "Kirloskar Precision Tools Pvt Ltd",
      rep_id: "rep-001",
      rep_name: "Ramesh Patil",
      order_date: "2026-11-08",
      order_channel: "FIELD_VISIT",
      is_geofence_verified: true,
      items: [
        { product_id: "p-001", name: "SKF Ball Bearing 6205-2RS", qty: 20, price: 380, tax_rate: 18, amount: 8968 }
      ],
      subtotal: 7600,
      tax_amount: 1368,
      current_order_total: 8968,
      previous_outstanding: 35000,
      paid_today: 5468,
      net_balance_due: 38500,
      status: "DELIVERED"
    },
    {
      id: "ord-1002",
      invoice_series: "NON_GST_ESTIMATE",
      invoice_number: "EST/26-27/0018",
      client_id: "c-105",
      client_name: "Santosh Pawar (Retail Workshop)",
      rep_id: "rep-001",
      rep_name: "Ramesh Patil",
      order_date: "2026-11-10",
      order_channel: "FIELD_VISIT",
      is_geofence_verified: true,
      items: [
        { product_id: "p-001", name: "SKF Ball Bearing 6205-2RS", qty: 2, price: 380, tax_rate: 0, amount: 760 }
      ],
      subtotal: 760,
      tax_amount: 0,
      current_order_total: 760,
      previous_outstanding: 0,
      paid_today: 760,
      net_balance_due: 0,
      status: "DELIVERED"
    }
  ]
};
