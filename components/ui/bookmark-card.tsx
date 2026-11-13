"use client";
import { Bookmark, ExternalLink } from "lucide-react";
import { Button } from "./button";
import { CardError, CardField, CardFrame, CardSubmit, CardText, useCardValue } from "./adaptive/card-ui";
import { safeBookmarkUrl } from "./adaptive/math";
import { ADAPTIVE_SAMPLE_DATA } from "./adaptive/samples";
import type { AdaptiveCardProps, BookmarkData } from "./adaptive/types";
export type BookmarkCardProps = AdaptiveCardProps<BookmarkData>;
export function BookmarkCard(props: BookmarkCardProps) {
  const [value, setValue] = useCardValue(props, ADAPTIVE_SAMPLE_DATA.bookmark), { disabled, editable = true, appearance = "polished", className } = props;
  const url = safeBookmarkUrl(value.url);
  return <CardFrame title="Bookmark" kind="bookmark" icon={<Bookmark aria-hidden="true" />} appearance={appearance} className={className} disabled={disabled}>
    <CardField label="URL" value={value.url} disabled={disabled} readOnly={!editable} onChange={event => setValue({ ...value, url: event.target.value })} />
    <CardField label="Link title" value={value.title} disabled={disabled} readOnly={!editable} onChange={event => setValue({ ...value, title: event.target.value })} />
    <CardText label="Description" rows={3} value={value.description} disabled={disabled} readOnly={!editable} onChange={event => setValue({ ...value, description: event.target.value })} />
    <CardError message={!url ? "Enter a valid HTTP or HTTPS URL." : undefined} />
    {url && !disabled && <Button appearance={appearance} variant="secondary" asChild><a href={url} target="_blank" rel="noopener noreferrer">Open link<ExternalLink aria-hidden="true" size={16} /></a></Button>}
    <CardSubmit hidden={props.showSubmit === false} label="Use bookmark" value={value} onSubmit={props.onSubmit} appearance={appearance} disabled={disabled || !url} />
  </CardFrame>;
}
