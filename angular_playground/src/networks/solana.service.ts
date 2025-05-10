import { Injectable } from '@angular/core';
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  VersionedTransaction,
 
} from '@solana/web3.js';
import { Buffer } from 'buffer';
import _ from 'lodash'
declare let splToken: any;// add in root html file <script src="https://cdn.jsdelivr.net/npm/@solana/spl-token@0.1.8/lib/index.iife.min.js"></script>

@Injectable({
  providedIn: 'root'
})

export class SolanaService {
  

  

  constructor(
    
  ) {

   }
  
  provider:any
  account:any
  activeWallet:string =""
  public connection = new Connection("https://grateful-jerrie-fast-mainnet.helius-rpc.com/", { confirmTransactionInitialTimeout: 100000, commitment: "confirmed" });
  chainId="0x11"
  async getAccounts(){
    if (!(window as any).phantom) {
      alert("phantom not installed");
      return;
  }
  this.provider = (window as any).phantom;
  const accounts: any = await this.provider.solana.connect();
  this.activeWallet = accounts.publicKey.toBase58();
 return this.activeWallet;
  }
  public async getChainId(){
    return this.chainId;
  }
  public async logOut(){
    this.provider={};
		
	}
  isNetworkSupported(nw:any){
    console.log(nw)
    return nw.chainId==='0x11';
   
 }
  public async initiateTransaction(txObj: any,token:any,srctokn:any,trgtokn:any,depositAddress:any) {
    if(token.exchangeInfo?.exchange_type==='DEX'){
      return this.initiateDexTx(txObj,token,srctokn,trgtokn,depositAddress)
    }
    if (srctokn.is_native_token) {
      let transaction: any = {};

      const amount = parseInt((txObj.amount * 1000000000).toString());

      // sol token
      const instruction = SystemProgram.transfer({
          fromPubkey: new PublicKey(this.activeWallet),
          toPubkey: new PublicKey(depositAddress),
          lamports: amount // sol token is 9 decimal value token
      })
      transaction = new Transaction().add(
          instruction
      );
      transaction.feePayer = new PublicKey(this.activeWallet);
      const anyTransaction: any = transaction;
      anyTransaction.recentBlockhash = (
          await this.connection.getLatestBlockhash()
      ).blockhash;
      let transactionSignature = null
      transactionSignature = await this.provider.solana.signAndSendTransaction(
          transaction
      );

      return transactionSignature.signature;

  } else {
      return await this.sendTxn(
          txObj,
          token,
          srctokn,
          trgtokn,
          depositAddress
      );
  }

  }
  public sendTxn = async (
    txObj?: any,
    token?: any,
    srctoken?: any,
    trgtoken?: any,
    depositAddress?: any
) => {
    try {
        if (!!this.activeWallet) {
            var destWallet = new PublicKey(depositAddress);

            const fromTokenAddress = new PublicKey(srctoken.contract_address)

            const TOKEN_PROGRAM_ID = new PublicKey(
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
            ); // SPL token
            const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
                'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
            ); // require to create token account if it does not exist

            const associatedSrcAddress =
            await splToken.Token.getAssociatedTokenAddress(
              ASSOCIATED_TOKEN_PROGRAM_ID,
              TOKEN_PROGRAM_ID,
              fromTokenAddress,
              new PublicKey(this.activeWallet)
            );
               
            const associatedDestAddress =
            await splToken.Token.getAssociatedTokenAddress(
              ASSOCIATED_TOKEN_PROGRAM_ID,
              TOKEN_PROGRAM_ID,
              fromTokenAddress,
              destWallet
          );
                const transaction = new Transaction();
            const accInfo = await this.connection.getParsedAccountInfo(
              associatedDestAddress
          );
            const isTokenAccountInfoPresent = _.get(
                accInfo,
                ['value', 'data', 'parsed'],
                null
            );
            // token account present, initiate transfer instruction.
            if (!isTokenAccountInfoPresent) {
              transaction.add(
                splToken.Token.createAssociatedTokenAccountInstruction(
                  ASSOCIATED_TOKEN_PROGRAM_ID,
                  TOKEN_PROGRAM_ID,
                  fromTokenAddress,
                  associatedDestAddress,
                  destWallet,
                  new PublicKey(this.activeWallet)
              )
              );
            }
            transaction.add(splToken.Token.createTransferInstruction(
              TOKEN_PROGRAM_ID, // spl token program id
              associatedSrcAddress, // token specific account needed
              associatedDestAddress,
              new PublicKey(this.activeWallet),
              [],
              txObj.amount * (10 ** srctoken.token_decimals)
          ))


                transaction.feePayer = new PublicKey(this.activeWallet)
                    ? new PublicKey(this.activeWallet)
                    : undefined;

                transaction.recentBlockhash = (
                    await this.connection.getLatestBlockhash()
                ).blockhash;
                const transactionSignature = await this.provider.solana.signAndSendTransaction(
                    transaction
                );
                return transactionSignature.signature
        }
    } catch (err: any) {
      console.log(err)
       return JSON.stringify(err);
    }
};
async initiateDexTx(txObj: any,token:any,srctokn:any,trgtokn:any,depositAddress:any){
      let encodedData=token.exchangeInfo.keyword=="DEBRIDGE"?token.swap.tx.data.slice(2):token.swap.tx.data.swapTransaction;
      const tx = VersionedTransaction.deserialize(Buffer.from(encodedData,token.exchangeInfo.keyword=="DEBRIDGE"?"hex":"base64"));
        const { blockhash } = await this.connection.getLatestBlockhash();
        tx.message.recentBlockhash = blockhash;
        //   let transactionSignature:any=tx.sign([this.provider])
        let transactionSignature = await this.provider.solana.signAndSendTransaction(
            tx
        );
       return transactionSignature.signature;

}



}
