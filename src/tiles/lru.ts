type Node<K> = {
  key: K;
  size: number;
  prev: Node<K> | null;
  next: Node<K> | null;
};

/**
 * Size-aware LRU cache.
 * Values are stored separately so we can evict by tracking bytes.
 */
export class LruCache<K, V> {
  private maxBytes: number;
  private bytes = 0;
  private map = new Map<K, { value: V; node: Node<K> }>();
  private head: Node<K> | null = null;
  private tail: Node<K> | null = null;

  constructor(maxBytes: number) {
    this.maxBytes = Math.max(0, Math.floor(maxBytes));
  }

  get currentBytes() {
    return this.bytes;
  }

  get(key: K): V | undefined {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    this.touch(hit.node);
    return hit.value;
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  set(key: K, value: V, sizeBytes: number) {
    const size = Math.max(0, Math.floor(sizeBytes));
    const existing = this.map.get(key);
    if (existing) {
      this.bytes -= existing.node.size;
      existing.value = value;
      existing.node.size = size;
      this.bytes += size;
      this.touch(existing.node);
    } else {
      const node: Node<K> = { key, size, prev: null, next: null };
      this.map.set(key, { value, node });
      this.bytes += size;
      this.unshift(node);
    }
    this.evictIfNeeded();
  }

  delete(key: K) {
    const existing = this.map.get(key);
    if (!existing) return;
    this.bytes -= existing.node.size;
    this.remove(existing.node);
    this.map.delete(key);
  }

  private evictIfNeeded() {
    while (this.tail && this.bytes > this.maxBytes) {
      this.delete(this.tail.key);
    }
  }

  private touch(node: Node<K>) {
    if (this.head === node) return;
    this.remove(node);
    this.unshift(node);
  }

  private unshift(node: Node<K>) {
    node.prev = null;
    node.next = this.head;
    if (this.head) this.head.prev = node;
    this.head = node;
    if (!this.tail) this.tail = node;
  }

  private remove(node: Node<K>) {
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;
    if (this.head === node) this.head = node.next;
    if (this.tail === node) this.tail = node.prev;
    node.prev = null;
    node.next = null;
  }
}

