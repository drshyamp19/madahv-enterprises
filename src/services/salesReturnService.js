// 15-20 Days Sales Return Flow & Credit Note Engine

export class SalesReturnService {
  constructor(inventoryEngine, billingEngine) {
    this.inventoryEngine = inventoryEngine;
    this.billingEngine = billingEngine;
    this.returnsHistory = [];
  }

  // Validate if invoice is within allowed 20 days return window
  isEligibleForReturn(invoiceDateStr, maxDays = 20) {
    const invoiceDate = new Date(invoiceDateStr);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate - invoiceDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      isEligible: diffDays <= maxDays,
      daysElapsed: diffDays,
      maxAllowedDays: maxDays
    };
  }

  // Process sales return
  processReturn({
    originalInvoice,
    returnItems, // [{ product_id, quantity, unit_refund_price, destination: 'RESELLABLE' | 'DAMAGED' }]
    client,
    rep,
    reason
  }) {
    // 1. Generate Credit Note or Sales Return Number
    const isGst = originalInvoice.invoice_series === "GST_INVOICE";
    const docNumber = this.billingEngine.getNextDocumentNumber("CREDIT_NOTE");

    // 2. Compute total refund amount
    let totalCreditAmount = 0;
    const processedItems = returnItems.map((item) => {
      const lineTotal = item.quantity * item.unit_refund_price;
      totalCreditAmount += lineTotal;

      // 3. Update stock in inventory engine based on condition
      this.inventoryEngine.processRestock(
        item.product_id,
        item.quantity,
        item.destination || "RESELLABLE"
      );

      return {
        ...item,
        line_total: lineTotal
      };
    });

    // 4. Deduct credit amount from customer's outstanding ledger balance
    const previousOutstanding = client.outstanding_balance || 0;
    const updatedOutstanding = Math.max(0, previousOutstanding - totalCreditAmount);
    client.outstanding_balance = updatedOutstanding;

    const returnRecord = {
      id: `ret-${Date.now()}`,
      document_number: docNumber,
      return_type: isGst ? "GST_CREDIT_NOTE" : "NON_GST_RETURN_VOUCHER",
      original_invoice_number: originalInvoice.invoice_number,
      client_id: client.id,
      client_name: client.company_name,
      rep_id: rep.id,
      rep_name: rep.name,
      items: processedItems,
      total_credit_amount: totalCreditAmount,
      previous_outstanding: previousOutstanding,
      new_outstanding: updatedOutstanding,
      reason,
      created_at: new Date().toISOString()
    };

    this.returnsHistory.unshift(returnRecord);
    return returnRecord;
  }
}
