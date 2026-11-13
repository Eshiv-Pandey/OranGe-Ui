"use client";

import { Plus } from "lucide-react";
import { Accordion } from "../accordion";
import { BlockFrame, type BlockProps } from "./shared";
import { SectionArt } from "./section-visuals";
import "../../../styles/faq-variants.css";

export type FaqItem = { question: string; answer: string; topic?: string };
export type FaqBlockProps = BlockProps & { title?: string; description?: string; questions?: FaqItem[]; defaultOpen?: number | null };
const sampleQuestions: FaqItem[] = [
  { topic: "Start", question: "Where should I begin?", answer: "Begin with a small idea and a little room to try it. Choose the pieces you need, make them your own, and build from there." },
  { topic: "Share", question: "Can I bring my team?", answer: "Good work is better together. Share a project, agree on your next step, and give everyone a clear place to contribute." },
  { topic: "Change", question: "What if my plans change?", answer: "Leave room for the next chapter. You can revisit your priorities, move things around, and keep the parts that still matter." },
  { topic: "Help", question: "How can I ask for help?", answer: "Start with the documentation for the piece you are using. Your application team can help with account, billing and service questions." },
];
function FaqHeading({ title, description }: { title: string; description: string }) { return <header className="mq-heading"><h2>{title}</h2><p>{description}</p></header>; }

export function FolderFaq({ title = "A few good\nquestions.", description = "Open a folder. Find a clear answer.", questions = sampleQuestions, defaultOpen = 1, ...props }: FaqBlockProps) {
  return <BlockFrame {...props} className={`sb-section mq-folder ${props.className ?? ""}`}><FaqHeading title={title} description={description} /><div className="mq-folder-list">{questions.length ? questions.map((item, index) => <details key={`${item.question}-${index}`} open={index === defaultOpen} className="mq-folder-item"><summary>{item.question}<Plus size={25} aria-hidden="true" /></summary><div className="mq-folder-paper"><p>{item.answer}</p></div></details>) : <p className="mq-empty">No questions to show yet.</p>}</div></BlockFrame>;
}

export function BubbleFaq({ title = "You ask,\nwe answer.", description = "A little clarity, right here.", questions = sampleQuestions, defaultOpen = 2, ...props }: FaqBlockProps) {
  return <BlockFrame {...props} className={`sb-section mq-bubble ${props.className ?? ""}`}><FaqHeading title={title} description={description} /><div className="mq-bubble-list">{questions.length ? questions.map((item, index) => <details key={`${item.question}-${index}`} open={index === defaultOpen}><summary>{item.question}<Plus size={17} aria-hidden="true" /></summary><p>{item.answer}</p></details>) : <p className="mq-empty">No questions to show yet.</p>}</div></BlockFrame>;
}

const faqArt = ["sprout", "fold", "eye", "spark"] as const;
export function PosterFaq({ title = "Good questions.\nBig possibilities.", description = "A different way to find your next step.", questions = sampleQuestions, defaultOpen = 0, ...props }: FaqBlockProps) {
  return <BlockFrame {...props} className={`sb-section mq-poster ${props.className ?? ""}`}><FaqHeading title={title} description={description} /><div className="mq-poster-list">{questions.length ? questions.map((item, index) => <details key={`${item.question}-${index}`} open={index === defaultOpen} data-color={index % 4}><summary><span className="mq-poster-topic">{item.topic ?? "Ask"}</span><span className="mq-poster-question">{item.question}</span><span className="mq-poster-art" aria-hidden="true"><SectionArt kind={faqArt[index % faqArt.length]} /></span><Plus className="mq-poster-plus" size={24} aria-hidden="true" /></summary><p>{item.answer}</p></details>) : <p className="mq-empty">No questions to show yet.</p>}</div></BlockFrame>;
}

export function AccordionFaq({ title = "The little details.", description = "A familiar accordion, with room for useful answers.", questions = sampleQuestions, defaultOpen = 0, ...props }: FaqBlockProps) {
  return <BlockFrame {...props} className={`sb-section mq-accordion ${props.className ?? ""}`}><FaqHeading title={title} description={description} />{questions.length ? <Accordion type="single" collapsible defaultValue={defaultOpen === null ? undefined : String(defaultOpen)} items={questions.map((item, index) => ({ value: String(index), title: item.question, content: item.answer }))} /> : <p className="mq-empty">No questions to show yet.</p>}</BlockFrame>;
}
