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
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};
