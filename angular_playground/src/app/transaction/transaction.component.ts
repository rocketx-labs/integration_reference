import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { HelperService } from '../../services/helper.service';
import { CommonModule } from '@angular/common';
import { EvmUtils } from '../../helper/evm-utils';
import { 
  toLower as _toLower, toString as _toString, 
  isUndefined as _isUndefined, isNull as _isNull,
  isEmpty as _isEmpty, cloneDeep as _clonedeep,round as _round,
  set
} from 'lodash';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-transaction',
  imports: [CommonModule],
  templateUrl: './transaction.component.html',
  styleUrl: './transaction.component.scss'
})
export class TransactionComponent implements OnInit {
  constructor(public helper:HelperService,
    public evmUtils:EvmUtils,
    public api:ApiService
  ){
    
  }
  @Output() close=new EventEmitter<boolean>();
 
  quote:any=""
  recipientAddress=""
  swapApiPayload:any={}
  err=""
  memo=""
  message:any="validating";
  revoveAndApproveToken:any={
    "0x1" : [
        "0xdac17f958d2ee523a2206206994597c13d831ec7"
    ]
}
swapApiRes:any={}
  approvalContractAddress=["0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000"];
  public excludeChainApproval=['aptos','solana','0x11'];
  ngOnInit(): void {
      this.quote=this.helper.selectedQuote;
      this.recipientAddress=this.helper.recipientAddress;
     this.initiateSwap()
  }
  async triggerApproval(fromToken:any,props:any,fromAmount:number,currentAllowance:number,preswap:boolean=false){
    this.message="Approval in Progress please confirm"
    try{
      if(!!fromAmount){
      fromAmount+=(fromAmount/100);
      fromAmount=_round(fromAmount,4)
      }
      let exisitngRevoke = false;
      let chainId: string = fromToken["chainId"];
      

      
      //check if exisitng spending limit revoke is needed
      if(this.revoveAndApproveToken[chainId]) {
        //exceptions are available for the given chain id 
        //check for token
        if(this.revoveAndApproveToken[chainId].indexOf(fromToken["contract_address"]) != -1) {
          //check for existing allowance
          if(currentAllowance != 0 && currentAllowance < fromAmount) {
            exisitngRevoke = true;
          }
        }
      }
      if(exisitngRevoke) {
        // revoke existing
        this.message="There's already an approval, but it's not enough for the swap. Please set the approval to 0 first, then try again."
        return;
        // const revoke = await this.helper.activeWalletService.approveSwap(fromToken,props.allowanceAddress,props.tx?.approveData, 0,preswap);
      }
      const approval = await this.helper.activeWalletService.approveSwap(fromToken,props.allowanceAddress,props.tx?.approveData,fromAmount);
      this.message="Validating approval"
      let approvalData={
        contractAddress:preswap?this.quote.fromTokenInfo.contract_address:this.swapApiRes.fromTokenInfo?.contract_address,
        spendor:preswap?this.quote.allowanceAddress:this.swapApiRes.swap?.allowanceAddress,
        activeWallet:this.helper.activeWalletService.activeWallet,
        tokenDecimal:this.quote.fromTokenInfo?.token_decimals,
        isNative:!!this.quote.fromTokenInfo?.is_native_token,
        sourceNetwork:this.helper.activeCombination.sourceNetwork,
        fromAmount:this.quote.fromAmount
      }
      await this.checkApproval(approvalData,false)
      preswap?this.swapApiCall():this.initiateWalletSign()
    }
    catch(e:any){
      console.log('error',e);
      if(e.code===4001) {
        // cancelled
        
        this.err = e?.message || "";
        this.message=this.err
       
      }
      else{
        // something else
        this.err = e?.message || e;
        
      }
    }

  }
  async initiateSwap(){
    let allowed=false

    if(this.quote.exchangeInfo.exchange_type==='DEX' && this.quote.allowanceAddress && !['JUPITER','RANGO','THORCHAIN'].includes(this.quote.exchangeInfo.keyword) && (!this.quote.fromTokenInfo?.is_native_token || this.approvalContractAddress.includes(this.quote.fromTokenInfo?.contract_address)) && !this.excludeChainApproval.includes(this.quote.fromTokenInfo.chainId)){
      this.message="checking for approval"
      const spendor = this.quote.allowanceAddress;
      const approvalResponse = await this.evmUtils.checkAllowance(this.quote.fromTokenInfo?.contract_address, 
      spendor,this.helper.activeWalletService.activeWallet,this.quote.fromTokenInfo?.token_decimals,
      !!this.quote.fromTokenInfo?.is_native_token,this.helper.activeCombination.sourceNetwork);
      if (approvalResponse && Number(approvalResponse) && Number(approvalResponse) >= this.quote.fromAmount) {
        allowed = true
      }
      if(!allowed) {
        // this.swapApiRes.swap.allowanceAddress=this.swapApiRes?.swap?.depositAddress || this.swapApiRes?.swap?.allowanceAddress;
        const props = {
          allowanceAddress : this.quote.allowanceAddress
        }
        this.triggerApproval(this.quote.fromTokenInfo,props,this.quote.fromAmount, Number(approvalResponse),true);
        return;
      }
      
    }
     this.swapApiCall()
  }
  async swapApiCall(){
    try{
    this.message="Swap Api Initiated"
    this.swapApiPayload=this.helper.getswapApiPayoad(this.quote)
        this.swapApiRes=await this.api.swap(this.swapApiPayload);
        if(this.swapApiRes.err){
          this.message=this.swapApiRes.err;
          return;
        }
        if(this.swapApiRes.exchangeInfo.walletLess){
          this.saveToLocal(this.swapApiRes)
         this.openActiveHistory(this.swapApiRes.requestId);
         return;
        }
        
           if(this.quote.exchangeInfo.exchange_type==='DEX' && ['JUPITER','RANGO','THORCHAIN'].includes(this.quote.exchangeInfo.keyword) && !this.quote.fromTokenInfo?.is_native_token && !this.excludeChainApproval.includes(this.quote.fromTokenInfo.chainId)){
            let allowed=false;
            this.swapApiRes.allowanceAddress = this.swapApiRes.swap?.depositAddress||this.swapApiRes.swap?.allowanceAddress;
            const approvalResponse = await this.evmUtils.checkAllowance(this.swapApiRes.fromTokenInfo?.contract_address, 
            this.swapApiRes.allowanceAddress,this.helper.activeWalletService.activeWallet,this.swapApiRes.fromTokenInfo?.token_decimals,
            !!this.swapApiRes.fromTokenInfo?.is_native_token,this.helper.activeCombination.sourceNetwork);
            if (approvalResponse && Number(approvalResponse) && Number(approvalResponse) >= this.quote.fromAmount) {
              allowed = true
            }
            if(!allowed) {
              const props = {
                allowanceAddress : this.swapApiRes.swap?.allowanceAddress
              }
              this.triggerApproval(this.quote.fromTokenInfo,this.swapApiRes,this.quote.fromAmount, Number(approvalResponse),false);
              return;
            }
            
           
          }

        
        if(this.swapApiRes.addressMemo || this.swapApiRes.swap.tx?.memo){
          this.memo = this.swapApiRes.addressMemo || this.swapApiRes.swap.tx?.memo;
        }
        this.initiateWalletSign();
       
        
    }catch(err:any){
      console.log(err)
      this.message=err.message||""
    }
     
    }
    async initiateWalletSign(){
      try{

      
      this.message="Confirm Transaction"
      const depositAddress = this.swapApiRes.swap.depositAddress;
      const baseToken = this.swapApiRes.fromTokenInfo;
      const targetToken = this.swapApiRes.toTokenInfo;
      let txHash=await this.helper.activeWalletService.initiateTransaction(this.swapApiPayload,this.swapApiRes,baseToken,targetToken,depositAddress)
        
      this.message="Status Api Initiated"
      let status=this.api.getStatus(this.swapApiRes.requestId,txHash);
      this.saveToLocal(this.swapApiRes)
     
      this.openActiveHistory(this.swapApiRes.requestId); 
    }catch(err:any){
       console.log(err)
      this.message=err.message||""  
    }
    }
    getRouterAdd(){
      if(this.swapApiRes?.swap?.depositAddress){
        const depositAddress = this.swapApiRes.swap.depositAddress;
        return depositAddress.slice(0,5)+"...."+depositAddress.slice(depositAddress.length - 5,depositAddress.length);
      }
      return "--";
    }
    async getStatus(reqId:string,txHash:string){
      return await this.api.getStatus(reqId,txHash);
    }
     saveToLocal(tx:any){
      let list:any=localStorage.getItem('transactions');
      list=list==null?[]:JSON.parse(list);
      let newTx={
        reqId:tx.requestId,
        fromTokenInfo:{
           tokenSymbol:tx.fromTokenInfo.token_symbol,
           networkImg:tx.fromTokenInfo.network_logo,
           amount:tx.swap.fromAmount
        },
        toTokenInfo:{
          tokenSymbol:tx.toTokenInfo.token_symbol,
          networkImg:tx.toTokenInfo.network_logo,
          amount:tx.swap.toAmount
       },
       exchangeInfo:{
        name:tx.exchangeInfo.title,
        img:tx.exchangeInfo.logo,
        amount:tx.swap.toAmount
       }
      }
      list.push(newTx)
      localStorage.setItem('transactions',JSON.stringify(list))
    }
    openActiveHistory(reqId:string){
      this.helper.activeHistoryReqId.next(reqId)
      this.close.emit()

    }

  async copy(item:string){
    switch (item){
      case 'recipientAdd':{
        await navigator.clipboard.writeText(this.recipientAddress);
        break;
      }
      case 'routerAddress':{
      await navigator.clipboard.writeText(this.swapApiRes.swap.depositAddress||'--');
      break;
      }
    }

  }
  async checkApproval(data:any,checkzero:boolean){
    
        const approvalResponse = await this.evmUtils.checkAllowance(data.contractAddress, 
          data.spendor,data.activeWallet,data.tokenDecimal,
          data.isNative,data.sourceNetwork);
        if (approvalResponse && Number(approvalResponse) && Number(approvalResponse) >= data.fromAmount) {
          return true
        }
        else return setTimeout(()=>this.checkApproval(data,checkzero),10000)
    
  }

}

