import { prop } from '@typegoose/typegoose';

export class Cards {
  @prop()
  card: string;

  @prop()
  quantity: number;
}
