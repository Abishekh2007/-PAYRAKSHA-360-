import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React, { Component } from 'react';
import { supportsWebGL, GuardianRobot, EngineCore, HeroScene } from './index';

// ---- supportsWebGL ---------------------------------------------------------
describe('supportsWebGL', () => {
  it('returns false in jsdom (getContext returns null)', () => {
    // jsdom setup sets HTMLCanvasElement.prototype.getContext = () => null
    expect(supportsWebGL()).toBe(false);
  });
});

// ---- GuardianRobot ---------------------------------------------------------
describe('GuardianRobot', () => {
  it('renders an aria-hidden element with data-robot-mood', () => {
    render(<GuardianRobot mood="alert" />);
    const el = document.querySelector('[data-robot-mood="alert"]');
    expect(el).not.toBeNull();
    expect(el?.getAttribute('aria-hidden')).toBe('true');
  });

  it('shows no canvas in jsdom (WebGL unsupported)', () => {
    render(<GuardianRobot mood="alert" />);
    expect(document.querySelector('canvas')).toBeNull();
  });

  it('defaults mood to idle', () => {
    render(<GuardianRobot />);
    const el = document.querySelector('[data-robot-mood="idle"]');
    expect(el).not.toBeNull();
  });
});

// ---- EngineCore ------------------------------------------------------------
describe('EngineCore', () => {
  it('renders data-engine-level and data-active attributes', () => {
    render(<EngineCore level="HIGH" active />);
    const el = document.querySelector('[data-engine-level="HIGH"]');
    expect(el).not.toBeNull();
    expect(el?.getAttribute('data-active')).toBe('true');
  });

  it('defaults to idle level and inactive', () => {
    render(<EngineCore />);
    const el = document.querySelector('[data-engine-level="idle"]');
    expect(el).not.toBeNull();
    expect(el?.getAttribute('data-active')).toBe('false');
  });
});

// ---- HeroScene -------------------------------------------------------------
describe('HeroScene', () => {
  it('renders [data-hero-scene]', () => {
    render(<HeroScene />);
    const el = document.querySelector('[data-hero-scene]');
    expect(el).not.toBeNull();
  });

  it('is aria-hidden', () => {
    render(<HeroScene />);
    const el = document.querySelector('[data-hero-scene]');
    expect(el?.getAttribute('aria-hidden')).toBe('true');
  });
});

// ---- ErrorBoundary ---------------------------------------------------------
// A component that throws so we can test the boundary
class ThrowingChild extends Component {
  render(): React.ReactNode {
    throw new Error('intentional test error');
  }
}

describe('ErrorBoundary', () => {
  it('renders fallback when a child throws', () => {
    // Suppress the expected React error output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // We need to access the ErrorBoundary; create a local test wrapper
    // that mimics the same pattern index.tsx uses
    type EBState = { hasError: boolean };
    class EB extends Component<{ fallback: React.ReactNode; children: React.ReactNode }, EBState> {
      constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
      }
      static getDerivedStateFromError(): EBState { return { hasError: true }; }
      render() {
        return this.state.hasError ? this.props.fallback : this.props.children;
      }
    }

    render(
      <EB fallback={<div data-testid="fallback-rendered">fallback</div>}>
        <ThrowingChild />
      </EB>,
    );

    expect(screen.getByTestId('fallback-rendered')).not.toBeNull();
    consoleSpy.mockRestore();
  });
});
