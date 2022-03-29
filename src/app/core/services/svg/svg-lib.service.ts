import { Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Blockchains } from '../../models/blockchains';

interface Icons {
    category: string;
    icons: Array<string>;
}

@Injectable({
    providedIn: 'root',
})
export class SVGLibraryService {
    svgIcons: Array<Icons> = [
        {
            category: 'blockchain',
            icons: ['ada', 'algo', 'atom', 'bnb', 'btc', 'dot', 'eth', 'ksm', 'ltc', 'luna', 'matic', 'sol', 'xlm'],
        },
    ];

    constructor(private matIconRegistry: MatIconRegistry, private domSanitizer: DomSanitizer) {
        this.init();
    }

    init() {
        const safeUrl = (val: string): SafeResourceUrl => this.domSanitizer.bypassSecurityTrustResourceUrl(val);
        this.svgIcons.forEach((cat) => {
            cat.icons.forEach((icon) => {
                this.matIconRegistry.addSvgIcon(
                    `${cat.category}_${icon}`,
                    safeUrl(`/assets/icons/${cat.category}/${icon}.svg`)
                );
            });
        });
    }

    getBlockchainIcon(blockchain: Blockchains): string {
        switch (blockchain) {
            case Blockchains.Stellar:
                return 'blockchain_xlm';
            case Blockchains.Ethereum:
                return 'blockchain_eth';
            case Blockchains.Binance:
                return 'blockchain_bnb';
            case Blockchains.Polygon:
                return 'blockchain_matic';
            case Blockchains.Terra:
                return 'blockchain_luna';
        }
    }
}
