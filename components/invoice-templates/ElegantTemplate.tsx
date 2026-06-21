export interface InvoiceTemplateProps {
    user: any;
    invoice: any;
    customer: any;
    orders: any[];
}

export const ElegantTemplate = ({ user, invoice, customer, orders }: InvoiceTemplateProps) => {
    return `
    <!DOCTYPE html>
    <html>
        <head>
            <meta name="viewport" content="width=800, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Lato:wght@300;400;700&display=swap');
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
                    font-family: 'Lato', sans-serif; 
                    margin: 0; 
                    padding: 0; 
                    width: 800px; 
                    height: 1050px; 
                    overflow: hidden; 
                    background-color: #ffffff; 
                    color: #333333; 
                    position: relative; 
                }
                
                /* Border Frame */
                .border-frame {
                    position: absolute;
                    top: 20px; left: 20px; right: 20px; bottom: 20px;
                    border: 1px solid #d4af37;
                    z-index: 0;
                    pointer-events: none;
                }
                
                /* Header Zone */
                .header-wrapper {
                    text-align: center;
                    padding: 45px 50px 25px;
                    border-bottom: 1px solid #eaeaea;
                    margin: 0 40px;
                }
                .brand-name {
                    font-family: 'Playfair Display', serif;
                    font-size: 32px;
                    font-weight: 700;
                    color: #222222;
                    margin: 0 0 8px 0;
                    letter-spacing: 2px;
                }
                .brand-details {
                    font-size: 12px;
                    color: #777777;
                    font-weight: 300;
                    letter-spacing: 1px;
                }
                
                .invoice-title {
                    font-family: 'Playfair Display', serif;
                    font-size: 36px;
                    font-style: italic;
                    color: #d4af37;
                    text-align: center;
                    margin: 20px 0 0 0;
                }
                
                /* Content Zone */
                .main-content { 
                    padding: 25px 60px 60px 60px; 
                    display: flex;
                    flex-direction: column;
                }
                
                .meta-row { 
                    display: flex; 
                    justify-content: space-between; 
                    border-bottom: 1px solid #eaeaea; 
                    padding-bottom: 20px; 
                    margin-bottom: 25px; 
                }
                .meta-col h4 { font-size: 11px; color: #a0a0a0; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 6px 0; }
                .meta-col p { font-size: 16px; margin: 0; color: #222222; font-family: 'Playfair Display', serif; }
                .meta-col span { font-size: 13px; color: #666666; display: block; margin-top: 2px; }
                
                /* Table Zone */
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-bottom: 25px; 
                    table-layout: fixed;
                }
                th { 
                    color: #a0a0a0; 
                    font-size: 11px; 
                    font-weight: 700; 
                    text-transform: uppercase; 
                    letter-spacing: 2px; 
                    padding: 8px 0; 
                    border-bottom: 1px solid #d4af37; 
                    text-align: left; 
                }
                td { 
                    padding: 16px 0; 
                    font-size: 14px; 
                    color: #333333; 
                    border-bottom: 1px solid #eaeaea; 
                    word-wrap: break-word;
                }
                
                /* Totals Zone */
                .totals-container { display: flex; justify-content: flex-end; }
                .totals-box { width: 250px; }
                .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #666666; }
                .grand-total { 
                    border-top: 1px solid #d4af37; 
                    border-bottom: 1px solid #d4af37; 
                    margin-top: 8px; 
                    padding: 12px 0; 
                    font-size: 18px; 
                    font-weight: 700; 
                    color: #222222; 
                    font-family: 'Playfair Display', serif; 
                    display: flex; 
                    justify-content: space-between; 
                }
                
                /* Footer Zone */
                .footer { text-align: center; margin-top: 25px; }
                .footer p { font-size: 11px; color: #888888; font-style: italic; font-family: 'Playfair Display', serif; margin: 0 0 8px 0; }
                .payment-details {
                    font-size: 10px; 
                    text-transform: uppercase; 
                    letter-spacing: 1px; 
                    color: #777777;
                    margin-top: 10px;
                }
                
                .watermark { 
                    position: absolute; 
                    bottom: 35px; 
                    left: 0; 
                    width: 800px; 
                    text-align: center; 
                    font-size: 10px; 
                    font-weight: 700; 
                    color: #d4af37; 
                    letter-spacing: 4px; 
                    z-index: 10; 
                    opacity: 0.7; 
                }
            </style>
        </head>
        <body>
            <div class="border-frame"></div>
            
            <div class="header-wrapper">
                <h1 class="brand-name">${user?.businessName || 'Elegance Maison'}</h1>
                <div class="brand-details">
                    ${user?.address || '45 Avenue de la mode, Paris'} &nbsp;|&nbsp; ${user?.phoneNumber || '+33 1 23 45 67'}
                </div>
            </div>
            
            <h2 class="invoice-title">Invoice</h2>
            
            <div class="main-content">
                <!-- Info Row -->
                <div class="meta-row">
                    <div class="meta-col">
                        <h4>Billed To</h4>
                        <p>${customer?.fullName || 'Isabella Rossi'}</p>
                        <span>${customer?.phoneNumber || 'No phone provided'}</span>
                    </div>
                    <div class="meta-col" style="text-align: right;">
                        <h4>Invoice Number</h4>
                        <p># ${invoice?.invoiceNumber || 'INV-001'}</p>
                        <h4 style="margin-top: 10px;">Date</h4>
                        <span>${new Date().toLocaleDateString()}</span>
                    </div>
                </div>
                
                <!-- Table Details -->
                <table>
                    <thead>
                        <tr>
                            <th style="width: 55%;">Description</th>
                            <th style="width: 15%; text-align: center;">Qty</th>
                            <th style="width: 30%; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map((order: any) => `
                        <tr>
                            <td style="font-family: 'Playfair Display', serif; font-size: 16px;">${order?.styleName || 'Bespoke Tailoring'}</td>
                            <td style="text-align: center;">${order.qty || 1}</td>
                            <td style="text-align: right; font-weight: 600;">${invoice?.currency || '$'} ${((order?.amount || 0) * (order.qty || 1)).toLocaleString()}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <!-- Totals Summary -->
                <div class="totals-container">
                    <div class="totals-box">
                        <div class="total-row">
                            <span>Subtotal</span>
                            <span>${invoice?.currency || '$'} ${(invoice?.amount || 5400).toLocaleString()}</span>
                        </div>
                        <div class="grand-total">
                            <span>Total</span>
                            <span>${invoice?.currency || '$'} ${(invoice?.amount || 5400).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Terms & Bank Details -->
                <div class="footer">
                     <p>${user?.invoiceTerms || 'Thank you for your business.'}</p>
                     ${user?.bankName && user?.accountNumber && user?.accountName ? `
                         <div class="payment-details">
                             Payment Details: ${user.bankName} &nbsp;|&nbsp; Acct: ${user.accountNumber} &nbsp;|&nbsp; Name: ${user.accountName}
                         </div>
                     ` : ''}
                 </div>
            </div>
            
           <div class="watermark">POWERED BY NEEDLEX <br/> NeedleAfrica.com</div>
        </body>
    </html>
    `;
};