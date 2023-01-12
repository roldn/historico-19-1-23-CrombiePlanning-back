import { prop } from '@typegoose/typegoose';
import { User } from './User';

export class GameOptions {
  @prop({ default: '' })
  gameName: string;

  @prop()
  votingSystem: string;

  @prop({ type: () => [User] })
  allowedReveal: User[];

  @prop({ type: () => [User] })
  manageIssues: User[];
}
