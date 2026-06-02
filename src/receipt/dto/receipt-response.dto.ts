export class ReceiptItemDto {
  name!: string;
  quantity!: number;
  price!: number;
  subtotal!: number;
}

export class ReceiptInfoDto {
  orderId!: string;
  receiptNumber!: string;
  date!: Date;
  customerName!: string;
  customerEmail?: string;
  items!: ReceiptItemDto[];
  total!: number;
  status!: string;
  paymentStatus!: string;
  paymentMethod?: string;
}
