export interface NodeClockProps {
  id: string;
  name: string;
  currentTimeMs: number;
  isServer: boolean;
  sentAtMs?: number;
}

export class ClockValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClockValidationError';
  }
}

export class NodeClock {
  readonly id: string;
  readonly name: string;
  readonly currentTimeMs: number;
  readonly isServer: boolean;
  readonly sentAtMs?: number;

  private constructor(props: NodeClockProps) {
    this.id = props.id;
    this.name = props.name;
    this.currentTimeMs = props.currentTimeMs;
    this.isServer = props.isServer;
    this.sentAtMs = props.sentAtMs;
  }

  static create(props: NodeClockProps): NodeClock {
    if (!props.id.trim()) {
      throw new ClockValidationError('Clock id is required.');
    }

    if (!props.name.trim()) {
      throw new ClockValidationError('Clock name is required.');
    }

    if (!Number.isFinite(props.currentTimeMs)) {
      throw new ClockValidationError('Clock currentTimeMs must be a finite number.');
    }

    if (typeof props.sentAtMs === 'number' && !Number.isFinite(props.sentAtMs)) {
      throw new ClockValidationError('Clock sentAtMs must be a finite number.');
    }

    if (props.isServer && typeof props.sentAtMs === 'number') {
      throw new ClockValidationError('Server clock must not declare sentAtMs.');
    }

    if (!props.isServer && typeof props.sentAtMs === 'number' && props.sentAtMs < props.currentTimeMs) {
      throw new ClockValidationError('Client sentAtMs cannot be smaller than currentTimeMs.');
    }

    return new NodeClock(props);
  }
}

export interface SyncResult {
  id: string;
  name: string;
  originalTimeMs: number;
  sendTimeMs?: number;
  adjustmentMs: number;
  synchronizedTimeMs: number;
  synchronizedSendTimeMs?: number;
  isServer: boolean;
}
