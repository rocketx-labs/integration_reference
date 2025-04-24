import { ChangeDetectorRef,Component, EventEmitter, OnInit, Output } from '@angular/core';
import { HelperService } from '../../services/helper.service';
import _ from 'lodash'
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
 
  @Output() openWalletSelector=new EventEmitter<string>()
  constructor(
    private cd:ChangeDetectorRef,
    public helper:HelperService,
  ){}
  chainId="";
  currentNetwork:any={}
  activeWallet=""
  updateWalletPopup(){
    this.openWalletSelector.emit('walletSelector')
  }
  ngOnInit(): void {
    this.helper.currentChainId.subscribe((val:any)=>{
      if(val && !_.isEmpty(this.helper.activeWalletService)){
        this.currentNetwork=this.helper.allConfig.supported_network.find((n:any)=> n.chainId===val)
        this.cd.detectChanges()
      } 
      else{
        this.currentNetwork={}
      }  
    })
    this.helper.currentWalletAddress.subscribe((val:any)=>{
      if(val && !_.isEmpty(this.helper.activeWalletService )){
        this.activeWallet=val;
        this.cd.detectChanges()
      }
      else{
        this.activeWallet=""
      }
    })
  
      
  }
  async copy(){
    await navigator.clipboard.writeText(this.activeWallet);
    document.getElementById('default-icon')?.classList.add('hidden');
    document.getElementById('success-icon')?.classList.remove('hidden')

  }
  disconnect(){
    this.helper.logoutSub();
  }
  openHistory(){
    this.openWalletSelector.emit('history')
  }
  openSettings(){
    this.openWalletSelector.emit('setting')

  }


}
