interface InvoiceTemplateProps {
    user: any;
    invoice: any;
    customer: any;
    orders: any[];
}

export const ClassicTemplate = ({ user, invoice, customer, orders }: InvoiceTemplateProps) => {
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
                font-family: 'Plus Jakarta Sans', Arial, sans-serif; 
                color: #222222; 
                background-color: #ffffff; 
                margin: 0; 
                padding: 0;
                width: 800px;
                height: 1050px;
                overflow: hidden;
                position: relative;
            }
            
            /* Left Geometric Sidebar */
            .sidebar {
                position: absolute;
                left: 0;
                top: 0;
                width: 120px;
                height: 100%;
                background-color: #ffffff;
                z-index: 1;
            }
            
            /* Main Content Area */
            .main-content {
                position: absolute;
                left: 120px;
                top: 0;
                width: 680px;
                height: 100%;
                padding: 35px 50px 55px 35px;
                display: flex;
                flex-direction: column;
                z-index: 2;
            }
            
            /* Typography & Colors - High Contrast for Print */
            .text-purple { color: #8c4a9e; }
            .text-green { color: #1b9a5e; }
            .text-yellow { color: #c49000; }
            .text-orange { color: #d96216; }
            .text-gray { color: #555555; }
            .text-dark { color: #222222; }
            
            h1.title {
                font-size: 56px;
                font-weight: 800;
                margin: 0;
                line-height: 1;
                letter-spacing: 0.5px;
            }
            .invoice-no {
                font-size: 14px;
                font-weight: 800;
                margin: 8px 0 0 0;
                letter-spacing: 1px;
                text-transform: uppercase;
            }
            
            .header-info-row {
                display: flex;
                justify-content: space-between;
                margin-top: 25px;
                margin-bottom: 20px;
            }
            .section-label {
                font-size: 13px;
                font-weight: 800;
                margin: 0 0 4px 0;
                letter-spacing: 0.5px;
            }
            .invoice-to-name {
                font-size: 18px;
                font-weight: 800;
                margin: 0;
            }
            .company-info {
                text-align: right;
                font-size: 12px;
                line-height: 1.5;
            }
            .company-info p { margin: 0; }
            
            /* Table Layout */
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
                table-layout: fixed;
            }
            .items-table th {
                font-size: 13px;
                font-weight: 800;
                text-align: left;
                padding-bottom: 10px;
                border-bottom: 2px solid #e5e7eb;
            }
            .items-table td {
                padding: 10px 0;
                font-size: 13px;
                font-weight: 600;
                border-bottom: 1px solid #f3f4f6;
                word-wrap: break-word;
            }
            
            /* Totals & Payment */
            .totals-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 15px;
            }
            .method-name { font-size: 11px; margin: 0 0 2px 0; font-weight: 700; text-transform: uppercase; }
            .method-detail { font-size: 12px; margin: 0 0 10px 0; font-weight: 600; }
            
            .calc-row {
                display: flex;
                justify-content: space-between;
                width: 220px;
                margin-bottom: 10px;
                font-size: 13px;
                font-weight: 800;
            }
            
            /* Terms & Total Pill */
            .terms-total-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: auto; /* Dynamically pushes footer downward */
                gap: 15px;
            }
            .terms { width: 50%; }
            .terms-text {
                font-size: 11px;
                line-height: 1.5;
                margin: 4px 0 0 0;
                font-weight: 600;
            }
            
            .total-pill {
                display: flex;
                align-items: center;
                background-color: #ffcc33;
                border-radius: 50px;
                padding: 6px 24px 6px 6px;
                gap: 15px;
            }
            .total-badge {
                background-color: #222222;
                color: #ffffff;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 800;
                font-size: 13px;
            }
            .total-amount {
                font-size: 28px;
                font-weight: 800;
                color: #222222;
                letter-spacing: -1px;
            }
            
            /* Footer Layout */
            .footer {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                margin-top: 5px;
            }
            .contact-area {
                display: flex;
                gap: 15px;
                align-items: flex-end;
            }
            .contact-info p {
                margin: 3px 0;
                font-size: 11px;
                font-weight: 600;
            }
            .contact-info span {
                font-weight: 800;
                margin-right: 4px;
            }
            .signature-area {
                text-align: center;
            }
            .sign-name {
                font-size: 16px;
                font-weight: 800;
                margin: 0 0 2px 0;
            }
            .sign-title {
                font-size: 11px;
                font-weight: 600;
                margin: 0;
            }
        </style>
    </head>
    <body>
        <!-- Geometric Sidebar -->
        <div class="sidebar">
            <svg width="120" height="1050" viewBox="0 0 120 1050" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="0,40 120,40 120,160" fill="#b581c7"/>
                <path d="M0,180 a60,60 0 0,1 120,0" fill="#ffcc33"/>
                <path d="M0,200 a60,60 0 0,0 120,0" fill="#38c983"/>
                <circle cx="60" cy="300" r="40" fill="#ffcc33"/>
                <circle cx="60" cy="300" r="20" fill="#222222"/>
                <circle cx="60" cy="420" r="40" fill="#b581c7"/>
                <circle cx="60" cy="520" r="40" fill="#ffcc33"/>
                <polygon points="0,580 60,620 0,660" fill="#b581c7"/>
                <polygon points="120,580 60,620 120,660" fill="#38c983"/>
                <path d="M0,700 a60,60 0 0,1 120,0" fill="#f58233"/>
                <path d="M0,720 a60,60 0 0,0 120,0" fill="#38c983"/>
                <circle cx="60" cy="780" r="40" fill="#b581c7"/>
                <circle cx="60" cy="850" r="40" fill="#ffcc33"/>
                <polygon points="0,910 60,940 0,970" fill="#b581c7"/>
                <polygon points="120,910 60,940 120,970" fill="#222222"/>
                <polygon points="0,1000 120,1000 0,1050" fill="#f58233"/>
            </svg>
        </div>
        
        <div class="main-content">
            <!-- Header -->
            <div>
                <h1 class="title text-purple">Invoice</h1>
                <p class="invoice-no text-green">NO. ${invoice?.invoiceNumber || '0230 0349 0349'}</p>
            </div>
            
            <!-- Info Row -->
            <div class="header-info-row">
                <div>
                    <p class="section-label text-green">INVOICE TO :</p>
                    <p class="invoice-to-name text-purple">${customer?.fullName || 'Elina Brown'}</p>
                </div>
                <div class="company-info text-gray">
                    <p>P : ${user?.phoneNumber || '+00 123 456 789'}</p>
                    <p>${user?.address || '7213 Lia View, Port Nola,<br>United States, US'}</p>
                </div>
            </div>
            
            <!-- Table -->
            <table class="items-table">
                <thead>
                    <tr>
                        <th class="text-green" style="width: 10%;">No.</th>
                        <th class="text-green" style="width: 45%;">Description</th>
                        <th class="text-green" style="width: 15%;">Price</th>
                        <th class="text-green" style="width: 15%; text-align: center;">Qty</th>
                        <th class="text-green" style="width: 15%; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map((order: any, idx: number) => `
                    <tr>
                        <td class="text-gray">${String(idx + 1).padStart(2, '0')}</td>
                        <td class="text-gray" style="color: #222222; font-weight: 700;">${order?.styleName || 'Logo Design'}</td>
                        <td class="text-gray">${invoice?.currency || '$'} ${(order?.amount || 0).toLocaleString()}</td>
                        <td class="text-gray" style="text-align: center;">${order.qty || 1}</td>
                        <td class="text-gray" style="text-align: right;">${invoice?.currency || '$'} ${((order?.amount || 0) * (order.qty || 1)).toLocaleString()}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <!-- Totals & Payment -->
            <div class="totals-row">
                <div>
                    <p class="section-label text-green" style="margin-bottom: 12px;">Payment Method :</p>
                    ${user?.bankName && user?.accountNumber && user?.accountName ? `
                        <p class="method-name text-gray">Bank Name</p>
                        <p class="method-detail text-yellow">${user.bankName}</p>
                        <p class="method-name text-gray">Account Number</p>
                        <p class="method-detail text-yellow">${user.accountNumber}</p>
                        <p class="method-name text-gray">Account Name</p>
                        <p class="method-detail text-yellow">${user.accountName}</p>
                    ` : `
                        <p class="method-name text-gray">Bank Transfer</p>
                        <p class="method-detail text-yellow">Please complete payment via Needle Link</p>
                    `}
                </div>
                <div class="totals-calc">
                    <div class="calc-row">
                        <span class="text-green">Sub Total</span>
                        <span class="text-dark">${invoice?.currency || '$'} ${(invoice?.amount || 250).toLocaleString()}</span>
                    </div>
                    <div class="calc-row">
                        <span class="text-green">Taxes (0%)</span>
                        <span class="text-dark">${invoice?.currency || '$'} 0</span>
                    </div>
                </div>
            </div>
            
            <!-- Terms & Total Pill -->
            <div class="terms-total-row">
                <div class="terms">
                    <p class="section-label text-green">Terms & Condition</p>
                    <p class="terms-text text-gray">${user?.invoiceTerms || 'Please pay within 15 days of receiving this invoice.'}</p>
                </div>
                <div>
                    <div class="total-pill">
                        <div class="total-badge">Total</div>
                        <div class="total-amount">${invoice?.currency || '$'} ${(invoice?.amount || 250).toLocaleString()}</div>
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <div class="contact-area">
                    <div class="contact-info">
                        <p class="section-label text-green" style="margin-bottom: 4px;">Contact</p>
                        <p class="text-gray"><span class="text-orange">P :</span> ${user?.phoneNumber || '+00 354 345 342'}</p>
                        <p class="text-gray"><span class="text-orange">E :</span> ${user?.email || 'youremail@mail.com'}</p>
                        <p class="text-gray"><span class="text-orange">A :</span> ${user?.address || 'West Earlburgh, US'}</p>
                    </div>
                </div>
                <div class="signature-area">
                    <!-- Generic Signature SVG -->
                    <svg width="110" height="45" viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 60C40 40 60 20 80 40C100 60 120 20 140 30C160 40 170 50 180 40" stroke="#222222" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M60 50L160 50" stroke="#222222" stroke-width="4" stroke-linecap="round"/>
                    </svg>
                    <p class="sign-name text-green">${user?.businessName || 'Tony Haws'}</p>
                    <p class="sign-title text-orange">Manager</p>
                </div>
            </div>
        </div>
        <div style="position: absolute; bottom: 25px; left: 0; width: 800px; text-align: center; font-size: 11px; font-weight: 800; color: #a1a1aa; letter-spacing: 3px; z-index: 10;">POWERED BY NEEDLEX <br/> NeedleAfrica.com</div>
    </body>
</html>
    `;
};