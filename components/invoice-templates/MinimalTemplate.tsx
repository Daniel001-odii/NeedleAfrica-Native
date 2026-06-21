interface InvoiceTemplateProps {
    user: any;
    invoice: any;
    customer: any;
    orders: any[];
}

export const MinimalTemplate = ({ user, invoice, customer, orders }: InvoiceTemplateProps) => {
    return `
        <!DOCTYPE html>
        <html>
            <head>
                <meta name="viewport" content="width=800, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
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
                        font-family: 'Inter', -apple-system, sans-serif; 
                        color: #1f2937; 
                        background-color: #ffffff; 
                        margin: 0; 
                        padding: 0;
                        width: 800px;
                        height: 1050px;
                        overflow: hidden;
                        position: relative;
                    }
                    
                    /* Decorative Accents */
                    .top-shape {
                        position: absolute;
                        top: 0;
                        right: 0;
                        width: 180px;
                        height: 180px;
                        background-color: #f17b4c;
                        clip-path: polygon(100% 0, 100% 100%, 50% 0);
                        z-index: 1;
                    }
                    .left-stripe {
                        position: absolute;
                        top: 40px;
                        bottom: 40px;
                        left: 0;
                        width: 16px;
                        background-color: #1f2937;
                        z-index: 1;
                    }
                    .bottom-shape {
                        position: absolute;
                        bottom: 40px;
                        left: 0;
                        width: 40px;
                        height: 200px;
                        background-color: #f17b4c;
                        border-top-right-radius: 12px;
                        border-bottom-right-radius: 12px;
                        z-index: 2;
                    }
                    
                    .container {
                        width: 100%;
                        height: 100%;
                        padding: 40px 60px 60px 60px;
                        display: flex;
                        flex-direction: column;
                        position: relative;
                        z-index: 10;
                    }
                    
                    /* Header Zone */
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 30px;
                    }
                    .business-info {
                        display: flex;
                        flex-direction: column;
                        max-width: 400px;
                    }
                    .business-name {
                        font-size: 28px;
                        font-weight: 800;
                        color: #e56b3e;
                        margin-bottom: 4px;
                        line-height: 1.1;
                    }
                    .business-address {
                        font-size: 13px;
                        color: #4b5563;
                        line-height: 1.4;
                        margin-top: 4px;
                    }
                    
                    .invoice-title {
                        text-align: right;
                        padding-right: 40px; /* To avoid overlapping the top shape */
                    }
                    .invoice-title h1 {
                        font-size: 40px;
                        font-weight: 800;
                        color: #111827;
                        margin: 0 0 4px 0;
                        letter-spacing: 0.5px;
                        line-height: 1;
                    }
                    .invoice-date { font-size: 14px; font-weight: 700; color: #4b5563; }
                    
                    /* Metadata Zone */
                    .meta-grid {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 35px;
                        border-top: 1px solid #e5e7eb;
                        padding-top: 20px;
                    }
                    .meta-item {
                        flex: 1;
                    }
                    .meta-item:last-child {
                        text-align: right;
                    }
                    .invoice-no {
                        font-size: 16px;
                        font-weight: 800;
                        color: #111827;
                        letter-spacing: 0.5px;
                    }
                    .to-label { font-size: 13px; font-weight: 800; color: #e56b3e; text-transform: uppercase; margin-bottom: 6px; }
                    .to-name { font-size: 18px; font-weight: 700; margin-bottom: 4px; color: #111827; }
                    .client-address { font-size: 13px; line-height: 1.4; color: #4b5563; }
                    
                    /* Table Zone */
                    .items-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 25px;
                        table-layout: fixed;
                    }
                    .items-table th {
                        text-align: left;
                        padding: 12px 0;
                        border-top: 2px solid #111827;
                        border-bottom: 2px solid #111827;
                        font-size: 13px;
                        font-weight: 800;
                        color: #111827;
                    }
                    .items-table td {
                        padding: 14px 0;
                        vertical-align: top;
                        border-bottom: 1px solid #f3f4f6;
                    }
                    .item-title { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 4px; }
                    .item-desc { font-size: 12px; color: #6b7280; line-height: 1.4; }
                    .item-val { font-size: 15px; font-weight: 700; color: #111827; }
                    
                    .totals-hr {
                        width: 100%;
                        height: 2px;
                        background: #111827;
                        margin-bottom: 20px;
                    }
                    
                    /* Bottom Zone */
                    .bottom-section {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        gap: 20px;
                        margin-bottom: auto; /* Pushes watermark downward */
                    }
                    .term-box {
                        width: 320px;
                    }
                    .term-title { font-size: 13px; font-weight: 800; color: #111827; text-transform: uppercase; margin-bottom: 6px; }
                    .term-desc { font-size: 12px; color: #6b7280; line-height: 1.5; }
                    
                    .totals-box {
                        width: 280px;
                    }
                    .totals-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 10px;
                        font-size: 14px;
                        font-weight: 700;
                        color: #374151;
                    }
                    .grand-total {
                        background-color: #ff6b35;
                        color: #ffffff;
                        display: flex;
                        justify-content: space-between;
                        padding: 12px 16px;
                        font-size: 16px;
                        font-weight: 800;
                        margin-top: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="top-shape"></div>
                <div class="left-stripe"></div>
                <div class="bottom-shape"></div>
                
                <div class="container">
                    <!-- Header -->
                    <div class="header">
                        <div class="business-info">
                            ${user?.profilePicture ?
            `<img src="${user.profilePicture}" style="height: 50px; object-fit: contain; margin-bottom: 8px;" alt="Logo">` :
            `<div class="business-name">${user?.businessName || 'Business Name'}</div>`
        }
                            <div class="business-address">
                                ${user?.address || 'Address, City Name'}<br>
                                ${user?.phoneNumber || ''}
                            </div>
                        </div>
                        <div class="invoice-title">
                            <h1>INVOICE</h1>
                            <div class="invoice-date">${new Date(invoice?.createdAt || 0).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                        </div>
                    </div>
                    
                    <!-- Metadata Info -->
                    <div class="meta-grid">
                        <div class="meta-item" style="padding-top: 25px;">
                            <div class="invoice-no">NO/ISN ${invoice?.invoiceNumber || '00-0000'}</div>
                        </div>
                        <div class="meta-item">
                            <div class="to-label">TO.</div>
                            <div class="to-name">${customer?.fullName || 'Client Name'}</div>
                            <div class="client-address">
                                ${customer?.phoneNumber || 'No phone'}<br>
                                ${customer?.email || ''}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Items Table -->
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th style="width: 10%;">QTY</th>
                                <th style="width: 50%;">DESCRIPTION</th>
                                <th style="width: 20%;">PRICE</th>
                                <th style="width: 20%; text-align: right;">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orders.map((order: any) => `
                            <tr>
                                <td class="item-val">${order.qty || 1}</td>
                                <td>
                                    <div class="item-title">${order?.styleName || 'Custom Service'}</div>
                                    <div class="item-desc">Premium custom styling, tailoring, and fit adjustments for specific measurements.</div>
                                </td>
                                <td class="item-val">${invoice?.currency || '$'} ${(order?.amount || 0).toLocaleString()}</td>
                                <td class="item-val" style="text-align: right;">${invoice?.currency || '$'} ${((order?.amount || 0) * (order.qty || 1)).toLocaleString()}</td>
                            </tr>
                            `).join('')}
                            ${invoice?.notes ? `
                            <tr>
                                <td></td>
                                <td colspan="3">
                                    <div class="item-title" style="font-size: 13px;">Additional Notes</div>
                                    <div class="item-desc">${invoice.notes}</div>
                                </td>
                            </tr>
                            ` : ''}
                        </tbody>
                    </table>
                    
                    <div class="totals-hr"></div>
                    
                    <!-- Bottom Info -->
                    <div class="bottom-section">
                        <div style="display: flex; flex-direction: column; gap: 20px;">
                            <div class="term-box">
                                <div class="term-title">Payment Method</div>
                                <div class="term-desc">
                                    ${user?.bankName && user?.accountNumber && user?.accountName ? `
                                        Bank Name: <strong>${user.bankName}</strong><br/>
                                        Account Number: <strong>${user.accountNumber}</strong><br/>
                                        Account Name: <strong>${user.accountName}</strong>
                                    ` : `
                                        Direct bank transfer. Please include the invoice number in your payment reference.
                                    `}
                                </div>
                            </div>
                            <div class="term-box">
                                <div class="term-title">Terms & Conditions</div>
                                <div class="term-desc">
                                    ${user?.invoiceTerms || 'Payments are due within 15 days of issue.'}
                                </div>
                            </div>
                        </div>
                        
                        <div class="totals-box">
                            <div class="totals-row">
                                <span>Sub Total</span>
                                <span>${invoice?.currency || '$'} ${(invoice?.amount || 0).toLocaleString()}</span>
                            </div>
                            <div class="totals-row">
                                <span>Tax 0%</span>
                                <span>${invoice?.currency || '$'} 0</span>
                            </div>
                            
                            <div class="grand-total">
                                <span>GRAND TOTAL</span>
                                <span>${invoice?.currency || '$'} ${(invoice?.amount || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="position: absolute; bottom: 25px; left: 0; width: 800px; text-align: center; font-size: 11px; font-weight: 800; color: #a1a1aa; letter-spacing: 3px; z-index: 10;">POWERED BY NEEDLEX <br/> NeedleAfrica.com</div>
            </body>
        </html>
    `;
};