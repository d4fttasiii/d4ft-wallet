import { Cluster } from "@solana/web3.js";

export interface Config {
    ethereum: EthereumConfig;
    stellar: StellarConfig;
    polygon: EthereumConfig;
    binance: EthereumConfig;
    avalanche: EthereumConfig;
    harmony: EthereumConfig;
    solana: SolanaConfig;
    terra: TerraConfig;
}

export class EthereumConfig {
    url: string;
    chainId: number;
}

export class StellarConfig {
    url: string;
    networkPhrase: string;
}

export class SolanaConfig {
    cluster: Cluster;
}

export class TerraConfig {
    url: string;
    chainId: string;
}
