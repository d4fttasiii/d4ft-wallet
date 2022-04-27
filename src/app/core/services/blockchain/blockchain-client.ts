import { Transaction } from '../../models/transaction';
import { NotificationService } from '../notification/notification.service';

export interface IBlockchainClient {
    buildRawTx(tx: Transaction): Promise<string>;
    signRawTx(rawTx: string, pk: string): Promise<string>;
    submitSignedTx(rawTx: string): Promise<string>;
    isAddressValid(address: string): Promise<boolean>;
    getBalance(address: string, contractAddress?: string): Promise<number>;
    getMinFeeOrGas(): number;
}

export abstract class BaseBlockchainClient {
    constructor(protected notification: NotificationService) { }

    tryExecute<TResponse>(funcFn: () => TResponse): TResponse {
        try {
            return funcFn();
        }
        catch (error) {
            this.notification.error(error.message);
            throw new Error();
        }
    }
    
    async tryExecuteAsync<TResponse>(funcFn: () => Promise<TResponse>): Promise<TResponse> {
        try {
            return await funcFn();
        }
        catch (error) {
            this.notification.error(error.message);
            throw new Error();
        }
    }
}
