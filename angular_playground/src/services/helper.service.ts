import { Injectable } from '@angular/core';
import _ from 'lodash';
import {  BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../environment';

@Injectable({
  providedIn: 'root'
})
export class HelperService {
  activeCombination:any={
    sourceToken:{},
    sourceNetwork:{},
    destinationToken:{},
    destinationNetwork:{},
    amount:100
  }
  apiKey="";
  evmReffererAddress="";// for getting comission instantly via dex
  solanaReffererAddress=""; // for getting comission instantly via dex
  recipientAddress=""; 
  selectedQuote:any={}
  
  public getTransactionHashSubject = new Subject();
  activeWalletService:any;
  allConfig:any;
  public chainId: string | undefined ;
  sourceNetwork: any;
  public selectCombination= new BehaviorSubject({});
  currentCombination=this.selectCombination.asObservable();
  public currentNetworkSource = new BehaviorSubject({});
  currentNetwork = this.currentNetworkSource.asObservable();
  public updateChainId= new BehaviorSubject("");
   currentChainId= this.updateChainId.asObservable();
  public updateWalletAddress=new BehaviorSubject("");
   currentWalletAddress= this.updateWalletAddress.asObservable();
  public activeHistoryReqId=new BehaviorSubject("");
   currentActiveHistoryReqId=this.activeHistoryReqId.asObservable();
   public activeQuotation=new BehaviorSubject("");
   currentActiveQuotation=this.activeQuotation.asObservable();

  

  constructor() {
    
   }
   assignKeys(){
 
    let partnerSetting:any=typeof(localStorage.getItem('partner-setting'))==='string'?JSON.parse(localStorage.getItem('partner-setting')||""):{};
    if(!_.isEmpty(partnerSetting)){ 
      this.apiKey=partnerSetting.apiKey;
      this.evmReffererAddress=partnerSetting.evmReferrerAddress;
      this.solanaReffererAddress=partnerSetting.solanaReferrerAddress;
    }

   }
  getswapApiPayoad(quote: any) {
    let swapApiPayload: any = {
      fee: 1,
      fromTokenId: quote.fromTokenInfo.id,
      toTokenId: quote.toTokenInfo.id,
      amount: quote.fromAmount,
      slippage: 1,
      disableEstimate: false

    }
    if (quote.exchangeInfo.exchange_type === 'DEX') {
      swapApiPayload['referrerAddress'] = this.getReferrerAddress(this.activeCombination.sourceNetwork.type === 'EVM' ?'EVM': this.activeCombination.sourceNetwork.chainId)
    }
    swapApiPayload['userAddress'] = quote.exchangeInfo.walletLess ? undefined : this.activeWalletService.activeWallet;
    swapApiPayload['destinationAddress'] = this.recipientAddress;
    return swapApiPayload;
  }
  getReferrerAddress(type:any){
    if(type==='EVM')  return this.evmReffererAddress
    else if(type==='0x11') return this.solanaReffererAddress;
    return ""
  }
  
  async logoutSub(){
    await this.activeWalletService.logOut()
     this.activeWalletService={};
     this.updateChainId.next("");
     this.updateWalletAddress.next("");

  }
  setDefaultCoin(coins:any) {
    let n=this.allConfig.supported_network.find((n:any)=>n.chainId==="0x38")
    let combination={
      sourceToken:coins.find((c:any)=>c.token_symbol==='USDT'),
      sourceNetwork:n,
      destinationToken:coins.find((c:any)=>c.is_native_token),
      destinationNetwork:n,
      amount:100
    }
    this.activeCombination=combination
    this.selectCombination.next(combination);
  }
  async getChainId(){
    let chainId=await this.activeWalletService.getChainId();
    this.updateChainId.next(chainId)
    console.log("chainId",chainId)




  }
  updateCombination(com:any){
    this.activeCombination=com;
    this.selectCombination.next(com);
  }
  updateAddress(add:string){
    this.updateWalletAddress.next(add);
  }
  public newTransactionHash(Obj:any){
    this.getTransactionHashSubject.next(Obj);
  }
  changeSourceNetworkByUser(nw:any){
    // let network:any = this.getNetwork(nw);
    if(this.activeWalletService?.activeWallet ){
      this.changeCurrentNetwork(nw);
      return;
    }

  }
  public RegexCheck(regex:string,address:string){
    let regCheck:RegExp = new RegExp(regex);
    return regCheck.test(address)
  }
  public changeCurrentNetwork(net:any){
    if( _.toLower(this.getActiveWalletChainId())!==_.toLower(net.chainId)){
      this.activeWalletService.requestChangeNetwork(net)
      this.chainId = net.chainId;
    
      // this.currentNetworkSource.next(this.sourceNetwork)
    }

  }
  public getActiveWalletChainId(){
    if(!this.activeWalletService){
      return;
    }
    // this.currentNetworkSource.next(this.activeWalletService.chainId);
    return this.activeWalletService.chainId;
  }
  public getNetwork(network:any){
    if(typeof network==='string'){
      return this.allConfig.supported_network.find((nw:any)=>_.toLower(nw.chainId)===_.toLower(network))
    }
    else{
      return network;
    }
  }
  trimAddress(add:string){
    return add.slice(0,5)+"...."+add.slice(add.length - 5,add.length);

  }
  generateQuotationParams(fromToken:any,fromNetwork:any,toToken:any,toNetwork:any,amount:any){
   return `/v1/quotation?fromToken=${fromToken.is_native_token?undefined:fromToken.contract_address}&fromNetwork=${fromNetwork.id}&toToken=${toToken.is_native_token?undefined:toToken.contract_address}&toNetwork=${toNetwork.id}&amount=${amount}`
  }
  
}
