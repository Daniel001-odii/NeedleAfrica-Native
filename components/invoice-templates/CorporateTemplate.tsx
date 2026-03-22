export interface InvoiceTemplateProps {
    user: any;
    invoice: any;
    customer: any;
    order: any;
}

export const CorporateTemplate = ({ user, invoice, customer, order }: InvoiceTemplateProps) => {
    return `
    <!DOCTYPE html>
    <html>
        <head>
            <meta name="viewport" content="width=800, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap');
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
                    font-family: 'Roboto', sans-serif; 
                    margin: 0; 
                    padding: 0; 
                    width: 800px; 
                    height: 1050px; 
                    overflow: hidden; 
                    background-color: #f8fafc; 
                    color: #1e293b; 
                    position: relative; 
                }
                
                .header { 
                    background-color: #1e3a8a; 
                    color: #ffffff; 
                    padding: 50px 60px; 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                }
                .title { font-size: 48px; font-weight: 900; margin: 0; letter-spacing: 2px; }
                .invoice-meta { font-size: 16px; font-weight: 500; margin-top: 10px; color: #93c5fd; }
                
                .brand-info { text-align: right; }
                .brand-name { font-size: 24px; font-weight: 700; margin: 0 0 10px 0; }
                .brand-details p { margin: 0 0 4px 0; font-size: 13px; color: #bfdbfe; }
                
                .main-content { padding: 40px 60px; }
                
                .billing-row { display: flex; justify-content: space-between; margin-bottom: 40px; }
                .bill-to h3 { font-size: 13px; color: #64748b; text-transform: uppercase; margin: 0 0 10px 0; letter-spacing: 1px; }
                .bill-to h2 { margin: 0 0 5px 0; font-size: 20px; font-weight: 700; color: #0f172a; }
                .bill-to p { margin: 0; font-size: 14px; color: #475569; }
                
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; background-color: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
                th { background-color: #f1f5f9; color: #334155; font-size: 13px; font-weight: 700; text-transform: uppercase; padding: 15px 20px; text-align: left; }
                td { padding: 18px 20px; font-size: 14px; color: #1e293b; border-bottom: 1px solid #f1f5f9; font-weight: 500; }
                tr:last-child td { border-bottom: none; }
                
                .totals { display: flex; justify-content: flex-end; margin-bottom: 40px; }
                .totals-box { width: 320px; background-color: #ffffff; padding: 25px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-radius: 8px; border-top: 4px solid #1e3a8a; }
                .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; font-weight: 500; color: #475569; }
                .grand-total { border-top: 1px solid #e2e8f0; margin-top: 15px; padding-top: 15px; font-size: 24px; font-weight: 900; color: #1e3a8a; display: flex; justify-content: space-between; }
                
                .footer { padding: 0 60px; display: flex; justify-content: space-between; align-items: flex-end; }
                .terms h4 { font-size: 13px; color: #64748b; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px; }
                .terms p { font-size: 12px; color: #475569; width: 350px; margin: 0; line-height: 1.6; }
                
                .watermark { position: absolute; bottom: 25px; left: 0; width: 800px; text-align: center; font-size: 11px; font-weight: 800; color: #94a3b8; letter-spacing: 3px; z-index: 10; }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <h1 class="title">INVOICE</h1>
                    <div class="invoice-meta"># ${invoice?.invoiceNumber || 'INV-2023-001'}</div>
                </div>
                <div class="brand-info">
                    <h2 class="brand-name">${user?.businessName || 'Corporate LLC'}</h2>
                    <div class="brand-details">
                        <p>${user?.email || 'contact@corporate.com'}</p>
                        <p>${user?.phoneNumber || '+1 234 567 890'}</p>
                        <p>${user?.address || '123 Business Avenue, Suite 100'}</p>
                    </div>
                </div>
            </div>
            
            <div class="main-content">
                <div class="billing-row">
                    <div class="bill-to">
                        <h3>Billed To</h3>
                        <h2>${customer?.fullName || 'John Doe'}</h2>
                        <p>${customer?.phoneNumber || 'No phone provided'}</p>
                    </div>
                    <div class="bill-to" style="text-align: right;">
                        <h3>Date Issued</h3>
                        <h2>${new Date().toLocaleDateString()}</h2>
                    </div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th style="width: 50%;">Description</th>
                            <th style="width: 15%; text-align: center;">Qty</th>
                            <th style="width: 15%; text-align: center;">Price</th>
                            <th style="width: 20%; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="color: #1e3a8a; font-weight: 700;">${order?.styleName || 'Consulting Services'}</td>
                            <td style="text-align: center;">1</td>
                            <td style="text-align: center;">${invoice?.currency || '$'} ${(invoice?.amount || 2500).toLocaleString()}</td>
                            <td style="text-align: right;">${invoice?.currency || '$'} ${(invoice?.amount || 2500).toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="totals">
                    <div class="totals-box">
                        <div class="total-row">
                            <span>Subtotal</span>
                            <span>${invoice?.currency || '$'} ${(invoice?.amount || 2500).toLocaleString()}</span>
                        </div>
                        <div class="total-row">
                            <span>Tax</span>
                            <span>$ 0.00</span>
                        </div>
                        <div class="grand-total">
                            <span>Total Due</span>
                            <span>${invoice?.currency || '$'} ${(invoice?.amount || 2500).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                
                <div class="footer">
                    <div class="terms">
                        <h4>Payment Terms</h4>
                        <p>${invoice?.notes || 'Please pay the invoice within 15 days online. Thank you for your business.'}</p>
                    </div>
                </div>
            </div>
            
            <div class="watermark">POWERED BY NEEDLEX</div>
        </body>
    </html>
    `;
};
