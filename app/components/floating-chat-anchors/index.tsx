import React, { useState, useEffect, useRef } from "react";
import styles from "./anchors.module.scss";
import { Navigator } from "./navigator";
import { Favorites } from "./favorites";
import { ChatMessage } from "@/app/store";
import Locale from "../../locales";
import { useFavoriteStore } from "@/app/store/favorites";
import MenuIcon from "../../icons/menu.svg";

interface FloatingChatAnchorsProps {
  messages: ChatMessage[];
  onInput: (text: string) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function FloatingChatAnchors({ messages, onInput, containerRef }: FloatingChatAnchorsProps) {
  const [activeTab, setActiveTab] = useState<"navigator" | "favorites">("navigator");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState({ x: -1, y: 100 }); 
  const [size, setSize] = useState({ width: 260, height: 400 });
  const [snapSide, setSnapSide] = useState<"left" | "right" | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const { addFavorite } = useFavoriteStore();
  const autoHideTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize position
  useEffect(() => {
    if (position.x === -1 && containerRef.current) {
        const bounds = containerRef.current.getBoundingClientRect();
        // Default to right side of container
        setPosition({ x: bounds.right - 280, y: bounds.top + 100 });
    }
  }, [position.x, containerRef]);

  // Drag and Resize logic
  const isDragging = useRef(false);
  const activeResizer = useRef<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialRect = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const getBounds = () => {
      if (!containerRef.current) return { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
      return containerRef.current.getBoundingClientRect();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // ... existing logic ...
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.classList.contains(styles['action-btn']) || target.classList.contains(styles['lock-btn'])) return;
    
    let resizerClass = "";
    if (target.classList.contains(styles['resizer-tl'])) resizerClass = 'tl';
    else if (target.classList.contains(styles['resizer-tr'])) resizerClass = 'tr';
    else if (target.classList.contains(styles['resizer-bl'])) resizerClass = 'bl';
    else if (target.classList.contains(styles['resizer-br'])) resizerClass = 'br';

    if (resizerClass) {
        activeResizer.current = resizerClass;
        dragStart.current = { x: e.clientX, y: e.clientY };
        initialRect.current = { x: position.x, y: position.y, w: size.width, h: size.height };
        e.preventDefault();
        return;
    }

    if (target.closest(`.${styles['anchor-header']}`) || isCollapsed) {
        isDragging.current = true;
        dragStart.current = { x: e.clientX, y: e.clientY };
        initialRect.current = { x: position.x, y: position.y, w: 0, h: 0 };
        e.preventDefault();
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        const bounds = getBounds();
        
        if (isDragging.current) {
            const dx = e.clientX - dragStart.current.x;
            const dy = e.clientY - dragStart.current.y;
            
            const newX = initialRect.current.x + dx;
            const newY = initialRect.current.y + dy;
            
            const currentWidth = isCollapsed ? 48 : size.width;
            const currentHeight = isCollapsed ? 48 : size.height;

            // Clamp to container bounds
            const clampedX = Math.min(Math.max(newX, bounds.left), bounds.right - currentWidth);
            const clampedY = Math.min(Math.max(newY, bounds.top), bounds.bottom - currentHeight);

            setPosition({ x: clampedX, y: clampedY });
        } else if (activeResizer.current) {
            const dx = e.clientX - dragStart.current.x;
            const dy = e.clientY - dragStart.current.y;
            const { x, y, w, h } = initialRect.current;
            const minSize = 150;
            
            let newW = w, newH = h, newX = x, newY = y;

            if (activeResizer.current.includes('r')) newW = Math.max(minSize, w + dx);
            if (activeResizer.current.includes('b')) newH = Math.max(minSize, h + dy);
            if (activeResizer.current.includes('l')) { 
                const intendedW = w - dx;
                if (intendedW > minSize) {
                    newW = intendedW;
                    newX = x + dx;
                }
            }
            if (activeResizer.current.includes('t')) { 
                const intendedH = h - dy;
                if (intendedH > minSize) {
                    newH = intendedH;
                    newY = y + dy;
                }
            }
            
            // Clamp Resize
            // Only strictly needed if we want to prevent resizing outside bounds, 
            // but for simplicity usually allowing resize slightly out and then snapping back on drag is ok.
            // However, let's clamp X/Y if top/left resize
            newX = Math.max(newX, bounds.left);
            newY = Math.max(newY, bounds.top);
            
            setSize({ width: newW, height: newH });
            setPosition({ x: newX, y: newY });
        }
    };

    const handleMouseUp = () => {
        if (isDragging.current) {
            isDragging.current = false;
            const bounds = getBounds();
            const threshold = 60;
            const currentWidth = isCollapsed ? 48 : size.width;
            
            if (position.x - bounds.left < threshold) {
                setPosition(p => ({ ...p, x: bounds.left }));
                setSnapSide('left');
            } else if (bounds.right - (position.x + currentWidth) < threshold) { 
                 setPosition(p => ({ ...p, x: bounds.right - currentWidth }));
                 setSnapSide('right');
            } else {
                setSnapSide(null);
            }
        }
        activeResizer.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [position, size, isCollapsed, containerRef]);

  // Auto hide logic
  const handleMouseEnter = () => {
    if (!isLocked) {
        if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
        // Expand logic handled in onClick or explicit expand
    }
  };

  const handleMouseLeave = () => {
    if (!isLocked && !isDragging.current && !activeResizer.current) {
        autoHideTimer.current = setTimeout(() => {
            const bounds = getBounds();
            setIsCollapsed(true);
            
            // Check snap on collapse
            const threshold = 60;
             if (position.x - bounds.left < threshold) {
                setPosition(p => ({ ...p, x: bounds.left }));
                setSnapSide('left');
            } else if (bounds.right - position.x < threshold + 300) { 
                 setPosition(p => ({ ...p, x: bounds.right - 48 })); // 48 is collapsed width
                 setSnapSide('right');
            }

        }, 600);
    }
  };

  const toggleCollapse = () => {
      if (isCollapsed) {
          // Expanding
          const bounds = getBounds();
          const expandedWidth = size.width;
          let newX = position.x;

          // If snapped right or overflowing right, shift left
          if (newX + expandedWidth > bounds.right) {
              newX = Math.max(bounds.left, bounds.right - expandedWidth);
          }
          
          setPosition(p => ({ ...p, x: newX }));
          setIsCollapsed(false);
          if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
      } else {
          // Manually collapsing (optional, but good for UX)
          // For now, onClick only expands as per previous logic, but let's allow toggle if needed.
          // Requirement was "click blank area retracted", here clicking the icon expands.
      }
  };

  return (
    <div 
        ref={panelRef}
        className={`${styles["floating-anchor-panel"]} ${isCollapsed ? styles["collapsed"] : ""} ${snapSide ? styles[`snapped-${snapSide}`] : ""}`}
        style={{ 
            left: position.x === -1 ? undefined : position.x, 
            top: position.y,
            right: position.x === -1 ? '24px' : undefined,
            width: isCollapsed && snapSide ? undefined : size.width,
            height: isCollapsed && snapSide ? undefined : size.height 
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
            if (isCollapsed) {
                toggleCollapse();
                e.stopPropagation();
            }
        }}
    >
        {/* Collapsed Icon */}
        <div className={styles["collapsed-icon"]}>
            <div className={styles["icon-placeholder"]}>
                <MenuIcon />
            </div>
        </div>

        {/* Resizers */}
        <div className={`${styles["resizer"]} ${styles["resizer-tl"]}`}></div>
        <div className={`${styles["resizer"]} ${styles["resizer-tr"]}`}></div>
        <div className={`${styles["resizer"]} ${styles["resizer-bl"]}`}></div>
        <div className={`${styles["resizer"]} ${styles["resizer-br"]}`}></div>

        {/* Content */}
        <div className={styles["anchor-header"]}>
            <div 
                className={`${styles["lock-btn"]} ${isLocked ? styles["active"] : ""}`}
                onClick={(e) => {
                    e.stopPropagation();
                    setIsLocked(!isLocked);
                }}
                title={isLocked ? Locale.Anchor.Unlock : Locale.Anchor.Lock}
            ></div>
            <div className={styles["nav-tabs"]}>
                <div 
                    className={`${styles["nav-tab"]} ${activeTab === 'navigator' ? styles["active"] : ""}`}
                    onClick={(e) => { e.stopPropagation(); setActiveTab('navigator'); setSearch(''); }}
                >
                    {Locale.Anchor.Navigator}
                </div>
                <div 
                    className={`${styles["nav-tab"]} ${activeTab === 'favorites' ? styles["active"] : ""}`}
                    onClick={(e) => { e.stopPropagation(); setActiveTab('favorites'); setSearch(''); }}
                >
                    {Locale.Anchor.Favorites}
                </div>
            </div>
        </div>

        <div className={styles["search-container"]}>
            <input 
                type="text" 
                placeholder={Locale.Anchor.Search} 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()} 
            />
        </div>

        <div className={styles["content-wrapper"]}>
            {activeTab === 'navigator' ? (
                <Navigator 
                    messages={messages} 
                    filter={search} 
                />
            ) : (
                <Favorites 
                    filter={search} 
                    onInput={onInput}
                />
            )}
        </div>
    </div>
  );
}
