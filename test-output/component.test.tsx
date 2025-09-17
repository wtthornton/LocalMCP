import React from 'react';
import { render, screen } from '@testing-library/react';
import CreateDarkThemeHelloWorldHTMLPage from './component';

describe('CreateDarkThemeHelloWorldHTMLPage', () => {
  it('renders without crashing', () => {
    render(<CreateDarkThemeHelloWorldHTMLPage />);
    expect(screen.getByText('CreateDarkThemeHelloWorldHTMLPage')).toBeInTheDocument();
  });
  
  it('displays the description', () => {
    render(<CreateDarkThemeHelloWorldHTMLPage />);
    expect(screen.getByText('Create a dark theme Hello World HTML page')).toBeInTheDocument();
  });
});