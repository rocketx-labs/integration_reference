import { Component,computed,effect,OnInit ,signal} from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { CommonModule } from '@angular/common';
import { HistoryComponent } from './history/history.component';
import { HeaderComponent } from './header/header.component';
import { SwapSectionComponent } from './swap-section/swap-section.component';
import { QuotationComponent } from './quotation/quotation.component';
import { ApiService } from '../services/api.service';
import { HelperService } from '../services/helper.service';
import { WalletselectComponent } from './walletselect/walletselect.component';
import { SignalService } from '../services/signal.service';
import { ModalComponent } from './modal/modal.component';
import _ from 'lodash'


@Component({
  selector: 'app-root',
  imports: [CommonModule,SwapSectionComponent,ModalComponent,QuotationComponent,HistoryComponent,HeaderComponent ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit  {
  isModalOpen = false;
  walletPopup:any=false;
  wsignal:any
  loading:boolean = true;
  combination:any;
  activeModal="walletSelect"
  quotation:any;
  activequotation:any;
  constructor(
    private signalService:SignalService,
    private api:ApiService,
    public helper:HelperService
  ){
    this.wsignal=this.signalService.showWalletSelect;
    console.log(this.showWalletPopup)
  }
  title = 'angular_playground';
  showWalletPopup=false;





  activeTab: 'buy' | 'sell' = 'buy';
  currentPrice: number = 43250.75;




  marketStats = [
    { label: '24h Volume', value: '$2.1B', change: 5.2 },
    { label: '24h High', value: '$43,750.00', change: 2.8 },
    { label: '24h Low', value: '$42,150.00', change: -1.5 }
  ];



  ngOnInit() {

   
    this.helper.currentCombination.subscribe(async (val:any)=>{
      console.log("sub",val)
      if(!_.isEmpty(val)){
        this.combination=val;
        await this.getQuotation()
      }
      
    })
    this.getConfig().catch((err:any)=>{
      console.log(err);
      this.loading=false}) 
  }
  updateCombination(combination:any){
    console.log(combination);
    this.quotation();
  }
  updateActiveQuotation(quote:any){
    this.activequotation=quote;
  }
  openModal(activeModal:any) {
    this.activeModal=activeModal;
    this.isModalOpen = true;
  }
  async getConfig(){
    this.loading=true;
    let promises=[]
    promises.push(this.api.getConfigs(),this.api.getPaginatedCoins('0x38',1,100))
    const [configs, coins]=await Promise.all(promises)
    this.helper.allConfig=configs;
    this.combination=this.helper.setDefaultCoin(coins);
    console.log(this.combination);
    await this.getQuotation()
    ;
    this.loading=false;
    console.log(configs);
    console.log(coins);
  }



  setActiveTab(tab: 'buy' | 'sell') {
    this.activeTab = tab;
  }

  calculateTotal(){
    // const amount = this.tradeForm.get('amount')?.value || 0;
    // const price = this.tradeForm.get('price')?.value || 0;
    // return amount * price;
  }

  executeTrade() {
    // if (this.tradeForm.valid) {
    //   const selectedQuote = this.quotes.find(q => q.selected);
    //   console.log(`Executing ${this.activeTab} order with ${selectedQuote?.provider}:`, this.tradeForm.value);
    // }
  }

  private async getQuotation() {
    const{sourceNetwork,destinationNetwork,sourceToken,destinationToken,amount}=this.combination
    this.quotation=await this.api.getQuotes(sourceToken,sourceNetwork,destinationToken,destinationNetwork,amount)
    console.log(this.quotation)
    this.activequotation=this.quotation.quotes[0];
    return this.quotation;
  }
}


