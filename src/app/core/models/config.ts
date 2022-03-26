
export interface Config {
    ethereum: EthereumConfig;
    stellar: StellarConfig;
}

export class EthereumConfig {
    url: string;
    chainId: number;
}

export class StellarConfig {
    url: string;
    networkPhrase: string;
}