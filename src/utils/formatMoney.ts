const moneyFormatter = new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// Presentation only: keep the original amount for calculations and payments.
export const formatMoney = (amount: number | null | undefined): string =>
  moneyFormatter.format(amount ?? 0);
