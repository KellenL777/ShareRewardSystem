export interface TradableAsset {
    tickerSymbol: string;
}

export interface Stock {
    tickerSymbol: string;
    price: number;
}

export interface DistributionRange {
    chance: number;
    min: number;
    max: number;
}

export interface DistributionLevel {
    [key: string]: DistributionRange;
}

export interface PriceData {
    sharePrice: number;
}

export interface MarketStatus {
    open: boolean;
    nextOpeningTime: string;
    nextClosingTime: string;
}

export interface Order {
    orderId: string;
}

export interface AccountPosition {
    tickerSymbol: string;
    quantity: number;
    sharePrice: number;
}

export interface OrderDetails {
    id: string;
    tickerSymbol: string;
    quantity: number;
    side: 'buy' | 'sell';
    status: 'open' | 'filled' | 'failed';
    filledPrice: number;
}

