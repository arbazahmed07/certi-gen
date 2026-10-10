import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from '../components/StatusBadge';

describe('StatusBadge Component', () => {
  it('renders completed status correctly', () => {
    render(<StatusBadge status="completed" />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders processing status with animation indicator', () => {
    render(<StatusBadge status="processing" />);
    expect(screen.getByText('Processing')).toBeInTheDocument();
  });

  it('renders failed status with error styling', () => {
    render(<StatusBadge status="failed" />);
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });
});
