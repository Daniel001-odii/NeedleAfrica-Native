interface InvoiceTemplateProps {
    user: any;
    invoice: any;
    customer: any;
    orders: any[];
}

export const EditorialTemplate = ({ user, invoice, customer, orders }: InvoiceTemplateProps) => {
    return `
    <!DOCTYPE html>
    <html>
        <head>
            <meta name="viewport" content="width=800, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                * { 
                    box-sizing: border-box; 
                    -webkit-print-color-adjust: exact !important; 
                    print-color-adjust: exact !important; 
                }
                @page { size: 800px 1050px; margin: 0; }
                @media print {
                    html, body {
                        width: 800px !important;
                        height: 1050px !important;
                        overflow: hidden !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        page-break-inside: avoid !important;
                    }
                }
                body { 
                    font-family: 'Plus Jakarta Sans', sans-serif; 
                    margin: 0; 
                    padding: 0; 
                    width: 800px; 
                    height: 1050px; 
                    overflow: hidden; 
                    background-color: #faf9f5; 
                    color: #1c2e24; 
                    position: relative; 
                }
                
                .container {
                    width: 100%;
                    height: 100%;
                    padding: 50px 55px 60px 55px;
                    display: flex;
                    flex-direction: column;
                }
                
                /* Header Zone */
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    border-bottom: 2px solid #1c2e24;
                    padding-bottom: 25px;
                    margin-bottom: 30px;
                }
                .brand-block {
                    max-width: 400px;
                }
                .brand-title {
                    font-family: 'Lora', serif;
                    font-size: 30px;
                    font-weight: 700;
                    color: #1c2e24;
                    margin: 0 0 6px 0;
                    line-height: 1.1;
                }
                .brand-meta {
                    font-size: 12px;
                    color: #5c6b62;
                    line-height: 1.5;
                }
                
                .invoice-label-block {
                    text-align: right;
                }
                .invoice-label {
                    font-family: 'Lora', serif;
                    font-style: italic;
                    font-size: 36px;
                    color: #c0a98c;
                    margin: 0 0 4px 0;
                    line-height: 1;
                }
                .invoice-number {
                    font-size: 13px;
                    font-weight: 700;
                    color: #1c2e24;
                    letter-spacing: 0.5px;
                }
                
                /* Metadata Grid */
                .meta-section {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 30px;
                    gap: 30px;
                }
                .meta-column {
                    width: 48%;
                }
                .meta-header {
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #c0a98c;
                    margin-bottom: 6px;
                }
                .meta-content {
                    font-family: 'Lora', serif;
                    font-size: 16px;
                    font-weight: 600;
                    color: #1c2e24;
                    margin: 0 0 2px 0;
                }
                .meta-subtext {
                    font-size: 12px;
                    color: #5c6b62;
                    line-height: 1.4;
                }
                
                /* Table Zone */
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 25px;
                    table-layout: fixed;
                }
                th {
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #5c6b62;
                    border-bottom: 2px solid #1c2e24;
                    padding: 8px 0;
                    text-align: left;
                }
                td {
                    padding: 14px 0;
                    border-bottom: 1px solid #e3e1da;
                    vertical-align: top;
                    word-wrap: break-word;
                }
                .item-name {
                    font-family: 'Lora', serif;
                    font-size: 15px;
                    font-weight: 700;
                    color: #1c2e24;
                    margin-bottom: 3px;
                }
                .item-description {
                    font-size: 12px;
                    color: #5c6b62;
                    line-height: 1.4;
                }
                .cell-text {
                    font-size: 13px;
                    font-weight: 600;
                    color: #1c2e24;
                }
                
                /* Totals Zone */
                .summary-container {
                    display: flex;
                    justify-content: flex-end;
                    margin-bottom: 30px;
                }
                .summary-box {
                    width: 280px;
                }
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 6px 0;
                    font-size: 13px;
                    color: #5c6b62;
                    font-weight: 500;
                }
                .grand-total-row {
                    border-top: 1px solid #1c2e24;
                    border-bottom: 1px solid #1c2e24;
                    margin-top: 6px;
                    padding: 10px 0;
                    font-family: 'Lora', serif;
                    font-size: 18px;
                    font-weight: 700;
                    color: #1c2e24;
                    display: flex;
                    justify-content: space-between;
                }
                
                /* Bottom Footer */
                .footer {
                    margin-top: 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    border-top: 1px solid #e3e1da;
                    padding-top: 20px;
                }
                .footer-column {
                    width: 48%;
                }
                .footer-header {
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #5c6b62;
                    margin-bottom: 6px;
                }
                .footer-text {
                    font-size: 11px;
                    color: #5c6b62;
                    line-height: 1.5;
                }
                
                .watermark { 
                    position: absolute; 
                    bottom: 30px; 
                    left: 0; 
                    width: 800px; 
                    text-align: center; 
                    font-size: 10px; 
                    font-weight: 700; 
                    color: #c0a98c; 
                    letter-spacing: 3px; 
                    z-index: 10; 
                    opacity: 0.8; 
                }
            </style>
        </head>
        <body>
            <div class="container">
                <!-- Header Section -->
                <div class="header">
                    <div class="brand-block">
                        <h1 class="brand-title">${user?.businessName || 'Editorial Atelier'}</h1>
                        <div class="brand-meta">
                            ${user?.address || '12 Rue de l\'Académie, Brussels'}<br>
                            ${user?.phoneNumber || '+32 2 555 0190'}
                        </div>
                    </div>
                    <div class="invoice-label-block">
                        <h2 class="invoice-label">Invoice</h2>
                        <div class="invoice-number">NO. ${invoice?.invoiceNumber || 'INV-90210'}</div>
                    </div>
                </div>
                
                <!-- Billing / Date Info Grid -->
                <div class="meta-section">
                    <div class="meta-column">
                        <div class="meta-header">Billed To</div>
                        <div class="meta-content">${customer?.fullName || 'Amélie Laurent'}</div>
                        <div class="meta-subtext">
                            ${customer?.phoneNumber || 'No phone'}<br>
                            ${customer?.email || ''}
                        </div>
                    </div>
                    <div class="meta-column" style="text-align: right;">
                        <div class="meta-header">Date of Issue</div>
                        <div class="meta-content" style="font-size: 15px; font-weight: 500;">
                            ${new Date(invoice?.createdAt || 0).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div class="meta-header" style="margin-top: 10px;">Payment Status</div>
                        <div class="meta-subtext" style="font-weight: 700; color: #1c2e24;">Due on Receipt</div>
                    </div>
                </div>
                
                <!-- Items Table -->
                <table>
                    <thead>
                        <tr>
                            <th style="width: 55%;">Item Description</th>
                            <th style="width: 15%; text-align: center;">Price</th>
                            <th style="width: 10%; text-align: center;">Qty</th>
                            <th style="width: 20%; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map((order: any) => `
                        <tr>
                            <td>
                                <div class="item-name">${order?.styleName || 'Creative Consult'}</div>
                                <div class="item-description">Full brand alignment review, typographic guidelines, and editorial voice workshop.</div>
                            </td>
                            <td class="cell-text" style="text-align: center;">${invoice?.currency || '$'} ${(order?.amount || 0).toLocaleString()}</td>
                            <td class="cell-text" style="text-align: center;">${order.qty || 1}</td>
                            <td class="cell-text" style="text-align: right; font-weight: 700;">${invoice?.currency || '$'} ${((order?.amount || 0) * (order.qty || 1)).toLocaleString()}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <!-- Totals Alignment -->
                <div class="summary-container">
                    <div class="summary-box">
                        <div class="summary-row">
                            <span>Subtotal</span>
                            <span>${invoice?.currency || '$'} ${(invoice?.amount || 1200).toLocaleString()}</span>
                        </div>
                        <div class="summary-row">
                            <span>Estimated Tax (0%)</span>
                            <span>${invoice?.currency || '$'} 0</span>
                        </div>
                        <div class="grand-total-row">
                            <span>Total Due</span>
                            <span>${invoice?.currency || '$'} ${(invoice?.amount || 1200).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Dynamic Footer (Terms & Bank Account Details) -->
                <div class="footer">
                    <div class="footer-column">
                        <div class="footer-header">Terms & Conditions</div>
                        <div class="footer-text">
                            ${user?.invoiceTerms || ''}
                        </div>
                    </div>
                    ${user?.bankName && user?.accountNumber && user?.accountName ? `
                    <div class="footer-column" style="text-align: right;">
                        <div class="footer-header">Bank Details</div>
                        <div class="footer-text">
                            Bank: <strong>${user.bankName}</strong><br>
                            Account No: <strong>${user.accountNumber}</strong><br>
                            Account Holder: <strong>${user.accountName}</strong>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="watermark">POWERED BY NEEDLEX <br/> NeedleAfrica.com</div>
        </body>
    </html>
    `;
};