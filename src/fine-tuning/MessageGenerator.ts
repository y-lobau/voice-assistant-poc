import he from "he";
import * as fs from "fs/promises";
import * as path from "path";
import { Book, BookChapter } from "../core/models/Book";
import { KnizhnyVozSkill } from "../core/skills/KnizhnyVozSkill";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface MessageGroup {
  messages: Message[];
}

interface MessageTemplate {
  messages: Message[];
}

export class MessageGenerator {
  private books: Book[] = [];
  private bookTemplates: MessageTemplate[] = [];
  private chapterTemplates: MessageTemplate[] = [];

  constructor(private skill: KnizhnyVozSkill) {}

  public async init(): Promise<void> {
    this.books = await this.skill.loadAllBooks();

    await this.loadBookTemplates("./data/fine-tune-messages-example-book.json");
    await this.loadChapterTemplates(
      "./data/fine-tune-messages-example-chapter.json"
    );

    await this.populateBookDetails();
  }

  private async populateBookDetails(): Promise<void> {
    const detailedBooks = [];
    for (const book of this.books) {
      try {
        book.chapters = await this.skill.fetchBookData(book.id);
      } catch (error) {
        console.error(`Failed to fetch details for book ${book.id}:`, error);
      }
    }
  }

  private decodeHtmlEntities(text: string): string {
    return he.decode(text);
  }

  private async loadJsonFile<T>(filePath: string): Promise<T> {
    const data = await fs.readFile(path.resolve(filePath), "utf8");
    return JSON.parse(data) as T;
  }

  async loadBookTemplates(filePath: string): Promise<void> {
    this.bookTemplates = await this.loadJsonFile<MessageTemplate[]>(filePath);
  }

  async loadChapterTemplates(filePath: string): Promise<void> {
    this.chapterTemplates = await this.loadJsonFile<MessageTemplate[]>(
      filePath
    );
  }

  private replacePlaceholders(
    template: string,
    book: Book,
    chapter?: BookChapter
  ): string {
    let result = template
      .replace(/%book%/g, `'${this.decodeHtmlEntities(book.name)}'`)
      .replace(
        /%id%/g,
        chapter
          ? `'${this.decodeHtmlEntities(chapter.id)}'`
          : `'${this.decodeHtmlEntities(book.id)}'`
      )
      .replace(
        /%description%/g,
        book.description ? this.decodeHtmlEntities(book.description) : ""
      )
      .replace(/%author%/g, `'${this.decodeHtmlEntities(book.author)}'`)
      .replace(
        /%chapters%/g,
        book.chapters
          .map((c) => `'${this.decodeHtmlEntities(c.name)}'`)
          .join(",")
      )
      .replace(
        /%chapter%/g,
        chapter ? `'${this.decodeHtmlEntities(chapter.name)}'` : ""
      );

    return result;
  }

  public async generateMessages(
    filePath: string = "./data/generated_messages.jsonl"
  ): Promise<void> {
    let messageLines: string[] = [];

    this.books.forEach((book) => {
      // For each book, check if it has a description before generating book-level messages
      if (book.description) {
        this.bookTemplates.forEach((template) => {
          const messageGroup: MessageGroup = { messages: [] };
          template.messages.forEach((msg) => {
            const content = this.replacePlaceholders(msg.content, book);
            messageGroup.messages.push({
              role: msg.role,
              content: this.decodeHtmlEntities(content),
            });
          });
          // Convert the message group to a JSON string and add it to messageLines
          messageLines.push(JSON.stringify(messageGroup));
        });
      }

      // Generate chapter-level messages
      book.chapters.forEach((chapter) => {
        this.chapterTemplates.forEach((template) => {
          const messageGroup: MessageGroup = { messages: [] };
          template.messages.forEach((msg) => {
            const content = this.replacePlaceholders(
              msg.content,
              book,
              chapter
            );
            messageGroup.messages.push({
              role: msg.role,
              content: this.decodeHtmlEntities(content),
            });
          });
          // Convert the message group to a JSON string for each chapter and add it to messageLines
          messageLines.push(JSON.stringify(messageGroup));
        });
      });
    });

    // Join all the JSON strings with a newline character to conform to the JSONL format
    const fileContent = messageLines.join("\n");
    // Write the JSONL content to the specified file
    await fs.writeFile(filePath, fileContent, "utf8");
  }
}
