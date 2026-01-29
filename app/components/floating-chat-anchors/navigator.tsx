import React from "react";
import styles from "./anchors.module.scss";
import { ChatMessage } from "@/app/store";
import Locale from "../../locales";
import { useFavoriteStore } from "@/app/store/favorites";

interface NavigatorProps {
  messages: ChatMessage[];
  filter: string;
}

export function Navigator({ messages, filter }: NavigatorProps) {
  const userMessages = messages.filter((m) => m.role === "user");
  const { favorites, addFavorite, removeFavorite } = useFavoriteStore();

  const filteredMessages = userMessages.filter((m) => {
    const text = typeof m.content === "string" ? m.content : "";
    return text.toLowerCase().includes(filter.toLowerCase());
  });

  const handleScroll = (id: string) => {
    const element = document.getElementById(`msg-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      
      const originalTransition = element.style.transition;
      element.style.transition = "background 0.5s";
      // Using a subtle highlight
      element.style.background = "var(--hover-color)";
      
      setTimeout(() => {
        element.style.background = "";
        element.style.transition = originalTransition;
      }, 800);
    }
  };

  return (
    <>
        {filteredMessages.map((msg, index) => {
        const text = typeof msg.content === "string" ? msg.content : "[多模态内容]";
        const isFav = favorites.includes(text);

        return (
          <div
            key={msg.id}
            className={styles["anchor-item"]}
            onClick={(e) => {
                e.stopPropagation();
                handleScroll(msg.id);
            }}
          >
            <span className={styles["item-text"]}>
              {index + 1}. {text}
            </span>
            <span
              className={`${styles["action-btn"]} ${isFav ? styles["active"] : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                if (isFav) {
                    removeFavorite(text);
                } else {
                    addFavorite(text);
                }
              }}
              title={Locale.Anchor.AddToFavorites}
            >
              {isFav ? "★" : "☆"}
            </span>
          </div>
        );
      })}
    </>
  );
}
