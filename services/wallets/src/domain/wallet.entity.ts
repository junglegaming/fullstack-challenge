export class Wallet{
    constructor(
        public readonly playerId: string,
        private _balance: bigint,
    ){}

    get balance(): bigint{
        return this._balance
    }

    credit(amount: bigint): void{
        if(amount <= 0n){
            throw new Error('INVALID_AMOUNT')
        }
        this._balance += amount;
    }

    debit(amount: bigint): void{
        if(amount <= 0n){
            throw new Error('INVALID_AMOUNT')
        }
        if(this._balance < amount){
            throw new Error('INSUFFICIENT_BALANCE')
        }
        this._balance -= amount;
    }

}