# Display fonts

Yatra One by Catherine Leigh Schmidt is used for the Hindi display token.
Baloo 2 by Ek Type is used for the Hinglish display token; Latin and Devanagari share the same family.
Both fonts are distributed under SIL Open Font License 1.1; full notices are included.
Sources: https://github.com/google/fonts/tree/main/ofl/yatraone and https://github.com/google/fonts/tree/main/ofl/baloo2

styles/desi-text.css exposes --font-hindi-display and --font-hinglish-display.
Replace these tokens and supply your licensed font assets to change the typefaces without changing the component API.
This folder is independent of component source so a future premium font package can be shipped separately.
