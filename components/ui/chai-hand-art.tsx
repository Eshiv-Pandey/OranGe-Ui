type HandProps = { id: string; part: 'back' | 'front' };

/** The handle sits between the curled fingertips and the back of the hand. */
export function KettleHand({ id, part }: HandProps) {
  if (part === 'back') return <g fill="#bd7d5c">
    <path d="M167 82C169 91 168 104 175 110Q182 115 187 109L183 91Z" />
    <path d="M188 76C190 90 190 103 196 107Q203 111 209 104L204 84Z" />
    <path d="M212 78Q217 96 224 101Q232 106 238 98L231 83Z" />
  </g>;
  return <g className="chai-kettle-grip">
    <path d="M108 77C126 73 139 65 155 62C169 58 181 58 193 62C208 65 219 71 230 80C240 89 247 99 247 108C247 115 242 118 237 115C231 111 231 101 226 96L217 89C218 99 226 110 222 118C219 124 211 124 207 118C202 111 200 102 194 97L188 94C190 103 199 116 194 123C190 129 182 127 177 121L163 105C151 104 142 108 132 113L112 119Z" fill={`url(#${id}-skin)`} />
    <path d="M112 105Q135 101 151 94C162 91 171 95 177 102L189 116Q194 123 189 126Q183 130 176 123L162 111Q146 110 132 119L114 121Z" fill="#c78a65" opacity=".58" />
    <path d="M119 81C142 69 165 65 181 68Q207 69 228 90" fill="none" stroke="#f9d6b2" strokeWidth="4" strokeLinecap="round" opacity=".55" />
    <path d="M164 76Q178 79 187 92M187 70Q202 75 211 87M213 77Q227 86 232 96" fill="none" stroke="#b97c5c" strokeWidth=".85" strokeLinecap="round" opacity=".7" />
    <path d="M179 116Q182 112 187 115L191 121Q187 125 183 123ZM211 114Q215 111 219 115L220 119Q216 122 213 119ZM237 106Q240 104 243 108L244 112Q240 115 238 111Z" fill="#f6d2af" opacity=".8" />
    <path d="M139 96Q149 87 161 88M169 108 175 114M200 106 204 112" fill="none" stroke="#a56d51" strokeWidth=".75" strokeLinecap="round" opacity=".6" />
    <path d="M104 73Q112 72 117 82L126 111Q126 119 116 125L105 119Q112 111 111 104L104 83Z" fill="#22aaa9" />
    <path d="M109 79 119 111Q121 115 116 119" fill="none" stroke="#0b8387" strokeWidth="1.3" strokeLinecap="round" />
  </g>;
}

/** The palm and far fingers are behind the glass; the thumb and curled tips are in front. */
export function GlassHand({ id, part }: HandProps) {
  if (part === 'back') return <g className="chai-glass-palm">
    <path d="M615 341C592 339 571 340 553 330Q539 321 527 324L511 341C494 345 478 339 459 337C438 333 429 345 431 359L435 393C438 419 458 437 481 434C508 431 529 412 554 405Q582 399 618 401Z" fill={`url(#${id}-skin)`} />
    <path d="M438 387Q462 418 487 417C514 416 529 395 553 392L615 385 618 401Q582 399 554 405C529 412 508 431 481 434Q451 440 438 413Z" fill="#bd7d5c" opacity=".42" />
    <path d="M550 349Q576 357 608 354L608 365Q578 370 551 361Z" fill="#f9d6b2" opacity=".45" />
    <path d="M518 351Q530 363 526 380M539 365Q537 385 520 395M557 391Q579 387 601 390" fill="none" stroke="#ae7356" strokeWidth=".85" strokeLinecap="round" opacity=".6" />
    <path d="M444 351Q472 344 500 352M447 373Q472 370 498 376M453 397Q472 397 490 401" fill="none" stroke="#b97c5c" strokeWidth="1.2" strokeLinecap="round" opacity=".45" />
  </g>;
  return <g className="chai-glass-grip" fill={`url(#${id}-skin)`}>
    <path d="M434 334C426 329 418 332 417 341C416 350 423 357 433 356L444 352 443 341Z" />
    <path d="M437 361C428 356 420 362 422 371C423 382 431 386 441 382L447 377 445 367Z" />
    <path d="M441 389C433 384 425 390 428 400C430 408 438 413 447 408L452 403 449 394Z" />
    <path d="M452 414C445 410 437 415 441 423C445 431 453 433 460 427L462 422Z" />
    <path d="M535 347C525 339 521 331 516 323C511 315 504 311 499 316C494 323 499 333 506 340L521 357Q530 365 540 358Z" />
    <path d="M501 323Q508 336 524 350Q533 359 539 355L537 361Q528 366 520 358L505 341Q496 332 497 325Z" fill="#bd7d5c" opacity=".42" />
    <path d="M420 345Q424 353 434 353M425 373Q429 381 438 379M431 400Q436 408 445 405M443 423Q449 429 456 426" fill="none" stroke="#bd7d5c" strokeWidth="1.5" strokeLinecap="round" opacity=".45" />
    <path d="M423 337Q428 334 433 339L438 345Q434 350 429 347L423 343ZM426 365Q431 362 436 367L441 373Q437 378 432 375L427 371ZM432 392Q437 390 442 395L447 401Q444 406 439 402L434 398ZM443 418Q448 415 452 420L456 424Q452 428 448 424ZM500 318Q504 315 509 320L516 328Q512 332 507 328L501 323Z" fill="#f8d7b6" opacity=".75" />
    <path d="M439 341 441 347M443 368 445 374M448 395 450 401M520 343Q524 348 529 350" fill="none" stroke="#a87053" strokeWidth=".7" strokeLinecap="round" opacity=".7" />
  </g>;
}
