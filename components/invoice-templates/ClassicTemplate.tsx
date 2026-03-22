interface InvoiceTemplateProps {
    user: any;
    invoice: any;
    customer: any;
    order: any;
}

export const ClassicTemplate = ({ user, invoice, customer, order }: InvoiceTemplateProps) => {
    return `
        <!DOCTYPE html>
        <html>
            <head>
                <meta name="viewport" content="width=800, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
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
                        display: flex;
                    }
                    
                    /* Left Sidebar Geometry */
                    .sidebar {
                        width: 100px;
                        height: 100%;
                        background-color: #555099;
                        position: relative;
                        overflow: hidden;
                        flex-shrink: 0;
                    }
                    /* Simple geometric elements in sidebar */
                    .geo-1 { position: absolute; top: 10%; left: 0; width: 100%; height: 100px; background-color: #f7b731; border-radius: 0 50px 50px 0; }
                    .geo-2 { position: absolute; top: 25%; right: -25px; width: 80px; height: 80px; border: 15px solid #ffffff; background: transparent; transform: rotate(45deg); opacity: 0.8; }
                    .geo-3 { position: absolute; top: 40%; left: 0; width: 0; height: 0; border-top: 50px solid transparent; border-bottom: 50px solid transparent; border-left: 80px solid #f7b731; }
                    .geo-4 { position: absolute; top: 55%; left: 20px; width: 60px; height: 60px; background-color: #ffffff; border-radius: 50%; opacity: 0.9; }
                    .geo-5 { position: absolute; bottom: 20%; right: 0; width: 100%; height: 120px; background-color: #f7b731; border-radius: 50px 0 0 50px; }
                    .geo-6 { position: absolute; bottom: 5%; left: 10px; width: 80px; height: 80px; border: 15px solid #ffffff; background: transparent; transform: rotate(20deg); opacity: 0.8; }
                    
                    /* Right Content Area */
                    .content-wrapper {
                        flex: 1;
                        padding: 60px;
                        padding-left: 50px;
                        display: flex;
                        flex-direction: column;
                    }
                    
                    .header-top {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 4px solid #f7b731;
                        padding-bottom: 40px;
                        margin-bottom: 40px;
                    }
                    .logo-area { display: flex; align-items: center; }
                    .logo-text { font-size: 24px; font-weight: 800; color: #555099; margin-left: 10px; }
                    .invoice-title { font-size: 52px; font-weight: 800; color: #555099; }
                    
                    .meta-grid {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 40px;
                    }
                    .meta-block { flex: 1; }
                    .meta-block:last-child { text-align: right; }
                    .meta-label { font-size: 13px; font-weight: 700; color: #f7b731; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px; }
                    .meta-val { font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 15px; }
                    .meta-text { font-size: 14px; color: #6b7280; line-height: 1.6; }
                    
                    .items-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 50px;
                    }
                    .items-table th {
                        background-color: #555099;
                        color: #ffffff;
                        padding: 15px 25px;
                        text-align: left;
                        font-size: 14px;
                        font-weight: 700;
                    }
                    .items-table th:last-child { text-align: right; }
                    .items-table td {
                        padding: 20px 25px;
                        border-bottom: 1px solid #e5e7eb;
                        font-size: 14px;
                        color: #111827;
                    }
                    .items-table td:last-child { text-align: right; font-weight: 700; }
                    .item-title { font-size: 15px; font-weight: 700; margin-bottom: 5px; }
                    .item-desc { font-size: 12px; color: #6b7280; max-width: 250px; }
                    
                    .totals-section {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 50px;
                    }
                    .terms-block { width: 45%; }
                    .term-title { font-size: 14px; font-weight: 800; color: #111827; margin-bottom: 8px; }
                    .term-text { font-size: 12px; color: #6b7280; line-height: 1.5; margin-bottom: 20px; }
                    
                    .totals-block { width: 40%; }
                    .totals-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; font-weight: 700; color: #4b5563; }
                    .grand-total { 
                        display: flex; 
                        justify-content: space-between; 
                        background-color: #555099; 
                        color: white; 
                        padding: 15px 20px; 
                        font-size: 18px; 
                        font-weight: 800; 
                        margin-top: 15px;
                        border-radius: 4px;
                    }
                    
                    .footer-bottom {
                        margin-top: auto;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                    }
                    .thanks { font-size: 18px; font-weight: 800; color: #555099; margin-bottom: 20px; }
                    .footer-contact { font-size: 12px; color: #6b7280; line-height: 1.6; }
                    .footer-contact span { color: #f7b731; font-weight: 700; }
                    
                    .signature { text-align: center; }
                    .signature-line { width: 150px; height: 2px; background-color: #111827; margin-top: 50px; margin-bottom: 10px; }
                    .signature-name { font-size: 15px; font-weight: 800; color: #555099; }
                </style>
            </head>
            <body>
                <div class="sidebar">
                    <div class="geo-1"></div>
                    <div class="geo-2"></div>
                    <div class="geo-3"></div>
                    <div class="geo-4"></div>
                    <div class="geo-5"></div>
                    <div class="geo-6"></div>
                </div>
                
                <div class="content-wrapper">
                    <div class="header-top">
                        <div class="logo-area">
                            ${user?.profilePicture ? 
                                `<img src="${user.profilePicture}" style="width: 50px; height: 50px; object-fit: contain; border-radius: 4px;" alt="Logo">` : 
                                `<svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 22h20L12 2z" fill="#f7b731"/><path d="M12 2L2 22h10V2z" fill="#555099"/></svg>`
                            }
                            <div class="logo-text">${user?.businessName || 'YourLogo'}</div>
                        </div>
                        <div class="invoice-title">INVOICE</div>
                    </div>
                    
                    <div class="meta-grid">
                        <div class="meta-block"></div>
                        <div class="meta-block">
                            <div class="meta-label">INVOICE NUMBER</div>
                            <div class="meta-val">${invoice?.invoiceNumber || '123-4567'}</div>
                            
                            <div class="meta-label">INVOICE DATE</div>
                            <div class="meta-val">${new Date(invoice?.createdAt || 0).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                        </div>
                        <div class="meta-block">
                            <div class="meta-label">INVOICE TO</div>
                            <div class="meta-val">${customer?.fullName || 'Client Name'}</div>
                            <div class="meta-text">
                                ${user?.phoneNumber || 'P: +00 123 456'}<br>
                                ${user?.address || 'Your Address St.'}
                            </div>
                        </div>
                    </div>
                    
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th style="width: 50%;">Description</th>
                                <th style="width: 20%; text-align: center;">Price</th>
                                <th style="width: 15%; text-align: center;">Quantity</th>
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
                    
                    <div class="totals-section">
                        <div class="terms-block">
                            <div class="term-title">Payment Method :</div>
                            <div class="term-text">
                                Bank Transfer<br>
                                <span style="color: #f7b731;">Yourbankaccount</span>
                            </div>
                            
                            <div class="term-title">Terms & Condition</div>
                            <div class="term-text">
                                Payment due strictly within 15 days of invoice date. Products remain property until fully paid.
                            </div>
                        </div>
                        <div class="totals-block">
                            <div class="totals-row">
                                <span>Sub Total</span>
                                <span>${invoice?.currency} ${(invoice?.amount || 0).toLocaleString()}</span>
                            </div>
                            <div class="totals-row">
                                <span>Taxes (0%)</span>
                                <span>${invoice?.currency} 0</span>
                            </div>
                            <div class="totals-row">
                                <span>Discount (0%)</span>
                                <span>${invoice?.currency} 0</span>
                            </div>
                            
                            <div class="grand-total">
                                <span>Grand Total</span>
                                <span>${invoice?.currency} ${(invoice?.amount || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="footer-bottom">
                        <div>
                            <div class="thanks">Thanks For Your Business<br>With Us!</div>
                            <div class="footer-contact">
                                <span>P :</span> ${user?.phoneNumber || '+123 456 789'}<br>
                                <span>E :</span> ${user?.email || 'email@yoursite.com'}<br>
                                <span>A :</span> ${user?.address || 'Street Address, City'}
                            </div>
                        </div>
                        <div class="signature">
                            <div class="signature-line"></div>
                            <div class="signature-name">${user?.businessName || 'Manager'}</div>
                            <div style="font-size: 12px; color: #f7b731;">Manager</div>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    `;
};
