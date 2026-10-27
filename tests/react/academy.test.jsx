import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router';
import AcademyPage from '../../src/pages/academy/AcademyPage.jsx';

describe('AcademyPage', () => {
  it('shows the beauty academy learning tracks and consultation CTA', () => {
    render(
      <MemoryRouter>
        <AcademyPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /나의 아름다움을직업으로/i })).toBeInTheDocument();
    expect(screen.getByText('헤어 디자인')).toBeInTheDocument();
    expect(screen.getByText('네일 아트')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /무료 상담 신청/i })).toHaveLength(2);
  });
});
