import { Component, OnInit } from '@angular/core';
import { Service } from '../service';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-watch-list',
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.css'],
})
export class WatchlistComponent implements OnInit {
  watchlist!: any;
  isLoading!: any;
  constructor(private Service: Service, private router: Router) {}

  ngOnInit() {
    this.getWatchlistData();
  }

  getWatchlistData() {
    this.isLoading = true;
    this.Service.getWatchListData().subscribe(
      (data: any) => {
        this.watchlist = data.data;

        const observables = this.watchlist.map((item: any) =>
          this.Service.getCurrentPortfolioPrice(item.symbol)
        );

        forkJoin(observables).subscribe(
          (responses: any) => {
            responses.forEach((response: any, index: any) => {
              this.watchlist[index].currentPrice = response.c;
            });
          },
          (error) => {
            console.error('Error fetching current prices:', error);
          }
        );
        this.isLoading = false;
        console.log('The watchlist is', this.watchlist);
      },
      (error: any) => {
        console.error('Error fetching watchlist data:', error);
        this.isLoading = false;
      }
    );
  }
  removeWatchlist(item: any): void {
    this.Service.removeFromWatchList(item.symbol).subscribe(
      (response: any) => {
        if (response.success) {
          this.watchlist = this.watchlist.filter(
            (watchlistItem: any) => watchlistItem.symbol !== item.symbol
          );
        } else {
          console.error('Error removing item from watchlist:', response.error);
        }
      },
      (error: any) => {
        console.error('Error removing item from watchlist:', error);
      }
    );
  }

  // currentPriceForPortfolio() {
  //   console.log('The watchl;ist us', this.watchlist);
  //   this.watchlist?.map((item: any) => {
  //     this.Service.getCurrentPortfolioPrice(item.symbol).subscribe(
  //       (response) => {
  //         this.watchlist?.map((watchlist: any) => {
  //           if (watchlist.symbol === item.symbol) {
  //             this.watchlist = {
  //               ...this.watchlist,
  //               currentPrice: response.c,
  //             };
  //           }
  //         });

  //         // Do something with the response if needed
  //       },
  //       (error) => {
  //         console.error(
  //           `Error fetching current price for ${item.symbol}:`,
  //           error
  //         );
  //       }
  //     );
  //   });
  // }

  navigateToSearch(symbol: string) {
    this.isLoading = true;
    this.router.navigate(['/search', symbol]);
  }
}
