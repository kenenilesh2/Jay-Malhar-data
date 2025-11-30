import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MaterialEntry, InvoiceItem, InvoiceCategory, ClientLedgerEntry } from '../types';
import { GST_RATES, SITE_NAME, UNITS } from '../constants';

// PDF Safe Currency Formatter
const formatCurrencyPDF = (amount: number) => {
  return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Helper to add header
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
) => {
  const doc = new jsPDF();
  addHeader(doc, "TAX INVOICE");
  
  doc.setFontSize(10);
  doc.text(`Invoice Month: ${month}`, 15, 65);
  doc.text(`Category: ${category}`, 15, 70);
  doc.text(`Site: ${SITE_NAME}`, 140, 65);
  
  const tableBody = items.map(item => [
    item.date, item.challanNumber, item.vehicleNumber, item.description,
    item.quantity.toString(), formatCurrencyPDF(item.rate), formatCurrencyPDF(item.amount)
  ]);
  
  autoTable(doc, {
    startY: 75,
    head: [['Date', 'Challan', 'Vehicle', 'Description', 'Qty', 'Rate', 'Amount']],
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: [44, 62, 80] },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' },
    },
  });
  
  const taxes = GST_RATES[category];
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const labelX = 130;
  const valueX = 195;
  
  doc.setFontSize(10);
  doc.text(`Sub Total:`, labelX, finalY);
  doc.text(formatCurrencyPDF(totalBase), valueX, finalY, { align: 'right' });
  
  if (category !== 'Water Supply') {
    doc.text(`CGST (${taxes.cgst}%):`, labelX, finalY + 6);
    doc.text(formatCurrencyPDF(totalBase * (taxes.cgst / 100)), valueX, finalY + 6, { align: 'right' });
    doc.text(`SGST (${taxes.sgst}%):`, labelX, finalY + 12);
    doc.text(formatCurrencyPDF(totalBase * (taxes.sgst / 100)), valueX, finalY + 12, { align: 'right' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total:`, labelX, finalY + 22);
    doc.text(formatCurrencyPDF(grandTotal), valueX, finalY + 22, { align: 'right' });
  } else {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total:`, labelX, finalY + 10);
    doc.text(formatCurrencyPDF(grandTotal), valueX, finalY + 10, { align: 'right' });
  }
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text("Terms & Conditions: E.&O.E. 1. Goods once sold will not be taken back.", 15, 280);
  doc.save(`Invoice_${category}_${month}.pdf`);
};

// Updated ledger PDF generation with new columns logic
export const generateLedgerPDF = (entries: any[], periodLabel: string) => {
  const doc = new jsPDF();
  
  addHeader(doc, "CLIENT LEDGER STATEMENT");
  
  doc.setFontSize(10);
  doc.text(`Client: Arihant Superstructures Ltd`, 15, 65);
  doc.text(`Site: ${SITE_NAME}`, 15, 70);
  doc.text(`Period: ${periodLabel}`, 140, 65);
  
  // Table headers reflecting the new structure
  const tableHead = [['Date', 'Type(DR/CR)', 'Bank Name', 'Vch Type', 'Vch No.', 'Debit', 'Credit']];
  
  const tableBody = entries.map(item => [
    item.date,
    item.derivedType !== 'NA' ? item.derivedType : '-',
    item.derivedBankName !== 'NA' ? item.derivedBankName : '-',
    item.vchType,
    item.vchNo,
    item.debit > 0 ? formatCurrencyPDF(item.debit) : '-',
    item.credit > 0 ? formatCurrencyPDF(item.credit) : '-'
  ]);
  
  autoTable(doc, {
    startY: 75,
    head: tableHead,
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: [44, 62, 80] },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 20 }, // Date
      1: { cellWidth: 30 }, // Type
      2: { cellWidth: 40 }, // Bank
      3: { cellWidth: 20 }, // Vch Type
      4: { cellWidth: 20 }, // Vch No
      5: { cellWidth: 25, halign: 'right', textColor: [22, 163, 74] }, // Debit
      6: { cellWidth: 25, halign: 'right', textColor: [220, 38, 38] }, // Credit
    },
  });
  
  const totalDebit = entries.reduce((sum, item) => sum + (Number(item.debit) || 0), 0);
  const totalCredit = entries.reduce((sum, item) => sum + (Number(item.credit) || 0), 0);
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