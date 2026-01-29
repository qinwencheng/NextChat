import React from "react";
import styles from "./anchors.module.scss";
import { useFavoriteStore } from "@/app/store/favorites";
import Locale from "../../locales";

interface FavoritesProps {
  filter: string;
  onInput: (text: string) => void;
}

export function Favorites({ filter, onInput }: FavoritesProps) {
  const { favorites, removeFavorite } = useFavoriteStore();

  const filteredFavorites = favorites.filter((f) =>
    f.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <>
      {filteredFavorites.length === 0 && (
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "var(--black)", opacity: 0.5 }}>
          {Locale.Anchor.NoFavorites}
        </div>
      )}
      {filteredFavorites.map((fav, index) => (
        <div
          key={index}
          className={styles["anchor-item"]}
          onClick={(e) => {
            e.stopPropagation();
            onInput(fav);
          }}
        >
          <span className={styles["item-text"]}>{fav}</span>
          <span
            className={styles["action-btn"]}
            onClick={(e) => {
              e.stopPropagation();
              removeFavorite(fav);
            }}
            title={Locale.Anchor.Delete}
          >
            🗑️
          </span>
        </div>
      ))}
    </>
  );
}
