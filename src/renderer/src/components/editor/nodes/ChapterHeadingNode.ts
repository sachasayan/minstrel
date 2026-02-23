import {
  EditorConfig,
  LexicalNode,
  NodeKey,
  Spread,
} from 'lexical';
import { HeadingNode, SerializedHeadingNode } from '@lexical/rich-text';

export type SerializedChapterHeadingNode = Spread<
  {
    chapterId?: string;
  },
  SerializedHeadingNode
>;

export class ChapterHeadingNode extends HeadingNode {
  __chapterId?: string;

  static getType(): string {
    return 'chapter-heading';
  }

  static clone(node: ChapterHeadingNode): ChapterHeadingNode {
    return new ChapterHeadingNode(node.__tag, node.__chapterId, node.__key);
  }

  constructor(tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', chapterId?: string, key?: NodeKey) {
    super(tag, key);
    this.__chapterId = chapterId;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    if (this.__chapterId) {
      element.setAttribute('data-chapter-id', this.__chapterId);
    }
    return element;
  }

  updateDOM(prevNode: ChapterHeadingNode, dom: HTMLElement, config: EditorConfig): boolean {
    const updated = super.updateDOM(prevNode as any, dom, config);
    if (this.__chapterId !== prevNode.__chapterId) {
      if (this.__chapterId) {
        dom.setAttribute('data-chapter-id', this.__chapterId);
      } else {
        dom.removeAttribute('data-chapter-id');
      }
    }
    return updated;
  }

  static importJSON(serializedNode: SerializedChapterHeadingNode): ChapterHeadingNode {
    const node = $createChapterHeadingNode(serializedNode.tag, serializedNode.chapterId);
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }

  exportJSON(): SerializedChapterHeadingNode {
    return {
      ...super.exportJSON(),
      chapterId: this.__chapterId,
      type: 'chapter-heading',
      version: 1,
    };
  }

  getChapterId(): string | undefined {
    return this.__chapterId;
  }

  setChapterId(chapterId: string | undefined): void {
    const writable = this.getWritable();
    writable.__chapterId = chapterId;
  }
}

export function $createChapterHeadingNode(
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
  chapterId?: string,
): ChapterHeadingNode {
  return new ChapterHeadingNode(tag, chapterId);
}

export function $isChapterHeadingNode(node: LexicalNode | null | undefined): node is ChapterHeadingNode {
  return node instanceof ChapterHeadingNode;
}
