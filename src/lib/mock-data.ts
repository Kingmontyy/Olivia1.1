// Mock data for the application
export const mockMetrics = {
  revenue: {
    current: 487500,
    previous: 456200,
    change: 6.9
  },
  profit: {
    current: 98400,
    previous: 89100,
    change: 10.4
  },
  expenses: {
    current: 389100,
    previous: 367100,
    change: 6.0
  },
  cashFlow: {
    current: 156800,
    previous: 142300,
    change: 10.2
  }
};

export const mockPerformanceData = [
  { month: 'Jan', revenue: 420000, profit: 85000, expenses: 335000 },
  { month: 'Feb', revenue: 445000, profit: 89000, expenses: 356000 },
  { month: 'Mar', revenue: 468000, profit: 92000, expenses: 376000 },
  { month: 'Apr', revenue: 487500, profit: 98400, expenses: 389100 },
  { month: 'May', revenue: 495000, profit: 102000, expenses: 393000 },
  { month: 'Jun', revenue: 512000, profit: 108000, expenses: 404000 }
];

export const mockDataSources = [
  { name: "QuickBooks", connected: true },
  { name: "ShipHero", connected: true },
  { name: "Google Sheets", connected: true },
  { name: "American Express", connected: false },
  { name: "Shopify", connected: true },
  { name: "Mercury Bank", connected: false }
];

export const mockScenarios = [
  {
    id: 1,
    name: "10% Marketing Increase",
    date: "Jan 15, 2025",
    revenue: "$512K",
    profit: "$98K",
    status: "active"
  },
  {
    id: 2,
    name: "Product Line Expansion",
    date: "Jan 12, 2025",
    revenue: "$548K",
    profit: "$102K",
    status: "draft"
  },
  {
    id: 3,
    name: "Cost Optimization Plan",
    date: "Jan 8, 2025",
    revenue: "$487K",
    profit: "$112K",
    status: "active"
  }
];

export const mockForecastInputs = [
  { id: 1, label: "Marketing Spend Change", value: "0", unit: "%" },
  { id: 2, label: "Product Price Adjustment", value: "0", unit: "%" },
  { id: 3, label: "Cost of Goods Sold Change", value: "0", unit: "%" },
  { id: 4, label: "Operating Expenses Change", value: "0", unit: "%" }
];
