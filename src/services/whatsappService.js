// WhatsApp 1-Click Sharing & Receipt Generator

export class WhatsAppService {
  static formatOrderMessage(order, company) {
    const isGst = order.invoice_series === "GST_INVOICE";
    const headerTitle = isGst ? "GST TAX INVOICE" : "ESTIMATE / ORDER RECEIPT";

    const itemsText = order.items
      .map(
        (it, idx) =>
          `${idx + 1}. *${it.name || it.product_name}*\n   Qty: ${it.qty || it.quantity} × ₹${it.unit_price || it.price} = ₹${it.total_amount || it.amount}`
      )
      .join("\n");

    const message = `🏢 *${company.name}*
${company.address}
GSTIN: *${company.gstin}* | Ph: ${company.phone}
━━━━━━━━━━━━━━━━━━━━
📄 *${headerTitle}*
🔢 *Doc No:* ${order.invoice_number}
📅 *Date:* ${order.order_date || new Date().toISOString().split("T")[0]}
👤 *Customer:* ${order.client_name}
📍 *Channel:* ${order.order_channel === "FIELD_VISIT" ? "✅ Field Visit (Verified)" : "📞 Phone Call Order"}
━━━━━━━━━━━━━━━━━━━━
📦 *ORDER ITEMS:*
${itemsText}
━━━━━━━━━━━━━━━━━━━━
💰 *BILL SUMMARY & LEDGER:*
• Subtotal: ₹${order.subtotal?.toLocaleString("en-IN")}
• Total Tax (GST): ₹${order.tax_amount?.toLocaleString("en-IN") || "0"}
• *Current Order Total:* ₹${order.current_order_total?.toLocaleString("en-IN")}
• *Previous Outstanding:* ₹${order.previous_outstanding?.toLocaleString("en-IN")}
• *Paid/Advance Today:* ₹${order.paid_today?.toLocaleString("en-IN")}
━━━━━━━━━━━━━━━━━━━━
🔴 *NET BALANCE DUE: ₹${order.net_balance_due?.toLocaleString("en-IN")}*
━━━━━━━━━━━━━━━━━━━━
💳 *PAY VIA UPI:*
UPI ID: \`${company.bank_details.upi_id}\`
Bank: ${company.bank_details.bank_name} | A/C: ${company.bank_details.account_no} | IFSC: ${company.bank_details.ifsc}

_Thank you for your business! - Booked by ${order.rep_name || "Sales Rep"}_`;

    return message;
  }

  static generateWhatsAppLink(phone, message) {
    const cleanPhone = (phone || "").replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  }
}
