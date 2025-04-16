import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environment';
import { retry, catchError, map } from 'rxjs/operators';
import { from, of, Observable  } from 'rxjs';
import { HelperService } from './helper.service';
const request_types = {
  get: 'GET',
  post: 'POST'
};

@Injectable({
  providedIn: 'root'
})
export class ApiService {
 
  private API_URL=environment.API_URL;


  constructor(private http: HttpClient,
    private helper:HelperService
  ) { }
  public generateRequestRx2(type: string, url: string, payload: any = {},params: any = {},header:any ={}) {

    let key =  this.helper.apiKey?this.helper.apiKey:environment.key;
    const headers = {
      "x-api-key": key,
      'Content-Type':'application/json',
      ...header
    };

    return this.generateRequest(type,this.API_URL+url, payload, headers,params);
  }
  public generateRequestRx(type: string, url: string, payload: any = {},params: any = {},header:any ={}) {

    const headers = {
      'Content-Type':  'application/json',
      ...header
    };

    return this.generateRequest(type,this.API_URL + url, payload, headers,params);
  }
  public generateRequest(type: string, url: string, payload: any = {}, customheaders: any = {}, params: any = {}) {

    let headers = {
        ...customheaders
    };

    const httpOptions = {
      headers: new HttpHeaders(headers),
      params: params
    };

    if (type === request_types.post) {
      return this.http.post(url, payload, httpOptions)
        .pipe(
          map(data => {
            return data;
          }),
          catchError(error => {

            throw error;
          }),
         
        ).toPromise()
    } else {
      return this.http.get(url, httpOptions)
      .pipe(
        map(data => {
          return data;
        }),
        catchError(error => {

          throw error;
        }),
      ).toPromise();
    }
  }
  public getConfigs(){
    return this.generateRequestRx(request_types.get, `/v1/configs`);
  }
  public getQuotes(fromToken:any,fromNetwork:any,toToken:any,toNetwork:any,amount:any){
   let params= this.helper.generateQuotationParams(fromToken,fromNetwork,toToken,toNetwork,amount)
    return this.generateRequestRx2(request_types.get, params)
  }
  public swap(payload:any){
    return this.generateRequestRx2(request_types.post, `/v1/swap`,payload,{});
  }
  public async getPaginatedCoins(chainId:any,page:number,items:number,query?:string){
    return await this.generateRequestRx2(request_types.get, `/v1/tokens?chainId=${chainId}&page=${page}&perPage=${items}`); 
  }
  public async getFilteredCoins(query:string,chainId:number){
    return await this.generateRequestRx2(request_types.get, `/v1/tokens${query ? `?keyword=${query}&chainId=${chainId}` : ``}`); 
  }
  public async getStatus(reqId:string,txHash?:string){
    return this.generateRequestRx2(request_types.get, `/v1/status?requestId=${reqId}${txHash ? `&txId=${txHash}` : ''}`);
  }
  
}
