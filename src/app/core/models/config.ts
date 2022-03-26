
export interface Config {
    ethereum: EthereumConfig;
    stellar: StellarConfig;
    polygon: EthereumConfig;
    binance: EthereumConfig;
}

export class EthereumConfig {
    url: string;
    chainId: number;
}

export class StellarConfig {
    url: string;
    networkPhrase: string;
}