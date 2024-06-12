import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map, startWith, switchMap, tap } from 'rxjs/operators';
// import { HomeService } from './home.service';
import { Service } from '../service';
// import * as Highcharts from 'highcharts';
// import 'highcharts/highstock';
import * as Highcharts from 'highcharts/highstock';
import 'highcharts/modules/stock';
import 'highcharts/modules/series-label'; // Import other required modules if used
import { ObjectId } from 'mongodb';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

import indicators from 'highcharts/indicators/indicators';
import volumeByPrice from 'highcharts/indicators/volume-by-price';
indicators(Highcharts);
volumeByPrice(Highcharts);

interface StockOption {
  symbol: string;
  description: string;
}
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  searchControl = new FormControl();
  // filteredSearchOptions!: Observable<string[]>;

  filteredSearchOptions!: Observable<StockOption[]>;
  isLoading!: any;
  alertType: any;
  alertMessage: any;
  alertVisible: any = false;

  constructor(
    private stockService: Service,
    private modalService: NgbModal,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  @ViewChild('buyDialogTemplate') buyDialogTemplate!: TemplateRef<any>;
  @ViewChild('sellDialogTemplate') sellDialogTemplate!: TemplateRef<any>;
  @ViewChild('newsDialogTemplate') newsDialogTemplate!: TemplateRef<any>;

  ngOnInit() {
    this.filteredSearchOptions = this.searchControl.valueChanges.pipe(
      tap(() => (this.isLoading = true)),
      startWith(''),
      switchMap((value: string) => {
        const trimmedValue = typeof value === 'string' ? value.trim() : '';

        if (trimmedValue.length > 0) {
          return this.stockService.getSymbolLookup(trimmedValue).pipe(
            map((data: any) => {
              if (data.result?.length === 0) {
                this.showAlert(
                  'sell',
                  'No data found. Please enter a valid ticker'
                );
                this.stockService.setShowContainer(false);
                setTimeout(() => {
                  this.alertVisible = false;
                }, 5000);
              } else {
                this.stockService.setShowContainer(true);
              }
              return data.result
                .filter((item: any) => !item.symbol.includes('.'))
                .map((item: any) => ({
                  symbol: item.symbol,
                  description: `${item.symbol} | ${item.description}`,
                }));
            }),
            tap(() => (this.isLoading = false))
          );
        } else {
          return of([]);
        }
      })
    );
  }

  logOption(option: any) {
    this.searchControl.setValue(option.symbol);
  }

  navigateToSearchHome() {
    this.searchControl.setValue('');
    this.isLoading = false;
    this.router.navigate(['/search/home']);
  }

  optionSelected() {
    if (this.alertVisible === false && this.searchControl.value.symbol) {
      this.router.navigate(['/search', this.searchControl.value.symbol]);
    }
  }

  showAlert(type: string, message: string) {
    this.alertType = type;
    this.alertMessage = message;
    this.alertVisible = true;
  }
  isHomeRoute(): boolean {
    return this.route.snapshot.url.join('/') === 'search/home';
  }
}
