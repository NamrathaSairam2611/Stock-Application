import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Service } from '../service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbAlertConfig } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css'],
})
export class PortfolioComponent implements OnInit {
  @ViewChild('buyDialogTemplate') buyDialogTemplate!: TemplateRef<any>;
  @ViewChild('sellDialogTemplate') sellDialogTemplate!: TemplateRef<any>;

  constructor(
    private service: Service,
    public dialog: MatDialog,
    private modalService: NgbModal,
    private config: NgbAlertConfig
  ) {
    config.dismissible = true;
  }

  walletAmount: number = 0;

  buyQuantity: number = 0;
  portfolios: any[] = [];
  quantityPurchased: number = 0;
  sellQuantity: any = 0;
  selectedPortfolio: any;
  alertType: any;
  alertMessage: any;
  alertVisible: any = false;
  isLoading: boolean = false;

  ngOnInit() {
    this.isLoading = true;
    // this.service?.initialiseWallet().subscribe((data: any) => {});
    this.getWalletBalance();
    this.service?.getPortfolio().subscribe((data: any) => {
      this.portfolios = data.portfolioData.slice(1);
      this.currentPriceForPortfolio();
      this.isLoading = false;
    });
  }

  getWalletBalance() {
    this.service.getWalletBalance().subscribe(
      (response) => {
        if (response.success) {
          this.walletAmount = response.walletAmount;
        } else {
          console.error('Error:', response.message);
        }
      },
      (error) => {
        console.error('Error:', error);
      }
    );
  }

  currentPriceForPortfolio() {
    this.portfolios.forEach((item) => {
      if (item.symbol) {
        this.service.getCurrentPortfolioPrice(item.symbol).subscribe(
          (response) => {
            this.portfolios.forEach((portfolio) => {
              if (portfolio.symbol === item.symbol) {
                portfolio.currentPrice = response.c;
              }
            });

            // Do something with the response if needed
          },
          (error) => {
            console.error(
              `Error fetching current price for ${item.symbol}:`,
              error
            );
          }
        );
      }
    });
  }

  openBuyDialog(portfolio: any): void {
    this.modalService.open(this.buyDialogTemplate, {
      centered: false,
      windowClass: 'top-modal',
    });
    this.selectedPortfolio = portfolio;
  }

  closeBuyDialog(): void {
    this.modalService.dismissAll();
  }

  buy(
    currentPrice: number,
    quantity: number,
    total: number,
    symbol: string,
    name: string
  ) {
    this.service
      .addToPortfolio(currentPrice, quantity, total, symbol, name)
      .subscribe(
        (response: any) => {
          if (response.success) {
            // this.showAlert('success', 'Buy successful');
            this.service?.getPortfolio().subscribe((data: any) => {
              this.portfolios = data.portfolioData.slice(1);
              this.currentPriceForPortfolio();

              this.showAlert('buy', response.message);
              setTimeout(() => {
                this.alertVisible = false;
              }, 5000);
            });
          }
        },
        (error: any) => {
          console.error('Error is here', error);
        }
      );
  }

  sell(currentPrice: number, quantity: number, total: number, symbol: string) {
    this.service
      .sellFromPortfolio(currentPrice, quantity, total, symbol)
      .subscribe(
        (response: any) => {
          if (response.success) {
            this.service?.getPortfolio().subscribe((data: any) => {
              this.portfolios = data.portfolioData.slice(1);
              this.currentPriceForPortfolio();

              this.showAlert('sell', response.message);
              setTimeout(() => {
                this.alertVisible = false;
              }, 5000);
            });
          }
        },
        (error: any) => {
          console.error('Error selling from portfolio:', error);
          // Handle error, display error message, etc.
        }
      );
  }

  getSellQuantity(symbol: string) {
    this.service.getSellQuantity(symbol).subscribe((response) => {
      console.log('the response is', response);
      if (response.success) {
        this.quantityPurchased = response.quantity;
      }
    });
  }

  openSellDialog(portfolio: any): void {
    this.modalService.open(this.sellDialogTemplate, {
      centered: false,
      windowClass: 'top-modal',
    });
    this.selectedPortfolio = portfolio;
    this.getSellQuantity(this.selectedPortfolio.symbol);
  }

  closeSellDialog(): void {
    this.modalService.dismissAll();
  }

  isSellDisabled(quantity: number) {
    if (this.quantityPurchased >= quantity && quantity > 0) {
      return false;
    } else return true;
  }

  isBuyDisabled(currentPrice: number, quantity: number): boolean {
    return (
      this.buyQuantity === null ||
      this.buyQuantity <= 0 ||
      this.calculateTotal(currentPrice, quantity) > this.walletAmount
    );
  }

  calculateTotal(currentPrice: number, quantity: number): number {
    return currentPrice * quantity;
  }

  showAlert(type: string, message: string) {
    this.alertType = type;
    this.alertMessage = message;
    this.alertVisible = true;
  }
}
