import React from "react";
import { CartItem } from "../types";
import { CartItemRow } from "./CartItemRow";

interface CartItemListProps {
  items: CartItem[];
  emptyMessage?: string;
  className?: string;
}

export function CartItemList({
  items,
  emptyMessage = "No items in this group",
  className = "space-y-3",
}: CartItemListProps) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 font-medium">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div role="list" aria-label="Cart items" className={className}>
      {items.map((item, idx) => (
        <div role="listitem" key={item.id}>
          <CartItemRow item={item} itemIndex={idx} />
        </div>
      ))}
    </div>
  );
}

