import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';

import { Observable, forkJoin, of, Subject } from 'rxjs';

import { Service } from '../service';

import * as Highcharts from 'highcharts/highstock';
import 'highcharts/modules/stock';
import 'highcharts/modules/series-label';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { ActivatedRoute, NavigationEnd } from '@angular/router';

import indicators from 'highcharts/indicators/indicators';
import volumeByPrice from 'highcharts/indicators/volume-by-price';
indicators(Highcharts);
volumeByPrice(Highcharts);

@Component({
  selector: 'app-search-details',
  templateUrl: './search-details.component.html',
  styleUrls: ['./search-details.component.css'],
})
export class SearchDetailsComponent implements OnInit {
  symbol: any;

  filteredSearchOptions!: Observable<string[]>;
  companyData!: any;
  quoteData!: any;
  newsData!: any;
  insiderSentimentsData!: any;
  averageMspr!: any;
  averageChange!: any;
  averagePositiveMspr!: any;
  averageNegativeMspr!: any;
  averagePositiveChange!: any;
  averageNegativeChange!: any;
  recommendationTrendsData!: any;
  companyEarningsData!: any;
  companyPeersData!: any;
  highchartsRecommendationTrends!: typeof Highcharts;
  chartOptionsRecommendationTrends!: Highcharts.Options;
  highchartsCompanyEarningsData!: typeof Highcharts;
  chartOptionsCompanyEarningsData!: Highcharts.Options;
  highchartsChartsTabData!: typeof Highcharts;
  chartOptionsChartTabData!: Highcharts.Options;
  highchartsCompanySummaryData!: typeof Highcharts;
  chartOptionsCompanyChartsData!: Highcharts.Options;
  chartsData!: any;
  companyChartsData!: any;
  tickerSearched = 'tsla';

  isLoading!: boolean;
  isStarFilled = false;
  walletAmount!: any;
  buyQuantity: any = 0;
  sellQuantity: any = 0;
  quantityPurchased: any = 0;
  alertType: any;
  alertMessage: any;
  alertVisible: any = false;
  watchlist: any;
  newsDataForDialog: any;
  selectedNewsArticle: any;
  showMore: boolean = false;
  maxLinesToShow: number = 2;
  trimmedSummary: string = '';
  marketIsOpen: boolean = false;
  showContainer: boolean = true;
  cacheData: any;
  cachedData: any;

  constructor(
    private stockService: Service,
    private modalService: NgbModal,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.highchartsRecommendationTrends = Highcharts;
    this.highchartsCompanyEarningsData = Highcharts;
  }

  @ViewChild('buyDialogTemplate') buyDialogTemplate!: TemplateRef<any>;
  @ViewChild('sellDialogTemplate') sellDialogTemplate!: TemplateRef<any>;
  @ViewChild('newsDialogTemplate') newsDialogTemplate!: TemplateRef<any>;

  ngOnInit() {
    // this.symbol = this.route.snapshot.paramMap.get('ticker');
    // this.getSellQuantity(this.symbol);
    this.route.paramMap.subscribe((params) => {
      this.symbol = params.get('ticker');
      const data = this.stockService.getLocalStorage();
      if (this.symbol === this.stockService.getLocalStorage()?.symbol) {
        this.companyData = data.companyData;
        this.newsData = data.newsData;
        this.insiderSentimentsData = data.insiderSentimentsData;
        this.companyPeersData = data.companyPeersData;
        this.chartsData = data.chartsData;
        this.companyEarningsData = data.companyEarningsData;
        this.quoteData = data.quoteData;
        this.newsDataForDialog = data.newsDataForDialog;
        this.companyChartsData = data.companyChartsData;
        this.recommendationTrendsData = data.recommendationTrendsData;
        if (this.recommendationTrendsData) {
          this.renderHighchartsRecommendationTrends(
            this.recommendationTrendsData
          );
        }
        if (this.companyEarningsData) {
          this.renderHighchartsCompanyEarningsData(this.companyEarningsData);
        }

        if (this.chartsData) {
          this.renderChartsTabData(this.symbol);
        }

        if (this.companyChartsData) {
          this.renderHighchartsCompanySummary(
            this.companyChartsData,
            this.symbol
          );
        }
        this.watchlist = data.watchlistData;
        this.walletAmount = data.walletAmount;
        this.quantityPurchased = data.quantityPurchased;
        this.isStarFilled = data.isStarFilled;
        this.averageMspr = data.averageMspr;
        this.averageChange = data.averageChange;
        this.averagePositiveChange = data.averagePositiveChange;
        this.averageNegativeChange = data.averageNegativeChange;
        this.averagePositiveMspr = data.averagePositiveMspr;
        this.averageNegativeMspr = data.averageNegativeMspr;
      } else {
        this.getData();
      }
      this.getShowContainer();
      this.checkIfSymbolInWatchlist(this.symbol);
    });
  }

