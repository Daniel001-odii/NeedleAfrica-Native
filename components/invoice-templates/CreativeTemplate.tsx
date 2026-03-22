interface InvoiceTemplateProps {
    user: any;
    invoice: any;
    customer: any;
    order: any;
}

export const CreativeTemplate = ({ user, invoice, customer, order }: InvoiceTemplateProps) => {
    return `
        <!DOCTYPE html>
        <html>
            <head>
                <meta name="viewport" content="width=800, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
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
                        font-family: 'Poppins', sans-serif; 
                        color: #111827; 
                        background-color: #ffffff; 
                        margin: 0; 
                        padding: 0;
                        width: 800px;
                        height: 1050px;
                        overflow: hidden;
                        display: flex;
                    }
                    
                    /* Left Sidebar */
                    .sidebar {
                        width: 200px;
                        height: 100%;
                        background-color: #fcfcfc;
                        position: relative;
                        overflow: hidden;
                        flex-shrink: 0;
                        border-right: 1px solid #f0f0f0;
                    }
                    
                    /* Sidebar Geometry Shapes */
                    .shape-yellow { position: absolute; top: 0; left: 0; width: 120px; height: 120px; background-color: #f7d853; border-radius: 0 0 100% 0; }
                    .shape-dots { position: absolute; top: 150px; left: 20px; width: 60px; height: 60px; background-image: radial-gradient(#111827 2px, transparent 2px); background-size: 10px 10px; }
                    .shape-purple { position: absolute; top: 250px; left: -30px; width: 100px; height: 100px; background-color: #b07aba; border-radius: 50%; opacity: 0.8; }
                    .shape-green { position: absolute; top: 450px; right: 0; width: 60px; height: 120px; background-color: #9fdfbc; border-radius: 120px 0 0 120px; opacity: 0.8; }
                    .shape-black { position: absolute; bottom: 250px; left: 40px; width: 40px; height: 40px; background-color: #111827; border-radius: 50%; }
                    
                    /* Sidebar Content */
                    .sidebar-text {
                        position: absolute;
                        top: 60%;
                        transform: translateY(-50%) rotate(-90deg);
                        font-size: 16px;
                        font-weight: 800;
                        letter-spacing: 4px;
                        color: #111827;
                        white-space: nowrap;
                        left: -40px;
                    }
                    .qr-box {
                        position: absolute;
                        bottom: 40px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 100px;
                        text-align: center;
                    }
                    .qr-code { width: 80px; height: 80px; background: #fff; border: 2px solid #111; padding: 5px; }
                    
                    /* Main Content Area */
                    .main-content {
                        flex: 1;
                        padding: 40px 50px;
                        display: flex;
                        flex-direction: column;
                    }
                    
                    .header-top {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 30px;
                    }
                    .invoice-title-wrapper { text-align: left; }
                    .invoice-title { font-size: 60px; font-weight: 800; color: #b07aba; line-height: 1; }
                    
                    .business-info { text-align: right; }
                    .business-name { font-size: 20px; font-weight: 800; color: #111827; margin-bottom: 5px; }
                    .business-contact { font-size: 13px; color: #6b7280; line-height: 1.6; }
                    
                    .meta-grid {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 30px;
                    }
                    .meta-block { flex: 1; }
                    .meta-label { font-size: 13px; font-weight: 800; color: #9fdfbc; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 1px; }
                    .meta-val { font-size: 16px; font-weight: 700; color: #111827; }
                    
                    .to-block { margin-top: 15px; }
                    .to-val { font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 5px; }
                    .to-text { font-size: 13px; color: #6b7280; line-height: 1.5; }
                    
                    .items-table {
                        width: 100%;
                        border-collapse: separate;
                        border-spacing: 0;
                        margin-bottom: 25px;
                    }
                    .items-table th {
                        background-color: #9fdfbc;
                        color: #111827;
                        padding: 15px 20px;
                        text-align: left;
                        font-size: 13px;
                        font-weight: 800;
                        text-transform: uppercase;
                    }
                    .items-table th:first-child { border-radius: 10px 0 0 10px; }
                    .items-table th:last-child { border-radius: 0 10px 10px 0; text-align: right; }
                    
                    .items-table td {
                        padding: 20px;
                        border-bottom: 1px solid #f3f4f6;
                        font-size: 14px;
                        vertical-align: top;
                    }
                    .items-table td:last-child { text-align: right; font-weight: 700; }
                    .item-title { font-weight: 700; color: #111827; margin-bottom: 5px; font-size: 15px; }
                    .item-desc { color: #6b7280; font-size: 13px; max-width: 250px; }
                    
                    .totals-wrapper {
                        display: flex;
                        justify-content: flex-end;
                        margin-bottom: 25px;
                    }
                    .totals-box { width: 350px; }
                    .totals-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 15px; font-weight: 600; color: #4b5563; }
                    
                    .grand-total {
                        display: flex;
                        justify-content: space-between;
                        background-color: #f7d853;
                        color: #111827;
                        padding: 15px 25px;
                        border-radius: 12px;
                        font-size: 18px;
                        font-weight: 800;
                        margin-top: 10px;
                    }
                    
                    .footer-bottom {
                        margin-top: auto;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                    }
                    .terms-box { width: 60%; }
                    .terms-title { font-size: 13px; font-weight: 800; color: #111827; margin-bottom: 5px; text-transform: uppercase; }
                    .terms-text { font-size: 12px; color: #6b7280; line-height: 1.6; }
                    
                    .signature-box { width: 30%; text-align: center; }
                    .signature-line { width: 100%; height: 2px; background-color: #111827; margin-top: 25px; margin-bottom: 10px; }
                    .signature-name { font-size: 15px; font-weight: 800; color: #111827; text-transform: uppercase; }
                </style>
            </head>
            <body>
                <div class="sidebar">
                    <div class="shape-yellow"></div>
                    <div class="shape-dots"></div>
                    <div class="shape-purple"></div>
                    <div class="shape-green"></div>
                    <div class="shape-black"></div>
                    
                    <div class="sidebar-text">THANK YOU FOR YOUR BUSINESS</div>
                    
                    <div class="qr-box">
                        <svg class="qr-code" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h6v6H3V3z"/><path d="M15 3h6v6h-6V3z"/><path d="M3 15h6v6H3v-6z"/><path d="M15 15h2v2h-2z"/><path d="M19 19h2v2h-2z"/><path d="M19 15h2v2h-2z"/><path d="M15 19h2v2h-2z"/></svg>
                        <div style="font-size: 10px; font-weight: 700; margin-top: 5px;">SCAN ME</div>
                    </div>
                </div>
                
                <div class="main-content">
                    <div class="header-top">
                        <div class="invoice-title-wrapper">
                            <div class="invoice-title">INVOICE</div>
                        </div>
                        <div class="business-info">
                            ${user?.profilePicture ? `<img src="${user.profilePicture}" style="height: 50px; object-fit: contain; margin-bottom: 10px; border-radius: 8px;" alt="Logo"><br>` : ''}
                            <div class="business-name">${user?.businessName || 'Business Name'}</div>
                            <div class="business-contact">
                                ${user?.phoneNumber || '+123-456-7890'}<br>
                                ${user?.email || 'email@yourdomain.com'}<br>
                                ${user?.address || '123 Address Rd, City'}
                            </div>
                        </div>
                    </div>
                    
                    <div class="meta-grid">
                        <div class="meta-block">
                            <div class="meta-label">Invoice No:</div>
                            <div class="meta-val">${invoice?.invoiceNumber || '#1234-5678'}</div>
                            
                            <div class="to-block">
                                <div class="meta-label">Invoice To:</div>
                                <div class="to-val">${customer?.fullName || 'Client Name'}</div>
                                <div class="to-text">${customer?.phoneNumber || 'P: +123 456'}<br>Local Client</div>
                            </div>
                        </div>
                        <div class="meta-block" style="text-align: right;">
                            <div class="meta-label">Issue Date:</div>
                            <div class="meta-val" style="margin-bottom: 15px;">${new Date(invoice?.createdAt || 0).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                            
                            <div class="meta-label">Due Date:</div>
                            <div class="meta-val" style="color: #b07aba;">On Receipt</div>
                        </div>
                    </div>
                    
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th style="width: 50%;">Description</th>
                                <th style="width: 20%; text-align: center;">Price</th>
                                <th style="width: 15%; text-align: center;">Qty</th>
                                <th style="width: 15%;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <div class="item-title">${order?.styleName || 'Apparel Service'}</div>
                                    <div class="item-desc">Premium custom styling, tailoring, and fit adjustments</div>
                                </td>
                                <td style="text-align: center;">${invoice?.currency} ${(invoice?.amount || 0).toLocaleString()}</td>
                                <td style="text-align: center;">1</td>
                                <td>${invoice?.currency} ${(invoice?.amount || 0).toLocaleString()}</td>
                            </tr>
                            ${invoice?.notes ? `
                            <tr>
                                <td colspan="4">
                                    <div class="item-title" style="font-size: 13px;">Notes</div>
                                    <div class="item-desc" style="max-width: unset;">${invoice.notes}</div>
                                </td>
                            </tr>
                            ` : ''}
                        </tbody>
                    </table>
                    
                    <div class="totals-wrapper">
                        <div class="totals-box">
                            <div class="totals-row">
                                <span>Sub Total</span>
                                <span>${invoice?.currency} ${(invoice?.amount || 0).toLocaleString()}</span>
                            </div>
                            <div class="totals-row">
                                <span>Tax</span>
                                <span>${invoice?.currency} 0</span>
                            </div>
                            
                            <div class="grand-total">
                                <span>TOTAL</span>
                                <span>${invoice?.currency} ${(invoice?.amount || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="footer-bottom">
                        <div class="terms-box">
                            <div class="terms-title">Terms & Conditions</div>
                            <div class="terms-text">
                                Payment is due within 15 days from the date of the invoice.<br>
                                Please make all cheques payable to ${user?.businessName || 'the business'}.
                            </div>
                        </div>
                        <div class="signature-box">
                            <div class="signature-line"></div>
                            <div class="signature-name">Signature</div>
                        </div>
                    </div>
                </div>
                <div style="position: absolute; bottom: 25px; left: 0; width: 800px; text-align: center; font-size: 11px; font-weight: 800; color: #a1a1aa; letter-spacing: 3px; z-index: 10;">POWERED BY NEEDLEX</div>
            </body>
        </html>
    `;
};
