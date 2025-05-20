import { ABook } from "../defines/abook/abook";
import { Id, WithId } from "../utils/withId";

export interface ABookStore {
    getABooks: () => Promise<WithId<ABook>[]>
    saveABook: (id: Id, abook: ABook) => Promise<void>
    deleteABook: (id: Id) => Promise<void>
    getABook: (id: Id) => Promise<ABook | null>
}