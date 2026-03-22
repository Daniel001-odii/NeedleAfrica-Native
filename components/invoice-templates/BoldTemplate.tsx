export interface InvoiceTemplateProps {
    user: any;
    invoice: any;
    customer: any;
    order: any;
}

export const BoldTemplate = ({ user, invoice, customer, order }: InvoiceTemplateProps) => {
    return `
    <!DOCTYPE html>
    <html>
        <head>
            <meta name="viewport" content="width=800, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap');
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
                    font-family: 'Space Grotesk', sans-serif; 
                    margin: 0; 
                    padding: 40px; 
                    width: 800px; 
                    height: 1050px; 
                    overflow: hidden; 
                    background-color: #f4f4f0; 
                    color: #000000; 
                    position: relative; 
                }
                
                .brutal-border {
                    border: 4px solid #000000;
                    height: 100%;
                    width: 100%;
                    position: relative;
                    background-color: #ffffff;
                    padding: 40px;
                    display: flex;
                    flex-direction: column;
                }
                
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    border-bottom: 8px solid #000000;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                
                .type {
                    font-size: 80px;
                    font-weight: 700;
                    line-height: 0.8;
                    margin: 0;
                    text-transform: uppercase;
                    letter-spacing: -2px;
                }
                
                .invoice-meta {
                    text-align: right;
                }
                .invoice-meta h3 { margin: 0; font-size: 24px; font-weight: 700; }
                .invoice-meta p { margin: 5px 0 0 0; font-size: 16px; font-weight: 600; }
                
                .flex-row { display: flex; border-bottom: 4px solid #000000; padding-bottom: 30px; margin-bottom: 30px; }
                .brand-zone { width: 50%; border-right: 4px solid #000000; padding-right: 20px; }
                .client-zone { width: 50%; padding-left: 20px; }
                
                .label { font-size: 12px; font-weight: 700; text-transform: uppercase; background-color: #bbff00; padding: 4px 8px; display: inline-block; border: 2px solid #000000; margin-bottom: 15px; }
                
                h2 { font-size: 28px; font-weight: 700; margin: 0 0 10px 0; text-transform: uppercase; line-height: 1.1; }
                p { font-size: 16px; font-weight: 600; margin: 0 0 5px 0; }
                
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 4px solid #000000; }
                th { background-color: #000000; color: #ffffff; font-size: 14px; font-weight: 700; text-transform: uppercase; padding: 15px; text-align: left; }
                td { padding: 15px; font-size: 18px; font-weight: 600; border-bottom: 2px solid #000000; }
                tr:last-child td { border-bottom: none; }
                
                .totals-wrap { display: flex; justify-content: space-between; align-items: stretch; }
                .notes { width: 45%; border: 4px solid #000000; padding: 20px; background-color: #f4f4f0; }
                .notes h4 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; }
                .notes p { font-size: 14px; }
                
                .totals-box { width: 50%; border: 4px solid #000000; padding: 20px; background-color: #bbff00; display: flex; flex-direction: column; justify-content: center; text-align: right; }
                .totals-box h3 { font-size: 20px; margin: 0 0 5px 0; text-transform: uppercase; }
                .grand { font-size: 48px; font-weight: 700; margin: 0; letter-spacing: -1px; }
                
                .watermark { position: absolute; bottom: -28px; left: 0; width: 100%; text-align: center; font-size: 12px; font-weight: 700; color: #a1a1aa; letter-spacing: 2px; }
            </style>
        </head>
        <body>
            <div class="brutal-border">
                <div class="header">
                    <h1 class="type">INVOICE</h1>
                    <div class="invoice-meta">
                        <h3># ${invoice?.invoiceNumber || '39029'}</h3>
                        <p>${new Date().toLocaleDateString()}</p>
                    </div>
                </div>
                
                <div class="flex-row">
                    <div class="brand-zone">
                        <div class="label">FROM</div>
                        <h2>${user?.businessName || 'NEXUS LABS'}</h2>
                        <p>${user?.email || 'hello@nexus.com'}</p>
                        <p>${user?.address || 'City Core, Sector 4'}</p>
                    </div>
                    <div class="client-zone">
                        <div class="label" style="background-color: #ff00ff; color: white;">TO</div>
                        <h2>${customer?.fullName || 'Alice Vance'}</h2>
                        <p>${customer?.phoneNumber || 'No phone'}</p>
                    </div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th style="width: 50%;">Item</th>
                            <th style="width: 20%; text-align: center;">Qty</th>
                            <th style="width: 30%; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${order?.styleName || 'UX System Audit'}</td>
                            <td style="text-align: center;">1</td>
                            <td style="text-align: right;">${invoice?.currency || '$'} ${(invoice?.amount || 9800).toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="totals-wrap">
                    <div class="notes">
                        <h4>NOTES</h4>
                        <p>${invoice?.notes || 'Payment due strictly within 7 days.'}</p>
                    </div>
                    <div class="totals-box">
                        <h3>TOTAL DUE</h3>
                        <div class="grand">${invoice?.currency || '$'} ${(invoice?.amount || 9800).toLocaleString()}</div>
                    </div>
                </div>
                
                <div class="watermark">POWERED BY NEEDLEX</div>
            </div>
        </body>
    </html>
    `;
};
