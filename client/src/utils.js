export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export const emptyData = {
  name: '',
  subscription: 'Free',
  tasks: [],
  sessions: [],
  games: [],
  notes: [],
};
