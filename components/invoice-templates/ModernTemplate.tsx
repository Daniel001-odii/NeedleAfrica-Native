interface InvoiceTemplateProps {
    user: any;
    invoice: any;
    customer: any;
    orders: any[];
}

export const ModernTemplate = ({ user, invoice, customer, orders }: InvoiceTemplateProps) => {
    return `
        <!DOCTYPE html>
        <html>
            <head>
                <meta name="viewport" content="width=800, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
                    * { 
                        box-sizing: border-box; 
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important; 
                    }
                    @page { 
                        size: 800px 1131px; 
                        margin: 0; 
                    }
                    @media print {
                        html, body {
                            width: 800px !important;
                            height: 1131px !important;
                            overflow: hidden !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            page-break-inside: avoid !important;
                        }
                    }
                    body { 
                        font-family: 'Plus Jakarta Sans', Arial, sans-serif; 
                        color: #111827; 
                        background-color: #ffffff; 
                        margin: 0; 
                        padding: 0;
                        width: 800px;
                        height: 1131px;
                        overflow: hidden;
                    }
                    .container {
                        width: 100%;
                        height: 100%;
                        padding: 50px 60px 80px 60px;
                        display: flex;
                        flex-direction: column;
                        background-color: #fcfcfc;
                        position: relative;
                    }
                    
                    /* Header Zone */
                    .header-top {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 35px;
                    }
                    .logo-area { display: flex; align-items: center; gap: 15px; }
                    .business-name { font-size: 28px; font-weight: 800; color: #5a57a6; line-height: 1.1; }
                    .invoice-title-area { text-align: right; }
                    .invoice-title { font-size: 38px; font-weight: 800; color: #5a57a6; letter-spacing: 1px; line-height: 1; }
                    .invoice-date { font-size: 14px; font-weight: 600; color: #4b5563; margin-top: 8px; }
                    
                    /* Meta Zone */
                    .meta-section {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 35px;
                        gap: 20px;
                    }
                    .meta-block {
                        flex: 1;
                    }
                    .meta-label { font-size: 14px; font-weight: 700; color: #5a57a6; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
                    .meta-text { font-size: 14px; color: #374151; line-height: 1.5; }
                    
                    /* Table Zone */
                    .items-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 30px;
                        table-layout: fixed;
                    }
                    .items-table th {
                        background-color: #5a57a6;
                        color: #ffffff;
                        padding: 12px 16px;
                        text-align: left;
                        font-size: 14px;
                        font-weight: 600;
                        border: none;
                    }
                    .items-table th:last-child { text-align: right; }
                    .items-table td {
                        padding: 16px;
                        border-bottom: 1px solid #e5e7eb;
                        color: #111827;
                        vertical-align: top;
                        word-wrap: break-word;
                    }
                    .items-table td:last-child { text-align: right; font-weight: 700; }
                    .item-title { font-size: 15px; font-weight: 700; margin-bottom: 4px; color: #111827; }
                    .item-desc { font-size: 12px; color: #6b7280; line-height: 1.4; }
                    
                    /* Totals Zone */
                    .totals-container {
                        display: flex;
                        justify-content: flex-end;
                        width: 350px;
                    }
                    .totals-table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .totals-table td {
                        padding: 8px 16px;
                        font-size: 14px;
                        font-weight: 600;
                        color: #374151;
                    }
                    .totals-table td:last-child { text-align: right; color: #111827; }
                    .total-due-row td {
                        background-color: #5a57a6;
                        color: #ffffff !important;
                        font-size: 18px;
                        font-weight: 800;
                        padding: 12px 16px;
                    }
                    
                    .thank-you {
                        font-size: 18px;
                        font-weight: 800;
                        color: #5a57a6;
                        margin-top: 20px;
                        margin-bottom: 30px;
                    }
                    
                    /* Footer Zone */
                    .footer-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr 1fr;
                        gap: 20px;
                        margin-top: 20px;
                        padding-top: 20px;
                        border-top: 2px solid #e5e7eb;
                    }
                    .footer-block h4 { font-size: 13px; color: #111827; margin: 0 0 8px 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
                    .footer-block p { font-size: 11px; color: #4b5563; line-height: 1.5; margin: 0; }
                    
                    .logo {
                        width: 50px;
                        height: 50px;
                        border-radius: 8px;
                        object-fit: cover;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header-top">
                        <div class="logo-area">
                            ${user?.profilePicture ? `<img src="${user.profilePicture}" class="logo" alt="Logo">` : ''}
                            <div class="business-name">${user?.businessName || 'Business Name.'}</div>
                        </div>
                        <div class="invoice-title-area">
                            <div class="invoice-title">INVOICE</div>
                            <div class="invoice-date">
                                ${new Date(invoice?.createdAt || 0).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </div>
                        </div>
                    </div>
                    
                    <div class="meta-section">
                        <div class="meta-block">
                            <div class="meta-label">Office Address</div>
                            <div class="meta-text">
                                ${user?.address || 'Main street, City<br>Country'}
                            </div>
                            <div class="meta-text" style="margin-top: 10px; font-weight: 700;">
                                ${user?.phoneNumber || ''}
                            </div>
                        </div>
                        <div class="meta-block" style="padding-left: 10px;">
                            <div class="meta-label">To:</div>
                            <div class="meta-text" style="font-weight: 700; color: #111827;">${customer?.fullName || 'Client Name'}</div>
                            <div class="meta-text">
                                ${customer?.phoneNumber || 'Client Phone'}
                            </div>
                            <div class="meta-text" style="margin-top: 10px; color: #6b7280; font-weight: 600;">
                                Invoice #${invoice?.invoiceNumber || '000'}
                            </div>
                        </div>
                    </div>
                    
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th style="width: 50%;">Items Description</th>
                                <th style="width: 20%; text-align: center;">Unit Price</th>
                                <th style="width: 10%; text-align: center;">Qty</th>
                                <th style="width: 20%; text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orders.map((order: any) => `
                            <tr>
                                <td>
                                    <div class="item-title">${order?.styleName || 'Custom Service'}</div>
                                    <div class="item-desc">Custom tailoring and measurement service with premium fabric finishing.</div>
                                </td>
                                <td style="text-align: center;">${invoice?.currency || '$'} ${(order?.amount || 0).toLocaleString()}</td>
                                <td style="text-align: center;">${order.qty || 1}</td>
                                <td style="text-align: right;">${invoice?.currency || '$'} ${((order?.amount || 0) * (order.qty || 1)).toLocaleString()}</td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="flex: 1; padding-right: 30px;">
                            ${invoice?.notes ? `
                            <div class="meta-label" style="font-size: 13px;">Note:</div>
                            <p style="font-size: 12px; color: #6b7280; line-height: 1.5; margin-top: 5px; margin-bottom: 0;">${invoice.notes}</p>
                            ` : ''}
                        </div>
                        <div class="totals-container">
                            <table class="totals-table">
                                <tr>
                                    <td>SUBTOTAL:</td>
                                    <td>${invoice?.currency || '$'} ${(invoice?.amount || 0).toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td>TAX 0%:</td>
                                    <td>${invoice?.currency || '$'} 0</td>
                                </tr>
                                <tr style="border-bottom: 12px solid transparent;">
                                    <td>DISCOUNT 0%:</td>
                                    <td>${invoice?.currency || '$'} 0</td>
                                </tr>
                                <tr class="total-due-row">
                                    <td style="border-top-left-radius: 6px; border-bottom-left-radius: 6px;">TOTAL DUE:</td>
                                    <td style="border-top-right-radius: 6px; border-bottom-right-radius: 6px; text-align: right;">${invoice?.currency || '$'} ${(invoice?.amount || 0).toLocaleString()}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                    
                    <div class="thank-you">Thank you for your business.</div>
                    
                    <div class="footer-grid">
                        <div class="footer-block">
                            <h4>Questions?</h4>
                            <p>Email: ${user?.email || 'hello@needleafrica.com'}</p>
                            <p>Call: ${user?.phoneNumber || '+123456789'}</p>
                        </div>
                        <div class="footer-block">
                            <h4>Payment Info</h4>
                            ${user?.bankName && user?.accountNumber && user?.accountName ? `
                                <p style="font-weight: 700; color: #111827; margin-bottom: 2px;">Bank: ${user.bankName}</p>
                                <p style="font-weight: 700; color: #111827; margin-bottom: 2px;">Acct: ${user.accountNumber}</p>
                                <p style="font-weight: 700; color: #111827;">Name: ${user.accountName}</p>
                            ` : `
                                <p>Please complete payment via the provided payment link or bank transfer.</p>
                            `}
                        </div>
                        <div class="footer-block">
                             <h4>Terms &amp; Conditions</h4>
                             <p>${user?.invoiceTerms || 'Please pay within 15 days of receiving this invoice.'}</p>
                        </div>
                    </div>
                </div>
                <div class="watermark">POWERED BY NEEDLEX <br/> NeedleAfrica.com</div>
            </body>
        </html>
    `;
};