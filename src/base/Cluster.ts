import { EventEmitter } from 'events';
import ClusterNode, { ClusterNodeOptions } from '../ClusterNode';
import Player from '../core/Player';
import { VoiceStateUpdate, VoiceServerUpdate } from './Node';

export default abstract class BaseCluster extends EventEmitter {
  public abstract send: (guildID: string, packet: any) => any;
  public abstract filter: (node: ClusterNode, guildID: string) => boolean;

  public readonly nodes: Map<string, ClusterNode> = new Map();

  constructor(options?: ClusterNodeOptions[]) {
    super();
    if (options) this.spawn(options);
  }

  public spawn(options: ClusterNodeOptions): ClusterNode;
  public spawn(options: ClusterNodeOptions[]): ClusterNode[];
  public spawn(options: ClusterNodeOptions | ClusterNodeOptions[]): ClusterNode | ClusterNode[] {
    if (Array.isArray(options)) return options.map(opt => this.spawn(opt));

    if (this.nodes.has(options.name)) {
      throw new Error('Node already exists');
    }

    const node = new ClusterNode(this, options);
    this.nodes.set(options.name, node);
    return node;
  }

  public sort(): ClusterNode[] {
    return [...this.nodes.values()].filter(n => n.connected).sort((a, b) => { // sort by overall system cpu load
      if (!a.stats || !b.stats) return -1;
      return (a.stats.cpu ? a.stats.cpu.systemLoad / a.stats.cpu.cores : 0)
        - (b.stats.cpu ? b.stats.cpu.systemLoad / b.stats.cpu.cores : 0);
    });
  }

  public getNode(guildID: string): ClusterNode | undefined {
    return [...this.nodes.values()].find(node => node.players.has(guildID));
  }

  public has(guildID: string): boolean {
    return [...this.nodes.values()].some(node => node.players.has(guildID));
  }

  public get(guildID: string): Player | undefined {
    const node = this.getNode(guildID);
    if (!node) return;

    return node.players.get(guildID);
  }

  public voiceStateUpdate(state: VoiceStateUpdate): Promise<boolean> {
    const node = this.getNode(state.guild_id);
    if (!node) return Promise.resolve(false);

    return node.voiceStateUpdate(state);
  }

  public voiceServerUpdate(server: VoiceServerUpdate): Promise<boolean> {
    const node = this.getNode(server.guild_id);
    if (!node) return Promise.resolve(false);
  
    return node.voiceServerUpdate(server);
  }
}
