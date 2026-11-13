import type { AdaptiveDataMap, AdaptiveKind } from "./types";
export const ADAPTIVE_EXAMPLES: Record<AdaptiveKind, string> = { event: "dinner with Priya Friday 8pm at Riverside", reminder: "remind me to pay rent tomorrow urgent", checklist: "buy milk, eggs, bread and coffee", timer: "25 min focus", color: "minecraft diamond", split: "split 2400 between 3", convert: "5 miles in km", calculate: "18% of 3450", poll: "pizza or burgers for Friday?", bookmark: "https://example.com/design design inspiration", note: "Ideas for the next project" };
export const ADAPTIVE_SAMPLE_DATA: AdaptiveDataMap = {
  event: { title: "Dinner with friends", date: "2026-11-13", time: "20:00", location: "Riverside", attendees: ["Priya", "Sam"] },
  reminder: { title: "Pay rent", due: "2026-11-07T09:00", priority: "high", completed: false },
  checklist: { title: "Groceries", items: [{ id: "milk", text: "Milk", checked: false }, { id: "eggs", text: "Eggs", checked: true }, { id: "bread", text: "Bread", checked: false }, { id: "coffee", text: "Coffee", checked: false }] },
  timer: { title: "Focus session", seconds: 1500 }, color: { color: "#4aedd9", name: "Minecraft diamond" }, split: { amount: 2400, people: 3, currency: "INR" },
  convert: { amount: 5, from: "mi", to: "km" }, calculate: { expression: "18% of 3450" },
  poll: { question: "What should we order?", options: [{ id: "pizza", label: "Pizza", votes: 3 }, { id: "burgers", label: "Burgers", votes: 2 }, { id: "tacos", label: "Tacos", votes: 1 }] },
  bookmark: { url: "https://example.com/design", title: "Design inspiration", description: "An example bookmark. Replace it with your own link." },
  note: { title: "Next project", text: "Make the first interaction useful. Keep the rest simple." },
};
