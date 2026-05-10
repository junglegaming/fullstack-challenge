import { CrashSeedProps } from "../repositories/ICashSeedRepository";

export class CrashSeed {
  private readonly props: CrashSeedProps;

  private constructor(props: CrashSeedProps) {
    this.props = props;
  }

  static create(props: CrashSeedProps): CrashSeed {
    if (!props.serverSeed || props.serverSeed.length !== 64) {
      throw new Error("serverSeed inválido");
    }
    if (!props.clientSeed) {
      throw new Error("clientSeed inválido");
    }
    if (props.nonce < 0) {
      throw new Error("nonce inválido");
    }
    return new CrashSeed(props);
  }

  get serverSeed(): string {
    return this.props.serverSeed;
  }
  get serverSeedHash(): string {
    return this.props.serverSeedHash;
  }
  get clientSeed(): string {
    return this.props.clientSeed;
  }
  get nonce(): number {
    return this.props.nonce;
  }

  reveal(): Pick<
    CrashSeedProps,
    "serverSeed" | "serverSeedHash" | "clientSeed" | "nonce"
  > {
    return { ...this.props };
  }

  toPublicJSON() {
    return {
      serverSeedHash: this.props.serverSeedHash,
      clientSeed: this.props.clientSeed,
      nonce: this.props.nonce,
    };
  }
}
