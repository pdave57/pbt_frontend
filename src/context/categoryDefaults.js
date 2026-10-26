export const CATEGORY_BLUEPRINTS = {
  rule503020: {
    title: '50/30/20 Rule Setup',
    description: 'Ideal for balanced allocation: 50% Needs, 30% Wants, 20% Financial Goals',
    categories: [
      { name: 'Needs (Rent & Groceries)', type: 'expense', icon: '🏠', allocatedBudget: 2500, color: '#3B82F6', description: 'Essential living and groceries' },
      { name: 'Needs (Bills & Transit)', type: 'expense', icon: '💡', allocatedBudget: 600, color: '#6366F1', description: 'Utilities, connectivity, and transport' },
      { name: 'Wants (Dining & Cafes)', type: 'expense', icon: '🍔', allocatedBudget: 500, color: '#F59E0B', description: 'Restaurants, coffee, takeout' },
      { name: 'Wants (Shopping & Fun)', type: 'expense', icon: '🛍️', allocatedBudget: 600, color: '#EC4899', description: 'Leisure, clothing, gadgets' },
      { name: 'Savings & Emergency Fund', type: 'income', icon: '📈', allocatedBudget: 1200, color: '#10B981', description: 'Emergency buffer and investments' },
      { name: 'Primary Salary', type: 'income', icon: '💼', allocatedBudget: 5400, color: '#10B981', description: 'Monthly net wage' },
    ],
  },
  household: {
    title: 'Standard Household Setup',
    description: 'Comprehensive categories designed for homes, couples, and family living',
    categories: [
      { name: 'Mortgage / Rent', type: 'expense', icon: '🏡', allocatedBudget: 1800, color: '#6366F1', description: 'Primary residential housing cost' },
      { name: 'Groceries', type: 'expense', icon: '🛒', allocatedBudget: 700, color: '#8B5CF6', description: 'Family food, produce, household items' },
      { name: 'Utilities & Internet', type: 'expense', icon: '💡', allocatedBudget: 280, color: '#3B82F6', description: 'Electric, gas, water, broadband' },
      { name: 'Vehicle & Gas', type: 'expense', icon: '🚗', allocatedBudget: 350, color: '#10B981', description: 'Auto fuel, maintenance, insurance' },
      { name: 'Healthcare & Fitness', type: 'expense', icon: '🏥', allocatedBudget: 200, color: '#EC4899', description: 'Health insurance, prescriptions, gym' },
      { name: 'Entertainment & Hobbies', type: 'expense', icon: '🎬', allocatedBudget: 300, color: '#F59E0B', description: 'Family outings, streaming, games' },
      { name: 'Primary Income', type: 'income', icon: '💼', allocatedBudget: 6500, color: '#10B981', description: 'Household monthly take-home' },
    ],
  },
  minimalist: {
    title: 'Student & Early Career Setup',
    description: 'Low complexity, streamlined setup for students, roommates, and young professionals',
    categories: [
      { name: 'Room & Rent', type: 'expense', icon: '🛏️', allocatedBudget: 850, color: '#6366F1', description: 'Shared apartment / dorm room' },
      { name: 'Groceries', type: 'expense', icon: '🍳', allocatedBudget: 350, color: '#8B5CF6', description: 'Home cooking & essentials' },
      { name: 'Public Transit', type: 'expense', icon: '🚇', allocatedBudget: 110, color: '#10B981', description: 'Bus, metro, transit pass' },
      { name: 'Tech & Digital', type: 'expense', icon: '💻', allocatedBudget: 80, color: '#3B82F6', description: 'Phone bill, Spotify, cloud storage' },
      { name: 'Coffee & Social', type: 'expense', icon: '☕', allocatedBudget: 150, color: '#F59E0B', description: 'Coffee shops, study snacks, hangouts' },
      { name: 'Part-Time / Stipend', type: 'income', icon: '🎓', allocatedBudget: 1600, color: '#10B981', description: 'Job income, assistantship, scholarship' },
    ],
  },
};

