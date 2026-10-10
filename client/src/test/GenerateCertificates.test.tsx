import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { GenerateCertificates } from '../pages/GenerateCertificates';

describe('GenerateCertificates Form Flow', () => {
  it('renders step 1 certificate information inputs by default', () => {
    render(
      <BrowserRouter>
        <GenerateCertificates />
      </BrowserRouter>
    );

    expect(screen.getByText(/1\. Certificate Information/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Course \/ Certification Title \*/i, { selector: 'label' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Issuing Organization \*/i, { selector: 'label' })).toBeInTheDocument();
  });

  it('navigates to step 2 upon clicking Next Step', async () => {
    render(
      <BrowserRouter>
        <GenerateCertificates />
      </BrowserRouter>
    );

    const nextBtn = screen.getByRole('button', { name: /Next Step/i });
    fireEvent.click(nextBtn);

    // After step 1 submission with valid defaults, Step 2 is shown
    expect(await screen.findByText(/2\. Recipient Ingestion/i)).toBeInTheDocument();
  });
});
