import { render, screen } from '@testing-library/react';
import App from './App';

test('renders professional landing hero', () => {
  render(<App />);
  const heading = screen.getByText(/Manage Your Beauty Business With Ease/i);
  expect(heading).toBeInTheDocument();
});
