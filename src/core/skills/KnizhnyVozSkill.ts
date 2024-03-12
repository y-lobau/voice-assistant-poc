import Play from "play-sound";
import { Book, BookChapter, BookShort } from "../models/Book.js";
import { SkillFunction } from "../models/SkillFunction.js";
import { ISkill } from "../interfaces/ISkill.js";

export class KnizhnyVozSkill implements ISkill {
  functions: SkillFunction[];

  books: Book[] = [];

  player = Play({ player: "mpg123" });
  playerProcess: Play.ChildProcess | null = null;

  systemPrompt = "Кніжны Воз-платформа дзіцячых аўдыёкніг.";

  constructor() {
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
        this.stopMP3
      ),
    ];
  }

  cleanup(): void {
    this.stopMP3();
  }

  // public init(): Promise<void> {
  //   // return this.loadAllBooks().then(() => {});
  // }

  public serviceMessages() {
    // const booksSuffix =
    //   "Спіс кніг у JSON:" + JSON.stringify(this.books.map((b) => b.toShort()));
    return [{ role: "system", content: this.systemPrompt }];
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
    this.stopMP3();

    return new Promise((resolve, reject) => {
      // Assuming you have configured `play-sound` opts to use mpg123 or another player
      this.playerProcess = this.player.play(mp3Url, {}, (err: Error | null) => {
        if (err) {
          console.error("Failed to play the MP3 file:", err);
          reject(err);
        } else {
          console.debug("MP3 playback started successfully.");
        }
      });
      resolve();
    });
  }

  private stopMP3() {
    if (this.playerProcess) {
      this.playerProcess.kill();
    }
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
            this.books = books;
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
