import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CurrencyCalculatorService } from 'src/currency-calculator/currency-calculator.service';
import { CurrencyCalculatorModule } from 'src/currency-calculator/currency-calculator.module';
import { from, mergeMap, forkJoin, Observable, map } from 'rxjs';
import { Product } from './product.model';
import { GcTranslateService } from 'src/gc-translate/gc-translate.service';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly currCalcService: CurrencyCalculatorService,
    private readonly gcTranslateService: GcTranslateService,
  ) {}

  @Post()
  addProduct(
    @Body('title') prodTitle: string,
    @Body('description') prodDesc: string,
    @Body('price') prodPrice: number,
  ): any {
    const genId = this.productsService.insertProduct(
      prodTitle,
      prodDesc,
      prodPrice,
    );
    return { id: genId };
  }

  @Get()
  getAllProducts() {
    return this.productsService.getProducts();
  }

  @Get(':id')
  getProduct(@Param('id') prodId: string) {
    return this.productsService.getSingleProduct(prodId);
  }

  @Get('/price/:id/:currency')
  getProductPriceInCurrency(
    @Param('id') id: string,
    @Param('currency') currency: string,
  ): Observable<number> {
    return forkJoin({
      rate: this.currCalcService.getCurrencyRate(currency),
      product: this.productsService.getSingleProduct(id),
    }).pipe(
      map(({ product, rate }) => {
        return product.price / rate;
      }),
    );
  }

  @Get('translatedDescription/:id/:targetLanguage')
  getTranslatedDescription(
    @Param('id') id: string,
    @Param('targetLanguage') targetLanguage: string,
  ): Observable<string> {
    return from(this.productsService.getSingleProduct(id)).pipe(
      mergeMap((product) => {
        return this.gcTranslateService.translate(
          product.description,
          targetLanguage,
        );
      }),
    );
  }

  @Patch(':id')
  updateProduct(
    @Param('id') prodId: string,
    @Body('title') prodTitle: string,
    @Body('description') prodDesc: string,
    @Body('price') prodPrice: number,
  ) {
    this.productsService.updateProduct(prodId, prodTitle, prodDesc, prodPrice);
    return null;
  }

  @Delete(':id')
  removeProduct(@Param('id') prodId: string): void {
    this.productsService.remove(prodId);
  }
}
