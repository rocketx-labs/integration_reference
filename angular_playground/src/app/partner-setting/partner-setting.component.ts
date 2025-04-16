import { Component, EventEmitter, OnInit, Output, } from '@angular/core';
import { HelperService } from '../../services/helper.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-partner-setting',
  imports: [CommonModule,FormsModule],
  templateUrl: './partner-setting.component.html',
  styleUrl: './partner-setting.component.scss'
})
export class PartnerSettingComponent implements OnInit {
  apiKey=""
  evmReffererAddress=""
  solanaReffererAddress=""
  constructor(
    public helper:HelperService
  ){

  }
  @Output() close=new EventEmitter<boolean>();
  ngOnInit(): void {
    this.apiKey= this.helper.apiKey;
    this.evmReffererAddress=this.helper.evmReffererAddress;
    this.solanaReffererAddress=this.helper.solanaReffererAddress;
  }
  updateApi(){
    this.helper.apiKey=this.apiKey;
    this.helper.evmReffererAddress=this.evmReffererAddress;
    this.helper.solanaReffererAddress=this.solanaReffererAddress;
    localStorage.setItem('partner-setting',JSON.stringify({
      "apiKey":this.apiKey,
      "evmReferrerAddress":this.evmReffererAddress,
      "solanaReferrerAddress":this.solanaReffererAddress
    }))
    this.close.emit()
  }

  

  

}
