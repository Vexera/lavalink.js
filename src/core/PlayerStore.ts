import Player from './Player';
import Node from '../base/Node';

export default class PlayerStore extends Map<string, any> {
  public readonly node: Node;
  public readonly player: any;

  constructor(node: Node, player?: any) {
    super();
    this.node = node;
    this.player = player || Player;
  }

  public get(key: string): any {
    let player = super.get(key);
    if (!player) {
      player = new this.player(this.node, key);
      this.set(key, player);
    }

    return player;
  }
}
