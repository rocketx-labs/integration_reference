import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import _, { values } from 'lodash';
import { HelperService } from '../../services/helper.service';

@Component({
  selector: 'app-swap-section',
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './swap-section.component.html',
  styleUrl: './swap-section.component.scss'
})
export class SwapSectionComponent  implements OnInit,OnChanges{
  @Output() openWalletSelector=new EventEmitter<string>()
  walletAddress:{
    error: boolean;
    address: string;

  } | undefined
  buttonName="Swap";
  recipientAddress="";
  regexError=false;
  postQuotationSample={
    
  }
  constructor(
    private cd:ChangeDetectorRef,
    private helper:HelperService
  ){

  }
  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes)
    console.log(this.combination)
    this.cd.detectChanges()
    this.getButtonName()
  }
   combination:any
  @Output() updateCombination=new EventEmitter<any>()
  @Output() openTokenSelector=new EventEmitter<any>()
  activeQuote:any
 ngOnInit(): void {
     console.log(this.combination)
     this.combination=this.helper.activeCombination;
     this.helper.currentChainId.subscribe((val:any)=>{
      this.getButtonName()
     })
     this.helper.activeQuotation.subscribe((val:any)=>{this.activeQuote=val; this.getButtonName()})
     this.helper.currentCombination.subscribe(async (val:any)=>{
      this.combination=val;
      this.getButtonName()
    })
    

 }
 updateRecipientAddress(event:any){
  this.recipientAddress=event.target.value;
  this.helper.recipientAddress=this.recipientAddress;
  
  if(this.buttonName=='Swap' && this.recipientAddress.length>0){
    this.postQuotationSample=this.helper.getswapApiPayoad(this.activeQuote)
  }
  console.log(this.recipientAddress);
 }
 switchCombination(){
  let comb=_.cloneDeep(this.combination)
  comb.sourceToken=this.combination.destinationToken;
  comb.destinationToken=this.combination.sourceToken;
  comb.sourceNetwork=this.combination.destinationNetwork;
  comb.destinationNetwork=this.combination.sourceNetwork;
  this.combination=comb;
  this.changeCombination();
  
 }
 
  changeCombination(){
    this.helper.updateCombination(this.combination);
  }
  updateAmount(event:any){
    // console.log(event);
    // console.log(event.target.value);
    this.combination.amount=event.target.value
    this.helper.updateCombination(this.combination);
  }
  openPopup(type:any){
    this.openTokenSelector.emit(type)
  }
  getNegativeValue(value:number){
    if(_.isNaN(value)) return 0;
    return -1*value;
  }
  isBridge(quote:any){
    return quote.type==='transfer';
   }
   getTokensUsdPrice(type:string,token:any,val:number){
    // Check if from/to tokens are matching with the quote params
    if(type==='from'&&this.activeQuote?.fromTokenInfo?.network_id===token.network_id && (this.activeQuote?.fromTokenInfo?.is_native_token ||this.activeQuote?.fromTokenInfo?.contract_address.toLowerCase()===token.contract_address.toLowerCase()) && this.activeQuote?.fromTokenInfo?.['price']){
        return this.activeQuote?.fromTokenInfo?.['price'] * val;
    }
    else if(type==='to' && this.activeQuote?.toTokenInfo?.network_id===token.network_id && (this.activeQuote?.toTokenInfo?.is_native_token||this.activeQuote?.toTokenInfo?.contract_address===token.contract_address) && this.activeQuote?.toTokenInfo?.['price']){
      return this.activeQuote?.toTokenInfo?.['price'] * val;
    }
    else return 0;
  
  }
  getButtonName(){
    let name=""
    if(this.activeQuote?.exchangeInfo?.walletLess){
      name='Swap'
    }
    else if(!_.isEmpty(this.helper.activeWalletService) && this.helper.activeWalletService.isNetworkSupported(this.combination.sourceNetwork) ){
      name=this.helper.activeWalletService.chainId===this.combination.sourceNetwork.chainId?'Swap':'Change Network'
    }
    else
    name='Connect Wallet'

    this.buttonName=name;
    this.cd.detectChanges();
    // return this.buttonName;
  }
  buttonClicked(){
    switch(this.buttonName){
      case 'Swap':{
        this.helper.selectedQuote=this.activeQuote;
        console.log('rec',this.recipientAddress)
        this.helper.recipientAddress=this.recipientAddress;
        this.openWalletSelector.emit('initiateTransaction');
        break;
      }
      case 'Change Network':{
        console.log("change Network");
        this.helper.changeSourceNetworkByUser(this.combination.sourceNetwork);
        break;
      }
      case 'Connect Wallet':{
        this.openWalletSelector.emit('walletSelector');
        break;
      }
    }
  }
  copyPayload(){
    navigator.clipboard.writeText(JSON.stringify(this.postQuotationSample))

  }
}
