/**
 * Generate order number in format WAS-XXXXXXXX
 */
export function generateOrderNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    return `WAS-${timestamp}`;
}
