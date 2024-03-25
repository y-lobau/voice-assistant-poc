import { Book, BookChapter } from "../models/Book.js";
import { SkillFunction } from "../models/SkillFunction.js";
import { ISkill } from "../interfaces/ISkill.js";
import { AudioPlayer } from "../../infrastructure/output/AudioPlayer.js";

export class KnizhnyVozSkill implements ISkill {
  functions: SkillFunction[];

  books: Book[] = [];

  systemPrompt = "Кніжны Воз-платформа дзіцячых аўдыёкніг.";

  constructor(private player: AudioPlayer) {
    this.functions = [
      new SkillFunction(
        "playBook",
        "Выкарыстоўвай гэту функцыю для праігрывання пэўнай кнігі з Кніжнага Воза",
        {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "ID кнігі, якую трэба праіграць",
            },
            name: {
              type: "string",
              description: "Назва кнігі, якую трэба праіграць",
            },
          },
          required: ["id", "name"],
        },
        this.playBook
      ),
      new SkillFunction(
        "stopPlaying",
        "Выкарыстоўвай гэту функцыю для спынення праігравання апошняй кнігі",
        {},
        this.player.stop
      ),
    ];
  }

  cleanup(): void {
    this.player.stop();
  }

  public init(): Promise<void> {
    return this.loadAllBooks().then((books) => {
      this.books = books;
    });
  }

  public serviceMessages() {
    const booksContent =
      "Спіс кніг у JSON:" + JSON.stringify(this.books.map((b) => b.toShort()));
    return [
      { role: "system", content: this.systemPrompt },
      { role: "system", content: booksContent },
    ];
  }

  private playBook(id: string, name: string): Promise<void> {
    console.debug(
      `Loading book from https://knizhnyvoz.com/books/${id}`,
      id,
      name
    );

    return this.fetchBookData(id).then((chapters) => {
      if (!chapters) {
        console.warn(`Book with ID ${id} not found.`);
        return;
      }

      const firstChapter = chapters[0];
      if (!firstChapter || !firstChapter.url) {
        console.warn(`MP3 for the first chapter of book ${id} not found.`);
        return;
      }

      return this.playMP3(firstChapter.url);
    });
  }

  private playMP3(mp3Url: string): Promise<void> {
    return this.player.playUrl(mp3Url);
  }

  public async fetchBookData(id: string): Promise<BookChapter[]> {
    try {
      const response = await fetch("https://knizhnyvoz.com/books/" + id);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const chapters: BookChapter[] = await response.json();
      return chapters;
    } catch (error) {
      console.error("Failed to fetch book data:", error);
      throw error; // Rethrow or handle error as needed
    }
  }

  public async loadAllBooks(): Promise<Book[]> {
    console.debug("Loading all books...");

    return fetch("https://knizhnyvoz.com/books")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response
          .json()
          .then((data) =>
            data.map(
              (book) =>
                new Book(book.id, book.name, [], book.author, book.description)
            )
          )
          .then((books: Book[]) => {
            console.debug("Books loaded:", books);
            return books;
          })
          .catch((error) => {
            console.error("Failed to fetch books data:", error);
            throw error; // Rethrow or handle error as needed
          });
      })
      .catch((error) => {
        console.error("Failed to fetch books data:", error);
        throw error; // Rethrow or handle error as needed
      });
  }
}
