export const ZAR = (v) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2 }).format(Number(v || 0));

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const CATEGORIES = [
  'Spouse',
  'Savings',
  'Groceries',
  'Internet',
  'Electricity',
  'Investments',
  'Adventure',
  'Others',
];

export const CATEGORY_COLORS = {
  Spouse:      '#C25934',
  Savings:     '#2C5545',
  Groceries:   '#8A9A5B',
  Internet:    '#4A6C82',
  Electricity: '#E8A838',
  Investments: '#5C5F58',
  Adventure:   '#7B5EA7',
  Others:      '#A0998A',
};
