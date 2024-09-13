// Example exchange rates relative to USD
import {exchangeRates, TriplanCurrency} from "./enums";

// Function to convert and get total in the desired currency
export function getTotalInCurrency(priceList: Record<TriplanCurrency, number>, desiredCurrency: TriplanCurrency) {
    const totalInUSD = Object.keys(priceList).reduce((total, currency) => {
        const amount = priceList[currency as TriplanCurrency];
        // Convert to USD if needed
        const amountInUSD = amount / exchangeRates[currency as TriplanCurrency];
        return total + amountInUSD;
    }, 0);

    // Convert total USD to the desired currency
    const totalInDesiredCurrency = totalInUSD * exchangeRates[desiredCurrency];

    return totalInDesiredCurrency.toFixed(2); // Returns rounded to two decimals
}

export function getSingleInCurrency(originalPrice: number, originalCurrency: TriplanCurrency, desiredCurrency: TriplanCurrency) {
    // Convert to USD if needed
    const totalInUSD = originalPrice / exchangeRates[originalCurrency.toLowerCase() as TriplanCurrency];

    // Convert total USD to the desired currency
    const totalInDesiredCurrency = totalInUSD * exchangeRates[desiredCurrency.toLowerCase()];
    return totalInDesiredCurrency.toFixed(2); // Returns rounded to two decimals
}