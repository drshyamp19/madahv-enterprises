// Billing Engine: Dual-Series Invoicing, Tax Calculations, and Ledger Formula

export class BillingEngine {
  constructor(companyStateCode = "27") {
    this.companyStateCode = companyStateCode; // 27 = Maharashtra
    this.gstCounter = 42;
    this.estimateCounter = 18;
    this.creditNoteCounter = 9;
  }

  // Generate next sequential invoice/estimate number
  getNextDocumentNumber(seriesType, financialYear = "26-27") {
    if (seriesType === "GST_INVOICE") {
      this.gstCounter += 1;
      const formattedNum = String(this.gstCounter).padStart(4, "0");
      return `INV/${financialYear}/${formattedNum}`;
    } else if (seriesType === "NON_GST_ESTIMATE") {
      this.estimateCounter += 1;
      const formattedNum = String(this.estimateCounter).padStart(4, "0");
      return `EST/${financialYear}/${formattedNum}`;
    } else if (seriesType === "CREDIT_NOTE") {
      this.creditNoteCounter += 1;
      const formattedNum = String(this.creditNoteCounter).padStart(4, "0");
      return `CN/${financialYear}/${formattedNum}`;
    }
    throw new Error(`Unknown series type: ${seriesType}`);
  }

  // Calculate taxes and line items
  calculateOrderTotals({
    seriesType = "GST_INVOICE",
    clientStateCode = "27",
    items = [],
    previousOutstanding = 0,
    paidToday = 0
  }) {
    let subtotal = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    const processedItems = items.map((item) => {
      const taxable = item.unit_price * item.quantity;
      subtotal += taxable;

      let lineTaxRate = item.tax_rate || 18;
      if (seriesType === "NON_GST_ESTIMATE") {
        lineTaxRate = 0; // Estimates have 0% tax
      }

      const lineTax = (taxable * lineTaxRate) / 100;

      // Intra-state vs Inter-state calculation
      if (seriesType === "GST_INVOICE") {
        if (clientStateCode === this.companyStateCode) {
          // Intra-state (Within Maharashtra) -> CGST + SGST split 50/50
          cgstAmount += lineTax / 2;
          sgstAmount += lineTax / 2;
        } else {
          // Inter-state (e.g. Gujarat) -> 100% IGST
          igstAmount += lineTax;
        }
      }

      return {
        ...item,
        taxable_value: taxable,
        tax_rate: lineTaxRate,
        tax_amount: lineTax,
        total_amount: taxable + lineTax
      };
    });

    const totalTax = cgstAmount + sgstAmount + igstAmount;
    const currentOrderTotal = Math.round((subtotal + totalTax) * 100) / 100;

    // Critical Vyapar formula:
    // [Current Order Total] + [Previous Outstanding Balance] - [Paid/Advance Today] = [Net Balance Due]
    const netBalanceDue = Math.round((currentOrderTotal + previousOutstanding - paidToday) * 100) / 100;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      cgstAmount: Math.round(cgstAmount * 100) / 100,
      sgstAmount: Math.round(sgstAmount * 100) / 100,
      igstAmount: Math.round(igstAmount * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      currentOrderTotal,
      previousOutstanding,
      paidToday,
      netBalanceDue,
      processedItems
    };
  }
}

export const billingEngine = new BillingEngine();
