/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { QuizOption } from './QuizOption';
import React from 'react';

describe('QuizOption', () => {
  afterEach(() => {
    cleanup();
  });

  // Scenario 1: User answered correctly
  it('renders correctly when user selected the correct answer', () => {
    render(
      <QuizOption
        option="Option A"
        isSelected={true}
        isCorrect={true}
        isAnswered={true}
        isHidden={false}
        isMockMode={false}
        onClick={() => {}}
      />
    );

    const button = screen.getByRole('button', { name: /Option A/i });
    // Should be Green
    expect(button.className).toContain('bg-green-50');
    expect(button.className).toContain('border-green-500');
  });

  // Scenario 2: User answered incorrectly, checking the incorrect option they picked
  it('renders correctly when user selected the wrong answer', () => {
    render(
      <QuizOption
        option="Option B"
        isSelected={true}
        isCorrect={false}
        isAnswered={true}
        isHidden={false}
        isMockMode={false}
        onClick={() => {}}
      />
    );

    const button = screen.getByRole('button', { name: /Option B/i });
    // Should be Red
    expect(button.className).toContain('bg-red-50');
    expect(button.className).toContain('border-red-500');
  });

  // Scenario 3: User answered incorrectly, checking the correct option they missed (The Bug)
  it('renders correctly when this is the correct answer but user missed it', () => {
    render(
      <QuizOption
        option="Option A"
        isSelected={false}
        isCorrect={true}
        isAnswered={true} // User answered something else
        isHidden={false}
        isMockMode={false}
        onClick={() => {}}
      />
    );

    const button = screen.getByRole('button', { name: /Option A/i });

    // EXPECTED BEHAVIOR (Ghost View):
    // containerClass = "bg-green-50/50 border-green-400 border-dashed relative";

    // If the bug exists, it will have 'bg-green-50' (solid) and 'border-green-500' (solid)
    // instead of 'bg-green-50/50' and 'border-dashed'.

    // We assert for the EXPECTED FIXED behavior.
    expect(button.className).toContain('border-dashed');
    expect(button.className).toContain('bg-green-50/50');
  });

  // Scenario 4: User answered (incorrectly), and this option is neither correct nor selected (Irrelevant)
  it('renders correctly when this option is irrelevant (faded)', () => {
    render(
      <QuizOption
        option="Option C"
        isSelected={false}
        isCorrect={false}
        isAnswered={true}
        isHidden={false}
        isMockMode={false}
        onClick={() => {}}
      />
    );

    const button = screen.getByRole('button', { name: /Option C/i });

    // Should be faded out
    expect(button.className).toContain('opacity-50');
    expect(button.className).toContain('bg-gray-50 dark:bg-gray-900');
  });
});
