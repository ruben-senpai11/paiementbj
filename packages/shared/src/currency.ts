/**
 * Formatage financier conforme aux normes de l'UEMOA (FCFA / XOF).
 */

export function formatFCFA(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0 FCFA';
  }

  // Formatage des milliers avec espace insécable
  const rounded = Math.round(amount);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} FCFA`;
}

export function formatCurrency(amount: number, currency: 'XOF' | 'EUR' | 'USD'): string {
  if (currency === 'XOF') {
    return formatFCFA(amount);
  }

  const rounded = Number(amount.toFixed(2));
  const parts = rounded.toString().split('.');
  const intPart = parts[0]?.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') ?? '0';
  const decPart = parts[1] ? `,${parts[1].padEnd(2, '0')}` : ',00';

  const symbol = currency === 'EUR' ? '€' : '$';
  return `${intPart}${decPart} ${symbol}`;
}
