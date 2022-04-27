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
    bitcoin: BitcoinConfig;
    litecoin: BitcoinConfig;
    algorand: AlgorandConfig;
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

export class BitcoinConfig {
    url: string;
    blockcypherUrl: string;
    isMainnet: boolean;
}

export class AlgorandConfig {
    algodServer: string;
    algodPort: number;
    indxrServer: string;
    indxrPort: number;
}