import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MaterialEntry, InvoiceItem, InvoiceCategory, ClientLedgerEntry } from '../types';
import { GST_RATES, SITE_NAME, COMPANY_DETAILS, CUSTOMER_DETAILS } from '../constants';

// Helper: Convert Number to Indian Currency Words
const numberToWords = (n: number): string => {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convert = (num: number): string => {
    if (num === 0) return '';
    if (num < 10) return units[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + units[num % 10] : '');
    if (num < 1000) return units[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + convert(num % 100) : '');
    if (num < 100000) return convert(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + convert(num % 1000) : '');
    if (num < 10000000) return convert(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + convert(num % 100000) : '');
    return convert(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 !== 0 ? ' ' + convert(num % 10000000) : '');
  };

  if (n === 0) return "Zero";
  const words = convert(Math.floor(n));
  return words + " Only";
};

const formatCurrencyPDF = (amount: number) => {
  return `${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const addHeader = (doc: jsPDF, title: string) => {
  doc.setFillColor(14, 165, 233); // Brand color
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text("JAY MALHAR ENTERPRISES", 105, 18, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text("Supply Chain & Material Management", 105, 26, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.text(title, 105, 55, { align: 'center' });
};

export const generateChallanPDF = (entry: MaterialEntry) => {
  const doc = new jsPDF();
  addHeader(doc, "DELIVERY CHALLAN");
  doc.setFontSize(11);
  const startY = 70;
  doc.text(`Challan No: ${entry.challanNumber}`, 15, startY);
  doc.text(`Date: ${new Date(entry.date).toLocaleDateString()}`, 140, startY);
  doc.text(`Site Name: ${entry.siteName}`, 15, startY + 10);
  doc.text(`Vehicle No: ${entry.vehicleNumber || 'N/A'}`, 140, startY + 10);
  autoTable(doc, {
    startY: startY + 25,
    head: [['Sr. No.', 'Description of Material', 'Quantity', 'Unit']],
    body: [['1', entry.material, entry.quantity.toString(), entry.unit]],
    theme: 'grid',
    headStyles: { fillColor: [14, 165, 233] },
    columnStyles: { 2: { halign: 'right' } }
  });
  const finalY = (doc as any).lastAutoTable.finalY + 40;
  doc.text("Receiver's Signature", 15, finalY);
  doc.text("For Jay Malhar Enterprises", 140, finalY);
  doc.save(`Challan_${entry.challanNumber}.pdf`);
};

export const generateMonthlyInvoicePDF = (
  month: string, 
  category: InvoiceCategory, 
  items: InvoiceItem[],
  totalBase: number,
  totalTax: number,
  grandTotal: number
): { blob: Blob; filename: string } => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // --- HEADER ---
  doc.setFontSize(8);
  doc.text("TAX INVOICE", pageWidth / 2, 8, { align: 'center' });
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 0, 0);
  doc.text(COMPANY_DETAILS.name, pageWidth / 2, 18, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(COMPANY_DETAILS.subtitle, pageWidth / 2, 24, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Address : ${COMPANY_DETAILS.address}`, pageWidth / 2, 29, { align: 'center' });
  doc.setLineWidth(0.5);
  doc.line(10, 32, pageWidth - 10, 32);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`GSTIN No. : ${COMPANY_DETAILS.gstin}`, 15, 37);
  doc.text(`State : Maharashtra`, pageWidth / 2, 37, { align: 'center' });
  doc.text(`State Code : ${COMPANY_DETAILS.stateCode}`, pageWidth - 15, 37, { align: 'right' });
  doc.line(10, 40, pageWidth - 10, 40);

  // --- INVOICE INFO ---
  const invNo = `55/${month.slice(2,4)}-${(parseInt(month.slice(2,4))+1)}`; 
  const invDate = new Date().toLocaleDateString('en-IN'); 

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice No. : ${invNo}`, 15, 46);
  doc.text(`Invoice Date : ${invDate}`, pageWidth - 15, 46, { align: 'right' });

  // --- PARTY DETAILS ---
  doc.setFont('helvetica', 'bold');
  doc.text("Party Name", 15, 52);
  doc.text(`  ${CUSTOMER_DETAILS.name}`, 36, 52); 
  doc.setFont('helvetica', 'normal');
  doc.text("Address", 15, 57);
  const addressLines = doc.splitTextToSize(CUSTOMER_DETAILS.address, pageWidth - 50);
  doc.setFont('helvetica', 'bold');
  doc.text(addressLines, 36, 57);
  let currentY = 57 + (addressLines.length * 5);
  doc.text(`GSTIN No. : ${CUSTOMER_DETAILS.gstin}`, 15, currentY);
  doc.text(`State : MAHARASHTRA`, 115, currentY);
  doc.text(`State Code ${CUSTOMER_DETAILS.stateCode}`, pageWidth - 15, currentY, { align: 'right' });
  currentY += 3;
  doc.line(10, currentY, pageWidth - 10, currentY);

  // --- GROUPING LOGIC (VEHICLE + DESCRIPTION) ---
  interface GroupedRow {
    vehicle: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }

  const groupedData: Record<string, GroupedRow> = {};

  items.forEach(item => {
    const key = `${item.vehicleNumber}||${item.description}`;
    
    if (!groupedData[key]) {
      groupedData[key] = {
        vehicle: item.vehicleNumber,
        description: item.description,
        quantity: 0,
        rate: item.rate,
        amount: 0
      };
    }
    
    groupedData[key].quantity += item.quantity;
    groupedData[key].amount += item.amount;
  });

  const tableRows = Object.values(groupedData).sort((a, b) => {
    if (a.vehicle < b.vehicle) return -1;
    if (a.vehicle > b.vehicle) return 1;
    return 0;
  }).map(row => [
    '',                 // Date (Requested Empty)
    '',                 // Challan (Requested Empty)
    row.vehicle,        // Lorry No.
    row.description,    // Description
    row.quantity.toFixed(2), 
    Math.round(row.rate),
    Math.round(row.amount)
  ]);

  autoTable(doc, {
    startY: currentY + 2,
    head: [['Date', 'Challan\nNo.', 'Lorry No.', 'DESCRIPTION', 'Quantity', 'RATE', 'Amount\nRs.']],
    body: tableRows,
    theme: 'plain', 
    styles: { 
      fontSize: 10, 
      cellPadding: 3, 
      lineColor: [0, 0, 0], 
      lineWidth: 0.1,
      textColor: [0, 0, 0],
      valign: 'middle'
    },
    headStyles: { 
      fillColor: [220, 220, 220], 
      textColor: [0, 0, 0], 
      fontStyle: 'bold', 
      halign: 'center',
      lineWidth: 0.1,
      lineColor: [0, 0, 0]
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' }, 
      1: { cellWidth: 18, halign: 'center' }, 
      2: { cellWidth: 28, halign: 'center', fontStyle: 'bold' }, 
      3: { cellWidth: 'auto', halign: 'left' }, 
      4: { cellWidth: 18, halign: 'center' }, 
      5: { cellWidth: 20, halign: 'center' }, 
      6: { cellWidth: 30, halign: 'right' }, 
    },
    margin: { left: 10, right: 10 },
  });

  // --- FOOTER ---
  let finalY = (doc as any).lastAutoTable.finalY;
  if (finalY > 220) {
    doc.addPage();
    finalY = 20;
  }
  const bottomStart = finalY;
  const bottomEnd = 280;
  const boxHeight = bottomEnd - bottomStart;
  
  doc.rect(10, bottomStart, pageWidth - 20, boxHeight);
  const splitX = 145; 
  doc.line(splitX, bottomStart, splitX, bottomEnd);

  // Left Side
  let leftY = bottomStart + 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text("Total Invoice Amount (Including GST)", 12, leftY);
  doc.setFont('helvetica', 'bolditalic');
  const words = numberToWords(Math.round(grandTotal));
  const wordLines = doc.splitTextToSize(words, splitX - 15);
  doc.text(wordLines, 12, leftY + 5);
  
  leftY += 15 + (wordLines.length * 4);
  doc.line(10, leftY, splitX, leftY);
  
  leftY += 5;
  doc.setFont('helvetica', 'bold');
  doc.text("Bank Details", 12, leftY);
  leftY += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Bank Name : ${COMPANY_DETAILS.bankName}`, 12, leftY);
  doc.text(`A/C No. : ${COMPANY_DETAILS.acNo}`, 12, leftY + 5);
  doc.text(`IFSC Code : ${COMPANY_DETAILS.ifsc}`, 12, leftY + 10);

  const decY = bottomEnd - 35;
  doc.line(10, decY, splitX, decY);
  doc.setFontSize(7);
  doc.text("DECLARATION:", 12, decY + 4);
  doc.text("1) I/We Declare that this Invoice shows actual price of the goods and/", 12, decY + 8);
  doc.text("or services described and that all particulars are true and correct.", 12, decY + 11);
  doc.text("2) Error and Omission Excepted.", 12, decY + 14);
  doc.text("3) Subject to Kalyan Jurisdiction", 12, decY + 17);

  // Right Side
  const taxes = GST_RATES[category];
  const rightLabelX = splitX + 2;
  const rightValueX = pageWidth - 12;
  let rightY = bottomStart;
  const rowH = 8;

  const drawTotalRow = (label: string, value: string) => {
    doc.line(splitX, rightY + rowH, pageWidth - 10, rightY + rowH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(label, rightLabelX, rightY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(value, rightValueX, rightY + 5.5, { align: 'right' });
    rightY += rowH;
  };

  drawTotalRow("TOTAL", Math.round(totalBase).toString());
  
  if (category !== 'Water Supply') {
    drawTotalRow(`SGST ${taxes.sgst}%`, Math.round(totalBase * (taxes.sgst/100)).toString());
    drawTotalRow(`CGST ${taxes.cgst}%`, Math.round(totalBase * (taxes.cgst/100)).toString());
  } else {
    drawTotalRow("SGST 0%", "0");
    drawTotalRow("CGST 0%", "0");
  }
  
  drawTotalRow("Round Off", "0");

  doc.setFont('helvetica', 'bold');
  doc.text("G. TOTAL", rightLabelX, rightY + 5.5);
  doc.text(Math.round(grandTotal).toString(), rightValueX, rightY + 5.5, { align: 'right' });
  doc.line(splitX, rightY + rowH, pageWidth - 10, rightY + rowH);

  // Signatures
  doc.setFontSize(9);
  doc.text("FOR JAY MALHAR ENTERPRISES", pageWidth - 35, bottomEnd - 25, { align: 'center' });
  doc.text("Auth. Signatory", pageWidth - 35, bottomEnd - 5, { align: 'center' });
  doc.line(splitX + 5, bottomEnd - 5, splitX + 45, bottomEnd - 5);
  doc.text("Rec. Sign.", splitX + 5, bottomEnd - 5);

  const filename = `Invoice_${category}_${month}.pdf`;
  return { blob: doc.output('blob'), filename };
};

export const generateLedgerPDF = (entries: ClientLedgerEntry[], periodLabel: string) => {
  const doc = new jsPDF();
  addHeader(doc, "CLIENT LEDGER STATEMENT");
  doc.setFontSize(10);
  doc.text(`Client: Arihant Superstructures Ltd`, 15, 65);
  doc.text(`Site: ${SITE_NAME}`, 15, 70);
  doc.text(`Period: ${periodLabel}`, 140, 65);
  
  const tableBody = entries.map(item => [
    item.date, item.particulars, item.vchType, item.vchNo,
    item.debit > 0 ? formatCurrencyPDF(item.debit) : '-',
    item.credit > 0 ? formatCurrencyPDF(item.credit) : '-'
  ]);
  
  autoTable(doc, {
    startY: 75,
    head: [['Date', 'Particulars', 'Vch Type', 'Vch No.', 'Debit (Received)', 'Credit (Billed)']],
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: [44, 62, 80] },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: { 
      0: { cellWidth: 20 }, 
      1: { cellWidth: 'auto' }, 
      4: { cellWidth: 30, halign: 'right', textColor: [22, 163, 74] }, 
      5: { cellWidth: 30, halign: 'right', textColor: [220, 38, 38] } 
    },
  });
  
  const totalDebit = entries.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = entries.reduce((sum, item) => sum + item.credit, 0);
  const balance = totalCredit - totalDebit;
  
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const labelX = 120;
  const valueX = 195;
  
  doc.setFontSize(10);
  doc.text(`Total Billed (Credit):`, labelX, finalY);
  doc.text(formatCurrencyPDF(totalCredit), valueX, finalY, { align: 'right' });
  doc.text(`Total Received (Debit):`, labelX, finalY + 6);
  doc.text(formatCurrencyPDF(totalDebit), valueX, finalY + 6, { align: 'right' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Closing Balance:`, labelX, finalY + 16);
  doc.text(formatCurrencyPDF(balance), valueX, finalY + 16, { align: 'right' });
  
  doc.save(`Ledger_Arihant_${periodLabel.replace(/\s/g, '_')}.pdf`);
};