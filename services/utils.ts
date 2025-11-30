import { getEntries } from './dataService';

export const generateChallanNumber = async (): Promise<string> => {
  try {
    const entries = await getEntries();
    const currentYear = new Date().getFullYear();
    
    // Find last challan for current year
    const pattern = new RegExp(`JME/${currentYear}/(\\d+)`);
    let maxNum = 0;

    entries.forEach(e => {
      const match = e.challanNumber?.match(pattern);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });

    const nextNum = maxNum + 1;
    return `JME/${currentYear}/${String(nextNum).padStart(3, '0')}`;
  } catch (e) {
    console.error("Error generating challan number", e);
    return `JME/${new Date().getFullYear()}/001`;
  }
};

export const formatCurrency = (amount: number): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};

// Helper for Ledger Date Parsing
export const parseLedgerDate = (dateStr: any): string => {
  if (!dateStr) return '';

  // 1. Handle Excel Serial Dates (e.g. 44910.123 or "44910")
  const asNum = Number(dateStr);
  // Check if it's a number and looks like a serial date (approx > year 1900)
  if (!isNaN(asNum) && asNum > 10000 && asNum < 2958465) { 
     // Excel base date is 1899-12-30. 
     // (Value - 25569) * 86400 * 1000 gives milliseconds since 1970-01-01
     // We add a small buffer (1 min) to handle floating point rounding errors near midnight
     const date = new Date(Math.round((asNum - 25569) * 86400 * 1000) + 60000);
     
     if (!isNaN(date.getTime())) {
       return date.toISOString().split('T')[0];
     }
  }

  const str = String(dateStr).trim();

  // 2. Handle "15-Dec-22" format (DD-MMM-YY)
  const dashParts = str.split('-');
  if (dashParts.length === 3) {
    // If second part is text (e.g. Dec)
    if (isNaN(Number(dashParts[1]))) { 
      const day = dashParts[0].padStart(2, '0');
      const monthStr = dashParts[1];
      let year = dashParts[2];
      if (year.length === 2) year = '20' + year;
      
      const months: Record<string, string> = { 
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06', 
        'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12',
        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06', 
        'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
        'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06', 
        'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
      };
      const month = months[monthStr];
      if (month) return `${year}-${month}-${day}`;
    }
  }

  // 3. Fallback: Try standard Date parse
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  // 4. If parsing fails, return original string (but log warning)
  console.warn("Date parsing failed for:", dateStr);
  return str;
};