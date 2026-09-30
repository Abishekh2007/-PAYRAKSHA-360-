import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  PaymentTwin,
  twinPathFor,
  twinNodeState,
  twinCaption,
  TWIN_NODES,
  TWIN_NODE_LABEL,
  type TwinNodeId
} from '../../src/components/soc';
import { runScenarioLocal, runLiveSimulation } from '../../src/engine';

const utility = runScenarioLocal('utility_scam');
const care = runScenarioLocal('customer_care_scam');
const legitUtility = runScenarioLocal('legit_utility');
const legitMerchant = runScenarioLocal('legit_merchant');
const live = runLiveSimulation();
const cautionStage = live.phases[0].report;
const linkStage = live.phases[2].report;

describe('PaymentTwin functions', () => {
  it('TWIN_NODES and TWIN_NODE_LABEL are exactly as specified', () => {
    expect(TWIN_NODES).toEqual(['message', 'call', 'web', 'qr', 'you', 'checkpoint', 'upi', 'recipient']);
    expect(TWIN_NODE_LABEL).toEqual({
      message: 'MESSAGE',
      call: 'CALL',
      web: 'WEB LINK',
      qr: 'QR CODE',
      you: 'YOU',
      checkpoint: 'PAYRAKSHA CHECKPOINT',
      upi: 'UPI RAIL (DEMO)',
      recipient: 'RECIPIENT',
    });
  });

  describe('twinPathFor', () => {
    it('returns expected paths for scenarios', () => {
      expect(twinPathFor(utility)).toEqual(['message', 'web', 'qr', 'you', 'checkpoint']);
      expect(twinPathFor(care)).toEqual(['message', 'call', 'qr', 'you', 'checkpoint']);
      expect(twinPathFor(legitUtility)).toEqual(['message', 'qr', 'you', 'checkpoint', 'upi', 'recipient']);
      expect(twinPathFor(legitMerchant)).toEqual(['qr', 'you', 'checkpoint', 'upi', 'recipient']);
      expect(twinPathFor(cautionStage)).toEqual(['message', 'you', 'checkpoint', 'upi', 'recipient']);
      expect(twinPathFor(linkStage)).toEqual(['message', 'web', 'you', 'checkpoint']);
    });

    it('returns empty for null or undefined', () => {
      expect(twinPathFor(null)).toEqual([]);
      expect(twinPathFor(undefined)).toEqual([]);
    });
  });

  describe('twinNodeState', () => {
    it('returns expected states for utility', () => {
      const expectation: Record<TwinNodeId, string> = {
        message: 'threat',
        call: 'idle',
        web: 'threat',
        qr: 'threat',
        you: 'active',
        checkpoint: 'held',
        upi: 'idle',
        recipient: 'threat',
      };
      for (const id of TWIN_NODES) {
        expect(twinNodeState(utility, id)).toBe(expectation[id]);
      }
    });

    it('returns expected states for care', () => {
      const expectation: Record<TwinNodeId, string> = {
        message: 'threat',
        call: 'threat',
        web: 'idle',
        qr: 'threat',
        you: 'active',
        checkpoint: 'held',
        upi: 'idle',
        recipient: 'threat',
      };
      for (const id of TWIN_NODES) {
        expect(twinNodeState(care, id)).toBe(expectation[id]);
      }
    });

    it('returns expected states for linkStage', () => {
      const expectation: Record<TwinNodeId, string> = {
        message: 'threat',
        call: 'idle',
        web: 'threat',
        qr: 'idle',
        you: 'active',
        checkpoint: 'held',
        upi: 'idle',
        recipient: 'threat',
      };
      for (const id of TWIN_NODES) {
        expect(twinNodeState(linkStage, id)).toBe(expectation[id]);
      }
    });

    it('returns expected states for cautionStage', () => {
      const expectation: Record<TwinNodeId, string> = {
        message: 'active',
        call: 'idle',
        web: 'idle',
        qr: 'idle',
        you: 'active',
        checkpoint: 'active',
        upi: 'active',
        recipient: 'active',
      };
      for (const id of TWIN_NODES) {
        expect(twinNodeState(cautionStage, id)).toBe(expectation[id]);
      }
    });

    it('returns expected states for legitUtility', () => {
      const expectation: Record<TwinNodeId, string> = {
        message: 'safe',
        call: 'idle',
        web: 'idle',
        qr: 'safe',
        you: 'safe',
        checkpoint: 'safe',
        upi: 'safe',
        recipient: 'safe',
      };
      for (const id of TWIN_NODES) {
        expect(twinNodeState(legitUtility, id)).toBe(expectation[id]);
      }
    });

    it('returns idle for all nodes when report is null', () => {
      for (const id of TWIN_NODES) {
        expect(twinNodeState(null, id)).toBe('idle');
      }
    });

    it('respects explicit path overrides', () => {
      const path: TwinNodeId[] = ['qr', 'you', 'checkpoint'];
      expect(twinNodeState(utility, 'web', path)).toBe('idle');
      expect(twinNodeState(utility, 'qr', path)).toBe('threat');
    });
  });

  describe('twinCaption', () => {
    it('returns expected captions', () => {
      expect(twinCaption(utility)).toBe('HELD FOR REVIEW · RISK 92');
      expect(twinCaption(linkStage)).toBe('HELD FOR REVIEW · RISK 65');
      expect(twinCaption(cautionStage)).toBe('CHECK BEFORE YOU PAY · RISK 54');
      expect(twinCaption(legitUtility)).toBe('LOW RISK · RISK 12');
      expect(twinCaption(null)).toBe('MONITORING');
    });
  });
});

