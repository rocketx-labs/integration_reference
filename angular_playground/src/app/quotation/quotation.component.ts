import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output,  } from '@angular/core';
import { HelperService } from '../../services/helper.service';
import { ApiService } from '../../services/api.service';
import { environment } from '../../environment';
@Component({
  selector: 'app-quotation',
  imports: [CommonModule],
  templateUrl: './quotation.component.html',
  styleUrl: './quotation.component.scss'
})
export class QuotationComponent implements OnInit {
  constructor(
    public helper:HelperService,
    public api:ApiService
  ){

  }
  combination:any={}
  copied=false
  quotation:any
  getQuotationSample:string=""
  loading:boolean=false;
  ngOnInit(): void {
      console.log('a',this.quotation)
     
      this.helper.currentCombination.subscribe((val:any)=>{
       this.combination=val;
       this.getQuotation()
      })
  }
  selectQuote(selectedQuote:any) {
    if(!selectedQuote.err && selectedQuote.isTxnAllowed){
    this.quotation.quotes.forEach((quote:any) => quote['selected'] = quote === selectedQuote);
    this.helper.activeQuotation.next(selectedQuote)
    
    }
  }
  refresh(){
    this.getQuotation();
  }
  public async getQuotation() {
    this.loading=true;
    const{sourceNetwork,destinationNetwork,sourceToken,destinationToken,amount}=this.combination
    this.quotation=await this.api.getQuotes(sourceToken,sourceNetwork,destinationToken,destinationNetwork,amount)
    console.log(this.quotation)
    this.quotation.quotes[0].selected=true;
    this.helper.activeQuotation.next(this.quotation.quotes[0])
    this.getQuotationSample=environment.API_URL+this.helper.generateQuotationParams(sourceToken,sourceNetwork,destinationToken,destinationNetwork,amount)
    this.loading=false;
    
    return this.quotation;
  }
  copyReq(){
    
    navigator.clipboard.writeText(this.getQuotationSample).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 1500);
    });
    

  }
  
}
