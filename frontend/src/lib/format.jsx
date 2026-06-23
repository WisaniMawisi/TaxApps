export const ZAR = (v) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2 }).format(Number(v || 0));

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const CATEGORIES = ['Transport', 'Medical', 'Education', 'Business', 'Other'];

export const CATEGORY_COLORS = {
  Transport: '#4A6C82',
  Medical: '#2C5545',
  Education: '#8A9A5B',
  Business: '#C25934',
  Other: '#5C5F58',
};
