import { prop, getModelForClass } from '@typegoose/typegoose';
import { Cards } from './Cards';
import { GameOptions } from './GameOptions';
import { User } from './User';

class Room {
  @prop({ required: true, type: () => [User] })
  users: User[];

  @prop({ required: true, type: () => [User], default: [] })
  voting: User[];

  @prop({ required: true, default: false })
  reveal: boolean;

  @prop({ required: true, type: () => GameOptions })
  gameOptions: GameOptions;

  @prop({ type: () => [Cards] })
  cards: Cards[];

  @prop({ default: false })
  coffee: boolean;

  @prop()
  average: number;
}

const RoomModel = getModelForClass(Room);

export default RoomModel;
