"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";

// --- Custom Select ---

interface SelectProps {
  id?: string;
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  placeholder?: string;
}

interface OptionInfo {
  value: string;
  label: string;
}

function extractOptions(children: React.ReactNode): OptionInfo[] {
  const options: OptionInfo[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement<SelectOptionProps>(child)) {
      options.push({
        value: String(child.props.value ?? ""),
        label:
          typeof child.props.children === "string"
            ? child.props.children
            : String(child.props.value ?? ""),
      });
    }
  });
  return options;
}

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({ id, value, onChange, className, children, disabled, placeholder }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const listRef = React.useRef<HTMLUListElement>(null);

    const options = React.useMemo(() => extractOptions(children), [children]);

    const selectedOption = options.find((o) => o.value === value);
    const displayLabel = selectedOption?.label || placeholder || "Select...";

    // Close on outside click
    React.useEffect(() => {
      if (!open) return;
      const handler = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    // Scroll highlighted item into view
    React.useEffect(() => {
      if (!open || highlightedIndex < 0) return;
      const list = listRef.current;
      if (!list) return;
      const item = list.children[highlightedIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: "nearest" });
    }, [highlightedIndex, open]);

    const selectOption = (optValue: string) => {
      onChange?.({ target: { value: optValue } });
      setOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case "Enter":
        case " ":
          e.preventDefault();
          if (open && highlightedIndex >= 0) {
            selectOption(options[highlightedIndex].value);
          } else {
            setOpen(true);
            const idx = options.findIndex((o) => o.value === value);
            setHighlightedIndex(idx >= 0 ? idx : 0);
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (!open) {
            setOpen(true);
            const idx = options.findIndex((o) => o.value === value);
            setHighlightedIndex(idx >= 0 ? idx : 0);
          } else {
            setHighlightedIndex((prev) =>
              prev < options.length - 1 ? prev + 1 : 0
            );
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (open) {
            setHighlightedIndex((prev) =>
              prev > 0 ? prev - 1 : options.length - 1
            );
          }
          break;
        case "Escape":
          e.preventDefault();
          setOpen(false);
          break;
      }
    };

    const handleToggle = () => {
      if (disabled) return;
      if (!open) {
        const idx = options.findIndex((o) => o.value === value);
        setHighlightedIndex(idx >= 0 ? idx : 0);
      }
      setOpen(!open);
    };

    return (
      <div ref={containerRef} className="relative">
        <button
          ref={ref}
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors",
            "hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            open && "ring-2 ring-ring ring-offset-2",
            className
          )}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
        >
          <span
            className={cn(
              "truncate",
              !selectedOption && "text-muted-foreground"
            )}
          >
            {displayLabel}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>

        {open && (
          <ul
            ref={listRef}
            role="listbox"
            className={cn(
              "absolute z-[200] mt-1 w-full min-w-[8rem] overflow-hidden rounded-lg border border-border bg-background shadow-lg",
              "animate-in fade-in-0 zoom-in-95 duration-150",
              "max-h-60 overflow-y-auto py-1"
            )}
          >
            {options.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isHighlighted = idx === highlightedIndex;

              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "relative flex items-center gap-2 cursor-pointer select-none px-3 py-2 text-sm transition-colors",
                    isHighlighted && "bg-accent text-accent-foreground",
                    isSelected && !isHighlighted && "text-primary font-medium",
                    !isHighlighted && !isSelected && "text-foreground hover:bg-accent/50"
                  )}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectOption(opt.value);
                  }}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isSelected ? "opacity-100 text-primary" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{opt.label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";

// --- SelectOption (declarative option definition) ---

interface SelectOptionProps {
  value?: string;
  className?: string;
  children?: React.ReactNode;
}

const SelectOption = React.forwardRef<HTMLElement, SelectOptionProps>(
  (_props, _ref) => {
    // This component is never rendered directly — it's read by Select via extractOptions()
    return null;
  }
);
SelectOption.displayName = "SelectOption";

export { Select, SelectOption };
export type { SelectProps, SelectOptionProps };
