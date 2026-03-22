interface InvoiceTemplateProps {
    user: any;
    invoice: any;
    customer: any;
    order: any;
}

export const MinimalTemplate = ({ user, invoice, customer, order }: InvoiceTemplateProps) => {
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
                    /* Top Right Orange Polygon */
                    .top-shape {
                        position: absolute;
                        top: 0;
                        right: 0;
                        width: 300px;
                        height: 300px;
                        background-color: #f17b4c;
                        clip-path: polygon(100% 0, 100% 100%, 75% 75%, 75% 0);
                        z-index: 1;
                    }
                    /* Background dark left stripe */
                    .left-stripe {
                        position: absolute;
                        top: 50px;
                        bottom: 50px;
                        left: 0;
                        width: 20px;
                        background-color: #1f2937;
                        z-index: 1;
                    }
                    /* Bottom Left Orange Shape */
                    .bottom-shape {
                        position: absolute;
                        bottom: 50px;
                        left: 0;
                        width: 50px;
                        height: 250px;
                        background-color: #f17b4c;
                        border-top-right-radius: 20px;
                        border-bottom-right-radius: 20px;
                        z-index: 2;
                    }
                    
                    .container {
                        width: 100%;
                        height: 100%;
                        padding: 50px 80px;
                        display: flex;
                        flex-direction: column;
                        position: relative;
                        z-index: 10;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 40px;
                    }
                    .business-info {
                        display: flex;
                        flex-direction: column;
                    }
                    .business-name {
                        font-size: 32px;
                        font-weight: 800;
                        color: #e56b3e;
                        font-family: cursive;
                        margin-bottom: 5px;
                    }
                    .business-sub { font-size: 14px; font-weight: 600; color: #1f2937; }
                    
                    .invoice-title {
                        text-align: right;
                        margin-top: -10px;
                    }
                    .invoice-title h1 {
                        font-size: 48px;
                        font-weight: 800;
                        color: #f17b4c;
                        margin: 0 0 5px 0;
                        letter-spacing: 1px;
                    }
                    .invoice-date { font-size: 16px; font-weight: 700; color: #1f2937; }
                    
                    .meta-grid {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 60px;
                    }
                    .meta-item {
                        flex: 1;
                    }
                    .meta-item:last-child {
                        text-align: right;
                    }
                    .invoice-no {
                        font-size: 18px;
                        font-weight: 800;
                        color: #1f2937;
                    }
                    .to-label { font-size: 15px; font-weight: 600; margin-bottom: 10px; }
                    .to-name { font-size: 20px; font-weight: 700; margin-bottom: 15px; color: #111827; }
                    .company-address { font-size: 14px; line-height: 1.6; color: #4b5563; }
                    
                    .items-table {
                        width: 100%;
                        border-spacing: 0;
                        margin-bottom: 25px;
                    }
                    .items-table th {
                        text-align: left;
                        padding: 15px 0;
                        border-top: 2px solid #111827;
                        border-bottom: 2px solid #111827;
                        font-size: 14px;
                        font-weight: 800;
                        color: #111827;
                    }
                    .items-table td {
                        padding: 25px 0;
                        vertical-align: top;
                    }
                    .item-title { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 5px; }
                    .item-desc { font-size: 13px; color: #6b7280; line-height: 1.5; max-width: 300px; }
                    .item-val { font-size: 16px; font-weight: 700; color: #111827; }
                    
                    .totals-hr {
                        width: 100%;
                        height: 1px;
                        background: #111827;
                        margin-bottom: 30px;
                    }
                    
                    .bottom-section {
                        display: flex;
                        justify-content: space-between;
                        flex-wrap: wrap;
                        gap: 30px;
                    }
                    .term-box {
                        width: 300px;
                    }
                    .term-title { font-size: 15px; font-weight: 800; color: #111827; margin-bottom: 10px; }
                    .term-desc { font-size: 13px; color: #6b7280; line-height: 1.6; }
                    
                    .totals-box {
                        width: 300px;
                    }
                    .totals-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 15px;
                        font-size: 16px;
                        font-weight: 700;
                    }
                    .grand-total {
                        background-color: #ff6b35;
                        color: #ffffff;
                        display: flex;
                        justify-content: space-between;
                        padding: 15px 20px;
                        font-size: 18px;
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
                    <div class="header">
                        <div class="business-info">
                            ${user?.profilePicture ? 
                                `<img src="${user.profilePicture}" style="height: 60px; object-fit: contain; margin-bottom: 10px;" alt="Logo">` : 
                                `<div class="business-name">${user?.businessName || 'Business Name'}</div><div class="business-sub">Premium tailoring</div>`
                            }
                        </div>
                        <div class="invoice-title">
                            <h1>INVOICE</h1>
                            <div class="invoice-date">${new Date(invoice?.createdAt || 0).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                        </div>
                    </div>
                    
                    <div class="meta-grid">
                        <div class="meta-item" style="padding-top: 50px;">
                            <div class="invoice-no">NO/ISN ${invoice?.invoiceNumber || '00-0000'}</div>
                        </div>
                        <div class="meta-item">
                            <div class="to-label">TO.</div>
                            <div class="to-name">${customer?.fullName || 'Client Name'}</div>
                            <div class="company-address">
                                ${user?.businessName || 'Your Business Name'}<br>
                                ${user?.address || 'Address, City Name'}<br>
                                ${user?.phoneNumber || 'Country Phone'}
                            </div>
                        </div>
                    </div>
                    
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
                            <tr>
                                <td class="item-val">1</td>
                                <td>
                                    <div class="item-title">${order?.styleName || 'Custom Service'}</div>
                                    <div class="item-desc">Premium custom styling, tailoring, and fit adjustments for specific measurements</div>
                                </td>
                                <td class="item-val">${invoice?.currency} ${(invoice?.amount || 0).toLocaleString()}</td>
                                <td class="item-val" style="text-align: right;">${invoice?.currency} ${(invoice?.amount || 0).toLocaleString()}</td>
                            </tr>
                            ${invoice?.notes ? `
                            <tr>
                                <td></td>
                                <td colspan="3">
                                    <div class="item-title" style="font-size: 14px;">Additional Notes</div>
                                    <div class="item-desc">${invoice.notes}</div>
                                </td>
                            </tr>
                            ` : ''}
                        </tbody>
                    </table>
                    
                    <div class="totals-hr"></div>
                    
                    <div class="bottom-section">
                        <div style="display: flex; flex-direction: column; gap: 30px;">
                            <div class="term-box">
                                <div class="term-title">Payment Method</div>
                                <div class="term-desc">
                                    Direct bank transfer. Please include invoice number in payment description.
                                </div>
                            </div>
                            <div class="term-box">
                                <div class="term-title">Terms & Condition</div>
                                <div class="term-desc">
                                    Payments are due within 15 days. Refunds not applicable to fully completed garments.
                                </div>
                            </div>
                        </div>
                        
                        <div class="totals-box">
                            <div class="totals-row">
                                <span>Sub Total</span>
                                <span>${invoice?.currency} ${(invoice?.amount || 0).toLocaleString()}</span>
                            </div>
                            <div class="totals-row">
                                <span>Tax 0%</span>
                                <span>${invoice?.currency} 0</span>
                            </div>
                            
                            <div class="grand-total">
                                <span>GRAND TOTAL</span>
                                <span>${invoice?.currency} ${(invoice?.amount || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="position: absolute; bottom: 25px; left: 0; width: 800px; text-align: center; font-size: 11px; font-weight: 800; color: #a1a1aa; letter-spacing: 3px; z-index: 10;">POWERED BY NEEDLEX</div>
            </body>
        </html>
    `;
};