  getShowContainer() {
    this.stockService.getShowContainer().subscribe((value) => {
      this.showContainer = value;
    });
  }

  openBuyDialog(): void {
    this.modalService.open(this.buyDialogTemplate, {
      centered: false,
      windowClass: 'top-modal',
    });
  }

  closeBuyDialog(): void {
    this.modalService.dismissAll();
  }

  openNewsDialog(news: any): void {
    this.modalService.open(this.newsDialogTemplate, {
      centered: false,
      windowClass: 'top-modal',
    });
    this.selectedNewsArticle = this.newsDataForDialog.filter(
      (item: any) => item.headline === news.headline
    );
  }

  toggleShowMore() {
    this.showMore = !this.showMore;
  }

  getDate(datetime: any) {
    let formattedDate = new Date(datetime * 1000)
      .toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      .replace(/(\d+),(\d+)/, '$1')
      .replace(/(\w+)\s(\d+)/, '$1 $2');

    return formattedDate;
  }

  generateTwitterShareUrl(title: string, url: string): string {
    const text = ` ${title} ${url}`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  }

  shareOnFacebook(url: string): void {
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      url
    )}`;
    window.open(facebookShareUrl, '_blank');
  }

  closeNewsDialog(): void {
    this.modalService.dismissAll();
  }

  openSellDialog(): void {
    this.modalService.open(this.sellDialogTemplate, {
      centered: false,
      windowClass: 'top-modal',
    });
  }

  closeSellDialog(): void {
    this.modalService.dismissAll();
  }

  buy(
    currentPrice: number,
    quantity: number,
    total: number,
    symbol: string,
    name: string
  ) {
    this.stockService
      .addToPortfolio(currentPrice, quantity, total, symbol, name)
      .subscribe(
        (response: any) => {
          if (response.success) {
            this.showAlert('buy', response.message);
            setTimeout(() => {
              this.alertVisible = false;
            }, 5000);
          }
        },
        (error: any) => {
          console.error('Error is here', error);
        }
      );
  }

  sell(currentPrice: number, quantity: number, total: number, symbol: string) {
    this.stockService
      .sellFromPortfolio(currentPrice, quantity, total, symbol)
      .subscribe(
        (response: any) => {
          if (response.success) {
            this.showAlert('sell', response.message);
            setTimeout(() => {
              this.alertVisible = false;
            }, 5000);
          }
        },
        (error: any) => {
          console.error('Error selling from portfolio:', error);
          // Handle error, display error message, etc.
        }
      );
  }

  checkMarketStatus(): void {
    const currentTime = Date.now() / 1000;
    const timeDifference = currentTime - this.quoteData?.t;
    const fiveMinutesInSeconds = 5 * 60;

    this.marketIsOpen = timeDifference < fiveMinutesInSeconds;
  }

  showAlert(type: string, message: string) {
    this.alertType = type;
    this.alertMessage = message;
    this.alertVisible = true;
  }

  calculateTotal(currentPrice: number, quantity: number): number {
    return currentPrice * quantity;
  }

  isBuyDisabled(currentPrice: number, quantity: number): boolean {
    return (
      this.buyQuantity === null ||
      this.buyQuantity <= 0 ||
      this.calculateTotal(currentPrice, quantity) > this.walletAmount
    );
  }

  getSellQuantity(symbol: string) {
    console.log('The response us HEYYYY');
    this.stockService.getSellQuantity(symbol).subscribe((response) => {
      if (response.success) {
        this.quantityPurchased = response.quantity;
        this.cacheData = {
          ...this.cacheData,
          quantityPurchased: this.quantityPurchased,
        };
      }
    });
  }

  isSellDisabled(quantity: number) {
    if (this.quantityPurchased >= quantity && quantity > 0) {
      return false;
    } else return true;
  }

  getWalletBalance() {
    this.stockService.getWalletBalance().subscribe(
      (response) => {
        if (response.success) {
          this.walletAmount = response.walletAmount;
          this.cacheData = {
            ...this.cacheData,
            walletAmount: this.walletAmount,
          };
        } else {
          console.error('Error:', response.message);
        }
      },
      (error) => {
        console.error('Error:', error);
      }
    );
  }

  fetchCompanyData() {
    this.stockService?.getCompanyData(this.symbol).subscribe((response) => {
      this.companyData = response?.companyData;
      this.quoteData = response?.quoteData;
      this.cacheData = {
        ...this.cacheData,
        companyData: this.companyData,
        quoteData: this.quoteData,
      };

      if (this.quoteData) {
        this.checkMarketStatus();
      }
    });
  }

  calculateAverages = (data: any[]) => {
    const msprSum = data.reduce((sum, obj) => sum + obj.mspr, 0);
    const changeSum = data.reduce((sum, obj) => sum + obj.change, 0);
    const positiveChangeData = data.filter((obj) => obj.change > 0);
    const negativeChangeData = data.filter((obj) => obj.change < 0);
    const positiveMsprData = data.filter((obj) => obj.mspr > 0);
    const negativeMsprData = data.filter((obj) => obj.mspr < 0);
    const positiveChangeSum = positiveChangeData.reduce(
      (sum, obj) => sum + obj.change,
      0
    );
    const negativeChangeSum = negativeChangeData.reduce(
      (sum, obj) => sum + obj.change,
      0
    );
    const positiveMsprSum = positiveMsprData.reduce(
      (sum, obj) => sum + obj.mspr,
      0
    );
    const negativeMsprSum = negativeMsprData.reduce(
      (sum, obj) => sum + obj.mspr,
      0
    );

    const averageMspr = msprSum / data.length;
    const averageChange = changeSum / data.length;
    const averagePositiveChange = positiveChangeSum / positiveChangeData.length;
    const averageNegativeChange = negativeChangeSum / negativeChangeData.length;
    const positiveMsprValues = positiveMsprSum / positiveMsprData.length;
    const negativeMsprValues = negativeMsprSum / negativeMsprData.length;

    this.averageMspr = averageMspr;
    this.averageChange = averageChange;
    this.averagePositiveChange = averagePositiveChange;
    this.averageNegativeChange = averageNegativeChange;
    this.averagePositiveMspr = positiveMsprValues;
    this.averageNegativeMspr = negativeMsprValues;

    this.cacheData = {
      ...this.cacheData,
      averageMspr: this.averageMspr,
      averageChange: this.averageChange,
      averagePositiveChange: this.averagePositiveChange,
      averageNegativeChange: this.averageNegativeChange,
      averagePositiveMspr: this.averagePositiveMspr,
      averageNegativeMspr: this.averageNegativeMspr,
    };
  };
  getData() {
    this.isLoading = true;

    this.router.navigate(['/search', this.symbol]);

    this.getWalletBalance();
    this.getWatchlistData();
    this.fetchCompanyData();

    this.getSellQuantity(this.symbol);

    setInterval(() => {
      this.fetchCompanyData();
    }, 15000);

    const apiObservables = [];

    apiObservables.push(this.stockService?.getCompanyPeer(this.symbol));
    apiObservables.push(this.stockService.getNewsData(this.symbol));
    apiObservables.push(this.stockService.getInsightsData(this.symbol));
    apiObservables.push(this.stockService?.getChartsData(this.symbol));
    apiObservables.push(this.stockService?.getCompanyChartSummary(this.symbol));

    forkJoin(apiObservables).subscribe(
      (results: any[]) => {
        this.cacheData = {
          ...this.cacheData,
          companyPeersData: results[0],
        };

        this.companyPeersData = results[0];
        this.newsData = results[1]
          .filter((article: any) => article.image && article.headline)
          .map((article: any) => ({
            image: article.image,
            headline: article.headline,
          }))
          .slice(0, 20);
        this.cacheData = {
          ...this.cacheData,
          newsData: this.newsData,
        };
        this.newsDataForDialog = results[1].filter(
          (article: any) => article.image && article.headline
        );
        this.cacheData = {
          ...this.cacheData,
          newsDataForDialog: this.newsDataForDialog,
        };
        this.insiderSentimentsData = results[2]?.insiderSentimentsData?.data;

        this.calculateAverages(this.insiderSentimentsData);

        this.cacheData = {
          ...this.cacheData,
          insiderSentimentsData: this.insiderSentimentsData,
        };

        this.recommendationTrendsData = results[2]?.recommendationTrendsData;
        this.cacheData = {
          ...this.cacheData,
          recommendationTrendsData: this.recommendationTrendsData,
        };
        this.companyEarningsData = results[2]?.companyEarningsData;
        this.cacheData = {
          ...this.cacheData,
          companyEarningsData: this.companyEarningsData,
        };
        if (this.recommendationTrendsData) {
          this.renderHighchartsRecommendationTrends(
            this.recommendationTrendsData
          );
        }
        if (this.companyEarningsData) {
          this.renderHighchartsCompanyEarningsData(this.companyEarningsData);
        }
        this.chartsData = results[3];
        this.cacheData = {
          ...this.cacheData,
          chartsData: this.chartsData,
        };
        if (this.chartsData) {
          this.renderChartsTabData(this.symbol);
        }
        this.companyChartsData = results[4];
        this.cacheData = {
          ...this.cacheData,
          companyChartsData: this.companyChartsData,
          symbol: this.symbol,
        };
        if (this.companyChartsData) {
          this.renderHighchartsCompanySummary(
            this.companyChartsData,
            this.symbol
          );
        }

        this.stockService.setLocalStorage(this.cacheData);
        this.isLoading = false;
      },
      (error: any) => {
        console.error('Error fetching data:', error);
        // In case of error, ensure isLoading is set to false as well
        this.isLoading = false;
      }
    );
  }

  renderHighchartsRecommendationTrends(responseData: any[]): void {
    this.highchartsRecommendationTrends = Highcharts;
    this.chartOptionsRecommendationTrends = {
      chart: {
        backgroundColor: '#f6f6f6', // Set the background color here
      },
      title: {
        text: 'Recommendation Trends',
        style: {
          fontSize: '1rem',
        },
      },

      legend: {
        layout: 'horizontal',
        align: 'center',
        verticalAlign: 'bottom',
        itemMarginTop: 10,
        itemMarginBottom: 10,
        itemStyle: {
          fontWeight: 'normal',
        },
      },
      xAxis: {
        categories: responseData?.map((item) => item.period),
      },
      yAxis: {
        min: 0,
        tickInterval: 10,
        title: {
          text: '#Analysis',
        },
        labels: {
          overflow: 'justify',
        },
      },
      tooltip: {
        shared: true,
      },
      plotOptions: {
        column: {
          dataLabels: {
            enabled: true,
          },
        },
        series: {
          stacking: 'normal',
        },
      },
      credits: {
        enabled: false,
      },
      series: [
        {
          name: 'Strong Buy',
          data: responseData?.map((item) => item.strongBuy),
          type: 'column',
          color: '#00652e',
        },
        {
          name: 'Buy',
          data: responseData?.map((item) => item.buy),
          type: 'column',
          color: '#00b243',
        },
        {
          name: 'Hold',
          data: responseData?.map((item) => item.hold),
          type: 'column',
          color: '#b97b00',
        },
        {
          name: 'Sell',
          data: responseData?.map((item) => item.sell),
          type: 'column',
          color: '#ff3d4c',
        },

        {
          name: 'Strong Sell',
          data: responseData?.map((item) => item.strongSell),
          type: 'column',
          color: '#7f2429',
        },
      ],
    };
  }
  renderHighchartsCompanyEarningsData(responseData: any[]): void {
    this.highchartsCompanyEarningsData = Highcharts;
    this.chartOptionsCompanyEarningsData = {
      chart: {
        type: 'spline',
        backgroundColor: '#f6f6f6',
      },
      title: {
        text: 'Historical EPS Surprises',
        style: {
          fontSize: '1rem',
        },
      },

      xAxis: {
        categories: responseData.map(
          (item) => `${item.period}<br/>Surprise: ${item.surprise}`
        ),
      },
      yAxis: {
        title: {
          text: 'Quarterly EPS',
        },
        labels: {},
        lineWidth: 0,
      },
      tooltip: {
        // crosshairs: true,
        shared: true,
      },
      plotOptions: {
        spline: {
          marker: {
            radius: 4,
            lineColor: '#666666',
            lineWidth: 1,
          },
        },
      },

      series: [
        {
          name: 'Actual',
          data: responseData.map((item) => item.actual),
          type: 'spline',
        },
        {
          name: 'Estimate',
          data: responseData.map((item) => item.estimate),
          type: 'spline',
        },
      ],
    };
  }

  renderHighchartsCompanySummary(responseData: any[], symbol: string): void {
    this.highchartsCompanySummaryData = Highcharts;

    this.chartOptionsCompanyChartsData = {
      title: {
        text: `${symbol} hourly price variation`,
      },

      xAxis: {
        categories: responseData.map((item) => item[0]),
        tickInterval: Math.ceil(responseData.map((item) => item[0]).length / 6),
      },
      yAxis: {
        opposite: true,
        title: {
          text: '', // Set an empty string to remove the y-axis title
        },
        tickInterval: 1,
      },

      series: [
        {
          data: responseData.map((item) => item[1]),
          type: 'line',
          showInLegend: false,
          marker: {
            enabled: false,
          },
          // color:
          //   responseData[responseData.length - 1][1] > 0
          //     ? '#dc3545'
          //     : '#198754',
        },
      ],

      responsive: {
        rules: [
          {
            condition: {
              maxWidth: 500,
            },
            chartOptions: {},
          },
        ],
      },
    };
  }

  getWatchlistData() {
    this.stockService.getWatchListData().subscribe(
      (data: any) => {
        this.watchlist = data.data;
        this.cacheData = {
          ...this.cacheData,
          watchlistData: this.watchlist,
        };

        this.checkIfSymbolInWatchlist(this.symbol);
      },
      (error: any) => {
        console.error('Error fetching watchlist data:', error);
      }
    );
  }

  removeWatchlist(symbol: any): void {
    this.stockService.removeFromWatchList(symbol).subscribe(
      (response: any) => {
        if (response.success) {
          this.watchlist = this.watchlist.filter(
            (watchlistItem: any) => watchlistItem.symbol !== symbol
          );
          console.log('The response is', response);
          this.showAlert('sell', response.message);
          setTimeout(() => {
            this.alertVisible = false;
          }, 5000);
        } else {
          console.error('Error removing item from watchlist:', response.error);
        }
      },
      (error: any) => {
        console.error('Error removing item from watchlist:', error);
      }
    );
  }

  renderChartsTabData(symbol: string): void {
    this.highchartsChartsTabData = Highcharts;
    this.chartOptionsChartTabData = {
      chart: {
        type: 'stockChart',
        backgroundColor: '#f8f8f8',
      },
      title: {
        text: `${symbol} Historical`,
      },

      navigator: {
        enabled: true,
      },
      rangeSelector: {
        enabled: true,

        buttons: [
          {
            type: 'month',
            count: 1,
            text: '1m',
          },
          {
            type: 'month',
            count: 3,
            text: '3m',
          },
          {
            type: 'month',
            count: 6,
            text: '6m',
          },
          {
            type: 'ytd',
            text: 'YTD',
          },
          {
            type: 'year',
            count: 1,
            text: '1y',
          },
          {
            type: 'all',
            text: 'All',
          },
        ],
      },

      subtitle: {
        text: 'With SMA and Volume by Price technical indicators',
      },

      xAxis: {
        type: 'datetime',
        ordinal: true,
      },

      yAxis: [
        {
          startOnTick: false,
          endOnTick: false,
          labels: {
            align: 'right',
            x: -3,
          },
          title: {
            text: 'OHLC',
          },
          height: '60%',
          lineWidth: 2,
          resize: {
            enabled: true,
          },
          opposite: true,
        },
        {
          labels: {
            align: 'right',
            x: -3,
          },
          title: {
            text: 'Volume',
          },
          top: '65%',
          height: '35%',
          offset: 0,
          lineWidth: 2,

          opposite: true,
        },
      ],

      tooltip: {
        split: true,
      },

      series: [
        {
          type: 'candlestick',
          name: 'AAPL',
          id: 'aapl',
          zIndex: 2,
          data: this.chartsData.ohlcData,
        },
        {
          type: 'column',
          name: 'Volume',
          id: 'volume',
          data: this.chartsData.volumeData,
          yAxis: 1,
        },
        {
          type: 'vbp',
          linkedTo: 'aapl',
          params: {
            volumeSeriesID: 'volume',
          },
          dataLabels: {
            enabled: false,
          },
          zoneLines: {
            enabled: false,
          },
        },
        {
          type: 'sma',
          linkedTo: 'aapl',
          zIndex: 1,
          marker: {
            enabled: false,
          },
        },
      ],
    };
  }

  checkIfSymbolInWatchlist(symbol: string) {
    if (this.watchlist) {
      this.isStarFilled = this.watchlist.some(
        (item: any) => item.symbol == symbol
      );
      this.cacheData = {
        ...this.cacheData,
        isStarFilled: this.isStarFilled,
      };
    }
  }

  toggleStar() {
    this.isStarFilled = !this.isStarFilled;
    if (this.isStarFilled) {
      const data = {
        symbol: this.companyData.ticker,
        name: this.companyData.name,
        c: this.quoteData.c,
        d: this.quoteData.d,
        dp: this.quoteData.dp,
      };

      this.stockService.insertData(data)?.subscribe(
        (response) => {
          if (response.success) {
            this.showAlert('buy', response.message);
            setTimeout(() => {
              this.alertVisible = false;
            }, 5000);
          }
        },
        (error) => {
          console.error('Error inserting data into MongoDB:', error);
        }
      );
    } else {
      this.removeWatchlist(this.companyData?.ticker);
    }
  }
}
