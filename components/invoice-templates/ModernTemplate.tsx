interface InvoiceTemplateProps {
    user: any;
    invoice: any;
    customer: any;
    order: any;
}

export const ModernTemplate = ({ user, invoice, customer, order }: InvoiceTemplateProps) => {
    return `
        <!DOCTYPE html>
        <html>
            <head>
                <meta name="viewport" content="width=800, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
                    * { box-sizing: border-box; }
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
                        padding: 60px 80px;
                        display: flex;
                        flex-direction: column;
                        background-color: #fcfcfc;
                    }
                    .header-top {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 50px;
                    }
                    .logo-area { display: flex; align-items: center; gap: 15px; }
                    .business-name { font-size: 32px; font-weight: 800; color: #5a57a6; line-height: 1.1; }
                    .invoice-title-area { text-align: right; }
                    .invoice-title { font-size: 42px; font-weight: 800; color: #5a57a6; letter-spacing: 2px; }
                    .invoice-date { font-size: 16px; font-weight: 600; color: #111827; margin-top: 5px; }
                    
                    .meta-section {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 50px;
                    }
                    .meta-block {
                        flex: 1;
                    }
                    .meta-label { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 8px; }
                    .meta-text { font-size: 15px; color: #374151; line-height: 1.6; }
                    
                    .items-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 40px;
                    }
                    .items-table th {
                        background-color: #5a57a6;
                        color: #ffffff;
                        padding: 15px 20px;
                        text-align: left;
                        font-size: 15px;
                        font-weight: 600;
                        border: none;
                    }
                    .items-table th:last-child { text-align: right; }
                    .items-table td {
                        padding: 20px;
                        border-bottom: 2px solid #5a57a6;
                        color: #111827;
                    }
                    .items-table td:last-child { text-align: right; font-weight: 700; }
                    .item-title { font-size: 16px; font-weight: 700; margin-bottom: 5px; }
                    .item-desc { font-size: 12px; color: #6b7280; max-width: 250px; line-height: 1.4; }
                    
                    .totals-container {
                        display: flex;
                        justify-content: flex-end;
                        margin-bottom: 40px;
                    }
                    .totals-table {
                        width: 350px;
                        border-collapse: collapse;
                    }
                    .totals-table td {
                        padding: 10px 20px;
                        font-size: 15px;
                        font-weight: 600;
                    }
                    .totals-table td:last-child { text-align: right; }
                    .total-due-row td {
                        background-color: #5a57a6;
                        color: #ffffff;
                        font-size: 20px;
                        font-weight: 800;
                        padding: 15px 20px;
                        border-radius: 8px;
                    }
                    
                    .thank-you {
                        font-size: 20px;
                        font-weight: 800;
                        color: #5a57a6;
                        margin-bottom: 50px;
                    }
                    
                    .footer-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr 1fr;
                        gap: 30px;
                        margin-top: auto;
                        padding-top: 30px;
                        border-top: 2px solid #e5e7eb;
                    }
                    .footer-block h4 { font-size: 15px; color: #111827; margin: 0 0 10px 0; font-weight: 700; }
                    .footer-block p { font-size: 12px; color: #4b5563; line-height: 1.6; margin: 0; }
                    
                    ${user?.profilePicture ? `
                    .logo {
                        width: 60px;
                        height: 60px;
                        border-radius: 12px;
                        object-fit: cover;
                    }
                    ` : ''}
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
                            <div class="invoice-date">${new Date(invoice?.createdAt || 0).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                        </div>
                    </div>
                    
                    <div class="meta-section">
                        <div class="meta-block">
                            <div class="meta-label">Office Address</div>
                            <div class="meta-text">
                                ${user?.address || 'Main street, City<br>Country'}
                            </div>
                            <div class="meta-text" style="margin-top:15px; font-weight: 700;">
                                ${user?.phoneNumber || ''}
                            </div>
                        </div>
                        <div class="meta-block" style="padding-left: 20px;">
                            <div class="meta-label">To:</div>
                            <div class="meta-text" style="font-weight: 700; color: #111827;">${customer?.fullName || 'Client Name'}</div>
                            <div class="meta-text">
                                ${customer?.phoneNumber || 'Client Phone'}
                            </div>
                            <div class="meta-text" style="margin-top: 15px; color: #6b7280; font-weight: 600;">
                                Invoice #${invoice?.invoiceNumber || '000'}
                            </div>
                        </div>
                    </div>
                    
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Items Description</th>
                                <th style="text-align: center;">Unit Price</th>
                                <th style="text-align: center;">Qnt</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <div class="item-title">${order?.styleName || 'Custom Service'}</div>
                                    <div class="item-desc">Custom tailoring and measurement service with premium fabric finishing.</div>
                                </td>
                                <td style="text-align: center;">${invoice?.currency} ${(invoice?.amount || 0).toLocaleString()}</td>
                                <td style="text-align: center;">1</td>
                                <td>${invoice?.currency} ${(invoice?.amount || 0).toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div style="display: flex; justify-content: space-between;">
                        <div style="flex: 1; padding-right: 40px;">
                            ${invoice?.notes ? `
                            <div class="meta-label" style="font-size: 14px;">Note:</div>
                            <p style="font-size: 12px; color: #6b7280; line-height: 1.5; margin-top: 5px;">${invoice.notes}</p>
                            ` : ''}
                        </div>
                        <div class="totals-container">
                            <table class="totals-table">
                                <tr>
                                    <td>SUBTOTAL:</td>
                                    <td>${invoice?.currency} ${(invoice?.amount || 0).toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td>TAX 0%:</td>
                                    <td>${invoice?.currency} 0</td>
                                </tr>
                                <tr style="border-bottom: 20px solid transparent;">
                                    <td>DISCOUNT 0%:</td>
                                    <td>${invoice?.currency} 0</td>
                                </tr>
                                <tr class="total-due-row">
                                    <td style="border-top-left-radius: 8px; border-bottom-left-radius: 8px;">TOTAL DUE:</td>
                                    <td style="border-top-right-radius: 8px; border-bottom-right-radius: 8px;">${invoice?.currency} ${(invoice?.amount || 0).toLocaleString()}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                    
                    <div class="thank-you">Thank you for your Business</div>
                    
                    <div class="footer-grid">
                        <div class="footer-block">
                            <h4>Questions?</h4>
                            <p>Email: ${user?.email || 'hello@needleafrica.com'}</p>
                            <p>Call: ${user?.phoneNumber || '+123456789'}</p>
                        </div>
                        <div class="footer-block">
                            <h4>Payment Info:</h4>
                            <p>Please complete payment via provided Needle Africa payment link or bank transfer.</p>
                        </div>
                        <div class="footer-block">
                            <h4>Terms & Conditions:</h4>
                            <p>Please pay within 15 days of receiving this invoice. Late payments may incur additional fees.</p>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    `;
};

