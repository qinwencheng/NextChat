import { createPersistStore } from "../utils/store";
import { StoreKey } from "../constant";

export const useFavoriteStore = createPersistStore(
  {
    favorites: [] as string[],
  },
  (set, get) => ({
    addFavorite(text: string) {
      const { favorites } = get();
      if (!favorites.includes(text)) {
        set({
          favorites: [text, ...favorites],
        });
      }
    },
    removeFavorite(text: string) {
      const { favorites } = get();
      set({
        favorites: favorites.filter((f) => f !== text),
      });
    },
  }),
  {
    name: StoreKey.Favorite,
    version: 1,
  },
);