describe('PaymentTwin component', () => {
  it('renders correctly for utility_scam report', () => {
    render(<PaymentTwin report={utility} />);

    const wrapper = screen.getByTestId('payment-twin');
    expect(wrapper).toHaveAttribute('data-level', 'HIGH');

    const svg = screen.getByRole('img', { name: 'Payment digital twin (simulation)' });
    expect(svg).toBeInTheDocument();

    const expectation: Record<TwinNodeId, string> = {
      message: 'threat',
      call: 'idle',
      web: 'threat',
      qr: 'threat',
      you: 'active',
      checkpoint: 'held',
      upi: 'idle',
      recipient: 'threat',
    };

    for (const id of TWIN_NODES) {
      const node = screen.getByTestId(`twin-node-${id}`);
      expect(node).toHaveAttribute('data-state', expectation[id]);
      expect(node).toHaveTextContent(TWIN_NODE_LABEL[id]);
    }

    const caption = screen.getByTestId('twin-caption');
    expect(caption).toHaveTextContent('HELD FOR REVIEW · RISK 92');

    expect(wrapper).toHaveTextContent(/SIMULATION/);
  });

  it('renders correctly for null / missing report', () => {
    const { unmount } = render(<PaymentTwin report={null} />);

    let wrapper = screen.getByTestId('payment-twin');
    expect(wrapper).toHaveAttribute('data-level', 'NONE');

    for (const id of TWIN_NODES) {
      const node = screen.getByTestId(`twin-node-${id}`);
      expect(node).toHaveAttribute('data-state', 'idle');
    }
    expect(screen.getByTestId('twin-caption')).toHaveTextContent('MONITORING');

    unmount();

    render(<PaymentTwin />);
    wrapper = screen.getByTestId('payment-twin');
    expect(wrapper).toHaveAttribute('data-level', 'NONE');
    for (const id of TWIN_NODES) {
      const node = screen.getByTestId(`twin-node-${id}`);
      expect(node).toHaveAttribute('data-state', 'idle');
    }
    expect(screen.getByTestId('twin-caption')).toHaveTextContent('MONITORING');
  });

  it('renders correctly for legitUtility', () => {
    render(<PaymentTwin report={legitUtility} />);

    const wrapper = screen.getByTestId('payment-twin');
    expect(wrapper).toHaveAttribute('data-level', 'LOW');
    expect(screen.getByTestId('twin-node-upi')).toHaveAttribute('data-state', 'safe');
    expect(screen.getByTestId('twin-node-recipient')).toHaveAttribute('data-state', 'safe');
    expect(screen.getByTestId('twin-caption')).toHaveTextContent('LOW RISK · RISK 12');
  });

  it('renders correctly for cautionStage', () => {
    render(<PaymentTwin report={cautionStage} />);

    const wrapper = screen.getByTestId('payment-twin');
    expect(wrapper).toHaveAttribute('data-level', 'CAUTION');
    expect(screen.getByTestId('twin-node-upi')).toHaveAttribute('data-state', 'active');
    expect(screen.getByTestId('twin-caption')).toHaveTextContent('CHECK BEFORE YOU PAY · RISK 54');
  });

  it('respects explicit path override', () => {
    render(<PaymentTwin report={utility} path={['qr', 'you', 'checkpoint']} />);

    expect(screen.getByTestId('twin-node-message')).toHaveAttribute('data-state', 'idle');
    expect(screen.getByTestId('twin-node-qr')).toHaveAttribute('data-state', 'threat');
    expect(screen.getByTestId('twin-node-checkpoint')).toHaveAttribute('data-state', 'held');
  });

  it('renders correctly with compact prop', () => {
    render(<PaymentTwin report={utility} compact />);
    for (const id of TWIN_NODES) {
      expect(screen.getByTestId(`twin-node-${id}`)).toBeInTheDocument();
    }
  });
});
