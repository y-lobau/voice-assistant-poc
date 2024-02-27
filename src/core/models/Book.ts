export class Book {
  toShort(): BookShort {
    return new BookShort(this.id, this.name);
  }

  id: string;
  name: string;

  constructor(
    id: string,
    name: string,
    chapters: BookChapter[],
    author: string,
    description: string
  ) {
    this.id = id;
    this.name = name;
    this.chapters = chapters;
    this.author = author;
    this.description = description;
  }

  chapters: BookChapter[];
  author: string;
  description: string;
}

export class BookShort {
  constructor(public id: string, public name: string) {}
}

export interface BookChapter {
  id: string;
  name: string;
  duration: number;
  url: string;
  blocked: boolean;
}
